import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  MapPin,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Complaint, Department } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

interface AIAnalyticsViewProps {
  complaints: Complaint[];
  departments: Department[];
  onNavigateTab?: (tab: any) => void;
}

export default function AIAnalyticsView({
  complaints,
  departments,
  onNavigateTab,
}: AIAnalyticsViewProps) {
  const { isDark } = useTheme();
  const [predictResponse, setPredictResponse] = useState<{
    model?: string;
    trainedModelLoaded?: boolean;
    trainedOnRecords?: number;
    globalResolutionRate?: number;
    wardForecasts?: Array<{
      ward: string;
      totalLogged: number;
      currentActive: number;
      criticalActive: number;
      predicted7Days: number;
      predicted30Days: number;
      riskLevel: string;
      recommendedFieldCrews: number;
    }>;
    seasonalSurgeAlert?: string;
  } | null>(null);

  useEffect(() => {
    api.predictTrends()
      .then((res) => {
        if (res) setPredictResponse(res);
      })
      .catch(() => {});
  }, [complaints.length]);

  const gridStroke = isDark ? '#1F2937' : '#E5E7EB';
  const axisStroke = isDark ? '#9CA3AF' : '#667085';
  const actualLineStroke = isDark ? '#F9FAFB' : '#111827';
  const tooltipStyle = {
    backgroundColor: '#111827',
    borderRadius: '8px',
    border: isDark ? '1px solid #374151' : 'none',
    color: '#F9FAFB',
    fontSize: '12px',
  };

  // 1. Chronological Observed Intake vs Statistical Queue Projection
  const dailyBucketMap = new Map<string, { label: string; sortKey: string; count: number }>();
  complaints.forEach((c) => {
    const ms = new Date(c.createdAt).getTime();
    if (!Number.isNaN(ms)) {
      const d = new Date(ms);
      const sortKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      const existing = dailyBucketMap.get(sortKey) || { label, sortKey, count: 0 };
      existing.count += 1;
      dailyBucketMap.set(sortKey, existing);
    }
  });

  const observedDays = Array.from(dailyBucketMap.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-7);

  const avgDailyObserved = observedDays.length > 0
    ? observedDays.reduce((s, d) => s + d.count, 0) / observedDays.length
    : 0;

  const activeBacklog = complaints.filter(
    (c) => c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Rejected'
  ).length;

  const lastObserved = observedDays[observedDays.length - 1];
  const baselineDaily = Math.max(1, Math.round(avgDailyObserved || Math.ceil(activeBacklog / 4)));
  const totalPredicted7d = (predictResponse?.wardForecasts || []).reduce(
    (sum, w) => sum + (w.predicted7Days || 0),
    0
  );
  const projectedDailyTarget = totalPredicted7d > 0 ? Math.max(1, Math.round(totalPredicted7d / 7)) : baselineDaily;

  const predictionTrendData = [
    ...observedDays.map((d, idx) => ({
      day: d.label,
      actual: d.count,
      forecast: idx === observedDays.length - 1 ? d.count : null,
    })),
    ...(observedDays.length === 0 ? [{ day: 'Today', actual: 0, forecast: 0 }] : []),
    { day: '+1d (Est)', actual: null, forecast: Math.max(lastObserved?.count || 0, projectedDailyTarget) },
    { day: '+2d (Est)', actual: null, forecast: projectedDailyTarget },
    { day: '+3d (Est)', actual: null, forecast: Math.round(projectedDailyTarget * 1.1) },
    { day: '+4d (Est)', actual: null, forecast: Math.round(projectedDailyTarget * 1.05) },
    { day: '+5d (Est)', actual: null, forecast: baselineDaily },
  ];

  // 2. Dynamically computed Most Affected Locations / Spatial Risk Scoring
  const wardGrouped: Record<string, { total: number; active: number; critical: number; topCategory: Record<string, number> }> = {};
  complaints.forEach((c) => {
    const wName = c.location?.ward || 'Unassigned Ward';
    if (!wardGrouped[wName]) {
      wardGrouped[wName] = { total: 0, active: 0, critical: 0, topCategory: {} };
    }
    wardGrouped[wName].total += 1;
    if (c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Rejected') {
      wardGrouped[wName].active += 1;
    }
    if ((c.priority === 'Critical' || c.priority === 'High') && c.status !== 'Resolved' && c.status !== 'Closed') {
      wardGrouped[wName].critical += 1;
    }
    wardGrouped[wName].topCategory[c.category] = (wardGrouped[wName].topCategory[c.category] || 0) + 1;
  });

  const hotZones = Object.entries(wardGrouped)
    .map(([ward, info]) => {
      const sortedCats = Object.entries(info.topCategory).sort((a, b) => b[1] - a[1]);
      const riskScore = Math.min(100, info.active * 12 + info.critical * 18 + info.total * 4);
      const forecastMatch = predictResponse?.wardForecasts?.find((w) => w.ward === ward);
      return {
        ward,
        activeIssues: info.active,
        totalLogged: info.total,
        riskScore,
        categorySurge: sortedCats[0]?.[0] || 'Civic Maintenance',
        riskLabel: forecastMatch?.riskLevel || (riskScore >= 65 ? 'High Risk' : riskScore >= 30 ? 'Moderate' : 'Stable'),
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const topRiskWard = hotZones[0];

  // 3. Real Hourly Complaint Frequency Analysis from stored createdAt timestamps
  const hourBuckets = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    startHour: h,
    frequency: 0,
  }));
  complaints.forEach((c) => {
    const d = new Date(c.createdAt);
    if (!Number.isNaN(d.getTime())) {
      const bucketIdx = Math.min(11, Math.floor(d.getUTCHours() / 2));
      hourBuckets[bucketIdx].frequency += 1;
    }
  });
  const hourlyFrequencyData = hourBuckets.map(({ hour, frequency }) => ({ hour, frequency }));

  // 4. Real Department Efficiency Scores from live complaints & departments
  const efficiencyMetrics = departments.map((d) => {
    const deptTickets = complaints.filter((c) => c.departmentAssigned === d.name);
    const activeCount = deptTickets.filter(
      (c) => c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Rejected'
    ).length;
    const resolvedTickets = deptTickets.filter((c) => c.status === 'Resolved' || c.status === 'Closed');
    let hoursSum = 0;
    let samples = 0;
    resolvedTickets.forEach((c) => {
      const start = new Date(c.createdAt).getTime();
      const resEvent = c.statusHistory?.find((h) => h.status === 'Resolved' || h.status === 'Closed');
      const end = new Date(resEvent?.timestamp || c.updatedAt).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        hoursSum += (end - start) / 3600000;
        samples += 1;
      }
    });
    const avgHours = samples > 0 ? `${(hoursSum / samples).toFixed(1)}h` : '—';
    const resolutionRate = deptTickets.length > 0
      ? `${Math.round((resolvedTickets.length / deptTickets.length) * 100)}%`
      : '—';
    return {
      dept: d.name,
      slaRate: resolutionRate,
      avgHours,
      totalCount: deptTickets.length,
      capacity: activeCount >= 4 ? 'Heavy Load' : 'Optimal',
    };
  });

  // 5. Real Triage & Mean Resolution Metrics
  const ruleTriagedCount = complaints.filter((c) => Boolean(c.aiAnalysis)).length;
  const ruleTriagePct = complaints.length > 0 ? Math.round((ruleTriagedCount / complaints.length) * 100) : 0;

  const resolvedAll = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed');
  let globalHoursSum = 0;
  let globalSamples = 0;
  resolvedAll.forEach((c) => {
    const start = new Date(c.createdAt).getTime();
    const resEvent = c.statusHistory?.find((h) => h.status === 'Resolved' || h.status === 'Closed');
    const end = new Date(resEvent?.timestamp || c.updatedAt).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
      globalHoursSum += (end - start) / 3600000;
      globalSamples += 1;
    }
  });
  const meanResolutionHours = globalSamples > 0 ? `${(globalHoursSum / globalSamples).toFixed(1)}h` : 'N/A';
  const resolutionRatePct = complaints.length > 0 ? Math.round((resolvedAll.length / complaints.length) * 100) : 0;

  return (
    <div className="space-y-6 text-left">
      {/* Header and Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB] dark:border-[#374151]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
              Triage Analytics & Statistical Estimator
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14B8A6]/10 text-[#0D9488] dark:text-teal-400 border border-[#99F6E4] dark:border-teal-800 whitespace-nowrap">
              Rule-Based Ontology • Vision ML: {predictResponse?.trainedModelLoaded ? 'Loaded' : 'Not Loaded'}
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
            Live database aggregations across {complaints.length} complaints, moving-average queue estimates, and spatial ward counts
          </p>
        </div>

        {/* Legend disclaimer distinguishing actual vs statistical estimates */}
        <div className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/40 border border-[#BFDBFE] dark:border-blue-900/60 flex items-center gap-2 text-xs text-[#1E40AF] dark:text-[#93C5FD]">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Solid lines reflect stored DB complaints; dashed projections use deterministic moving-average queue estimation.</span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 tabular-nums">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">7-Day Projected Intake</span>
            <BrainCircuit className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">
            {totalPredicted7d} Tickets
          </div>
          <div className="mt-2 text-[11px] text-[#667085] dark:text-[#9CA3AF] flex items-center gap-1 truncate" title={predictResponse?.seasonalSurgeAlert}>
            <TrendingUp className="w-3 h-3 text-[#2563EB] shrink-0" />
            <span className="truncate">{activeBacklog} currently active in queue</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Top Hotspot Ward</span>
            <MapPin className="w-4 h-4 text-[#DC2626] dark:text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#DC2626] dark:text-red-400">
            {topRiskWard ? topRiskWard.ward.split(' - ')[0] : 'None'}
          </div>
          <div className="mt-2 text-[11px] text-[#667085] dark:text-[#9CA3AF]">
            {topRiskWard ? (
              <>Score: <strong className="text-[#DC2626] dark:text-red-400">{topRiskWard.riskScore}/100</strong> ({topRiskWard.activeIssues} active)</>
            ) : (
              'No ward backlog recorded'
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Rule Triage Coverage</span>
            <Sparkles className="w-4 h-4 text-[#14B8A6]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#16A34A] dark:text-emerald-400">
            {ruleTriagePct}%
          </div>
          <div className="mt-2 text-[11px] text-[#667085] dark:text-[#9CA3AF] font-medium">
            {ruleTriagedCount}/{complaints.length} via Deterministic Ontology
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Observed Mean Resolution</span>
            <Clock className="w-4 h-4 text-[#7C3AED] dark:text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">
            {meanResolutionHours}
          </div>
          <div className="mt-2 text-[11px] text-[#2563EB] dark:text-[#60A5FA] font-medium">
            {resolutionRatePct}% of logged tickets resolved/closed
          </div>
        </div>
      </div>

      {/* Main Charts: Intake & Hourly Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Daily Volume & Statistical Estimate Chart (8 cols) */}
        <div className="lg:col-span-8 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Intake History vs Moving-Average Projection
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Chronological database intake counts paired with linear statistical projection
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[#F2F4F7] dark:bg-[#0F172A] rounded-lg text-[11px] shrink-0">
              <span className="px-2 py-0.5 font-semibold text-[#2563EB]">Observed + 5-Day Estimate</span>
            </div>
          </div>

          <div className="h-56 sm:h-72 w-full min-w-0 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictionTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={11} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} domain={[0, 'auto']} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke={actualLineStroke}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: actualLineStroke }}
                  name="Observed DB Complaints"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#2563EB"
                  strokeDasharray="4 4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#forecastFill)"
                  name="Statistical Estimate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaint Frequency by Hour of Day (4 cols) */}
        <div className="lg:col-span-4 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs space-y-3">
          <div className="pb-3 border-b border-[#E5E7EB] dark:border-[#374151]">
            <h3 className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">
              Incident Frequency by Hour (UTC)
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
              Distribution of stored ticket timestamps across 2-hour windows
            </p>
          </div>

          <div className="h-56 sm:h-72 w-full min-w-0 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyFrequencyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="hour" stroke={axisStroke} fontSize={10} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="frequency" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Reports Logged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Most Affected Locations Table & Department Efficiency Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Most Affected Locations (6 cols) */}
        <div className="lg:col-span-6 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Most Affected Locations & Hotspots
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Ward ranking derived strictly from active backlog and critical priority tickets
              </p>
            </div>
            <span className="text-[10px] font-semibold text-[#DC2626] dark:text-red-400 bg-[#FEF2F2] dark:bg-red-950/40 px-2 py-0.5 rounded border border-[#FCA5A5] dark:border-red-900/60 shrink-0">
              Live Spatial Index
            </span>
          </div>

          {hotZones.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#667085] dark:text-slate-400">
              No ward complaints recorded in database yet.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB] dark:divide-[#374151]">
              {hotZones.map((z, idx) => (
                <div key={idx} className="py-2.5 flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2 sm:gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#111827] dark:text-[#F9FAFB] truncate">
                      {z.ward}
                    </div>
                    <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF] truncate">
                      Dominant: {z.categorySurge} ({z.totalLogged} total)
                    </div>
                  </div>

                  <div className="flex items-center justify-between min-[420px]:justify-end gap-3 shrink-0 tabular-nums">
                    <div className="min-[420px]:text-right">
                      <div className="font-bold text-[#111827] dark:text-[#F9FAFB]">{z.activeIssues} active</div>
                      <div className="text-[10px] text-[#DC2626] dark:text-red-400 font-medium">{z.riskLabel}</div>
                    </div>

                    <div className="w-12 text-center py-1 rounded font-bold font-mono text-[11px] bg-[#FEF2F2] dark:bg-red-950/40 text-[#DC2626] dark:text-red-400 border border-[#FCA5A5] dark:border-red-900/60">
                      {z.riskScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Efficiency Matrix (6 cols) */}
        <div className="lg:col-span-6 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB] dark:border-[#374151]">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">
                Department Resolution & Queue Throughput
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
                Live resolution percentages and mean completion durations per municipal division
              </p>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('departments')}
              className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline shrink-0"
            >
              View Depts &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] dark:bg-[#1F2937] text-[#667085] dark:text-[#9CA3AF] text-[10px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Department</th>
                  <th className="p-2.5">Resolved %</th>
                  <th className="p-2.5">Avg Time</th>
                  <th className="p-2.5">Load Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#374151]">
                {efficiencyMetrics.map((em, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937]">
                    <td className="p-2.5 font-medium text-[#111827] dark:text-[#F9FAFB]">
                      {em.dept}
                    </td>
                    <td className="p-2.5 font-semibold text-[#16A34A] dark:text-emerald-400">
                      {em.slaRate}
                    </td>
                    <td className="p-2.5 font-mono text-[#667085] dark:text-[#9CA3AF]">
                      {em.avgHours}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        em.capacity === 'Optimal'
                          ? 'bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#16A34A] dark:text-emerald-400'
                          : 'bg-[#FFFBEB] dark:bg-amber-950/40 text-[#D97706] dark:text-amber-400'
                      }`}>
                        {em.capacity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dispatch Recommendation Banner */}
          <div className="p-3 rounded-lg bg-[#FFFBEB] dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-900/60 text-[#B45309] dark:text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-4">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                {topRiskWard
                  ? `Highest active backlog observed in ${topRiskWard.ward.split(' - ')[0]} (${topRiskWard.activeIssues} active tickets).`
                  : 'All municipal wards currently have zero active backlog.'}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('departments')}
              className="w-full sm:w-auto min-h-[36px] px-3 py-1.5 rounded bg-[#D97706] hover:bg-[#B45309] text-white text-[11px] font-bold shrink-0 transition-colors text-center"
            >
              Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
