import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  MapPin,
  Tag,
  Bell,
  Activity,
  FileText,
  Settings,
  FileSpreadsheet,
  Radio,
  Lock,
  Megaphone,
  Map,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  BarChart3,
  Moon,
  Sun,
  UserCheck
} from 'lucide-react';
import {
  User,
  DashboardStats,
  AuditLog,
  SystemSettings,
  ComplaintCategoryConfig,
  SecuritySession,
  SystemHealthMetrics,
  EmergencyBroadcast,
  Department,
  Ward,
  Announcement,
  Complaint
} from '../../types';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

// Submodules
import SuperAdminOverview from './SuperAdminOverview';
import UserManagementModule from './UserManagementModule';
import DepartmentManagementModule from './DepartmentManagementModule';
import WardManagementModule from './WardManagementModule';
import CategoryManagementModule from './CategoryManagementModule';
import PlatformHealthModule from './PlatformHealthModule';
import AuditLogsModule from './AuditLogsModule';
import SystemSettingsModule from './SystemSettingsModule';
import BroadcastModule from './BroadcastModule';
import ReportsExportModule from './ReportsExportModule';
import SecurityCenterModule from './SecurityCenterModule';

// Re-use existing GIS & Announcements components
import GISMapAdmin from '../admin/GISMapAdmin';
import AnnouncementsPortal from '../announcements/AnnouncementsPortal';

interface SuperAdminDashboardProps {
  currentUser: User;
  stats: DashboardStats | null;
  complaints?: Complaint[];
  onLogout: () => void;
  onSwitchRole: (role: 'citizen' | 'government' | 'super_admin') => void;
  onNavigateToLanding?: () => void;
}

