import React, { useState, useEffect } from 'react';
import { Building2, Award, Clock, CheckCircle, AlertCircle, TrendingUp, BarChart3, PieChart as PieChartIcon, Search, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { api } from '../../services/api';
import { WardPerformanceStats } from '../../types';

export default function WardPerformanceDashboard() {
  const [wards, setWards] = useState<WardPerformanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWard, setSelectedWard] = useState<WardPerformanceStats | null>(null);

  useEffect(() => {
    loadWardData();
  }, []);

  const loadWardData = async () => {
    setLoading(true);
    try {
      const data = await api.getWardPerformance();
      setWards(data);
      if (data.length > 0) setSelectedWard(data[0]);
    } catch (err) {
      console.error('Failed to load ward performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWards = wards.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.councillor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Building2 className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-500/30 mb-3">
              <Award className="w-3.5 h-3.5" />
              Municipal Corporation Accountability Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ward Performance & Governance Leaderboard</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Comparative analytics across all municipal wards evaluating SLA compliance, resolution turnaround times, and citizen satisfaction scores.
            </p>
          </div>
          <button
            onClick={loadWardData}
            className="self-start md:self-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold backdrop-blur-md border border-white/20 transition-all"
          >
            Refresh Live Metrics
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Wards Tracked</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{wards.length} Wards</div>
          <p className="text-xs text-slate-500 mt-1">100% Ward Coverage</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Citywide Resolution</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">16.2 Hours</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">↑ 18% Faster than Target SLA</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Citizen Satisfaction</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">93.8%</div>
          <p className="text-xs text-amber-600 font-medium mt-1">Based on verified feedback</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Performing Ward</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">Ward 1</div>
          <p className="text-xs text-purple-600 font-medium mt-1">98.0% SLA Compliance</p>
        </div>
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Resolved vs Pending */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Ward Resolution Comparison</h3>
              <p className="text-xs text-slate-500">Resolved complaints vs active pending queue</p>
            </div>
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wards}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="code" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="resolvedComplaints" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendingComplaints" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Total Complaints Share */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Complaint Load Distribution</h3>
              <p className="text-xs text-slate-500">Share of total municipal grievances by Ward</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wards}
                  dataKey="totalComplaints"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ code }) => code}
                >
                  {wards.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ward Leaderboard Table */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Ward Governance Leaderboard Table</h3>
            <p className="text-xs text-slate-500">Ranked by overall SLA compliance and citizen rating</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ward or councillor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Ward Name & Code</th>
                <th className="py-3 px-4">Councillor</th>
                <th className="py-3 px-4">Resolved / Total</th>
                <th className="py-3 px-4">Avg Resolution Time</th>
                <th className="py-3 px-4">SLA Compliance</th>
                <th className="py-3 px-4">Satisfaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredWards.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => setSelectedWard(w)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    selectedWard?.id === w.id ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-black">
                    <span
                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                        w.rank === 1
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                          : w.rank === 2
                          ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      #{w.rank}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {w.name} <span className="text-slate-400 font-mono text-[10px]">({w.code})</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">{w.councillor}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{w.resolvedComplaints}</span>
                    <span className="text-slate-400"> / {w.totalComplaints}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{w.avgResolutionHours} hrs</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            w.slaCompliancePercent >= 95 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${w.slaCompliancePercent}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{w.slaCompliancePercent}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
                      ★ {w.citizenSatisfactionRate}%
                    </span>
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
