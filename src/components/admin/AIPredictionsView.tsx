import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  Info,
  CloudRain,
  Cpu,
  RefreshCw,
  Users
} from 'lucide-react';
import {
  Line,
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
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface AIPredictionsViewProps {
  complaints: Complaint[];
  departments: Department[];
  onNavigateTab?: (tab: any) => void;
}

interface WardForecastItem {
  ward: string;
  totalLogged: number;
  currentActive: number;
  criticalActive: number;
  predicted7Days: number;
  predicted30Days: number;
  riskLevel: string;
  recommendedFieldCrews: number;
}

interface PredictTrendsPayload {
  model?: string;
  trainedModelLoaded?: boolean;
  trainedOnRecords?: number;
  globalResolutionRate?: number;
  forecastHorizonDays?: number[];
  wardForecasts?: WardForecastItem[];
  seasonalSurgeAlert?: string;
}

export default function AIPredictionsView({
  complaints,
  departments,
  onNavigateTab,
}: AIPredictionsViewProps) {
  const { isDark } = useTheme();
  const [modelHorizon, setModelHorizon] = useState<'7d' | '30d'>('7d');
  const [simulating, setSimulating] = useState(false);
  const [predictionData, setPredictionData] = useState<PredictTrendsPayload | null>(null);

  const loadPrediction = async () => {
    setSimulating(true);
    try {
      const res = await api.predictTrends();
      setPredictionData(res);
    } catch {
      // keep locally derived queue statistics if offline
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    loadPrediction();
  }, [complaints.length]);

  const gridStroke = isDark ? '#1F2937' : '#E5E7EB';
  const axisStroke = isDark ? '#9CA3AF' : '#667085';
  const tooltipStyle = {
    backgroundColor: '#111827',
    borderRadius: '8px',
    border: isDark ? '1px solid #374151' : 'none',
    color: '#F9FAFB',
    fontSize: '12px',
  };

  // Fallback local ward derivation strictly from live complaints if API hasn't returned yet
  const localWardMap: Record<string, { total: number; active: number; critical: number }> = {};
  complaints.forEach((c) => {
    const w = c.location?.ward || 'Unassigned Ward';
    if (!localWardMap[w]) localWardMap[w] = { total: 0, active: 0, critical: 0 };
    localWardMap[w].total += 1;
    if (c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Rejected') {
      localWardMap[w].active += 1;
      if (c.priority === 'Critical') localWardMap[w].critical += 1;
    }
  });

  const localWardForecasts: WardForecastItem[] = Object.entries(localWardMap).map(([ward, counts]) => {
    const loadMultiplier = counts.active > 3 ? 1.25 : 1.0;
    const predicted7Days = counts.active === 0 ? 0 : Math.max(1, Math.round(counts.active * 1.2 * loadMultiplier));
    const predicted30Days = counts.active === 0 ? 0 : Math.max(2, Math.round(counts.active * 3.5 * loadMultiplier));
    const riskLevel = counts.critical >= 2 || counts.active >= 5 ? 'High Risk' : counts.active >= 2 ? 'Moderate' : 'Stable';
    return {
      ward,
      totalLogged: counts.total,
      currentActive: counts.active,
      criticalActive: counts.critical,
      predicted7Days,
      predicted30Days,
      riskLevel,
      recommendedFieldCrews: counts.active === 0 ? 0 : Math.max(1, Math.ceil((counts.active + counts.critical) / 2)),
    };
  });

  const wardStressList: WardForecastItem[] = (
    Array.isArray(predictionData?.wardForecasts) && predictionData.wardForecasts.length > 0
      ? predictionData.wardForecasts
      : localWardForecasts
  ).slice().sort((a, b) => b.predicted7Days - a.predicted7Days || b.currentActive - a.currentActive);

  const totalActiveQueue = wardStressList.reduce((sum, w) => sum + w.currentActive, 0);
  const totalPredicted7d = wardStressList.reduce((sum, w) => sum + w.predicted7Days, 0);
  const totalPredicted30d = wardStressList.reduce((sum, w) => sum + w.predicted30Days, 0);
  const totalCrewsRecommended = wardStressList.reduce(
    (sum, w) => sum + (w.currentActive > 0 ? w.recommendedFieldCrews : 0),
    0
  );
  const topWard = wardStressList[0];

  // Build observed chronological daily buckets from real complaints
  const dayMap = new Map<string, { day: string; sortKey: string; count: number }>();
  complaints.forEach((c) => {
    const ms = new Date(c.createdAt).getTime();
    if (!Number.isNaN(ms)) {
      const d = new Date(ms);
      const sortKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      const entry = dayMap.get(sortKey) || { day: label, sortKey, count: 0 };
      entry.count += 1;
      dayMap.set(sortKey, entry);
    }
  });
  const sortedObserved = Array.from(dayMap.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-4);

  const lastCount = sortedObserved[sortedObserved.length - 1]?.count ?? 0;
  const dailyEstBase = Math.max(1, Math.round(totalPredicted7d / 7));

  const forecast7d = [
    ...sortedObserved.map((d, idx) => ({
      day: d.day,
      actual: d.count,
      forecast: idx === sortedObserved.length - 1 ? d.count : null,
      upperBand: idx === sortedObserved.length - 1 ? d.count + 1 : null,
    })),
    ...(sortedObserved.length === 0 ? [{ day: 'Today', actual: 0, forecast: 0, upperBand: 1 }] : []),
    { day: '+1 Day', actual: null, forecast: Math.max(lastCount, dailyEstBase), upperBand: Math.ceil(Math.max(lastCount, dailyEstBase) * 1.25) },
    { day: '+2 Days', actual: null, forecast: dailyEstBase, upperBand: Math.ceil(dailyEstBase * 1.25) + 1 },
    { day: '+3 Days', actual: null, forecast: Math.round(dailyEstBase * 1.15), upperBand: Math.ceil(dailyEstBase * 1.4) + 1 },
    { day: '+4 Days', actual: null, forecast: Math.round(dailyEstBase * 1.1), upperBand: Math.ceil(dailyEstBase * 1.35) + 1 },
    { day: '+5 Days', actual: null, forecast: dailyEstBase, upperBand: Math.ceil(dailyEstBase * 1.25) + 1 },
    { day: '+6 Days', actual: null, forecast: Math.max(1, Math.round(dailyEstBase * 0.9)), upperBand: Math.ceil(dailyEstBase * 1.15) + 1 },
    { day: '+7 Days', actual: null, forecast: Math.max(1, Math.round(dailyEstBase * 0.85)), upperBand: Math.ceil(dailyEstBase * 1.1) + 1 },
  ];

  const weeklyEstBase = Math.max(1, Math.round(totalPredicted30d / 4));
  const forecast30d = [
    { day: 'Week 1 (Observed)', actual: complaints.length, forecast: complaints.length, upperBand: complaints.length + 2 },
    { day: 'Week 2 (Est)', actual: null, forecast: weeklyEstBase, upperBand: Math.ceil(weeklyEstBase * 1.25) },
    { day: 'Week 3 (Est)', actual: null, forecast: Math.round(weeklyEstBase * 1.15), upperBand: Math.ceil(weeklyEstBase * 1.4) },
    { day: 'Week 4 (Est)', actual: null, forecast: Math.round(weeklyEstBase * 0.9), upperBand: Math.ceil(weeklyEstBase * 1.2) },
  ];

  const activeForecast = modelHorizon === '30d' ? forecast30d : forecast7d;

  // Dynamic directives generated from real active ward queues & department workloads
  const overloadedDepts = departments.filter((d) => {
    const active = complaints.filter(
      (c) => c.departmentAssigned === d.name && c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Rejected'
    ).length;
    return active >= 2;
  });

  const dynamicDirectives = wardStressList
    .filter((w) => w.currentActive > 0)
    .slice(0, 3)
    .map((w) => ({
      title: `${w.ward.split(' - ')[0]} Crew Readiness`,
      urgency: w.riskLevel === 'High Risk' ? 'Priority' : w.riskLevel === 'Moderate' ? 'Active Queue' : 'Monitor',
      body: `${w.currentActive} active ticket(s) (${w.criticalActive} critical). Projected 7-day demand: ${w.predicted7Days} tickets. Recommended allocation: ${w.recommendedFieldCrews} crew(s).`,
      tone: w.riskLevel === 'High Risk' ? 'blue' : w.riskLevel === 'Moderate' ? 'teal' : 'amber',
    }));

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAECF0] dark:border-[#1E293B]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-[#101828] dark:text-white tracking-tight">
              Statistical Queue Projections & Workload Planning
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2563EB]/10 text-[#2563EB] dark:text-blue-400 border border-[#BFDBFE] dark:border-blue-800 whitespace-nowrap">
              Statistical Queue Estimator (Vision ML: {predictionData?.trainedModelLoaded ? 'Loaded' : 'Not Loaded'})
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Deterministic queue depth extrapolations and staffing estimates derived from {complaints.length} stored complaints across {wardStressList.length} wards
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadPrediction}
            disabled={simulating}
            className="w-full sm:w-auto min-h-[38px] px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] border border-[#D0D5DD] dark:border-[#334155] text-[#344054] dark:text-slate-300 hover:bg-[#F9FAFB] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#2563EB] ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'Recalculating...' : 'Recalculate Projections'}</span>
          </button>
        </div>
      </div>

      {/* 4 Prediction Highlight Metric Cards */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 tabular-nums">
        {/* Card 1 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">7-Day Projected Load</span>
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#101828] dark:text-white">
            {totalPredicted7d} Tickets
          </div>
          <div className="mt-2 text-[11px] text-[#D97706] dark:text-amber-400 font-medium flex items-center gap-1 truncate">
            <CloudRain className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{totalActiveQueue} active tickets across wards</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">Highest Queue Ward</span>
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#DC2626] dark:text-red-400">
            {topWard ? topWard.ward.split(' - ')[0] : 'Balanced'}
          </div>
          <div className="mt-2 text-[11px] text-[#667085] dark:text-slate-400 truncate">
            {topWard ? (
              <>Active: <strong className="text-[#DC2626] dark:text-red-400">{topWard.currentActive}</strong> ({topWard.riskLevel})</>
            ) : (
              'No ward backlog logged'
            )}
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">Global Resolution Rate</span>
            <Cpu className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9488] dark:text-teal-400">
            {predictionData?.globalResolutionRate ?? (complaints.length > 0 ? Math.round((complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length / complaints.length) * 100) : 0)}%
          </div>
          <div className="mt-2 text-[11px] text-[#16A34A] dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Rule-Based Ontology + dHash Active</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">Estimated Crews Needed</span>
            <Users className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#7C3AED] dark:text-violet-400">
            {totalCrewsRecommended} Crew{totalCrewsRecommended === 1 ? '' : 's'}
          </div>
          <div className="mt-2 text-[11px] text-[#667085] dark:text-slate-400 truncate">
            {overloadedDepts.length > 0
              ? `${overloadedDepts.length} dept(s) with ≥2 active tickets`
              : 'All departments within normal load'}
          </div>
        </div>
      </div>

      {/* Main Forecast Chart Section */}
      <div className="min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#101828] dark:text-white">
              Complaint Volume & Linear Queue Projection
            </h3>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              Observed database filings paired with deterministic statistical bounds (Non-ML Moving-Average Heuristic)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-[#F2F4F7] dark:bg-[#0F172A] rounded-lg text-xs font-medium">
              <button
                onClick={() => setModelHorizon('7d')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  modelHorizon === '7d'
                    ? 'bg-white dark:bg-[#1E293B] text-[#101828] dark:text-white shadow-2xs font-semibold'
                    : 'text-[#667085]'
                }`}
              >
                7-Day Horizon
              </button>
              <button
                onClick={() => setModelHorizon('30d')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  modelHorizon === '30d'
                    ? 'bg-white dark:bg-[#1E293B] text-[#101828] dark:text-white shadow-2xs font-semibold'
                    : 'text-[#667085]'
                }`}
              >
                30-Day Horizon
              </button>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-56 sm:h-72 w-full min-w-0 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeForecast} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#93C5FD" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="day" stroke={axisStroke} fontSize={11} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              <Area
                type="monotone"
                dataKey="upperBand"
                stroke="#93C5FD"
                strokeDasharray="3 3"
                fill="url(#bandFill)"
                name="Upper Load Margin (+25%)"
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#forecastFill)"
                name="Projected Queue Rate"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#16A34A"
                strokeWidth={3}
                dot={{ r: 4, fill: '#16A34A' }}
                name="Observed DB Tickets"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#667085] dark:text-slate-400 border-t border-[#F2F4F7] dark:border-[#2D3748]">
          <div className="flex items-start sm:items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5 sm:mt-0" />
            <span>
              {predictionData?.seasonalSurgeAlert || `Evaluating ${complaints.length} stored records using deterministic queue trend estimation (no trained neural weights loaded).`}
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#2563EB] font-medium shrink-0">
            Records: {predictionData?.trainedOnRecords ?? complaints.length}
          </span>
        </div>
      </div>

      {/* Ward Risk Breakdown & Dynamic Crew Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Ward Stress Rankings */}
        <div className="lg:col-span-7 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Ward Queue & Workload Forecast
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Real per-ward active counts, critical flags, and 7-day / 30-day queue extrapolations
              </p>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('map')}
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View Map</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {wardStressList.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#667085] dark:text-slate-400">
              No ward records available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {wardStressList.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-[#EAECF0] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#101828] dark:text-white">{w.ward}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          w.riskLevel === 'High Risk'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
                            : w.riskLevel === 'Moderate'
                            ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                            : 'bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]'
                        }`}
                      >
                        {w.riskLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#667085] dark:text-slate-400 mt-1">
                      Total Logged: {w.totalLogged} • Active: {w.currentActive} • Critical Active: {w.criticalActive}
                    </div>
                    <div className="text-[11px] text-[#2563EB] dark:text-blue-400 font-medium mt-0.5">
                      Recommended Staffing: {w.recommendedFieldCrews} crew(s)
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 tabular-nums">
                    <div className="text-sm font-bold font-mono text-[#101828] dark:text-white">
                      {w.predicted7Days} <span className="text-[10px] font-normal text-[#667085]">/ 7d est.</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#667085] dark:text-slate-400">
                      {w.predicted30Days} / 30d est.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Resource Directives */}
        <div className="lg:col-span-5 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <h3 className="text-sm font-bold text-[#101828] dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span>Queue-Driven Crew Allocation Directives</span>
            </h3>
            <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
              Generated directly from active ward backlog and critical ticket counts
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {dynamicDirectives.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#ECFDF5] dark:bg-emerald-950/30 border border-[#A7F3D0] dark:border-emerald-800 text-[#15803D] dark:text-emerald-300 text-xs">
                All municipal wards currently have zero active backlog requiring crew transfer.
              </div>
            ) : (
              dynamicDirectives.map((dir, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border space-y-1.5 ${
                    dir.tone === 'blue'
                      ? 'bg-[#EFF6FF] dark:bg-[#0F1E36] border-[#BFDBFE] dark:border-[#1E3A8A]'
                      : dir.tone === 'teal'
                      ? 'bg-[#F0FDFA] dark:bg-[#062024] border-[#99F6E4] dark:border-[#115E59]'
                      : 'bg-[#FFFBEB] dark:bg-[#201802] border-[#FDE68A] dark:border-[#854D0E]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-bold text-[#101828] dark:text-white">
                      {dir.title}
                    </span>
                    <span className="text-[10px] font-bold text-[#2563EB] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-[#BFDBFE] dark:border-slate-700">
                      {dir.urgency}
                    </span>
                  </div>
                  <p className="text-[#344054] dark:text-slate-300 text-[11px] leading-relaxed">
                    {dir.body}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab && onNavigateTab('departments')}
              className="w-full min-h-[42px] py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Review Department Dispatch</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
