import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  LayoutDashboard,
  Megaphone,
  Users,
  ShieldCheck,
  PlusCircle,
  Globe,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  ChevronDown,
  AlertTriangle,
  Lock,
  BarChart3
} from 'lucide-react';
import { User, Language } from '../../types';
import NotificationBell from './NotificationBell';
import { changeLanguage, getCurrentLanguage } from '../../utils/i18n';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentView: 'landing' | 'citizen' | 'government' | 'announcements' | 'super_admin' | 'transparency';
  onViewChange: (view: 'landing' | 'citizen' | 'government' | 'announcements' | 'super_admin' | 'transparency') => void;
  onOpenEmergencySOS?: () => void;
  user: User | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenLogin: (role?: 'citizen' | 'admin') => void;
  onLogout: () => void;
}

export default function Navbar({
  currentView,
  onViewChange,
  onOpenEmergencySOS,
  user,
  isDarkMode,
  onToggleDarkMode,
  onOpenLogin,
  onLogout,
}: NavbarProps) {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const effectiveDark = typeof isDarkMode === 'boolean' ? isDark : isDarkMode;
  const handleThemeToggle = () => {
    toggleTheme();
    if (onToggleDarkMode && onToggleDarkMode !== toggleTheme) {
      // avoid double toggling when App already passes toggleTheme
    }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage());
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLanguageChange = (newLang: Language) => {
    changeLanguage(newLang);
    setCurrentLang(newLang);
    if (user) {
      user.preferredLanguage = newLang;
    }
  };

  // Role-Aware Navigation Architecture:
  // Public citizens see citizen-facing services. Officials see operations/admin tools.
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'officer' || user?.role === 'field_worker' || isSuperAdmin;

  const publicNavItems = [
    {
      id: 'landing' as const,
      label: i18n.language === 'hi' ? 'मुख्य पृष्ठ' : 'Home',
      icon: LayoutDashboard,
      action: () => onViewChange('landing'),
    },
    {
      id: 'citizen' as const,
      label: i18n.language === 'hi' ? 'नागरिक पोर्टल' : 'Citizen Services',
      icon: Users,
      action: () => onViewChange('citizen'),
    },
    {
      id: 'government' as const,
      label: i18n.language === 'hi' ? 'प्रशासन कंसोल' : 'Admin Console',
      icon: Building2,
      action: () => onViewChange('government'),
    },
    {
      id: 'announcements' as const,
      label: i18n.language === 'hi' ? 'सरकारी सूचनाएं' : 'Official Notices',
      icon: Megaphone,
      action: () => onViewChange('announcements'),
    },
    {
      id: 'transparency' as const,
      label: i18n.language === 'hi' ? 'पारदर्शिता' : 'Public Transparency',
      icon: BarChart3,
      action: () => onViewChange('transparency'),
    },
  ];

  const adminNavItems = [
    {
      id: 'government' as const,
      label: i18n.language === 'hi' ? 'नगर निगम नियंत्रण' : 'Operations Console',
      icon: Building2,
      action: () => onViewChange('government'),
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'super_admin' as const,
            label: i18n.language === 'hi' ? 'सुपर एडमिन' : 'System Administration',
            icon: ShieldCheck,
            action: () => onViewChange('super_admin'),
          },
        ]
      : []),
    {
      id: 'landing' as const,
      label: i18n.language === 'hi' ? 'नागरिक दृश्य' : 'Public View',
      icon: LayoutDashboard,
      action: () => onViewChange('landing'),
    },
    {
      id: 'announcements' as const,
      label: i18n.language === 'hi' ? 'सूचनाएं' : 'Notices',
      icon: Megaphone,
      action: () => onViewChange('announcements'),
    },
  ];

  const activeNavItems = isAdmin ? adminNavItems : publicNavItems;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#374151] transition-colors pt-safe">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">

          {/* Brand & Identity */}
          <button
            type="button"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink-0 text-left min-h-[44px]"
            onClick={() => onViewChange('landing')}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                  CivicPulse
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  Municipal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden xl:block -mt-0.5 truncate">
                Smart City Grievance & Public Redressal
              </p>
            </div>
          </button>

          {/* Clean Primary Navigation (lg+ avoids tablet collision) */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1 min-w-0"
          >
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/80 dark:border-blue-800/80'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2] shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Bar (Right side) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Emergency SOS Button */}
            {onOpenEmergencySOS && (
              <button
                onClick={onOpenEmergencySOS}
                title="Log Critical Public Safety Hazard"
                className="min-h-[40px] sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 active:bg-rose-900 shadow-xs flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 whitespace-nowrap"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Emergency SOS</span>
                <span className="md:hidden">SOS</span>
              </button>
            )}

            {/* Quick Report Issue Button */}
            <button
              onClick={() => {
                onViewChange('citizen');
              }}
              className="min-h-[40px] sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 shadow-xs flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t('nav.reportIssue')}</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* Language Selector (EN / HI) */}
            <div className="relative hidden sm:flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={i18n.language || currentLang}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                aria-label="Select Language"
                className="min-h-[36px] pl-7 pr-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="en">EN</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={handleThemeToggle}
              className="min-w-[40px] min-h-[40px] sm:min-w-[36px] sm:min-h-[36px] p-2 rounded-lg text-[#667085] dark:text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-[#1F2937] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors border border-[#E5E7EB] dark:border-[#374151] flex items-center justify-center"
              title={effectiveDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark Mode"
            >
              {effectiveDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Staff / Official Access Link (when logged out) */}
            {!user && (
              <button
                onClick={() => onOpenLogin('admin')}
                className="hidden xl:flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                title="Municipal Staff Login"
              >
                <Lock className="w-3 h-3" />
                <span>Staff</span>
              </button>
            )}

            {/* User Account / Auth State */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="User account menu"
                  className="min-h-[40px] sm:min-h-[36px] flex items-center gap-1.5 sm:gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="w-7 h-7 rounded-md bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden xl:block text-left">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white leading-none">
                      {user.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrator' : user.role === 'officer' ? 'Dept Officer' : user.role === 'field_worker' ? 'Field Worker' : 'Citizen'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 text-xs z-50">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-700">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {user.role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onViewChange(user.role === 'citizen' ? 'citizen' : user.role === 'super_admin' ? 'super_admin' : 'government');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full min-h-[40px] text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.role === 'citizen' ? 'My Dashboard' : 'Operations Portal'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full min-h-[40px] text-left px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('nav.signOut')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenLogin('citizen')}
                className="min-h-[40px] sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-[#111827] dark:text-[#F9FAFB] hover:bg-[#F5F7FA] dark:hover:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] transition-colors whitespace-nowrap"
              >
                {t('nav.signIn')}
              </button>
            )}

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] p-2 lg:hidden rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close Mobile Menu' : 'Open Mobile Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 max-h-[calc(100dvh-4rem)] overflow-y-auto">
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {!user && (
              <button
                onClick={() => {
                  onOpenLogin('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Lock className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Municipal Staff Login</span>
              </button>
            )}

            <div className="pt-2.5 mt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-3.5 text-xs">
              <span className="text-slate-500 font-medium">Language:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs ${i18n.language === 'en' ? 'font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'text-slate-500'}`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('hi')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs ${i18n.language === 'hi' ? 'font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'text-slate-500'}`}
                >
                  हिन्दी
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
