import React, { useState, useEffect } from 'react';
import {
  Users,
  HardHat,
  CheckCircle2,
  Clock,
  MapPin,
  Search
} from 'lucide-react';
import { Complaint, User } from '../../types';
import { api } from '../../services/api';

interface FieldWorkforceViewProps {
  complaints: Complaint[];
  onSelectComplaint?: (c: Complaint) => void;
  onOpenProgressModal?: (c: Complaint) => void;
  onRefreshData?: () => void;
}

interface WorkerRoster {
  id: string;
  name: string;
  role: string;
  department: string;
  ward: string;
  phone: string;
  status: 'On Duty' | 'En Route' | 'On Site' | 'Off Duty';
  activeTickets: string[];
  resolvedTotal: number;
  slaRate: string;
  avatar: string;
}

const AVATAR_POOL = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
];

export default function FieldWorkforceView({
  complaints,
  onSelectComplaint,
  onOpenProgressModal,
  onRefreshData,
}: FieldWorkforceViewProps) {
  const [workers, setWorkers] = useState<WorkerRoster[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    Promise.all([api.getUsers().catch(() => []), api.getOfficers().catch(() => [])]).then(
      ([allUsers, officers]) => {
        if (!active) return;
        const staffUsers = (allUsers as User[]).filter(
          (u) => u.role === 'officer' || u.role === 'field_worker'
        );

        const mappedFromUsers: WorkerRoster[] = staffUsers.map((u, idx) => {
          const firstToken = u.name.replace(/^(Eng\.|Dr\.|Er\.)\s*/i, '').split(' ')[0].toLowerCase();
          const matchedTickets = complaints
            .filter(
              (c) =>
                c.officerAssigned &&
                c.officerAssigned.toLowerCase().includes(firstToken) &&
                c.status !== 'Resolved' &&
                c.status !== 'Closed'
            )
            .map((c) => c.ticketNumber);

          const resolvedMatches = complaints.filter(
            (c) =>
              c.officerAssigned &&
              c.officerAssigned.toLowerCase().includes(firstToken) &&
              (c.status === 'Resolved' || c.status === 'Closed')
          ).length;

          const totalAssigned = matchedTickets.length + resolvedMatches;
          const realRate = totalAssigned > 0 ? `${Math.round((resolvedMatches / totalAssigned) * 100)}%` : 'No cases';

          const status: WorkerRoster['status'] =
            u.dutyStatus === 'Off Duty' || u.dutyStatus === 'On Leave'
              ? 'Off Duty'
              : matchedTickets.length > 0
              ? 'On Site'
              : 'On Duty';

          return {
            id: u.id,
            name: u.name,
            role: u.role === 'officer' ? 'Municipal Officer (Lead)' : 'Field Operations Specialist',
            department: u.department || 'Roads & Infrastructure',
            ward: u.ward || 'Ward 4 - Central Promenade',
            phone: u.phone || '+91 98765 11000',
            status,
            activeTickets: matchedTickets,
            resolvedTotal: resolvedMatches,
            slaRate: realRate,
            avatar: u.avatarUrl || AVATAR_POOL[idx % AVATAR_POOL.length],
          };
        });

        if (mappedFromUsers.length > 0) {
          setWorkers(mappedFromUsers);
        } else if (Array.isArray(officers) && officers.length > 0) {
          setWorkers(
            officers.map((o: any, idx: number) => {
              const firstToken = (o.name || '').replace(/^(Eng\.|Dr\.|Er\.)\s*/i, '').split(' ')[0].toLowerCase();
              const activeTickets = firstToken
                ? complaints
                    .filter(
                      (c) =>
                        c.officerAssigned &&
                        c.officerAssigned.toLowerCase().includes(firstToken) &&
                        c.status !== 'Resolved' &&
                        c.status !== 'Closed'
                    )
                    .map((c) => c.ticketNumber)
                : [];
              const resolvedTotal = firstToken
                ? complaints.filter(
                    (c) =>
                      c.officerAssigned &&
                      c.officerAssigned.toLowerCase().includes(firstToken) &&
                      (c.status === 'Resolved' || c.status === 'Closed')
                  ).length
                : 0;
              const total = activeTickets.length + resolvedTotal;
              return {
                id: o.id,
                name: o.name,
                role: 'Municipal Field Engineer',
                department: o.department || 'Roads & Infrastructure',
                ward: 'Ward 4 - Central Promenade',
                phone: o.phone || '+91 98765 11000',
                status: activeTickets.length > 0 ? 'On Site' : o.status === 'Off Duty' ? 'Off Duty' : 'On Duty',
                activeTickets,
                resolvedTotal,
                slaRate: total > 0 ? `${Math.round((resolvedTotal / total) * 100)}%` : 'No cases',
                avatar: o.avatarUrl || AVATAR_POOL[idx % AVATAR_POOL.length],
              };
            })
          );
        }
      }
    );
    return () => {
      active = false;
    };
  }, [complaints]);

  const filteredWorkers = workers.filter((w) => {
    if (departmentFilter !== 'All' && !w.department.includes(departmentFilter)) return false;
    if (statusFilter !== 'All' && w.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        w.name.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q) ||
        w.ward.toLowerCase().includes(q) ||
        w.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: WorkerRoster['status']) => {
    switch (status) {
      case 'On Site':
        return 'bg-[#FEF3C7] dark:bg-amber-950/40 text-[#D97706] dark:text-amber-400 border-[#FDE68A] dark:border-amber-900/60';
      case 'En Route':
        return 'bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] border-[#BFDBFE] dark:border-blue-900/60';
      case 'On Duty':
        return 'bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#16A34A] dark:text-emerald-400 border-[#A7F3D0] dark:border-emerald-900/60';
      case 'Off Duty':
      default:
        return 'bg-[#F2F4F7] dark:bg-[#1F2937] text-[#667085] dark:text-[#9CA3AF] border-[#D0D5DD] dark:border-[#374151]';
    }
  };

  const handleToggleDuty = async (id: string) => {
    const target = workers.find((w) => w.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Off Duty' ? 'On Duty' : 'Off Duty';

    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: nextStatus } : w))
    );

    try {
      await api.updateUser(id, { dutyStatus: nextStatus });
      if (onRefreshData) onRefreshData();
    } catch {
      // Revert if unauthorized/offline
      setWorkers((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: target.status } : w))
      );
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAECF0] dark:border-[#1E293B]">
        <div>
          <h2 className="text-xl font-bold text-[#101828] dark:text-white tracking-tight">
            Field Workforce & Crew Management
          </h2>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Real-time roster of municipal engineers, field teams, on-site personnel, and work-order resolution evidence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] dark:bg-[#062024] border border-[#A7F3D0] text-xs font-semibold text-[#16A34A] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>{workers.filter((w) => w.status === 'On Site' || w.status === 'On Duty').length} Personnel Active</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats (Computed from Live Database State) */}
      {(() => {
        const activeCount = workers.filter((w) => w.status !== 'Off Duty').length;
        const uniqueWards = new Set(workers.map((w) => w.ward).filter(Boolean)).size;
        const openWorkOrders = workers.reduce((acc, curr) => acc + curr.activeTickets.length, 0);
        const resolvedCount = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
        const completionPct = complaints.length > 0 ? Math.round((resolvedCount / complaints.length) * 100) : 0;

        return (
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 tabular-nums">
            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs">
              <div className="flex items-center justify-between text-[#667085]">
                <span className="text-xs font-semibold">Total Roster Personnel</span>
                <Users className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-[#101828] dark:text-white">
                {workers.length} Personnel
              </div>
              <div className="mt-2 text-[11px] text-[#667085] font-medium">
                Live registered officers & field crews
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs">
              <div className="flex items-center justify-between text-[#667085]">
                <span className="text-xs font-semibold">On-Duty / Dispatched</span>
                <HardHat className="w-4 h-4 text-[#D97706]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-[#D97706]">
                {activeCount} Active
              </div>
              <div className="mt-2 text-[11px] text-[#667085]">
                Across {uniqueWards} covered ward{uniqueWards === 1 ? '' : 's'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs">
              <div className="flex items-center justify-between text-[#667085]">
                <span className="text-xs font-semibold">Work Orders In Hand</span>
                <Clock className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-[#7C3AED]">
                {openWorkOrders} Tickets
              </div>
              <div className="mt-2 text-[11px] text-[#667085]">
                Currently assigned to field roster
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs">
              <div className="flex items-center justify-between text-[#667085]">
                <span className="text-xs font-semibold">Citywide Completion Rate</span>
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-[#16A34A]">
                {completionPct}%
              </div>
              <div className="mt-2 text-[11px] text-[#667085] font-medium">
                {resolvedCount} of {complaints.length} complaints resolved
              </div>
            </div>
          </div>
        );
      })()}

      {/* Filter Row */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by worker name, role, ward, or department..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#101828] dark:text-white placeholder-[#98A2B3] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-medium text-[#101828] dark:text-white"
          >
            <option value="All">All Departments</option>
            <option value="Roads & Infrastructure">Roads & Infrastructure</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Water Supply">Water Supply</option>
            <option value="Electrical Maintenance">Electrical Maintenance</option>
            <option value="Drainage & Sewage">Drainage & Sewage</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-medium text-[#101828] dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="On Duty">On Duty</option>
            <option value="En Route">En Route</option>
            <option value="On Site">On Site</option>
            <option value="Off Duty">Off Duty</option>
          </select>
        </div>
      </div>

      {/* Workforce Roster Mobile Cards + Desktop Table */}
      <div className="rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs overflow-hidden">
        {/* Mobile Roster Cards */}
        <div className="md:hidden divide-y divide-[#EAECF0] dark:divide-[#334155]">
          {filteredWorkers.map((w) => (
            <div key={w.id} className="p-4 space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {brokenAvatars[w.id] ? (
                    <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] font-bold text-xs flex items-center justify-center border border-[#BFDBFE] dark:border-blue-900 shrink-0">
                      {w.name.slice(0, 2).toUpperCase()}
                    </div>
                  ) : (
                    <img
                      src={w.avatar}
                      alt={w.name}
                      onError={() => setBrokenAvatars((prev) => ({ ...prev, [w.id]: true }))}
                      className="w-9 h-9 rounded-full object-cover border border-[#E5E7EB] dark:border-[#374151] shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-[#111827] dark:text-[#F9FAFB] truncate">{w.name}</div>
                    <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF] truncate">{w.role}</div>
                  </div>
                </div>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${getStatusBadge(w.status)}`}>
                  {w.status}
                </span>
              </div>

              <div className="text-[11px] space-y-1">
                <div className="font-semibold text-[#344054] dark:text-slate-200">{w.department}</div>
                <div className="text-[#667085] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#DC2626] shrink-0" />
                  <span className="truncate">{w.ward}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 border-t border-[#EAECF0] dark:border-[#334155]">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[#667085]">Tickets: </span>
                  {w.activeTickets.length > 0 ? (
                    w.activeTickets.map((tNum) => {
                      const match = complaints.find((c) => c.ticketNumber === tNum);
                      return (
                        <button
                          key={tNum}
                          type="button"
                          onClick={() => match && (onOpenProgressModal ? onOpenProgressModal(match) : onSelectComplaint?.(match))}
                          className="font-mono text-[#2563EB] font-bold hover:underline"
                        >
                          {tNum}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-[#98A2B3] italic">Available</span>
                  )}
                </div>
                <div className="tabular-nums">
                  <span className="font-semibold text-[#101828] dark:text-white">{w.resolvedTotal} cases</span>
                  <span className="mx-1.5 text-[#D0D5DD]">•</span>
                  <span className="text-[#16A34A] font-bold">{w.slaRate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleDuty(w.id)}
                  className="flex-1 min-h-[38px] px-3 py-2 rounded-lg bg-[#F2F4F7] hover:bg-[#EAECF0] dark:bg-[#334155] dark:hover:bg-[#475467] text-xs font-semibold text-[#344054] dark:text-slate-200 transition-colors"
                >
                  {w.status === 'Off Duty' ? 'Set On Duty' : 'Set Off Duty'}
                </button>
                {w.activeTickets.length > 0 && onOpenProgressModal && (
                  <button
                    onClick={() => {
                      const match = complaints.find((c) => c.ticketNumber === w.activeTickets[0]);
                      if (match) onOpenProgressModal(match);
                    }}
                    className="min-h-[38px] px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors"
                  >
                    Update Work
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] dark:bg-[#182234] text-[#667085] font-semibold border-b border-[#EAECF0] dark:border-[#334155] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Crew Member</th>
                <th className="px-4 py-3">Department & Ward</th>
                <th className="px-4 py-3">Duty Status</th>
                <th className="px-4 py-3">Active Tickets</th>
                <th className="px-4 py-3">Lifetime Resolved</th>
                <th className="px-4 py-3">SLA Compliance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#334155] bg-white dark:bg-[#1E293B]">
              {filteredWorkers.map((w) => (
                <tr key={w.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#283548] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {brokenAvatars[w.id] ? (
                        <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] font-bold text-xs flex items-center justify-center border border-[#BFDBFE] dark:border-blue-900 shrink-0">
                          {w.name.slice(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <img
                          src={w.avatar}
                          alt={w.name}
                          onError={() => setBrokenAvatars((prev) => ({ ...prev, [w.id]: true }))}
                          className="w-9 h-9 rounded-full object-cover border border-[#E5E7EB] dark:border-[#374151]"
                        />
                      )}
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F9FAFB]">{w.name}</div>
                        <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">{w.role}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-[#344054] dark:text-slate-200">{w.department}</div>
                    <div className="text-[11px] text-[#667085] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#DC2626]" />
                      <span>{w.ward}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(w.status)}`}>
                      {w.status}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                    {w.activeTickets.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {w.activeTickets.map((tNum) => {
                          const match = complaints.find((c) => c.ticketNumber === tNum);
                          return (
                            <button
                              key={tNum}
                              type="button"
                              onClick={() => match && (onSelectComplaint ? onSelectComplaint(match) : onOpenProgressModal?.(match))}
                              className="text-[#2563EB] font-bold hover:underline"
                            >
                              {tNum}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[#98A2B3] italic">Available</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 font-semibold text-[#101828] dark:text-white whitespace-nowrap">
                    {w.resolvedTotal} cases
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-[#16A34A] font-bold">{w.slaRate}</span>
                  </td>

                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {w.activeTickets.length > 0 && onOpenProgressModal && (
                        <button
                          onClick={() => {
                            const match = complaints.find((c) => c.ticketNumber === w.activeTickets[0]);
                            if (match) onOpenProgressModal(match);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors"
                        >
                          Update Work
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleDuty(w.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#F2F4F7] hover:bg-[#EAECF0] dark:bg-[#334155] dark:hover:bg-[#475467] text-xs font-semibold text-[#344054] dark:text-slate-200 transition-colors"
                      >
                        {w.status === 'Off Duty' ? 'Set On Duty' : 'Set Off Duty'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
