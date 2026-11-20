import React, { useState } from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Phone,
  Mail,
  UserCheck,
  Activity,
  Layers,
  ChevronRight,
  Shield,
  Send,
  Check
} from 'lucide-react';
import { Department, Complaint, ComplaintStatus } from '../../types';
import { formatDate } from '../../utils/i18n';
import { api } from '../../services/api';

interface DepartmentManagementViewProps {
  departments: Department[];
  complaints: Complaint[];
  onRefreshData?: () => void;
  onSelectComplaint?: (c: Complaint) => void;
}

interface CoreDepartmentInfo {
  id: string;
  name: string;
  categoryTag: string;
  headName: string;
  email: string;
  phone: string;
  status: 'Optimal' | 'Elevated Load' | 'Heavy Demand';
  activeTickets: number;
  resolvedTickets: number;
  avgResolutionHours: number;
  slaRate: number;
  officers: {
    id: string;
    name: string;
    role: string;
    phone: string;
    dutyStatus: 'On Duty' | 'On Field' | 'Standby';
    rating: number;
    assignedCount: number;
  }[];
}

export default function DepartmentManagementView({
  departments,
  complaints,
  onRefreshData,
  onSelectComplaint,
}: DepartmentManagementViewProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept_eng');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState<Complaint | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [officersList, setOfficersList] = React.useState<any[]>([]);

  React.useEffect(() => {
    api.getOfficers().then((list) => {
      if (Array.isArray(list)) setOfficersList(list);
    }).catch(() => {});
  }, []);

  const buildDeptCard = (
    id: string,
    name: string,
    categoryTag: string,
    defaultHead: string,
    defaultEmail: string,
    defaultPhone: string,
    matchFn: (c: Complaint) => boolean,
    fallbackOfficers: CoreDepartmentInfo['officers']
  ): CoreDepartmentInfo => {
    const dbDept = departments.find((d) =>
      d.name.toLowerCase().includes(name.split(' ')[0].toLowerCase()) ||
      (name.includes('Engineering') && d.name.toLowerCase().includes('road')) ||
      (name.includes('Sanitation') && d.name.toLowerCase().includes('waste'))
    );
    const matching = complaints.filter(matchFn);
    const active = matching.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Rejected').length;
    const resolved = matching.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
    const total = active + resolved;
    const slaRate = total > 0 ? Number(((resolved / total) * 100).toFixed(1)) : 100.0;

    const resolvedHrs = matching
      .filter((c) => c.status === 'Resolved' || c.status === 'Closed')
      .map((c) => (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / 3600000)
      .filter((h) => Number.isFinite(h) && h > 0);
    const avgResolutionHours =
      resolvedHrs.length > 0
        ? Number((resolvedHrs.reduce((a, b) => a + b, 0) / resolvedHrs.length).toFixed(1))
        : (dbDept?.avgResolutionHours ?? 0);

    const dynamicOfficers = officersList
      .filter((o) => o.department && o.department.toLowerCase().includes(name.split(' ')[0].toLowerCase()))
      .map((o) => ({
        id: o.id,
        name: o.name,
        role: 'Municipal Field Officer',
        phone: o.phone || defaultPhone,
        dutyStatus: (o.status === 'On Field' ? 'On Field' : 'On Duty') as 'On Duty' | 'On Field' | 'Standby',
        rating: o.rating || 4.8,
        assignedCount: matching.filter(
          (c) =>
            c.officerAssigned &&
            c.officerAssigned.toLowerCase().includes(o.name.replace(/^(Eng\.|Dr\.|Er\.)\s*/i, '').split(' ')[0].toLowerCase()) &&
            c.status !== 'Resolved' &&
            c.status !== 'Closed'
        ).length,
      }));

    return {
      id,
      name: dbDept?.name || name,
      categoryTag,
      headName: dbDept?.headName || defaultHead,
      email: dbDept?.email || defaultEmail,
      phone: dbDept?.phone || defaultPhone,
      status: active >= 4 ? 'Heavy Demand' : active >= 2 ? 'Elevated Load' : 'Optimal',
      activeTickets: active,
      resolvedTickets: resolved,
      avgResolutionHours,
      slaRate,
      officers: dynamicOfficers.length > 0 ? dynamicOfficers : fallbackOfficers,
    };
  };

  const coreDepartments: CoreDepartmentInfo[] = [
    buildDeptCard(
      'dept_eng',
      'Roads & Infrastructure',
      'Roads, Potholes, Traffic & Signage',
      'Eng. Vikram Sethi',
      'roads@smartcity.gov',
      '+1 555-0144',
      (c) => {
        const assigned = (c.departmentAssigned || '').toLowerCase();
        return assigned.includes('road') || assigned.includes('engineering') || c.category.includes('Road') || c.category.includes('Pothole') || c.category.includes('Traffic');
      },
      [
        { id: 'off_1', name: 'Eng. Vikram Sethi', role: 'Department Head', phone: '+1 555-0144', dutyStatus: 'On Duty', rating: 4.9, assignedCount: 0 },
        { id: 'off_2', name: 'Ramesh Kumar (Field Response Specialist)', role: 'Field Response Specialist', phone: '+1 555-0155', dutyStatus: 'On Field', rating: 4.8, assignedCount: 0 },
      ]
    ),
    buildDeptCard(
      'dept_san',
      'Solid Waste & Sanitation',
      'Solid Waste, Cleansing & Landfills',
      'Dr. Sunita Rao',
      'sanitation@smartcity.gov',
      '+1 555-0188',
      (c) => {
        const assigned = (c.departmentAssigned || '').toLowerCase();
        return assigned.includes('waste') || assigned.includes('sanitation') || c.category.includes('Garbage') || c.category.includes('Waste') || c.category.includes('Health');
      },
      [
        { id: 'off_4', name: 'Dr. Sunita Rao', role: 'Chief Sanitation Officer', phone: '+1 555-0188', dutyStatus: 'On Duty', rating: 5.0, assignedCount: 0 },
      ]
    ),
    buildDeptCard(
      'dept_water',
      'Water Supply & Sewage',
      'Potable Pipelines, Drainage & Sewage',
      'Eng. Ramesh Gupta',
      'water@smartcity.gov',
      '+1 555-0122',
      (c) => {
        const assigned = (c.departmentAssigned || '').toLowerCase();
        return assigned.includes('water') || assigned.includes('drainage') || c.category.includes('Water') || c.category.includes('Drainage');
      },
      [
        { id: 'off_7', name: 'Eng. Ramesh Gupta', role: 'Executive Engineer', phone: '+1 555-0122', dutyStatus: 'On Duty', rating: 4.8, assignedCount: 0 },
      ]
    ),
    buildDeptCard(
      'dept_elec',
      'Electrical & Streetlighting',
      'Streetlights, Power Lines & Signals',
      'Er. Priya Nair',
      'electricity@smartcity.gov',
      '+1 555-0166',
      (c) => {
        const assigned = (c.departmentAssigned || '').toLowerCase();
        return assigned.includes('electric') || assigned.includes('light') || c.category.includes('Streetlight') || c.category.includes('Electrical');
      },
      [
        { id: 'off_10', name: 'Er. Priya Nair', role: 'Chief Electrical Engineer', phone: '+1 555-0166', dutyStatus: 'On Duty', rating: 4.9, assignedCount: 0 },
      ]
    ),
  ];

  const activeDepartment = coreDepartments.find((d) => d.id === selectedDeptId) || coreDepartments[0];

  // Active tickets for selected department
  const deptComplaints = complaints.filter((c) => {
    const assigned = (c.departmentAssigned || '').toLowerCase();
    const deptName = activeDepartment.name.toLowerCase();
    if (deptName.includes('road') && (assigned.includes('road') || assigned.includes('engineering') || c.category.includes('Road') || c.category.includes('Pothole'))) return true;
    if (deptName.includes('sanitation') && (assigned.includes('waste') || assigned.includes('sanitation') || c.category.includes('Garbage') || c.category.includes('Waste'))) return true;
    if (deptName.includes('water') && (assigned.includes('water') || assigned.includes('drainage') || c.category.includes('Water') || c.category.includes('Drainage'))) return true;
    if (deptName.includes('electric') && (assigned.includes('electric') || assigned.includes('light') || c.category.includes('Streetlight') || c.category.includes('Electrical'))) return true;
    return false;
  });

  const handleDispatchTicket = async () => {
    if (!selectedTicketForAssign || !selectedOfficer) return;
    setAssigning(true);
    setAssignError('');
    try {
      await api.assignComplaint(
        selectedTicketForAssign.id,
        activeDepartment.name,
        selectedOfficer,
        new Date(Date.now() + 24 * 3600 * 1000).toISOString()
      );
      setAssignSuccess(true);
      if (onRefreshData) onRefreshData();
      setTimeout(() => {
        setAssignSuccess(false);
        setAssignModalOpen(false);
        setSelectedTicketForAssign(null);
      }, 1200);
    } catch (e: any) {
      setAssignError(e?.message || 'Dispatch failed. Verify official authorization.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAECF0] dark:border-[#1E293B]">
        <div>
          <h2 className="text-xl font-bold text-[#101828] dark:text-white tracking-tight">
            Department Management
          </h2>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Workload distribution, officer assignments, and SLA operational readiness
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#16A34A] bg-[#ECFDF5] px-3 py-1.5 rounded-lg border border-[#A7F3D0]">
            All 4 Core Divisions Operational
          </span>
        </div>
      </div>

      {/* 4 Core Department Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 tabular-nums">
        {coreDepartments.map((dept) => {
          const isSelected = selectedDeptId === dept.id;

          return (
            <div
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-white dark:bg-[#1E293B] border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-md'
                  : 'bg-white dark:bg-[#1E293B] border-[#EAECF0] dark:border-[#334155] shadow-xs hover:border-[#D0D5DD]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-[#0F172A] text-[#2563EB] flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      dept.status === 'Optimal'
                        ? 'bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]'
                        : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                    }`}
                  >
                    {dept.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#101828] dark:text-white mt-3">
                  {dept.name}
                </h3>
                <p className="text-[11px] text-[#667085] dark:text-slate-400 line-clamp-1 mt-0.5">
                  {dept.categoryTag}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#F2F4F7] dark:border-[#2D3748] text-xs">
                  <div>
                    <span className="text-[10px] text-[#667085] block uppercase font-semibold">Active Workload</span>
                    <span className="text-base font-bold text-[#D97706]">{dept.activeTickets} tickets</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#667085] block uppercase font-semibold">Resolved Rate</span>
                    <span className="text-base font-bold text-[#16A34A]">{dept.slaRate}%</span>
                  </div>
                </div>
              </div>

              {/* Head of Dept */}
              <div className="mt-4 pt-3 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center justify-between text-[11px]">
                <div className="truncate">
                  <span className="text-[#98A2B3] block text-[9px] uppercase font-semibold">Department Head</span>
                  <span className="font-medium text-[#101828] dark:text-white truncate">{dept.headName}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#2563EB]' : 'text-[#98A2B3]'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Department Command Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Department Officers & Crew Roster (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div>
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Officer & Crew Roster
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                {activeDepartment.name} deployment personnel
              </p>
            </div>
            <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
              {activeDepartment.officers.length} Officers
            </span>
          </div>

          <div className="space-y-3">
            {activeDepartment.officers.map((officer) => (
              <div
                key={officer.id}
                className="p-3.5 rounded-lg border border-[#EAECF0] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-xs flex items-center justify-center">
                      {officer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[#101828] dark:text-white">{officer.name}</div>
                      <div className="text-[10px] text-[#667085]">{officer.role}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      officer.dutyStatus === 'On Field'
                        ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                        : 'bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]'
                    }`}
                  >
                    {officer.dutyStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#667085] pt-2 border-t border-[#EAECF0] dark:border-[#334155]">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3" /> {officer.phone}
                  </span>
                  <span>
                    Rating: <strong className="text-[#101828] dark:text-white font-bold">{officer.rating} ★</strong> ({officer.assignedCount} active)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Department Complaints & Dispatch Queue (7 cols) */}
        <div className="lg:col-span-7 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Active Queue: {activeDepartment.name}
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Grievances currently under investigation or work-in-progress
              </p>
            </div>
            <span className="text-xs font-semibold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded shrink-0">
              {deptComplaints.length} in queue
            </span>
          </div>

          {/* Mobile Queue Cards */}
          <div className="md:hidden divide-y divide-[#EAECF0] dark:divide-[#334155] rounded-lg border border-[#EAECF0] dark:border-[#334155] overflow-hidden">
            {deptComplaints.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#667085]">
                No active backlog for this department!
              </div>
            ) : (
              deptComplaints.slice(0, 6).map((c) => (
                <div key={c.id} className="p-3.5 space-y-2 text-xs bg-white dark:bg-[#1E293B]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#2563EB]">{c.ticketNumber}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F2F4F7] dark:bg-slate-800 text-[#344054] dark:text-slate-200">
                        {c.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626]">
                        {c.priority}
                      </span>
                    </div>
                  </div>
                  <div className="font-semibold text-[#101828] dark:text-white line-clamp-1">{c.title}</div>
                  <div className="text-[11px] text-[#667085] truncate">{c.location.address}</div>
                  <button
                    onClick={() => {
                      setSelectedTicketForAssign(c);
                      setSelectedOfficer(activeDepartment.officers[0]?.name || 'Eng. Vikram Sethi');
                      setAssignModalOpen(true);
                    }}
                    className="w-full min-h-[36px] mt-1 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors shadow-2xs"
                  >
                    Assign Crew
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-lg border border-[#EAECF0] dark:border-[#334155]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] dark:bg-[#182234] text-[#667085] text-[10px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Ticket</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3 text-right">Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] dark:divide-[#334155]">
                {deptComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#667085]">
                      No active backlog for this department!
                    </td>
                  </tr>
                ) : (
                  deptComplaints.slice(0, 6).map((c) => (
                    <tr key={c.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#283548]">
                      <td className="p-3 font-mono font-bold text-[#2563EB] whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectComplaint?.(c)}
                          className="hover:underline"
                        >
                          {c.ticketNumber}
                        </button>
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <button
                          type="button"
                          onClick={() => onSelectComplaint?.(c)}
                          className="text-left block w-full hover:text-[#2563EB]"
                        >
                          <div className="font-semibold text-[#101828] dark:text-white truncate">{c.title}</div>
                          <div className="text-[10px] text-[#667085] truncate">{c.location.address}</div>
                        </button>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F2F4F7] text-[#344054]">
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626]">
                          {c.priority}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedTicketForAssign(c);
                            setSelectedOfficer(activeDepartment.officers[0]?.name || 'Eng. Vikram Sethi');
                            setAssignModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors shadow-2xs"
                        >
                          Assign Crew
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Crew Assignment Modal */}
      {assignModalOpen && selectedTicketForAssign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-t-2xl sm:rounded-xl border border-[#EAECF0] dark:border-[#334155] shadow-2xl p-5 pb-safe max-h-[92dvh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0] dark:border-[#334155]">
              <h3 className="font-bold text-sm text-[#101828] dark:text-white">
                Assign Field Officer & Crew
              </h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                aria-label="Close assignment modal"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-[#667085] hover:text-[#101828] hover:bg-slate-100 dark:hover:bg-slate-800 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#EAECF0] dark:border-[#334155] text-xs">
              <span className="font-mono font-bold text-[#2563EB]">{selectedTicketForAssign.ticketNumber}</span>
              <div className="font-semibold text-[#101828] dark:text-white mt-1">{selectedTicketForAssign.title}</div>
              <div className="text-[#667085] text-[11px]">{selectedTicketForAssign.location.address}</div>
            </div>

            {assignError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-700 dark:text-red-300">
                {assignError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                Select Available Field Officer
              </label>
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-xs font-medium text-[#111827] dark:text-[#F9FAFB]"
              >
                {activeDepartment.officers.map((o) => (
                  <option key={o.id} value={o.name}>
                    {o.name} ({o.role} · {o.dutyStatus})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-[#D0D5DD] dark:border-[#334155] text-xs font-semibold text-[#344054] dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchTicket}
                disabled={assigning}
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                {assignSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Assigned!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm Dispatch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
