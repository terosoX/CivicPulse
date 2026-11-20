import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Clock, MapPin, Award, Building2, BarChart3, PieChart as PieChartIcon, Search, Eye, ExternalLink, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '../../services/api';
import InteractiveCityMap from '../citizen/InteractiveCityMap';
import ComplaintTimeline from '../citizen/ComplaintTimeline';
import Footer from '../common/Footer';
import { useTheme } from '../../context/ThemeContext';

export default function PublicTransparencyPortal() {
  const { isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'map' | 'records'>('metrics');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    setLoading(true);
    try {
      const res = await api.getPublicTransparencyData();
      setData(res);
    } catch (err) {
      console.error('Failed to load transparency data:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'];

  const categoryChartData = data?.categoryCounts
    ? Object.entries(data.categoryCounts).map(([name, value]) => ({ name, value }))
    : [];

  const wardChartData = data?.wardCounts
    ? Object.entries(data.wardCounts).map(([name, value]) => ({ name, value }))
    : [];

  const filteredComplaints = (data?.recentComplaints || []).filter((c: any) =>
    c.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1120] text-[#111827] dark:text-[#F9FAFB] flex flex-col font-sans">
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white pt-8 sm:pt-10 pb-14 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-blue-900/50 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold border border-blue-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Open Government Data & Municipal Audit Standard</span>
          </div>
          <h1 className="fluid-hero-title font-black text-white">
            Municipal Public Transparency Portal
          </h1>
          <p className="text-xs sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Real-time public dashboard publishing all municipal civic issues, resolution rates, ward performance analytics, and GIS location maps. Citizen privacy & PII data are fully protected under Privacy Act guidelines.
          </p>

          {/* Quick Tabs */}
          <div className="flex items-center gap-2 pt-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`min-h-[40px] px-4 sm:px-5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
            >
              📊 Citywide Analytics
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`min-h-[40px] px-4 sm:px-5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
            >
              🗺️ Public GIS Map
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`min-h-[40px] px-4 sm:px-5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
            >
              📋 Open Incident Feed
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6 sm:space-y-8 -mt-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-5 sm:p-6 bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#374151] shadow-xl">
            <div className="text-xs font-semibold text-slate-500 dark:text-[#9CA3AF]">Total Logged Incidents</div>
            <div className="text-2xl sm:text-3xl font-black text-[#111827] dark:text-[#F9FAFB] mt-1 tabular-nums">
              {data?.summary?.totalComplaints ?? 0}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">Recorded across all 6 wards</div>
          </div>

          <div className="p-5 sm:p-6 bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#374151] shadow-xl">
            <div className="text-xs font-semibold text-slate-500 dark:text-[#9CA3AF]">Field Resolution Rate</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {data?.summary?.resolutionRatePercent ?? 0}%
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-2">Verified field completion</div>
          </div>

          <div className="p-5 sm:p-6 bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#374151] shadow-xl">
            <div className="text-xs font-semibold text-slate-500 dark:text-[#9CA3AF]">Average Turnaround</div>
            <div className="text-2xl sm:text-3xl font-black text-[#111827] dark:text-[#F9FAFB] mt-1 tabular-nums">
              {data?.summary?.avgResolutionHours ?? 0} Hours
            </div>
            <div className="text-xs text-slate-500 dark:text-[#9CA3AF] mt-2">Against 24h SLA benchmark</div>
          </div>

          <div className="p-5 sm:p-6 bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#374151] shadow-xl">
            <div className="text-xs font-semibold text-slate-500 dark:text-[#9CA3AF]">Verified Citizen Approval</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-1 tabular-nums">
              {data?.summary?.citizenSatisfactionPercent ?? 0}%
            </div>
            <div className="text-xs text-amber-600 font-medium mt-2">Verified post-remediation ratings</div>
          </div>
        </div>

        {/* Tab 1: Citywide Analytics */}
        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Category Chart */}
            <div className="min-w-0 p-4 sm:p-6 bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#374151] shadow-sm space-y-4">
              <h3 className="font-extrabold text-[#111827] dark:text-[#F9FAFB] text-base sm:text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Category Distribution</span>
              </h3>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                    <XAxis type="number" stroke={isDark ? '#9CA3AF' : '#667085'} fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke={isDark ? '#9CA3AF' : '#667085'} fontSize={10} width={96} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#111827' : '#FFFFFF',
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        color: isDark ? '#F9FAFB' : '#111827',
                        borderRadius: '12px',
                      }}
                    />
                    <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ward Distribution Pie */}
            <div className="min-w-0 p-4 sm:p-6 bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#374151] shadow-sm space-y-4">
              <h3 className="font-extrabold text-[#111827] dark:text-[#F9FAFB] text-base sm:text-lg flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>Ward Share Analysis</span>
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wardChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius="72%"
                      innerRadius="42%"
                      paddingAngle={4}
                    >
                      {wardChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#111827' : '#FFFFFF',
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        color: isDark ? '#F9FAFB' : '#111827',
                        borderRadius: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: GIS Map */}
        {activeTab === 'map' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl">Interactive Municipal GIS Heatmap</h3>
              <p className="text-xs text-slate-500">Live spatial mapping of field complaints across all municipal wards.</p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <InteractiveCityMap
                complaints={data?.recentComplaints || []}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Open Records Feed */}
        {activeTab === 'records' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl">Public Civic Incident Directory</h3>
                <p className="text-xs text-slate-500">Real-time public listing. Citizen PII details anonymized for privacy protection.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by ticket #, category, ward..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 min-h-[40px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredComplaints.map((cmp: any) => (
                <div
                  key={cmp.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
                      {cmp.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        cmp.status === 'Resolved' || cmp.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {cmp.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{cmp.title}</h4>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cmp.location.address}</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1">
                      <span>Category: <strong className="text-slate-700 dark:text-slate-300">{cmp.category}</strong></span>
                      <span>Support: <strong className="text-blue-600 font-bold">{cmp.upvotes || 1}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {selectedComplaint && (
        <ComplaintTimeline
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onFeedbackSubmitted={() => {
            loadPublicData();
            setSelectedComplaint(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
