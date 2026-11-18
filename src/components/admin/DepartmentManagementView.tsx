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

  // 4 Core Departments specified in requirements
  const coreDepartments: CoreDepartmentInfo[] = [
    {
      id: 'dept_eng',
      name: 'Municipal Engineering',
      categoryTag: 'Roads, Potholes & Public Infrastructure',
      headName: 'Chief Eng. Vikram Sethi',
      email: 'engineering@smartcity.gov',
      phone: '+91 11 2345 6701',
      status: 'Optimal',
      activeTickets: complaints.filter((c) => c.category.includes('Road') || c.category.includes('Pothole')).length || 18,
      resolvedTickets: 74,
      avgResolutionHours: 21.4,
      slaRate: 96.2,
      officers: [
        { id: 'off_1', name: 'Eng. Vikram Sethi', role: 'Superintending Engineer', phone: '+91 98111 00001', dutyStatus: 'On Duty', rating: 4.9, assignedCount: 6 },
        { id: 'off_2', name: 'Insp. Rakesh Verma', role: 'Field Asphalt Inspector', phone: '+91 98111 00002', dutyStatus: 'On Field', rating: 4.8, assignedCount: 8 },
        { id: 'off_3', name: 'Tech. Manoj Solanki', role: 'Pavement Compaction Lead', phone: '+91 98111 00003', dutyStatus: 'On Duty', rating: 4.7, assignedCount: 4 },
      ],
    },
    {
      id: 'dept_san',
      name: 'Sanitation',
      categoryTag: 'Solid Waste, Cleansing & Landfills',
      headName: 'Dr. Sunita Deshmukh',
      email: 'sanitation@smartcity.gov',
      phone: '+91 11 2345 6702',
      status: 'Optimal',
      activeTickets: complaints.filter((c) => c.category.includes('Garbage') || c.category.includes('Waste')).length || 12,
      resolvedTickets: 98,
      avgResolutionHours: 12.6,
      slaRate: 98.4,
      officers: [
        { id: 'off_4', name: 'Dr. Sunita Deshmukh', role: 'Chief Sanitation Officer', phone: '+91 98111 00004', dutyStatus: 'On Duty', rating: 5.0, assignedCount: 4 },
        { id: 'off_5', name: 'Supervisor Amit Rawat', role: 'Ward Waste Logistics Lead', phone: '+91 98111 00005', dutyStatus: 'On Field', rating: 4.9, assignedCount: 5 },
        { id: 'off_6', name: 'Insp. Priya Nair', role: 'Dumping Vigilance Officer', phone: '+91 98111 00006', dutyStatus: 'On Duty', rating: 4.7, assignedCount: 3 },
      ],
    },
    {
      id: 'dept_water',
      name: 'Water Supply',
      categoryTag: 'Potable Pipelines, Drainage & Sewage',
      headName: 'Eng. Rajesh Pillai',
      email: 'watersupply@smartcity.gov',
      phone: '+91 11 2345 6703',
      status: 'Heavy Demand',
      activeTickets: complaints.filter((c) => c.category.includes('Water') || c.category.includes('Drainage')).length || 14,
      resolvedTickets: 56,
      avgResolutionHours: 25.8,
      slaRate: 91.8,
      officers: [
        { id: 'off_7', name: 'Eng. Rajesh Pillai', role: 'Executive Engineer (Hydraulics)', phone: '+91 98111 00007', dutyStatus: 'On Duty', rating: 4.8, assignedCount: 7 },
        { id: 'off_8', name: 'Tech. Gurpreet Singh', role: 'Main Valve Specialist', phone: '+91 98111 00008', dutyStatus: 'On Field', rating: 4.6, assignedCount: 5 },
        { id: 'off_9', name: 'Insp. Kavita Yadav', role: 'Contamination Testing Lead', phone: '+91 98111 00009', dutyStatus: 'Standby', rating: 4.9, assignedCount: 2 },
      ],
    },
    {
      id: 'dept_elec',
      name: 'Electrical Maintenance',
      categoryTag: 'Streetlights, Power Lines & Signals',
      headName: 'Eng. Deepa Narayan',
      email: 'electrical@smartcity.gov',
      phone: '+91 11 2345 6704',
      status: 'Optimal',
      activeTickets: complaints.filter((c) => c.category.includes('Streetlight') || c.category.includes('Electrical')).length || 8,
      resolvedTickets: 68,
      avgResolutionHours: 16.2,
      slaRate: 97.1,
      officers: [
        { id: 'off_10', name: 'Eng. Deepa Narayan', role: 'Chief Electrical Inspector', phone: '+91 98111 00010', dutyStatus: 'On Duty', rating: 4.9, assignedCount: 3 },
        { id: 'off_11', name: 'Tech. Rohit Sharma', role: 'High Mast Repair Crew Lead', phone: '+91 98111 00011', dutyStatus: 'On Field', rating: 4.8, assignedCount: 4 },
        { id: 'off_12', name: 'Tech. Sanjay Kumar', role: 'Cable Fault Locator', phone: '+91 98111 00012', dutyStatus: 'On Duty', rating: 4.7, assignedCount: 1 },
      ],
    },
  ];

  const activeDepartment = coreDepartments.find((d) => d.id === selectedDeptId) || coreDepartments[0];

  // Active tickets for selected department
  const deptComplaints = complaints.filter((c) => {
    const assigned = (c.departmentAssigned || '').toLowerCase();
    const deptName = activeDepartment.name.toLowerCase();
    if (deptName.includes('engineering') && (assigned.includes('road') || assigned.includes('engineering') || c.category.includes('Road') || c.category.includes('Pothole'))) return true;
    if (deptName.includes('sanitation') && (assigned.includes('waste') || assigned.includes('sanitation') || c.category.includes('Garbage') || c.category.includes('Waste'))) return true;
    if (deptName.includes('water') && (assigned.includes('water') || assigned.includes('drainage') || c.category.includes('Water') || c.category.includes('Drainage'))) return true;
    if (deptName.includes('electrical') && (assigned.includes('electric') || assigned.includes('light') || c.category.includes('Streetlight') || c.category.includes('Electrical'))) return true;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <span className="text-[10px] text-[#667085] block uppercase font-semibold">SLA Adherence</span>
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
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div>
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Active Queue: {activeDepartment.name}
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Grievances currently under investigation or work-in-progress
              </p>
            </div>
            <span className="text-xs font-semibold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded">
              {deptComplaints.length} in queue
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#EAECF0] dark:border-[#334155]">
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
                        {c.ticketNumber}
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <div className="font-semibold text-[#101828] dark:text-white truncate">{c.title}</div>
                        <div className="text-[10px] text-[#667085] truncate">{c.location.address}</div>
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-xl border border-[#EAECF0] dark:border-[#334155] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0] dark:border-[#334155]">
              <h3 className="font-bold text-sm text-[#101828] dark:text-white">
                Assign Field Officer & Crew
              </h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-[#667085] hover:text-[#101828]"
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
                className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-xs font-medium text-[#111827] dark:text-[#F9FAFB]"
              >
                {activeDepartment.officers.map((o) => (
                  <option key={o.id} value={o.name}>
                    {o.name} ({o.role} · {o.dutyStatus})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-[#D0D5DD] dark:border-[#334155] text-xs font-semibold text-[#344054] dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchTicket}
                disabled={assigning}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
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
