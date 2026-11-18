import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/common/Navbar';
import LandingPage from './components/pages/LandingPage';
import CitizenDashboard from './components/citizen/CitizenDashboard';
import GovernmentDashboard from './components/admin/GovernmentDashboard';
import AnnouncementsPortal from './components/announcements/AnnouncementsPortal';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';
import PublicTransparencyPortal from './components/pages/PublicTransparencyPortal';
import EmergencySOSModal from './components/common/EmergencySOSModal';
import AuthModal from './components/auth/AuthModal';
import ComplaintTimeline from './components/citizen/ComplaintTimeline';
import ChatbotWidget from './components/common/ChatbotWidget';
import { User, UserRole, Complaint, DashboardStats, Announcement, Department, IssueCategory, ComplaintStatus, NotificationItem } from './types';
import { api } from './services/api';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<'landing' | 'citizen' | 'government' | 'announcements' | 'super_admin' | 'transparency'>('government');
  const [citizenTab, setCitizenTab] = useState('overview');
  const [adminTab, setAdminTab] = useState('overview');

  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('civic_user');
      if (storedUser) {
        return JSON.parse(storedUser) as User;
      }
    } catch {
      // ignore parse errors
    }
    return {
      id: 'user_admin_1',
      name: 'Dr. Rajesh Verma (Municipal Commissioner)',
      email: 'admin@smartcity.gov',
      role: 'admin',
      department: 'Municipal Executive Administration',
      ward: 'Ward 4 - Central Promenade',
      status: 'active',
      dutyStatus: 'On Duty',
      createdAt: new Date().toISOString(),
    };
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'citizen' | 'admin'>('citizen');

  // Application Data State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [trackedComplaint, setTrackedComplaint] = useState<Complaint | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [complaintsData, statsData, announcementsData, deptData, notifData] = await Promise.all([
        api.getComplaints(),
        api.getStats(),
        api.getAnnouncements(),
        api.getDepartments(),
        api.getNotifications(),
      ]);

      setComplaints(complaintsData || []);
      setStats(statsData || null);
      setAnnouncements(announcementsData || []);
      setDepartments(deptData || []);
      setNotifications(notifData || []);
    } catch (err) {
      console.error('Error fetching municipal data:', err);
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const existingToken = localStorage.getItem('civic_token');
      const existingUserRaw = localStorage.getItem('civic_user');

      if (!existingToken) {
        const targetRole: UserRole = user?.role || 'admin';
        try {
          const session = await api.demoSession(targetRole);
          setUser(session.user);
          localStorage.setItem('civic_user', JSON.stringify(session.user));
          localStorage.setItem('civic_token', session.token);
          if (session.user.role === 'citizen') {
            setCurrentView('citizen');
          } else if (session.user.role === 'super_admin') {
            setCurrentView('super_admin');
          }
        } catch {
          // keep fallback state if offline
        }
      } else if (existingUserRaw) {
        try {
          const parsed = JSON.parse(existingUserRaw) as User;
          setUser(parsed);
          if (parsed.role === 'citizen') {
            setCurrentView('citizen');
          } else if (parsed.role === 'super_admin') {
            setCurrentView('super_admin');
          }
        } catch {
          // ignore invalid JSON
        }
      }

      await loadData();
    };

    initSession();

    // Check URL parameters for ticket tracking
    const params = new URLSearchParams(window.location.search);
    const ticket = params.get('ticket');
    if (ticket) {
      api.getComplaintByTicket(ticket).then((res) => {
        if (res) setTrackedComplaint(res);
      }).catch(() => {});
    }
  }, [loadData]);

  const handleLoginSuccess = (loggedInUser: User, token: string) => {
    setUser(loggedInUser);
    localStorage.setItem('civic_user', JSON.stringify(loggedInUser));
    localStorage.setItem('civic_token', token);
    setAuthModalOpen(false);

    if (loggedInUser.role === 'super_admin') {
      setCurrentView('super_admin');
    } else if (loggedInUser.role === 'admin' || loggedInUser.role === 'officer' || loggedInUser.role === 'field_worker') {
      setCurrentView('government');
      setAdminTab('overview');
    } else {
      setCurrentView('citizen');
      setCitizenTab('overview');
    }
    loadData();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('civic_user');
    localStorage.removeItem('civic_token');
    setCurrentView('landing');
  };

  const handleSwitchRole = async (newRole: UserRole) => {
    try {
      const session = await api.demoSession(newRole);
      setUser(session.user);
      localStorage.setItem('civic_user', JSON.stringify(session.user));
      localStorage.setItem('civic_token', session.token);
    } catch {
      const fallbackUser: User = {
        id: newRole === 'citizen' ? 'user_citizen_1' : newRole === 'super_admin' ? 'user_superadmin_1' : newRole === 'field_worker' ? 'user_worker_1' : newRole === 'officer' ? 'user_officer_1' : 'user_admin_1',
        name:
          newRole === 'citizen'
            ? 'Aarav Sharma'
            : newRole === 'super_admin'
            ? 'Super Admin - Director of Digital Governance'
            : newRole === 'field_worker'
            ? 'Ramesh Kumar (Field Response Specialist)'
            : newRole === 'officer'
            ? 'Eng. Vikram Sethi'
            : 'Dr. Rajesh Verma (Municipal Commissioner)',
        email:
          newRole === 'citizen'
            ? 'citizen@smartcity.gov'
            : newRole === 'super_admin'
            ? 'superadmin@smartcity.gov'
            : newRole === 'field_worker'
            ? 'worker@smartcity.gov'
            : newRole === 'officer'
            ? 'roads@smartcity.gov'
            : 'admin@smartcity.gov',
        role: newRole,
        department:
          newRole === 'field_worker' || newRole === 'officer'
            ? 'Roads & Infrastructure'
            : 'Municipal Operations',
        ward: 'Ward 4 - Central Promenade',
        status: 'active',
        dutyStatus: 'On Duty',
        createdAt: user?.createdAt || new Date().toISOString(),
      };
      setUser(fallbackUser);
      localStorage.setItem('civic_user', JSON.stringify(fallbackUser));
    }

    if (newRole === 'citizen') {
      setCurrentView('citizen');
      setCitizenTab('overview');
    } else if (newRole === 'super_admin') {
      setCurrentView('super_admin');
    } else if (newRole === 'field_worker') {
      setCurrentView('government');
      setAdminTab('workforce');
    } else if (newRole === 'officer') {
      setCurrentView('government');
      setAdminTab('complaints');
    } else {
      setCurrentView('government');
      setAdminTab('overview');
    }
    loadData();
  };

  const handleViewChange = (view: 'landing' | 'citizen' | 'government' | 'announcements' | 'super_admin' | 'transparency') => {
    if ((view === 'government' || view === 'super_admin') && user?.role === 'citizen') {
      setAuthRole('admin');
      setAuthModalOpen(true);
      return;
    }
    if ((view === 'government' || view === 'super_admin') && !user) {
      setAuthRole('admin');
      setAuthModalOpen(true);
      return;
    }
    setCurrentView(view);
    if (view === 'citizen') setCitizenTab('overview');
    if (view === 'government') setAdminTab('overview');
  };

  const handleUpvote = async (id: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c))
    );
    try {
      await api.upvoteComplaint(id, user?.id);
      loadData();
    } catch {
      loadData();
    }
  };

  const handleStatusUpdate = async (id: string, status: ComplaintStatus) => {
    try {
      await api.updateComplaintStatus(id, {
        status,
        updatedBy: user ? user.name : 'Municipal System',
      });
      loadData();
    } catch {
      // handled gracefully
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.markNotificationRead(id);
    } catch {
      // ignore
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col font-sans antialiased bg-[#F5F7FA] dark:bg-[#0B1120] text-[#111827] dark:text-[#F9FAFB] transition-colors duration-200">
      {currentView !== 'government' && currentView !== 'super_admin' && (
        <Navbar
          currentView={currentView}
          user={user}
          isDarkMode={isDark}
          onToggleDarkMode={toggleTheme}
          onOpenEmergencySOS={() => setSosModalOpen(true)}
          onViewChange={handleViewChange}
          onOpenLogin={(role) => {
            setAuthRole(role || 'citizen');
            setAuthModalOpen(true);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Main Page Rendering with Motion Transitions */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full"
          >
            {currentView === 'landing' && (
              <LandingPage
                stats={stats}
                complaints={complaints}
                announcements={announcements}
                onReportClick={() => {
                  if (!user) {
                    setAuthRole('citizen');
                    setAuthModalOpen(true);
                  } else {
                    setCurrentView('citizen');
                    setCitizenTab('report');
                  }
                }}
                onExploreMapClick={() => {
                  setCurrentView('citizen');
                  setCitizenTab('map');
                }}
                onTrackClick={() => {
                  setCurrentView('citizen');
                  setCitizenTab('history');
                }}
                onSelectCategory={(_cat: IssueCategory) => {
                  setCurrentView('citizen');
                  setCitizenTab('history');
                }}
                onViewComplaint={(c) => setTrackedComplaint(c)}
                onViewAnnouncementsClick={() => setCurrentView('announcements')}
              />
            )}

            {currentView === 'announcements' && (
              <AnnouncementsPortal
                user={user}
                announcements={announcements}
                onRefreshData={loadData}
                onOpenLogin={(role) => {
                  setAuthRole(role || 'citizen');
                  setAuthModalOpen(true);
                }}
              />
            )}

            {currentView === 'citizen' && (
              <CitizenDashboard
                user={user}
                complaints={complaints}
                activeTab={citizenTab}
                onTabChange={(tab) => setCitizenTab(tab)}
                onRefreshData={loadData}
                onUpvote={handleUpvote}
              />
            )}

            {currentView === 'government' && (
              <GovernmentDashboard
                stats={stats}
                complaints={complaints}
                departments={departments}
                announcements={announcements}
                notifications={notifications}
                onMarkNotificationRead={handleMarkNotificationRead}
                onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                activeTab={adminTab}
                onTabChange={(tab) => setAdminTab(tab)}
                onRefreshData={loadData}
                onStatusUpdate={handleStatusUpdate}
                onOpenAnnouncementsPortal={() => setCurrentView('announcements')}
                user={user}
                onLogout={handleLogout}
                onSwitchToCitizen={() => handleSwitchRole('citizen')}
                onSwitchRole={handleSwitchRole}
                isDarkMode={isDark}
                onToggleDarkMode={toggleTheme}
                onOpenEmergencySOS={() => setSosModalOpen(true)}
              />
            )}

            {currentView === 'super_admin' && (
              <SuperAdminDashboard
                currentUser={
                  user || {
                    id: 'user_superadmin_1',
                    name: 'Super Admin - Director of Digital Governance',
                    email: 'superadmin@smartcity.gov',
                    role: 'super_admin',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                  }
                }
                stats={stats}
                complaints={complaints}
                onLogout={handleLogout}
                onSwitchRole={(role) => {
                  if (role === 'citizen') handleSwitchRole('citizen');
                  else if (role === 'government') handleSwitchRole('admin');
                  else handleSwitchRole('super_admin');
                }}
                onNavigateToLanding={() => setCurrentView('landing')}
              />
            )}

            {currentView === 'transparency' && <PublicTransparencyPortal />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          initialRole={authRole}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* Emergency SOS Modal */}
      {sosModalOpen && (
        <EmergencySOSModal
          onClose={() => setSosModalOpen(false)}
          onSubmitted={() => {
            loadData();
          }}
        />
      )}

      {/* Tracked Ticket Direct Modal */}
      {trackedComplaint && (
        <ComplaintTimeline
          complaint={trackedComplaint}
          onClose={() => setTrackedComplaint(null)}
          onFeedbackSubmitted={() => {
            loadData();
            setTrackedComplaint(null);
          }}
        />
      )}

      {/* Floating 24/7 Municipal AI Chatbot */}
      <ChatbotWidget currentUser={user} />
    </div>
  );
}
