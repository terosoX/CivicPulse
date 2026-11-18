import React from 'react';
import {
  Activity,
  Cpu,
  Server,
  Database,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  HardDrive
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
  Area
} from 'recharts';
import { SystemHealthMetrics, DashboardStats } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface PlatformHealthModuleProps {
  healthMetrics: SystemHealthMetrics;
  stats: DashboardStats | null;
}

const PERFORMANCE_TREND = [
  { time: '00:00', latency: 38, cpu: 18, aiInferences: 12000 },
  { time: '04:00', latency: 32, cpu: 14, aiInferences: 8000 },
  { time: '08:00', latency: 45, cpu: 28, aiInferences: 28000 },
  { time: '12:00', latency: 52, cpu: 34, aiInferences: 42000 },
  { time: '16:00', latency: 48, cpu: 30, aiInferences: 35000 },
  { time: '20:00', latency: 41, cpu: 22, aiInferences: 19000 },
];

export default function PlatformHealthModule({
  healthMetrics,
  stats,
}: PlatformHealthModuleProps) {
  const { isDark } = useTheme();
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Platform Analytics & Infrastructure Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time server metrics, CivicPulse Local AI neural processing volume, API latency, and persistent data store telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            UPTIME: {healthMetrics.systemUptime}
          </span>
        </div>
      </div>

      {/* Hardware Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">CPU Allocation</span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {healthMetrics.cpuUsagePercent}%
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${healthMetrics.cpuUsagePercent}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Memory Allocation</span>
            <HardDrive className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {healthMetrics.memoryUsagePercent}%
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${healthMetrics.memoryUsagePercent}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">API Response Time</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {healthMetrics.apiResponseLatencyMs} ms
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            ⚡ Optimal Node.js Event Loop
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-[#E5E7EB] dark:border-[#374151] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">AI Inferences Today</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {healthMetrics.geminiTokenCountToday.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            {healthMetrics.geminiApiQuotaUsedPercent}% Local Compute Load
          </p>
        </div>
      </div>

      {/* Latency & Token Usage Area Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Trend */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            24-Hour API Latency (ms)
          </h3>
          <p className="text-xs text-slate-500 mb-4">Express API response duration across endpoints</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="time" stroke={isDark ? '#9CA3AF' : '#667085'} fontSize={11} />
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
                <Area type="monotone" dataKey="latency" name="Latency (ms)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CivicPulse Local AI Consumption */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#374151] shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            CivicPulse AI Neural Processing
          </h3>
          <p className="text-xs text-slate-500 mb-4">Auto-triage, voice parsing, & chatbot assistant queries</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PERFORMANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="time" stroke={isDark ? '#9CA3AF' : '#667085'} fontSize={11} />
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
                <Bar dataKey="aiInferences" name="AI Inferences" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Resolution SLA Performance Bar Chart */}
      <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#374151] shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          Department Average Resolution Hours vs SLA Target
        </h3>
        <p className="text-xs text-slate-500 mb-4">Actual resolution turnaround times across municipal departments</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.departmentPerformance || []} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="name" stroke={isDark ? '#9CA3AF' : '#667085'} fontSize={10} angle={-15} textAnchor="end" />
              <YAxis stroke={isDark ? '#9CA3AF' : '#667085'} fontSize={11} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                  borderRadius: '12px',
                  color: isDark ? '#F9FAFB' : '#111827',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="avgHours" name="Avg Hours" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
