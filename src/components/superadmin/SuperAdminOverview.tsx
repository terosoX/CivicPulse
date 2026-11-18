import React from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  MapPin,
  AlertTriangle,
  Activity,
  Cpu,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText,
  Server,
  Download,
  Bell,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DashboardStats, AuditLog, SystemHealthMetrics } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface SuperAdminOverviewProps {
  stats: DashboardStats | null;
  usersCount: number;
  officialsCount: number;
  auditLogs: AuditLog[];
  healthMetrics: SystemHealthMetrics;
  onNavigateTab: (tab: string) => void;
  onOpenBroadcast: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function SuperAdminOverview({
  stats,
  usersCount,
  officialsCount,
  auditLogs,
  healthMetrics,
  onNavigateTab,
  onOpenBroadcast,
}: SuperAdminOverviewProps) {
  const { isDark } = useTheme();
  const categoryData = stats
    ? Object.entries(stats.categoryCounts).map(([name, value]) => ({ name: name.split(' ')[0], value }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Command Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                CENTRAL MUNICIPAL CONTROL ROOM
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                SYSTEM ONLINE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Super Admin Executive Platform
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time monitoring of municipal infrastructure, department SLA performance, GIS spatial coverage, and platform health across all urban wards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenBroadcast}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Bell className="w-4 h-4 animate-bounce" />
              Send Emergency Broadcast
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              Export Executive Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Accounts
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {usersCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +14.2%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Citizens, Staff & System Admins
          </p>
        </div>

        {/* Govt Officials */}
        <div
          onClick={() => onNavigateTab('officials')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Field Officers
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {officialsCount}
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              7 Depts Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Engineers & Ward Supervisors
          </p>
        </div>

        {/* Complaints Registered */}
        <div
          onClick={() => onNavigateTab('analytics')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Complaints
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.totalComplaints || 0}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {stats?.citizenSatisfactionRate || 94.2}% Satisfaction
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {stats?.resolved || 0} Resolved | Avg SLA {stats?.avgResolutionHours || 21}h
          </p>
        </div>

        {/* System Health */}
        <div
          onClick={() => onNavigateTab('analytics')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              System Latency
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {healthMetrics.apiResponseLatencyMs} ms
            </span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              CPU {healthMetrics.cpuUsagePercent}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Uptime: {healthMetrics.systemUptime}
          </p>
        </div>
      </div>

      {/* Main Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                6-Month Issue Lodgement vs Resolution Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Municipal ticket velocity & field closure efficiency
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
              Live Feed
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="month" stroke={isDark ? '#9CA3AF' : '#667085'} fontSize={11} />
                <YAxis stroke={isDark ? '#9CA3AF' : '#667085'} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    borderRadius: '12px',
                    color: isDark ? '#F9FAFB' : '#111827',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="complaints" name="Lodged" stroke="#3b82f6" fillOpacity={1} fill="url(#colorComplaints)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Breakdown */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#374151] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Category Volume Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Distribution of civic issues reported
            </p>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      borderRadius: '8px',
                      color: isDark ? '#F9FAFB' : '#111827',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600 dark:text-slate-400 truncate max-w-[90px]">{cat.name}</span>
                <span className="font-bold text-slate-900 dark:text-white ml-auto">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Infrastructure Health & Recent Audit Trail Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Infrastructure Health Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              Infrastructure & AI Status
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              HEALTHY
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* CPU */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">CPU Allocation</span>
                <span className="text-slate-900 dark:text-white">{healthMetrics.cpuUsagePercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${healthMetrics.cpuUsagePercent}%` }} />
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">RAM Memory</span>
                <span className="text-slate-900 dark:text-white">{healthMetrics.memoryUsagePercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${healthMetrics.memoryUsagePercent}%` }} />
              </div>
            </div>

            {/* Local AI Capacity */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">CivicPulse AI Engine Load</span>
                <span className="text-slate-900 dark:text-white">{healthMetrics.geminiApiQuotaUsedPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${healthMetrics.geminiApiQuotaUsedPercent}%` }} />
              </div>
            </div>

            {/* DB Connections */}
            <div className="pt-2 flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
              <span>Database Connections</span>
              <span className="font-bold text-slate-900 dark:text-white">{healthMetrics.databaseConnections} Pool Active</span>
            </div>
          </div>
        </div>

        {/* Live System Audit Stream */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Live System Audit Stream
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable security logs tracking administrative & platform actions
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All Logs →
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between text-xs gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'Success'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-0.5">
                    <span>By: {log.adminName} ({log.adminRole})</span>
                    <span>IP: {log.ipAddress}</span>
                  </div>
                </div>
                <div className="text-[10px] font-medium text-slate-400 whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
