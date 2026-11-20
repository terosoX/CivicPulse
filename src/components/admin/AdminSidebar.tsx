import React, { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  MapPin,
  BrainCircuit,
  Building2,
  GitCommitHorizontal,
  Star,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Activity,
  Bot,
  Users,
  UserCheck,
  Bell,
  Shield,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';
import { User, UserRole } from '../../types';

export type AdminNavigationTab =
  | 'overview'
  | 'complaints'
  | 'report'
  | 'map'
  | 'tracking'
  | 'analytics'
  | 'predictions'
  | 'assistant'
  | 'departments'
  | 'workforce'
  | 'citizens'
  | 'feedback'
  | 'notifications'
  | 'audit_logs'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminNavigationTab;
  onTabChange: (tab: AdminNavigationTab) => void;
  user: User | null;
  onLogout: () => void;
  onSwitchToCitizen?: () => void;
  onSwitchRole?: (role: UserRole) => void;
  complaintsCount?: number;
  pendingCount?: number;
  unreadNotificationsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: AdminNavigationTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[];
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  user,
  onLogout,
  onSwitchToCitizen,
  onSwitchRole,
  complaintsCount = 0,
  pendingCount = 0,
  unreadNotificationsCount = 0,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const navSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
      ],
    },
    {
      title: 'CIVIC OPERATIONS',
      items: [
        {
          id: 'complaints',
          label: 'Complaints',
          icon: ClipboardList,
          badge: pendingCount > 0 ? pendingCount : undefined,
          badgeColor: 'bg-[#D97706]/20 text-[#F59E0B] border border-[#F59E0B]/30',
        },
        { id: 'report', label: 'Report an Issue', icon: PlusCircle },
        { id: 'map', label: 'Live City Map', icon: MapPin },
        { id: 'tracking', label: 'Resolution Tracking', icon: GitCommitHorizontal },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        {
          id: 'analytics',
          label: 'AI Analytics',
          icon: BrainCircuit,
          badge: 'AI',
          badgeColor: 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30',
        },
        {
          id: 'predictions',
          label: 'AI Predictions',
          icon: Sparkles,
          badge: 'NEW',
          badgeColor: 'bg-[#2563EB]/30 text-[#93C5FD] border border-[#2563EB]/40',
        },
        {
          id: 'assistant',
          label: 'Civic Assistant',
          icon: Bot,
          badge: '24/7',
          badgeColor: 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30',
        },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'workforce', label: 'Field Workforce', icon: Users },
        { id: 'citizens', label: 'Citizens', icon: UserCheck },
        { id: 'feedback', label: 'Feedback & Reviews', icon: Star },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          badgeColor: 'bg-[#DC2626]/20 text-[#F87171] border border-[#DC2626]/40',
        },
        { id: 'audit_logs', label: 'Audit Logs', icon: Shield },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleItemClick = (id: AdminNavigationTab) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleRoleSelect = (role: UserRole) => {
    if (onSwitchRole) {
      onSwitchRole(role);
    }
    setRoleSwitcherOpen(false);
  };

  const currentRole = user?.role || 'admin';
  const showCompact = isCollapsed && !isOpenMobile;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container: Off-canvas on <md, Collapsible Rail on md+, Expanded on xl+ */}
      <aside
        aria-label="Operations Sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#111827] dark:bg-[#080E1A] text-white flex flex-col justify-between border-r border-[#1F2937] dark:border-[#1E293B] transition-all duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile
            ? 'translate-x-0 w-72 max-w-[85vw]'
            : showCompact
            ? '-translate-x-full md:w-20'
            : '-translate-x-full md:w-64'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className={`h-16 border-b border-[#1F2937] flex items-center justify-between shrink-0 ${showCompact ? 'px-3 justify-center' : 'px-4 sm:px-5'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-xs shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              {!showCompact && (
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-white truncate">CivicPulse</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold tracking-wider bg-[#1F2937] text-[#14B8A6] border border-[#14B8A6]/30 shrink-0">
                      SaaS
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold truncate">
                    Smart City Intelligence
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Close Trigger */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                aria-label="Close sidebar"
                className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1F2937]"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Tablet / Desktop Collapse Trigger */}
            {onToggleCollapse && !isOpenMobile && (
              <button
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={`hidden md:flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1F2937] transition-colors ${
                  showCompact ? 'hidden' : 'w-8 h-8'
                }`}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {showCompact && onToggleCollapse && (
            <div className="px-2 pt-2 hidden md:flex justify-center">
              <button
                onClick={onToggleCollapse}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#1F2937] transition-colors"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Live System Indicator */}
          {!showCompact && (
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="px-3 py-1.5 rounded-lg bg-[#1F2937]/70 border border-[#374151] flex items-center justify-between text-[11px] text-[#9CA3AF]">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                  </span>
                  <span className="font-medium text-slate-200">Municipal Core</span>
                </div>
                <span className="text-[#10B981] font-mono text-[10px]">LIVE v4.5</span>
              </div>
            </div>
          )}

          {/* Scrollable Navigation Sections */}
          <nav className={`flex-1 overflow-y-auto py-2 space-y-4 ${showCompact ? 'px-2' : 'px-3'}`}>
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-0.5">
                {!showCompact && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-left">
                    {section.title}
                  </div>
                )}

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      title={item.label}
                      aria-label={item.label}
                      className={`w-full min-h-[40px] flex items-center ${
                        showCompact ? 'justify-center px-2' : 'justify-between px-3'
                      } py-2 rounded-lg text-xs font-medium transition-colors text-left relative ${
                        isActive
                          ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                          : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]'
                      }`}
                    >
                      <div className={`flex items-center ${showCompact ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#9CA3AF]'}`} />
                        {!showCompact && <span className="truncate">{item.label}</span>}
                      </div>

                      {!showCompact && item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeColor || 'bg-[#1F2937] text-[#9CA3AF]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {showCompact && typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Quick Account Switch & User Profile */}
        <div className={`p-3 border-t border-[#1F2937] space-y-2 bg-[#0B1120] shrink-0 pb-safe`}>
          {/* Quick Role Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen((prev) => !prev)}
              title="Switch Role"
              className={`w-full min-h-[38px] flex items-center ${
                showCompact ? 'justify-center px-2' : 'justify-between px-3'
              } py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-[11px] font-medium text-slate-300 hover:text-white transition-colors`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                {!showCompact && (
                  <>
                    <span>Switch Role:</span>
                    <span className="text-white font-semibold capitalize truncate">{currentRole.replace('_', ' ')}</span>
                  </>
                )}
              </div>
              {!showCompact && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>

            {roleSwitcherOpen && (
              <div className={`absolute bottom-full ${showCompact ? 'left-0 w-60' : 'left-0 right-0'} mb-1.5 bg-[#1F2937] rounded-lg border border-[#374151] shadow-xl p-1 z-50 text-xs space-y-0.5`}>
                <button
                  onClick={() => handleRoleSelect('admin')}
                  className={`w-full min-h-[36px] px-2.5 py-1.5 rounded text-left transition-colors flex items-center justify-between ${
                    currentRole === 'admin' ? 'bg-[#2563EB] text-white font-semibold' : 'text-slate-300 hover:bg-[#374151]'
                  }`}
                >
                  <span>Administrator (City Admin)</span>
                  {currentRole === 'admin' && <span className="text-[10px]">Active</span>}
                </button>
                <button
                  onClick={() => handleRoleSelect('officer')}
                  className={`w-full min-h-[36px] px-2.5 py-1.5 rounded text-left transition-colors flex items-center justify-between ${
                    currentRole === 'officer' ? 'bg-[#2563EB] text-white font-semibold' : 'text-slate-300 hover:bg-[#374151]'
                  }`}
                >
                  <span>Municipal Officer (Dept Lead)</span>
                  {currentRole === 'officer' && <span className="text-[10px]">Active</span>}
                </button>
                <button
                  onClick={() => handleRoleSelect('field_worker')}
                  className={`w-full min-h-[36px] px-2.5 py-1.5 rounded text-left transition-colors flex items-center justify-between ${
                    currentRole === 'field_worker' ? 'bg-[#2563EB] text-white font-semibold' : 'text-slate-300 hover:bg-[#374151]'
                  }`}
                >
                  <span>Field Crew (Dispatched Worker)</span>
                  {currentRole === 'field_worker' && <span className="text-[10px]">Active</span>}
                </button>
                <button
                  onClick={() => handleRoleSelect('citizen')}
                  className={`w-full min-h-[36px] px-2.5 py-1.5 rounded text-left transition-colors flex items-center justify-between ${
                    currentRole === 'citizen' ? 'bg-[#2563EB] text-white font-semibold' : 'text-slate-300 hover:bg-[#374151]'
                  }`}
                >
                  <span>Citizen (Aarav Sharma)</span>
                  {currentRole === 'citizen' && <span className="text-[10px]">Active</span>}
                </button>
                <button
                  onClick={() => handleRoleSelect('super_admin')}
                  className={`w-full min-h-[36px] px-2.5 py-1.5 rounded text-left transition-colors flex items-center justify-between ${
                    currentRole === 'super_admin' ? 'bg-[#2563EB] text-white font-semibold' : 'text-slate-300 hover:bg-[#374151]'
                  }`}
                >
                  <span>Super Admin (System Core)</span>
                  {currentRole === 'super_admin' && <span className="text-[10px]">Active</span>}
                </button>
              </div>
            )}
          </div>

          {/* User Profile Card */}
          <div className={`p-2 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center ${showCompact ? 'justify-center' : 'justify-between'}`}>
            {!showCompact && (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#1F2937] text-[#2563EB] font-bold text-xs flex items-center justify-center shrink-0 border border-[#2563EB]/40">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {user?.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] flex items-center gap-1">
                    <span>Role:</span>
                    <span className="text-[#14B8A6] font-medium capitalize truncate">
                      {currentRole.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onLogout}
              title="Logout"
              aria-label="Logout"
              className="min-w-[36px] min-h-[36px] p-1.5 rounded-md text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#1F2937] transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
