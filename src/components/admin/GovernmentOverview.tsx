import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Users
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Complaint, DashboardStats, Department } from '../../types';
import { formatNumber, translateCategory, translatePriority, translateStatus } from '../../utils/i18n';
import { useTheme } from '../../context/ThemeContext';

interface GovernmentOverviewProps {
  stats: DashboardStats | null;
  complaints: Complaint[];
  departments: Department[];
  onNavigateTab: (tab: string) => void;
  onSelectComplaint: (c: Complaint) => void;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function GovernmentOverview({
  stats,
  complaints,
  departments,
  onNavigateTab,
  onSelectComplaint,
}: GovernmentOverviewProps) {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();

  // Calculate SLA Breached / Critical complaints
  const slaBreached = complaints.filter(
    (c) => c.priority === 'Critical' && c.status !== 'Resolved' && c.status !== 'Closed'
  );

  // Department workload chart data
  const deptData = departments.map((d) => ({
    name: d.name.replace('Department of ', '').replace(' & Infrastructure', ''),
    active: d.activeTickets,
    resolved: d.resolvedTickets,
  }));

  // Category chart data
  const categoryCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    const catLabel = translateCategory(c.category as any);
    categoryCounts[catLabel] = (categoryCounts[catLabel] || 0) + 1;
  });

  const pieData = Object.keys(categoryCounts).map((cat) => ({
    name: cat,
    value: categoryCounts[cat],
  }));

  return (
    <div className="space-y-6 text-left">
      {/* Executive KPI Banner */}
      <div className="p-6 sm:p-7 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-300 font-semibold text-xs uppercase tracking-wider border border-blue-500/20">
            {i18n.language === 'hi' ? 'नगर निगम कमान और नियंत्रण' : 'Municipal Command & Control'}
          </span>
          <h2 className="text-2xl font-bold mt-2.5 tracking-tight">
            {i18n.language === 'hi' ? 'सरकारी प्रशासन डैशबोर्ड' : 'Government Administration Dashboard'}
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            {i18n.language === 'hi'
              ? 'वास्तविक समय में नागरिक शिकायत ट्राइएज, SLA ट्रैकिंग, स्वचालित प्रेषण और फील्ड टीम विश्लेषण।'
              : 'Real-time municipal grievance triage, SLA tracking, automated CivicPulse AI dispatching, and field crew deployment analytics.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('assignments')}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-xs"
          >
            <Users className="w-4 h-4" />
            <span>{t('nav.dispatchCenter')} ({formatNumber(complaints.filter(c => c.status === 'Submitted' || c.status === 'Verified').length)})</span>
          </button>

          <button
            onClick={() => onNavigateTab('map')}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <span>{i18n.language === 'hi' ? 'GIS मानचित्र' : 'GIS Map View'}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SLA Alert Header */}
      {slaBreached.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 animate-pulse" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider">{i18n.language === 'hi' ? 'गंभीर SLA चेतावनी: ' : 'Critical SLA Alert: '}</span>
              <span>
                {i18n.language === 'hi'
                  ? `${formatNumber(slaBreached.length)} उच्च-प्राथमिकता वाले अति-गंभीर मामलों में तुरंत टीम भेजने की आवश्यकता है।`
                  : `${slaBreached.length} high-priority critical tickets require immediate field team dispatch.`}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('complaints')}
            className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs shrink-0 hover:bg-red-700 transition-colors"
          >
            {i18n.language === 'hi' ? 'गंभीर देखें' : 'View Critical'}
          </button>
        </div>
      )}

      {/* Executive KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t('dashboard.stats.total')}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {formatNumber(stats?.totalComplaints || complaints.length)}
            </span>
            <span className="text-blue-500 text-xs font-bold">+8%</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">{t('dashboard.stats.pending')}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              {formatNumber(stats?.pending || 0)}
            </span>
            <span className="text-slate-400 text-xs">{i18n.language === 'hi' ? 'सक्रिय' : 'Active'}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">{t('dashboard.stats.inProgress')}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatNumber(stats?.inProgress || 0)}
            </span>
            <span className="text-indigo-500 text-xs font-bold">{i18n.language === 'hi' ? 'तैनात' : 'Deployed'}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">{t('dashboard.stats.resolved')}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatNumber(stats?.resolved || 0)}
            </span>
            <span className="text-emerald-500 text-xs font-bold">{i18n.language === 'hi' ? 'पूर्ण' : 'Completed'}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">{i18n.language === 'hi' ? 'औसत समाधान' : 'Avg Resolution'}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {formatNumber(stats?.avgResolutionHours || 21.4)}<span className="text-sm font-medium">{i18n.language === 'hi' ? 'घंटे' : 'h'}</span>
            </span>
            <span className="text-blue-500 text-xs font-bold">-2.1h</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">{i18n.language === 'hi' ? 'नागरिक संतुष्टि' : 'Citizen Sentiment'}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
              {formatNumber(stats?.citizenSatisfactionRate || 94.2)}%
            </span>
            <span className="text-emerald-500 text-xs font-bold">{i18n.language === 'hi' ? 'उत्कृष्ट' : 'Optimal'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Preview & AI Smart Routing Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Issue Pipeline Brief Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-500 rounded-sm"></div>
              {i18n.language === 'hi' ? 'हालिया समस्या पाइपलाइन' : 'Recent Issue Pipeline'}
            </h3>
            <button
              onClick={() => onNavigateTab('complaints')}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              {i18n.language === 'hi' ? `सभी देखें (${formatNumber(complaints.length)})` : `View All (${complaints.length})`} &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3">{i18n.language === 'hi' ? 'टिकट आईडी' : 'Ticket ID'}</th>
                  <th className="px-5 py-3">{i18n.language === 'hi' ? 'श्रेणी' : 'Categorization & AI Note'}</th>
                  <th className="px-5 py-3">{i18n.language === 'hi' ? 'वार्ड / स्थान' : 'Ward / Location'}</th>
                  <th className="px-5 py-3">{t('dashboard.complaints.priority')}</th>
                  <th className="px-5 py-3">{t('dashboard.complaints.status')}</th>
                  <th className="px-5 py-3 text-right">{i18n.language === 'hi' ? 'कार्रवाई' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800">
                {complaints.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      {c.ticketNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                        {c.title}
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                        {translateCategory(c.category)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {c.location.ward}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.priority === 'Critical'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : c.priority === 'High'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {translatePriority(c.priority)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'Resolved'
                              ? 'bg-emerald-500'
                              : c.status === 'Work Started' || c.status === 'In Inspection'
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span>{translateStatus(c.status)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onSelectComplaint(c)}
                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        {i18n.language === 'hi' ? 'निरीक्षण करें' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Smart Routing & GIS Preview Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Insights Module */}
          <div className="bg-blue-900 rounded-2xl shadow-lg border border-blue-800 p-5 text-white flex flex-col justify-between gap-4 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                  {i18n.language === 'hi' ? 'स्मार्ट रूटिंग सुझाव' : 'Smart Routing Insights'}
                </span>
              </div>
              <span className="text-[10px] bg-blue-800/80 px-2 py-0.5 rounded text-blue-200 font-mono">
                {i18n.language === 'hi' ? 'AI सक्रिय' : 'AI ACTIVE'}
              </span>
            </div>

            <div>
              <p className="text-xs leading-relaxed text-blue-100">
                {i18n.language === 'hi' ? (
                  <>सिस्टम <span className="text-blue-300 font-semibold">वार्ड 04</span> में <span className="font-bold text-white underline decoration-blue-400">4 फील्ड टीमों</span> को पुनः आवंटित करने का सुझाव देता है। सड़क मरम्मत की शिकायतों में वृद्धि का अनुमान।</>
                ) : (
                  <>System suggests reallocating <span className="font-bold text-white underline decoration-blue-400">4 field crews</span> to <span className="text-blue-300 font-semibold">Ward 04</span>. Predicted 35% spike in road repair requests based on weather & crowd telemetry.</>
                )}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('assignments')}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
            >
              {i18n.language === 'hi' ? 'टीम प्रेषण अनुकूलित करें' : 'Optimize Crew Dispatch'}
            </button>
          </div>

          {/* Quick GIS Map Miniature Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-sm" />
                {i18n.language === 'hi' ? 'GIS स्थानिक हॉटस्पॉट' : 'GIS Spatial Hotspots'}
              </span>
              <span className="text-[10px] text-slate-400">{i18n.language === 'hi' ? 'वार्ड सीमाएं दृश्यमान' : 'Ward Boundaries Visible'}</span>
            </div>
            
            <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center border border-slate-200/60 dark:border-slate-800">
              <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
              <div className="absolute w-16 h-16 bg-red-500/20 rounded-full blur-xl" />
              <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white top-8 left-12 animate-ping" />
              <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white top-8 left-12" />
              <div className="absolute w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white bottom-6 right-16" />
              <div className="absolute w-2.5 h-2.5 bg-amber-600 rounded-full border-2 border-white top-14 right-24" />
            </div>

            <button
              onClick={() => onNavigateTab('map')}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              {i18n.language === 'hi' ? 'मानचित्र देखें' : 'Launch Interactive Map View'} &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Departmental Workload & Resolution Capacity */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {i18n.language === 'hi' ? 'विभागवार सक्रिय बनाम हल की गई शिकायतें' : 'Departmental Active vs Resolved Complaints'}
              </h3>
            </div>
            <span className="text-xs text-slate-400">{i18n.language === 'hi' ? 'नगर निगम कार्यभार' : 'Municipal Workload'}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <XAxis dataKey="name" stroke={isDark ? '#9CA3AF' : '#667085'} fontSize={10} />
                <YAxis stroke={isDark ? '#9CA3AF' : '#667085'} fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    color: isDark ? '#F9FAFB' : '#111827',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="active" fill="#3b82f6" name={i18n.language === 'hi' ? 'सक्रिय टिकट' : 'Active Tickets'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#10b981" name={i18n.language === 'hi' ? 'निवारित टिकट' : 'Resolved Tickets'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-[#374151]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {i18n.language === 'hi' ? 'श्रेणी के अनुसार समस्या वितरण' : 'Issue Distribution by Category'}
              </h3>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    color: isDark ? '#F9FAFB' : '#111827',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Global Status Footer */}
      <footer className="bg-white dark:bg-[#111827] px-6 py-2.5 border border-[#E5E7EB] dark:border-[#374151] rounded-xl flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium gap-2">
        <div className="flex flex-wrap items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" /> {i18n.language === 'hi' ? 'API प्रणाली संचालित' : 'API Systems Operational'}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" /> {i18n.language === 'hi' ? 'AI प्रेषक: सक्रिय' : 'CivicPulse AI Dispatcher: Active'}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" /> {i18n.language === 'hi' ? 'डेटाबेस: सिंक्रनाइज़्ड' : 'Database: Synchronized'}
          </span>
        </div>
        <div className="text-slate-400 italic">
          CivicPulse v4.5.0 | Clean Utility Edition
        </div>
      </footer>
    </div>
  );
}
