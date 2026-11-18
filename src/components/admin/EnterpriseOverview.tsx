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

  // Compute live complaint counts
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

  // 1. Complaints Over Time data (Responds to 30d vs 7d selection)
  const complaintsOverTime =
    timelineRange === '7d'
      ? [
          { period: 'Mon', reported: 9, resolved: 7, target: 8 },
          { period: 'Tue', reported: 12, resolved: 10, target: 10 },
          { period: 'Wed', reported: 14, resolved: 13, target: 12 },
          { period: 'Thu', reported: 11, resolved: 12, target: 11 },
          { period: 'Fri', reported: 15, resolved: 14, target: 12 },
          { period: 'Sat', reported: 8, resolved: 9, target: 8 },
          { period: 'Today', reported: totalCount, resolved: resolvedCount, target: Math.max(8, Math.round(totalCount * 0.7)) },
        ]
      : [
          { period: 'Week 1', reported: 42, resolved: 38, target: 40 },
          { period: 'Week 2', reported: 58, resolved: 51, target: 45 },
          { period: 'Week 3', reported: 64, resolved: 59, target: 50 },
          { period: 'Week 4', reported: 51, resolved: 62, target: 50 },
          { period: 'Week 5', reported: 47, resolved: 49, target: 45 },
          { period: 'Current', reported: complaints.length, resolved: resolvedCount, target: 50 },
        ];

  // 2. Issue Distribution Donut Chart data
  const categoryMap: Record<string, number> = {};
  complaints.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });
  const donutData = Object.keys(categoryMap).map((cat) => ({
    name: cat.replace(' & Road Damage', '').replace(' & Solid Waste', '').replace(' & Electrical', '').replace(' & Supply', ''),
    value: categoryMap[cat],
  }));

  // 3. Department Performance Data (Horizontal Bar Chart)
  const defaultDeptData = [
    { name: 'Municipal Eng.', active: 18, resolved: 64 },
    { name: 'Sanitation', active: 12, resolved: 82 },
    { name: 'Water Supply', active: 9, resolved: 41 },
    { name: 'Electrical Maint.', active: 6, resolved: 53 },
  ];
  const deptPerformanceData = departments.length > 0
    ? departments.map((d) => ({
        name: d.name.replace('Department of ', '').replace(' & Infrastructure', '').replace('Maintenance', 'Maint.').replace('Engineering', 'Eng.'),
        active: d.activeTickets,
        resolved: d.resolvedTickets,
      }))
    : defaultDeptData;

  // 4. Resolution Efficiency Data (Composed Area Chart)
  const efficiencyData = [
    { day: 'Mon', efficiency: 91, avgHours: 24.2, slaRate: 95 },
    { day: 'Tue', efficiency: 94, avgHours: 22.8, slaRate: 96 },
    { day: 'Wed', efficiency: 89, avgHours: 25.1, slaRate: 94 },
    { day: 'Thu', efficiency: 96, avgHours: 19.4, slaRate: 98 },
    { day: 'Fri', efficiency: 93, avgHours: 21.6, slaRate: 95 },
    { day: 'Sat', efficiency: 97, avgHours: 18.2, slaRate: 99 },
    { day: 'Sun', efficiency: 95, avgHours: 20.1, slaRate: 96 },
  ];

  // Helper Sparkline mini-SVGs
  const renderSparkline = (points: number[], color: string) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 24;
    const pathD = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
            {greetingPrefix}, {adminShortName}
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-1">
            Here's what's happening across your city's civic infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="p-2 rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] text-[#344054] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Refresh live telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <button
            onClick={() => exportComplaintsToPDF(complaints, 'CivicPulse_Infrastructure_Audit_Report')}
            className="px-3 py-2 rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] text-[#344054] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#667085] dark:text-[#9CA3AF]" />
            <span>Export Report</span>
          </button>

          <button
            onClick={() => onNavigateTab('report')}
            className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>+ Report Issue</span>
          </button>
        </div>
      </div>

      {/* Critical SLA Notification Banner if any */}
      {criticalSlaBreaches.length > 0 && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] dark:bg-red-950/30 border border-[#FCA5A5] dark:border-red-900/60 text-[#991B1B] dark:text-red-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-5 h-5 text-[#DC2626] dark:text-red-400 shrink-0" />
            <div className="text-xs min-w-0">
              <span className="font-bold">CRITICAL ATTENTION REQUIRED: </span>
              <span>
                {criticalSlaBreaches.length} high-severity civic grievance{criticalSlaBreaches.length > 1 ? 's' : ''} require immediate crew dispatch.
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('complaints')}
            className="px-3 py-1 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shrink-0 transition-colors shadow-2xs"
          >
            View Urgent
          </button>
        </div>
      )}

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
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
            {renderSparkline([28, 34, 40, 48, 51, totalCount], '#2563EB')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="flex items-center text-[#16A34A] font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +12.4%
            </span>
            <span className="text-[#667085] dark:text-slate-400">vs last period</span>
          </div>
        </div>

        {/* 2. Pending Complaints */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085] dark:text-slate-400">
            <span className="text-xs font-semibold">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] dark:bg-[#0F172A] text-[#D97706] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#D97706]">
              {pendingCount}
            </span>
            {renderSparkline([18, 15, 14, 16, 12, pendingCount], '#F59E0B')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="flex items-center text-[#16A34A] font-semibold">
              <TrendingDown className="w-3 h-3 mr-0.5" /> -4.2%
            </span>
            <span className="text-[#667085] dark:text-slate-400">vs last period</span>
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
            {renderSparkline([6, 9, 12, 11, 14, inProgressCount], '#14B8A6')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="flex items-center text-[#2563EB] font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +8.1%
            </span>
            <span className="text-[#667085] dark:text-slate-400">deployed crews</span>
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
            {renderSparkline([12, 19, 24, 30, 38, resolvedCount], '#16A34A')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="flex items-center text-[#16A34A] font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +19.5%
            </span>
            <span className="text-[#667085] dark:text-slate-400">completion velocity</span>
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
                {stats?.avgResolutionHours || 21.4}
              </span>
              <span className="text-xs font-medium text-[#667085]">hours</span>
            </div>
            {renderSparkline([32, 28, 25, 23, 22, 21.4], '#8B5CF6')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="flex items-center text-[#16A34A] font-semibold">
              <TrendingDown className="w-3 h-3 mr-0.5" /> -2.6h
            </span>
            <span className="text-[#667085] dark:text-slate-400">faster than SLA</span>
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
              {stats?.citizenSatisfactionRate || 94.8}%
            </span>
            {renderSparkline([88, 90, 92, 91, 93, 94.8], '#10B981')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F2F4F7] dark:border-[#2D3748] flex items-center gap-1.5 text-[11px]">
            <span className="flex items-center text-[#16A34A] font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +3.2%
            </span>
            <span className="text-[#667085] dark:text-slate-400">verified reviews</span>
          </div>
        </div>
      </div>

      {/* Visualizations Grid: 4 Core Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Complaints Over Time – Line Chart (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div>
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Complaints Over Time
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Weekly reported vs resolved issue velocity
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[#F2F4F7] dark:bg-[#0F172A] rounded-lg text-[11px] font-medium">
              <button
                onClick={() => setTimelineRange('30d')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timelineRange === '30d' ? 'bg-white dark:bg-[#1E293B] text-[#101828] dark:text-white shadow-2xs font-semibold' : 'text-[#667085]'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimelineRange('7d')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timelineRange === '7d' ? 'bg-white dark:bg-[#1E293B] text-[#101828] dark:text-white shadow-2xs font-semibold' : 'text-[#667085]'
                }`}
              >
                7 Days
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complaintsOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="period" stroke={axisStroke} fontSize={11} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} />
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
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div>
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Issue Distribution
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Categorical breakdown of municipal reports
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-[#2563EB] bg-[#EFF6FF] dark:bg-[#0F172A] px-2 py-0.5 rounded">
              {totalCount} Total
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
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
        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <div>
              <h3 className="text-sm font-bold text-[#101828] dark:text-white">
                Department Performance
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Active workload vs completed resolutions
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('departments')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Manage &rarr;
            </button>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={deptPerformanceData}
                margin={{ top: 5, right: 20, left: 25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                <XAxis type="number" stroke={axisStroke} fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke={axisStroke} fontSize={11} tickLine={false} width={95} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="active" fill="#F59E0B" name="Active Tickets" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="resolved" fill="#16A34A" name="Resolved" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Resolution Efficiency – Analytics Chart (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#374151]">
            <div>
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">
                Resolution Efficiency
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
                Daily turnaround efficiency against 95% SLA target
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#16A34A] dark:text-emerald-400 bg-[#ECFDF5] dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-emerald-900/60">
              Optimal SLA
            </span>
          </div>

          <div className="h-64 w-full pt-4">
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
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} domain={[80, 100]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [`${val}%`, 'Efficiency Rate']}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#14B8A6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#efficiencyGrad)"
                  name="Efficiency Score (%)"
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

      {/* Recent Complaints Table */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
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
            className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All ({complaints.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-lg border border-[#EAECF0] dark:border-[#334155]">
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
