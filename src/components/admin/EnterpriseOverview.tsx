import React, { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  Eye,
  SlidersHorizontal,
  Download,
  Filter,
  CheckCircle,
  Activity,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { Complaint, DashboardStats, Department, PriorityLevel, ComplaintStatus, User } from '../../types';
import { formatDate } from '../../utils/i18n';
import { exportComplaintsToPDF } from '../../utils/pdfExport';
import { useTheme } from '../../context/ThemeContext';

interface EnterpriseOverviewProps {
  stats: DashboardStats | null;
  complaints: Complaint[];
  departments: Department[];
  user?: User | null;
  onNavigateTab: (tab: any) => void;
  onSelectComplaint: (c: Complaint) => void;
  onRefreshData?: () => void;
}

const DONUT_COLORS = ['#2563EB', '#14B8A6', '#F59E0B', '#DC2626', '#8B5CF6', '#06B6D4'];

export default function EnterpriseOverview({
  stats,
  complaints,
  departments,
  user,
  onNavigateTab,
  onSelectComplaint,
  onRefreshData,
}: EnterpriseOverviewProps) {
  const { isDark } = useTheme();
  const [timelineRange, setTimelineRange] = useState<'30d' | '7d' | '90d'>('30d');

  const gridStroke = isDark ? '#1F2937' : '#E5E7EB';
  const axisStroke = isDark ? '#9CA3AF' : '#667085';
  const tooltipStyle = {
    backgroundColor: isDark ? '#111827' : '#111827',
    borderRadius: '8px',
    border: isDark ? '1px solid #374151' : 'none',
    color: '#F9FAFB',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
  };

  // Dynamic time-of-day greeting
  const currentHour = new Date().getHours();
  const greetingPrefix =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const adminShortName = user?.name ? user.name.split('(')[0].trim() : 'Administrator';

  // Compute live complaint counts strictly from DB records
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status === 'Submitted' || c.status === 'Pending' || c.status === 'Verified'
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'Work Started' || c.status === 'In Inspection' || c.status === 'Assigned' || c.status === 'Officer En Route'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'Resolved' || c.status === 'Closed'
  ).length;
  const criticalSlaBreaches = complaints.filter(
    (c) => c.priority === 'Critical' && c.status !== 'Resolved' && c.status !== 'Closed'
  );
  const resolutionRatePct = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // Real average resolution time from closed/resolved timestamps when stats absent
  const computedAvgHours = (() => {
    if (stats && typeof stats.avgResolutionHours === 'number' && stats.avgResolutionHours > 0) {
      return stats.avgResolutionHours;
    }
    const resolvedDurations = complaints
      .filter((c) => c.status === 'Resolved' || c.status === 'Closed')
      .map((c) => {
        const diffHrs = (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / 3600000;
        return Number.isFinite(diffHrs) && diffHrs > 0 ? diffHrs : 0;
      })
      .filter((h) => h > 0);
    if (resolvedDurations.length === 0) return 0;
    return Number((resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length).toFixed(1));
  })();

  // Real satisfaction rate from actual submitted citizen feedback
  const feedbackItems = complaints.filter((c) => c.feedback && typeof c.feedback.rating === 'number');
  const satisfactionPct =
    stats && typeof stats.citizenSatisfactionRate === 'number' && (stats.citizenSatisfactionRate > 0 || feedbackItems.length === 0)
      ? stats.citizenSatisfactionRate
      : feedbackItems.length > 0
      ? Math.round((feedbackItems.reduce((acc, c) => acc + c.feedback!.rating, 0) / feedbackItems.length) * 20)
      : 0;

  // 1. Real Complaints Over Time series grouped from complaint createdAt / updatedAt
  const dayBuckets = timelineRange === '7d' ? 7 : timelineRange === '90d' ? 12 : 6;
  const complaintsOverTime = (() => {
    const byDate: Record<string, { reported: number; resolved: number; sortKey: number }> = {};
    complaints.forEach((c) => {
      const dt = new Date(c.createdAt);
      if (Number.isNaN(dt.getTime())) return;
      const label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byDate[label]) {
        byDate[label] = { reported: 0, resolved: 0, sortKey: new Date(dt.toDateString()).getTime() };
      }
      byDate[label].reported += 1;
      if (c.status === 'Resolved' || c.status === 'Closed') {
        byDate[label].resolved += 1;
      }
    });
    const sorted = Object.entries(byDate)
      .sort((a, b) => a[1].sortKey - b[1].sortKey)
      .slice(-dayBuckets)
      .map(([period, val]) => ({
        period,
        reported: val.reported,
        resolved: val.resolved,
      }));
    return sorted.length > 0 ? sorted : [{ period: 'No Data', reported: 0, resolved: 0 }];
  })();

  // 2. Issue Distribution Donut Chart data
  const categoryMap: Record<string, number> = {};
  complaints.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });
  const donutData = Object.keys(categoryMap).map((cat) => ({
    name: cat.replace(' & Road Damage', '').replace(' & Solid Waste', '').replace(' & Electrical', '').replace(' & Supply', ''),
    value: categoryMap[cat],
  }));

  // 3. Department Performance Data computed strictly from live complaints
  const deptPerformanceData = (() => {
    const map: Record<string, { active: number; resolved: number }> = {};
    departments.forEach((d) => {
      map[d.name] = { active: 0, resolved: 0 };
    });
    complaints.forEach((c) => {
      const dept = c.departmentAssigned || 'Unassigned';
      if (!map[dept]) map[dept] = { active: 0, resolved: 0 };
      if (c.status === 'Resolved' || c.status === 'Closed') {
        map[dept].resolved += 1;
      } else if (c.status !== 'Rejected') {
        map[dept].active += 1;
      }
    });
    return Object.entries(map)
      .filter(([, counts]) => counts.active + counts.resolved > 0 || departments.length > 0)
      .map(([fullName, counts]) => ({
        name: fullName
          .replace('Department of ', '')
          .replace(' & Infrastructure', '')
          .replace(' & Sanitation', '')
          .replace(' & Streetlighting', '')
          .replace(' & Stormwater', ''),
        active: counts.active,
        resolved: counts.resolved,
      }));
  })();

  // 4. Resolution Rate Series computed from real daily buckets against 95% target
  const efficiencyData = complaintsOverTime.map((item) => {
    const rate = item.reported > 0 ? Math.round((item.resolved / item.reported) * 100) : 0;
    return {
      day: item.period,
      efficiency: rate,
      slaRate: 95,
    };
  });

  // Helper Sparkline mini-SVGs
  const renderSparkline = (points: number[], color: string) => {
    const safePoints = points.length >= 2 ? points : [0, points[0] ?? 0];
    const min = Math.min(...safePoints);
    const max = Math.max(...safePoints);
    const range = max - min || 1;
    const width = 64;
    const height = 24;
    const pathD = safePoints
      .map((p, i) => {
        const x = (i / (safePoints.length - 1)) * width;
        const y = height - ((p - min) / range) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const dailyReportedSeries = complaintsOverTime.map((d) => d.reported);
  const dailyResolvedSeries = complaintsOverTime.map((d) => d.resolved);

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Critical':
        return 'bg-[#FEF2F2] dark:bg-red-950/40 text-[#DC2626] dark:text-red-400 border-[#FCA5A5] dark:border-red-900/60';
      case 'High':
        return 'bg-[#FFFBEB] dark:bg-amber-950/40 text-[#D97706] dark:text-amber-400 border-[#FDE68A] dark:border-amber-900/60';
      case 'Medium':
        return 'bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] border-[#BFDBFE] dark:border-blue-900/60';
      case 'Low':
      default:
        return 'bg-[#F2F4F7] dark:bg-[#1F2937] text-[#475467] dark:text-[#9CA3AF] border-[#D0D5DD] dark:border-[#374151]';
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#16A34A] dark:text-emerald-400 border-[#A7F3D0] dark:border-emerald-900/60';
      case 'Work Started':
      case 'In Inspection':
      case 'Officer En Route':
        return 'bg-[#F0FDFA] dark:bg-teal-950/40 text-[#0D9488] dark:text-teal-400 border-[#99F6E4] dark:border-teal-900/60';
      case 'Assigned':
      case 'Verified':
        return 'bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] border-[#BFDBFE] dark:border-blue-900/60';
      case 'Rejected':
        return 'bg-[#FEF2F2] dark:bg-red-950/40 text-[#DC2626] dark:text-red-400 border-[#FCA5A5] dark:border-red-900/60';
      case 'Submitted':
      case 'Pending':
      default:
        return 'bg-[#FFFBEB] dark:bg-amber-950/40 text-[#D97706] dark:text-amber-400 border-[#FDE68A] dark:border-amber-900/60';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB] dark:border-[#374151]">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
            {greetingPrefix}, {adminShortName}
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-1">
            Live municipal database metrics across all civic sectors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="min-h-[38px] px-3 py-2 rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] text-[#344054] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Refresh live telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <button
            onClick={() => exportComplaintsToPDF(complaints, 'CivicPulse_Infrastructure_Audit_Report')}
            className="min-h-[38px] px-3 py-2 rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] text-[#344054] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#667085] dark:text-[#9CA3AF]" />
            <span>Export Report</span>
          </button>

          <button
            onClick={() => onNavigateTab('report')}
            className="min-h-[38px] px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>+ Report Issue</span>
          </button>
        </div>
      </div>

      {/* Critical SLA Notification Banner if any */}
      {criticalSlaBreaches.length > 0 && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] dark:bg-red-950/30 border border-[#FCA5A5] dark:border-red-900/60 text-[#991B1B] dark:text-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-5 h-5 text-[#DC2626] dark:text-red-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs min-w-0">
              <span className="font-bold">CRITICAL ATTENTION REQUIRED: </span>
              <span>
                {criticalSlaBreaches.length} high-severity civic grievance{criticalSlaBreaches.length > 1 ? 's' : ''} require immediate crew dispatch.
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('complaints')}
            className="w-full sm:w-auto min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shrink-0 transition-colors shadow-2xs text-center"
          >
            View Urgent
          </button>
        </div>
      )}

      {/* 6 KPI Cards Grid (100% Live DB Values) */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 tabular-nums">
        {/* 1. Total Complaints */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">Total Complaints</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-[#0F172A] text-[#2563EB] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#101828] dark:text-white">
              {totalCount}
            </span>
            {renderSparkline(dailyReportedSeries, '#2563EB')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="text-[#667085] dark:text-slate-400">
              {criticalSlaBreaches.length} critical open
            </span>
          </div>
        </div>

        {/* 2. Pending Complaints */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">Pending Triage</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] dark:bg-[#0F172A] text-[#D97706] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#D97706]">
              {pendingCount}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="text-[#667085] dark:text-slate-400">
              {totalCount > 0 ? `${Math.round((pendingCount / totalCount) * 100)}% of total` : 'No pending'}
            </span>
          </div>
        </div>

        {/* 3. In Progress */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-[#F0FDFA] dark:bg-[#0F172A] text-[#0D9488] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#0D9488]">
              {inProgressCount}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="text-[#667085] dark:text-slate-400">assigned & active</span>
          </div>
        </div>

        {/* 4. Resolved Complaints */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] dark:bg-[#0F172A] text-[#16A34A] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#16A34A]">
              {resolvedCount}
            </span>
            {renderSparkline(dailyResolvedSeries, '#16A34A')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="font-semibold text-[#16A34A]">{resolutionRatePct}%</span>
            <span className="text-[#667085] dark:text-slate-400">resolution rate</span>
          </div>
        </div>

        {/* 5. Average Resolution Time */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">Avg Resolution</span>
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] dark:bg-[#0F172A] text-[#7C3AED] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#101828] dark:text-white">
                {computedAvgHours > 0 ? computedAvgHours : '0'}
              </span>
              <span className="text-xs font-medium text-[#667085]">hours</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="text-[#667085] dark:text-slate-400">
              {resolvedCount > 0 ? `across ${resolvedCount} resolved` : 'no closed durations'}
            </span>
          </div>
        </div>

        {/* 6. Citizen Satisfaction */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">Satisfaction</span>
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] dark:bg-[#0F172A] text-[#059669] flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#059669]">
              {feedbackItems.length > 0 ? `${satisfactionPct}%` : 'N/A'}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="text-[#667085] dark:text-slate-400">
              {feedbackItems.length} verified review{feedbackItems.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Visualizations Grid: 4 Core Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* 1. Complaints Over Time – Line Chart (7 cols) */}
        <div className="lg:col-span-7 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Complaints Over Time (Database Records)
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Daily reported vs resolved complaints grouped by creation date
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[#F2F4F7] dark:bg-[#0F172A] rounded-lg text-[11px] font-medium shrink-0">
              <button
                onClick={() => setTimelineRange('30d')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timelineRange === '30d' ? 'bg-white dark:bg-[#1E293B] text-[#101828] dark:text-white shadow-2xs font-semibold' : 'text-[#667085]'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setTimelineRange('7d')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timelineRange === '7d' ? 'bg-white dark:bg-[#1E293B] text-[#101828] dark:text-white shadow-2xs font-semibold' : 'text-[#667085]'
                }`}
              >
                7 Buckets
              </button>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full min-w-0 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complaintsOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="period" stroke={axisStroke} fontSize={11} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="reported"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563EB' }}
                  activeDot={{ r: 6 }}
                  name="Reported Complaints"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#16A34A"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#16A34A' }}
                  activeDot={{ r: 6 }}
                  name="Resolved Tickets"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Issue Distribution – Donut Chart (5 cols) */}
        <div className="lg:col-span-5 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Issue Distribution
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Categorical breakdown of municipal reports
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-[#2563EB] bg-[#EFF6FF] dark:bg-[#0F172A] px-2 py-0.5 rounded shrink-0">
              {totalCount} Total
            </span>
          </div>

          <div className="h-60 sm:h-64 w-full min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101828',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Department Performance – Horizontal Bar Chart (6 cols) */}
        <div className="lg:col-span-6 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Department Performance (Live Queue)
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Active workload vs completed resolutions from database
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('departments')}
              className="text-xs font-semibold text-[#2563EB] hover:underline shrink-0"
            >
              Manage &rarr;
            </button>
          </div>

          <div className="h-60 sm:h-64 w-full min-w-0 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={deptPerformanceData}
                margin={{ top: 5, right: 14, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                <XAxis type="number" stroke={axisStroke} fontSize={11} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke={axisStroke} fontSize={11} tickLine={false} width={96} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="active" fill="#F59E0B" name="Active Tickets" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="resolved" fill="#16A34A" name="Resolved" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Resolution Rate – Analytics Chart (6 cols) */}
        <div className="lg:col-span-6 min-w-0 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB] dark:border-[#374151]">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">
                Cohort Resolution Rate
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
                Resolved share per intake date against 95% benchmark
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#16A34A] dark:text-emerald-400 bg-[#ECFDF5] dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-emerald-900/60 shrink-0">
              Overall: {resolutionRatePct}%
            </span>
          </div>

          <div className="h-56 sm:h-64 w-full min-w-0 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiencyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="efficiencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={11} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [`${val}%`, 'Resolution Rate']}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#14B8A6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#efficiencyGrad)"
                  name="Resolved Share (%)"
                />
                <Line
                  type="monotone"
                  dataKey="slaRate"
                  stroke="#2563EB"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                  name="SLA Benchmark (95%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Complaints Card List (Mobile) + Table (Desktop) */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#101828] dark:text-white">
              Recent Complaints
            </h3>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              Latest citizen incident filings across all municipal sectors
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('complaints')}
            className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 self-start sm:self-auto py-1"
          >
            <span>View All ({complaints.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[#EAECF0] dark:divide-[#334155] rounded-lg border border-[#EAECF0] dark:border-[#334155] overflow-hidden">
          {complaints.slice(0, 6).map((c) => (
            <div key={c.id} className="p-3.5 bg-white dark:bg-[#1E293B] space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-[#2563EB]">{c.ticketNumber}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(c.priority)}`}>
                    {c.priority}
                  </span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(c.status)}`}>
                    {c.status}
                  </span>
                </div>
              </div>
              <div>
                <div className="font-semibold text-[#101828] dark:text-white line-clamp-1">{c.title}</div>
                <div className="text-[11px] text-[#667085]">{c.category} • {c.location.ward}</div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#667085]">
                <span className="truncate">{c.departmentAssigned || 'Roads & Infrastructure'}</span>
                <button
                  onClick={() => onSelectComplaint(c)}
                  className="min-h-[34px] px-3 py-1.5 rounded-lg bg-[#F2F4F7] hover:bg-[#EAECF0] dark:bg-[#334155] text-[#344054] dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Table Container */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-[#EAECF0] dark:border-[#334155]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] dark:bg-[#182234] text-[#667085] font-semibold border-b border-[#EAECF0] dark:border-[#334155] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Complaint ID</th>
                <th className="px-4 py-3">Issue Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Reported Date</th>
                <th className="px-4 py-3">Assigned Department</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#334155] bg-white dark:bg-[#1E293B]">
              {complaints.slice(0, 6).map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-[#F9FAFB] dark:hover:bg-[#283548] transition-colors"
                >
                  {/* Complaint ID */}
                  <td className="px-4 py-3.5 font-mono font-bold text-[#2563EB] whitespace-nowrap">
                    {c.ticketNumber}
                  </td>

                  {/* Issue Category */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-[#101828] dark:text-white line-clamp-1">
                      {c.title}
                    </div>
                    <div className="text-[11px] text-[#667085] truncate">
                      {c.category}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3.5 text-[#344054] dark:text-slate-300 whitespace-nowrap">
                    <div className="truncate max-w-[180px]">{c.location.address}</div>
                    <div className="text-[10px] text-[#98A2B3]">{c.location.ward}</div>
                  </td>

                  {/* Reported Date */}
                  <td className="px-4 py-3.5 text-[#667085] whitespace-nowrap font-mono text-[11px]">
                    {formatDate(c.createdAt)}
                  </td>

                  {/* Assigned Department */}
                  <td className="px-4 py-3.5 text-[#344054] dark:text-slate-300 whitespace-nowrap font-medium">
                    {c.departmentAssigned || 'Roads & Infrastructure'}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(c.priority)}`}>
                      {c.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectComplaint(c)}
                      className="px-2.5 py-1.2 rounded-lg bg-[#F2F4F7] hover:bg-[#EAECF0] dark:bg-[#334155] dark:hover:bg-[#475467] text-[#344054] dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#667085]" />
                      <span>Inspect</span>
                    </button>
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