export default function SuperAdminDashboard({
  currentUser,
  stats,
  complaints = [],
  onLogout,
  onSwitchRole,
  onNavigateToLanding,
}: SuperAdminDashboardProps) {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Loaded Data States
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [categoryConfigs, setCategoryConfigs] = useState<ComplaintCategoryConfig[]>([]);
  const [securitySessions, setSecuritySessions] = useState<SecuritySession[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics | null>(null);
  const [broadcasts, setBroadcasts] = useState<EmergencyBroadcast[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial datasets
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [
        fetchedUsers,
        fetchedDepts,
        fetchedWards,
        fetchedLogs,
        fetchedSettings,
        fetchedCategories,
        fetchedSessions,
        fetchedHealth,
        fetchedAnnouncements
      ] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
        api.getWards(),
        api.getAuditLogs(),
        api.getSystemSettings(),
        api.getCategoryConfigs(),
        api.getSecuritySessions(),
        api.getHealthMetrics(),
        api.getAnnouncements(),
      ]);

      setUsers(fetchedUsers);
      setDepartments(fetchedDepts);
      setWards(fetchedWards);
      setAuditLogs(fetchedLogs);
      setSystemSettings(fetchedSettings);
      setCategoryConfigs(fetchedCategories);
      setSecuritySessions(fetchedSessions);
      setHealthMetrics(fetchedHealth);
      setAnnouncements(fetchedAnnouncements);
    } catch (err) {
      console.error('Error loading Super Admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handlers
  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      const newUser = await api.createUser(userData);
      setUsers((prev) => [newUser, ...prev]);
      // Refresh logs
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleUpdateUser = async (id: string, userData: Partial<User>) => {
    try {
      const updated = await api.updateUser(id, userData);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const res = await api.resetUserPassword(id);
      setBannerNotice({ type: 'success', text: `Temporary password issued: ${res.tempPassword}` });
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      setBannerNotice({ type: 'error', text: err?.message || 'Failed to reset password' });
    }
  };

  const handleUpdateDept = async (updatedDept: Department) => {
    try {
      const saved = await api.updateDepartment(updatedDept.id, updatedDept);
      setDepartments((prev) => prev.map((d) => (d.id === updatedDept.id ? saved : d)));
      setBannerNotice({ type: 'success', text: `Department "${saved.name}" updated.` });
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      setBannerNotice({ type: 'error', text: err?.message || 'Failed to update department' });
    }
  };

  const handleCreateDept = async (newDept: Partial<Department>) => {
    try {
      const created = await api.createDepartment(newDept);
      setDepartments((prev) => [...prev, created]);
      setBannerNotice({ type: 'success', text: `Department "${created.name}" created.` });
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      setBannerNotice({ type: 'error', text: err?.message || 'Failed to create department' });
    }
  };

  const handleUpdateWard = async (updatedWard: Ward) => {
    try {
      const saved = await api.updateWard(updatedWard.id, updatedWard);
      setWards((prev) => prev.map((w) => (w.id === updatedWard.id ? saved : w)));
      setBannerNotice({ type: 'success', text: `Ward "${saved.name}" updated.` });
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      setBannerNotice({ type: 'error', text: err?.message || 'Failed to update ward' });
    }
  };

  const handleCreateWard = async (newWard: Partial<Ward>) => {
    try {
      const created = await api.createWard(newWard);
      setWards((prev) => [...prev, created]);
      setBannerNotice({ type: 'success', text: `Ward "${created.name}" registered.` });
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      setBannerNotice({ type: 'error', text: err?.message || 'Failed to create ward' });
    }
  };

  const handleUpdateCategory = async (id: string, config: Partial<ComplaintCategoryConfig>) => {
    try {
      const updated = await api.updateCategoryConfig(id, config);
      setCategoryConfigs((prev) => prev.map((c) => (c.id === id ? updated : c)));
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  };

  const handleUpdateSettings = async (newSettings: SystemSettings) => {
    try {
      const updated = await api.updateSystemSettings(newSettings);
      setSystemSettings(updated);
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  const handleSendBroadcast = async (broadcastData: {
    title: string;
    message: string;
    severity: 'Info' | 'Warning' | 'Critical';
    targetWards: string[];
    channels: string[];
  }) => {
    try {
      const newBc = await api.sendEmergencyBroadcast(broadcastData);
      setBroadcasts((prev) => [newBc, ...prev]);
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err) {
      console.error('Failed to dispatch broadcast:', err);
    }
  };

  const handleTerminateSession = async (id: string) => {
    try {
      await api.terminateSecuritySession(id);
      setSecuritySessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'Terminated' } : s))
      );
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err) {
      console.error('Failed to terminate session:', err);
    }
  };

  const officersCount = users.filter((u) => u.role === 'officer' || u.role === 'admin').length;

  const NAV_ITEMS = [
    { id: 'overview', label: 'Command Overview', icon: ShieldCheck },
    { id: 'users', label: 'User Governance', icon: Users, badge: users.length },
    { id: 'officials', label: 'Field Staff Directory', icon: UserCheck, badge: officersCount },
    { id: 'departments', label: 'Departments & SLA', icon: Building2, badge: departments.length },
    { id: 'wards', label: 'Wards & Jurisdiction', icon: MapPin, badge: wards.length },
    { id: 'categories', label: 'Complaint Taxonomy', icon: Tag },
    { id: 'announcements', label: 'Municipal Notices', icon: Megaphone },
    { id: 'gis', label: 'GIS Spatial Command', icon: Map },
    { id: 'analytics', label: 'Platform Telemetry', icon: Activity },
    { id: 'audit', label: 'Audit Trail Logs', icon: FileText },
    { id: 'broadcast', label: 'Emergency Alerts', icon: Radio },
    { id: 'reports', label: 'Executive Reports', icon: FileSpreadsheet },
    { id: 'security', label: 'Security & Sessions', icon: Lock },
    { id: 'settings', label: 'Global Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1120] text-[#111827] dark:text-[#F9FAFB] flex flex-col font-sans selection:bg-purple-500 selection:text-white transition-colors duration-200">
      {/* Top Command Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#080E1A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#374151] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-[#667085] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937]"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={onNavigateToLanding}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-[#111827] dark:text-white">CivicPulse</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  SUPER ADMIN
                </span>
              </div>
              <span className="text-[10px] text-[#667085] dark:text-[#9CA3AF] block font-medium">
                Central Smart City Control Room
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher */}
          <div className="hidden sm:flex items-center bg-[#F3F4F6] dark:bg-[#111827] rounded-xl p-1 border border-[#E5E7EB] dark:border-[#374151] text-xs">
            <button
              onClick={() => onSwitchRole('citizen')}
              className="px-2.5 py-1 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              Citizen Portal
            </button>
            <button
              onClick={() => onSwitchRole('government')}
              className="px-2.5 py-1 rounded-lg text-[#667085] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              Gov Portal
            </button>
            <button
              className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold shadow-xs"
            >
              Super Admin
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827] text-[#374151] dark:text-[#F9FAFB] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] flex items-center justify-center transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Admin Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB] dark:border-[#374151]">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              SA
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-bold text-[#111827] dark:text-white leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Chief Technology Officer</div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-[#667085] dark:text-slate-400 hover:text-red-500 hover:bg-[#FEE2E2] dark:hover:bg-[#1F2937] transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#111827] dark:bg-[#080E1A] border-r border-[#1F2937] dark:border-[#1E293B] flex flex-col justify-between transition-transform duration-300 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              System Modules
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#1F2937] text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-[#1F2937] text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between font-medium">
              <span>CivicPulse Version</span>
              <span className="font-mono text-purple-400 font-bold">v4.5.0-enterprise</span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span>AI Core Engine</span>
              <span className="font-mono text-emerald-400 font-bold">Local Neural v4.5</span>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F5F7FA] dark:bg-[#0B1120]">
          {bannerNotice && (
            <div
              className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                bannerNotice.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <span>{bannerNotice.text}</span>
              <button
                onClick={() => setBannerNotice(null)}
                className="opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#667085] dark:text-slate-400 font-bold">Connecting to Super Admin Control Engine...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <SuperAdminOverview
                  stats={stats}
                  usersCount={users.length}
                  officialsCount={officersCount}
                  auditLogs={auditLogs}
                  healthMetrics={
                    healthMetrics || {
                      cpuUsagePercent: 24,
                      memoryUsagePercent: 48,
                      apiResponseLatencyMs: 42,
                      databaseConnections: 36,
                      systemUptime: '99.98%',
                      geminiTokenCountToday: 142000,
                      geminiApiQuotaUsedPercent: 18.4,
                    }
                  }
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenBroadcast={() => setActiveTab('broadcast')}
                />
              )}

              {activeTab === 'users' && (
                <UserManagementModule
                  users={users}
                  onCreateUser={handleCreateUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onResetPassword={handleResetPassword}
                />
              )}

              {activeTab === 'officials' && (
                <UserManagementModule
                  users={users.filter((u) => u.role === 'officer' || u.role === 'admin')}
                  onCreateUser={handleCreateUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onResetPassword={handleResetPassword}
                />
              )}

              {activeTab === 'departments' && (
                <DepartmentManagementModule
                  departments={departments}
                  onUpdateDepartment={handleUpdateDept}
                  onCreateDepartment={handleCreateDept}
                />
              )}

              {activeTab === 'wards' && (
                <WardManagementModule
                  wards={wards}
                  onUpdateWard={handleUpdateWard}
                  onCreateWard={handleCreateWard}
                />
              )}

              {activeTab === 'categories' && (
                <CategoryManagementModule
                  categories={categoryConfigs}
                  onUpdateCategory={handleUpdateCategory}
                />
              )}

              {activeTab === 'announcements' && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#374151]">
                  <AnnouncementsPortal
                    user={currentUser}
                    announcements={announcements}
                    onRefreshData={loadAdminData}
                    onOpenLogin={() => {}}
                  />
                </div>
              )}

              {activeTab === 'gis' && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#374151]">
                  <GISMapAdmin complaints={complaints} onSelectComplaint={() => {}} />
                </div>
              )}

              {activeTab === 'analytics' && (
                <PlatformHealthModule
                  healthMetrics={
                    healthMetrics || {
                      cpuUsagePercent: 24,
                      memoryUsagePercent: 48,
                      apiResponseLatencyMs: 42,
                      databaseConnections: 36,
                      systemUptime: '99.98%',
                      geminiTokenCountToday: 142000,
                      geminiApiQuotaUsedPercent: 18.4,
                    }
                  }
                  stats={stats}
                />
              )}

              {activeTab === 'audit' && <AuditLogsModule logs={auditLogs} />}

              {activeTab === 'settings' && systemSettings && (
                <SystemSettingsModule
                  settings={systemSettings}
                  onUpdateSettings={handleUpdateSettings}
                />
              )}

              {activeTab === 'broadcast' && (
                <BroadcastModule broadcasts={broadcasts} onSendBroadcast={handleSendBroadcast} />
              )}

              {activeTab === 'reports' && <ReportsExportModule stats={stats} />}

              {activeTab === 'security' && (
                <SecurityCenterModule
                  sessions={securitySessions}
                  onTerminateSession={handleTerminateSession}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
