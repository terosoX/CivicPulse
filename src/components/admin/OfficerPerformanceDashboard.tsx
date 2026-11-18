import React, { useState, useEffect } from 'react';
import { UserCheck, Star, ShieldCheck, Clock, CheckCircle2, Award, Phone, Activity, Search } from 'lucide-react';
import { api } from '../../services/api';
import { OfficerPerformance } from '../../types';

export default function OfficerPerformanceDashboard() {
  const [officers, setOfficers] = useState<OfficerPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOfficers();
  }, []);

  const loadOfficers = async () => {
    setLoading(true);
    try {
      const data = await api.getOfficers();
      setOfficers(data);
    } catch (err) {
      console.error('Failed to load officer performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOfficers = officers.filter(o =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Field Engineering Command Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Field Officer Performance & Leaderboard</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Real-time evaluation of municipal department officers, response speeds, field completion rates, and citizen ratings.
          </p>
        </div>
        <button
          onClick={loadOfficers}
          className="self-start md:self-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold backdrop-blur-md border border-white/20 transition-all"
        >
          Refresh Officer Logs
        </button>
      </div>

      {/* Officers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOfficers.map((off, index) => (
          <div
            key={off.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
          >
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-wider">
                👑 Top Field Officer
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                {off.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate">{off.name}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate">{off.department}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${off.status === 'On Field' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-[11px] text-slate-500 font-medium">{off.status}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-500">Tickets Resolved</div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {off.resolvedCount} <span className="text-xs text-slate-400 font-normal">/ {off.assignedCount}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-500">Citizen Rating</div>
                <div className="text-lg font-black text-amber-500 mt-0.5 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {off.rating}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-500">Avg Response</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {off.avgResponseMinutes} Mins
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <div className="text-xs text-slate-500">Avg Completion</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {off.avgCompletionHours} Hrs
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5" />
                {off.phone}
              </span>
              <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                {Math.round((off.resolvedCount / off.assignedCount) * 100)}% Success Rate
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
