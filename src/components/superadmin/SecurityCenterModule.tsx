import React from 'react';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Globe,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { SecuritySession } from '../../types';

interface SecurityCenterModuleProps {
  sessions: SecuritySession[];
  onTerminateSession: (id: string) => Promise<void>;
}

export default function SecurityCenterModule({
  sessions,
  onTerminateSession,
}: SecurityCenterModuleProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Security Operations & Active Admin Sessions
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time session monitoring, IP rate limiting protection, JWT revocation, and multi-factor authentication enforcement.
          </p>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm overflow-hidden space-y-4 p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-[#374151] pb-3">
          <Globe className="w-4 h-4 text-blue-500" />
          Active Administrator Sessions ({sessions.filter(s => s.status === 'Active').length} Active)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1F2937]/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-[#374151]">
              <tr>
                <th className="py-3 px-4">Admin User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Device & Browser</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Revoke Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {sessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {sess.userName}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                    {sess.role}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {sess.device}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {sess.ipAddress}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(sess.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sess.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-[#1F2937] dark:text-slate-400'
                      }`}
                    >
                      {sess.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {sess.status === 'Active' && (
                      <button
                        onClick={() => onTerminateSession(sess.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 font-bold text-[11px] transition-colors"
                      >
                        Terminate
                      </button>
                    )}
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
