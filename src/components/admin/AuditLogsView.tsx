import React, { useState, useEffect } from 'react';
import {
  Search,
  Download
} from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/i18n';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  targetId: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FLAGGED' | 'SYSTEM_EXEC';
  details: string;
}

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    let active = true;
    api.getAuditLogs()
      .then((res) => {
        if (!active || !Array.isArray(res)) return;
        const mapped: AuditLogEntry[] = res.map((entry: any) => {
          const rawStatus = String(entry.status || 'Success').toLowerCase();
          const status: AuditLogEntry['status'] =
            rawStatus === 'failed' || rawStatus === 'warning' || rawStatus === 'flagged'
              ? 'FLAGGED'
              : entry.adminRole === 'system' || rawStatus === 'system_exec'
              ? 'SYSTEM_EXEC'
              : 'SUCCESS';

          return {
            id: entry.id,
            timestamp: entry.timestamp ? formatDate(entry.timestamp) : '',
            actor: entry.adminName || entry.actor || 'Municipal Core',
            role: entry.adminRole || entry.role || 'Administrator',
            action: entry.action || 'SYSTEM_EVENT',
            targetId: entry.entityId || entry.targetId || 'SYS',
            ipAddress: entry.ipAddress || '127.0.0.1',
            status,
            details: entry.details || entry.targetEntity || 'Recorded system state mutation',
          };
        });
        setLogs(mapped);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (statusFilter !== 'All' && l.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.actor.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.targetId.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.ipAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAECF0] dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#101828] dark:text-white tracking-tight">
              System Audit Trails & Security Logs
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#16A34A]/10 text-[#16A34A] border border-[#A7F3D0]">
              Immutable SHA-256 Ledger
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Complete cryptographic audit trail of user access, automated triage events, and state mutations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `CivicPulse_Audit_Log_${Date.now()}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs font-semibold text-[#344054] dark:text-slate-300 hover:bg-[#F9FAFB] flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#667085]" />
            <span>Export JSON Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, action type, target ticket, or IP address..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#101828] dark:text-white placeholder-[#98A2B3] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-medium text-[#101828] dark:text-white"
        >
          <option value="All">All Event Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="SYSTEM_EXEC">SYSTEM_EXEC</option>
          <option value="FLAGGED">FLAGGED (Security Alert)</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] dark:bg-[#182234] text-[#667085] font-semibold border-b border-[#EAECF0] dark:border-[#334155] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Log ID & Time</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Action Event</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Mutation Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#334155] bg-white dark:bg-[#1E293B]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#283548] transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-mono font-bold text-[#2563EB]">{log.id}</div>
                    <div className="text-[10px] font-mono text-[#98A2B3]">{log.timestamp}</div>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-semibold text-[#101828] dark:text-white">{log.actor}</div>
                    <div className="text-[10px] text-[#667085]">{log.role}</div>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#F2F4F7] dark:bg-[#0F172A] border border-[#D0D5DD] dark:border-[#334155] text-[#344054] dark:text-slate-300">
                      {log.action}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-[#2563EB] font-bold whitespace-nowrap">
                    {log.targetId}
                  </td>

                  <td className="px-4 py-3.5 font-mono text-[#667085] whitespace-nowrap text-[11px]">
                    {log.ipAddress}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.status === 'SUCCESS'
                          ? 'bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]'
                          : log.status === 'SYSTEM_EXEC'
                          ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                          : 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-xs text-[#344054] dark:text-slate-300 max-w-sm truncate">
                    {log.details}
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
