import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  User as UserIcon,
  Shield,
  LogOut,
  Moon,
  Sun,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Flame,
  X,
  Languages,
  Clock
} from 'lucide-react';
import { User, Complaint, Language, NotificationItem } from '../../types';
import { AdminNavigationTab } from './AdminSidebar';
import { changeLanguage, getCurrentLanguage, formatDate } from '../../utils/i18n';

interface AdminTopNavProps {
  activeTab: AdminNavigationTab;
  user: User | null;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onSearchSelectComplaint?: (c: Complaint) => void;
  complaints?: Complaint[];
  notifications?: NotificationItem[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onNavigateTab?: (tab: AdminNavigationTab) => void;
  onOpenEmergencySOS?: () => void;
}

export default function AdminTopNav({
  activeTab,
  user,
  onLogout,
  onOpenMobileMenu,
  isDarkMode = false,
  onToggleDarkMode,
  onSearchSelectComplaint,
  complaints = [],
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateTab,
  onOpenEmergencySOS,
}: AdminTopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Formatted Current Date & Municipal Clock
  const [formattedDate, setFormattedDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      };
      setFormattedDate(now.toLocaleDateString('en-US', options));
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        if (!searchOpen) {
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileDropdownOpen(false);
        setLangDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Tab Breadcrumb Map
  const tabNames: Record<AdminNavigationTab, { section: string; title: string }> = {
    overview: { section: 'Overview', title: 'Command Center' },
    complaints: { section: 'Civic Operations', title: 'Live Complaints' },
    report: { section: 'Civic Operations', title: 'Report an Issue' },
    map: { section: 'Civic Operations', title: 'Live City Map' },
    tracking: { section: 'Civic Operations', title: 'Resolution Tracking' },
    analytics: { section: 'Intelligence', title: 'AI Analytics' },
    predictions: { section: 'Intelligence', title: 'AI Predictions' },
    assistant: { section: 'Intelligence', title: 'Civic Assistant' },
    departments: { section: 'Management', title: 'Departments' },
    workforce: { section: 'Management', title: 'Field Workforce' },
    citizens: { section: 'Management', title: 'Citizens' },
    feedback: { section: 'Management', title: 'Feedback & Reviews' },
    notifications: { section: 'System', title: 'Notifications' },
    audit_logs: { section: 'System', title: 'Audit Logs' },
    settings: { section: 'System', title: 'Settings' },
  };

  const handleLanguageChange = (newLang: Language) => {
    changeLanguage(newLang);
    setCurrentLang(newLang);
    setLangDropdownOpen(false);
  };

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? complaints.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.ticketNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.location.address.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }).slice(0, 5)
    : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const currentTabInfo = tabNames[activeTab] || { section: 'Operations', title: 'Dashboard' };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 sm:h-16 bg-[#F5F7FA]/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#374151] px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-200 pt-safe">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="min-w-[44px] min-h-[44px] p-2 rounded-lg text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-[#E5E7EB] dark:hover:bg-[#1F2937] md:hidden transition-colors flex items-center justify-center shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
            <span className="font-medium text-[#667085] dark:text-slate-400 hidden sm:inline">CivicPulse</span>
            <span className="text-[#98A2B3] hidden sm:inline">/</span>
            <span className="font-medium text-[#667085] dark:text-slate-400 hidden lg:inline">
              {currentTabInfo.section}
            </span>
            <span className="text-[#98A2B3] hidden lg:inline">/</span>
            <span className="font-bold text-[#101828] dark:text-white truncate">
              {currentTabInfo.title}
            </span>
          </nav>
        </div>

        {/* Middle: Global Search Input (md+) */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search complaints, wards, ticket #, departments..."
              className="w-full pl-9 pr-16 py-1.5 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs text-[#101828] dark:text-white placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all shadow-2xs"
            />
            <div className="absolute right-2 top-2 flex items-center">
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#667085] bg-[#F2F4F7] dark:bg-[#0F172A] border border-[#D0D5DD] dark:border-[#334155]">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1E293B] rounded-xl border border-[#EAECF0] dark:border-[#334155] shadow-lg overflow-hidden z-50 text-left">
              <div className="px-3 py-2 text-[10px] font-bold text-[#667085] uppercase tracking-wider border-b border-[#EAECF0] dark:border-[#334155] flex justify-between items-center">
                <span>Matching Tickets</span>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-xs text-[#98A2B3] hover:text-[#101828] p-1"
                  aria-label="Close search results"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-[#F2F4F7] dark:divide-[#334155]">
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (onSearchSelectComplaint) onSearchSelectComplaint(c);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full p-3 text-left hover:bg-[#F9FAFB] dark:hover:bg-[#283548] flex items-center justify-between transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#2563EB]">
                          {c.ticketNumber}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-[#F2F4F7] dark:bg-[#0F172A] text-[#344054] dark:text-slate-300">
                          {c.status}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-[#101828] dark:text-white truncate mt-0.5">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-[#667085] truncate">
                        {c.location.address}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#98A2B3] shrink-0 font-medium">
                      {c.priority}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Controls: Mobile Search, Clock, SOS, Language, Theme, Notifications, Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle (< md) */}
          <button
            onClick={() => {
              setSearchOpen((prev) => !prev);
              setNotificationsOpen(false);
              setProfileDropdownOpen(false);
              setLangDropdownOpen(false);
              setTimeout(() => searchInputRef.current?.focus(), 60);
            }}
            className="md:hidden min-w-[40px] min-h-[40px] p-2 rounded-lg text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-white dark:hover:bg-[#111827] transition-colors flex items-center justify-center"
            aria-label="Search complaints"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Real-Time Municipal Clock */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] text-xs font-medium text-[#344054] dark:text-slate-300 shadow-2xs whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-[#667085]" />
            <span>{formattedDate}</span>
            <span className="text-[#98A2B3]">•</span>
            <Clock className="w-3 h-3 text-[#2563EB]" />
            <span className="font-mono">{currentTime}</span>
          </div>

          {/* Emergency SOS Button */}
          {onOpenEmergencySOS && (
            <button
              onClick={onOpenEmergencySOS}
              className="min-h-[38px] sm:min-h-[34px] flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#FEE2E2] hover:bg-[#FECDCD] text-[#DC2626] border border-[#FCA5A5] text-xs font-semibold transition-colors shadow-2xs whitespace-nowrap"
              title="Dispatch Municipal Emergency Alert"
              aria-label="Emergency SOS"
            >
              <Flame className="w-3.5 h-3.5 fill-[#DC2626] shrink-0" />
              <span className="hidden sm:inline">Emergency SOS</span>
            </button>
          )}

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setLangDropdownOpen((prev) => !prev);
                setNotificationsOpen(false);
                setProfileDropdownOpen(false);
              }}
              className="min-h-[38px] min-w-[38px] px-2 py-1.5 rounded-lg text-[#667085] hover:text-[#101828] dark:hover:text-white hover:bg-white dark:hover:bg-[#1E293B] border border-transparent hover:border-[#EAECF0] dark:hover:border-[#334155] transition-all flex items-center justify-center gap-1"
              title="Change Language"
              aria-label="Change Language"
            >
              <Languages className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-semibold uppercase hidden sm:inline">{currentLang}</span>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#111827] rounded-xl border border-[#E5E7EB] dark:border-[#374151] shadow-xl z-50 overflow-hidden text-left py-1 text-xs">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full min-h-[36px] px-3 py-2 text-left flex items-center justify-between ${
                    currentLang === 'en'
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] font-bold'
                      : 'text-[#111827] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937]'
                  }`}
                >
                  <span>English</span>
                  {currentLang === 'en' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />}
                </button>
                <button
                  onClick={() => handleLanguageChange('hi')}
                  className={`w-full min-h-[36px] px-3 py-2 text-left flex items-center justify-between ${
                    currentLang === 'hi'
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] font-bold'
                      : 'text-[#111827] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937]'
                  }`}
                >
                  <span>हिन्दी (Hindi)</span>
                  {currentLang === 'hi' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />}
                </button>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="min-w-[38px] min-h-[38px] p-2 rounded-lg text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-white dark:hover:bg-[#111827] border border-transparent hover:border-[#E5E7EB] dark:hover:border-[#374151] transition-all flex items-center justify-center"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                setProfileDropdownOpen(false);
                setLangDropdownOpen(false);
              }}
              className="min-w-[38px] min-h-[38px] relative p-2 rounded-lg text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB] hover:bg-white dark:hover:bg-[#111827] border border-transparent hover:border-[#E5E7EB] dark:hover:border-[#374151] transition-all flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
              )}
            </button>

            {notificationsOpen && (
              <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-14 sm:top-full sm:mt-2 w-auto sm:w-96 bg-white dark:bg-[#111827] rounded-xl border border-[#E5E7EB] dark:border-[#374151] shadow-xl z-50 overflow-hidden text-left animate-in fade-in duration-150">
                <div className="p-3.5 border-b border-[#E5E7EB] dark:border-[#374151] flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB]">
                      Municipal Alerts & Dispatch
                    </h4>
                    <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF]">
                      {unreadCount} unread update{unreadCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        if (onMarkAllNotificationsRead) onMarkAllNotificationsRead();
                        setNotificationsOpen(false);
                      }}
                      className="text-xs text-[#2563EB] dark:text-[#60A5FA] font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#E5E7EB] dark:divide-[#374151] max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#667085] dark:text-[#9CA3AF]">
                      All municipal notifications cleared.
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.read && onMarkNotificationRead) onMarkNotificationRead(n.id);
                          if (onNavigateTab) onNavigateTab('notifications');
                          setNotificationsOpen(false);
                        }}
                        className={`w-full text-left p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] transition-colors ${
                          !n.read ? 'bg-[#EFF6FF]/50 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5">
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#60A5FA] shrink-0" />}
                            {n.title}
                          </span>
                          <span className="text-[10px] text-[#667085] dark:text-[#9CA3AF] shrink-0 font-mono">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen((prev) => !prev);
                setNotificationsOpen(false);
                setLangDropdownOpen(false);
              }}
              aria-label="Admin profile menu"
              className="min-h-[38px] flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 pr-1.5 sm:pr-2 rounded-lg bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] hover:border-[#D0D5DD] transition-all text-left shadow-2xs"
            >
              <div className="w-7 h-7 rounded-full bg-[#111827] text-[#2563EB] font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden lg:block leading-tight">
                <div className="text-xs font-semibold text-[#101828] dark:text-white max-w-[100px] truncate">
                  {user?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-[#667085] capitalize">
                  {user?.role?.replace('_', ' ') || 'City Admin'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#667085] hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#1E293B] rounded-xl border border-[#EAECF0] dark:border-[#334155] shadow-xl z-50 overflow-hidden text-left animate-in fade-in duration-150">
                <div className="p-3 border-b border-[#EAECF0] dark:border-[#334155]">
                  <div className="text-xs font-bold text-[#101828] dark:text-white truncate">
                    {user?.name || 'Municipal Administrator'}
                  </div>
                  <div className="text-[11px] text-[#667085] truncate">
                    {user?.email || 'admin@smartcity.gov'}
                  </div>
                  <div className="mt-1.5">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-[#ECFDF5] text-[#16A34A] border border-[#A7F3D0]">
                      Status: On Duty (Active)
                    </span>
                  </div>
                </div>

                <div className="p-1 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      if (onNavigateTab) onNavigateTab('settings');
                    }}
                    className="w-full min-h-[38px] flex items-center gap-2 px-3 py-2 rounded-lg text-[#344054] dark:text-slate-200 hover:bg-[#F2F4F7] dark:hover:bg-[#1F2937] transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#667085] dark:text-[#9CA3AF]" />
                    <span>Admin Profile & Role</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      if (onNavigateTab) onNavigateTab('audit_logs');
                    }}
                    className="w-full min-h-[38px] flex items-center gap-2 px-3 py-2 rounded-lg text-[#344054] dark:text-slate-200 hover:bg-[#F2F4F7] dark:hover:bg-[#1F2937] transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#667085] dark:text-[#9CA3AF]" />
                    <span>Security & Audit Trails</span>
                  </button>

                  <div className="my-1 border-t border-[#EAECF0] dark:border-[#334155]" />

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full min-h-[38px] flex items-center gap-2 px-3 py-2 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-red-950/40 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout from Platform</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Expandable Search Bar Drawer (< md) */}
      {searchOpen && (
        <div className="md:hidden bg-white dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#374151] px-3 py-2.5 z-30 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, ward, address..."
                className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#1E293B] text-xs text-[#101828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <button
              onClick={() => setSearchOpen(false)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Close mobile search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="rounded-xl border border-[#EAECF0] dark:border-[#334155] divide-y divide-[#F2F4F7] dark:divide-[#334155] max-h-60 overflow-y-auto bg-white dark:bg-[#1E293B]">
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (onSearchSelectComplaint) onSearchSelectComplaint(c);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full p-2.5 text-left flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold text-[#2563EB]">{c.ticketNumber}</span>
                    <div className="text-xs font-medium text-[#101828] dark:text-white truncate">{c.title}</div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#667085] shrink-0">{c.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
