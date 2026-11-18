import React, { useState } from 'react';
import AdminSidebar, { AdminNavigationTab } from './AdminSidebar';
import AdminTopNav from './AdminTopNav';
import EnterpriseOverview from './EnterpriseOverview';
import LiveComplaintsView from './LiveComplaintsView';
import EnterpriseReportIssueView from './EnterpriseReportIssueView';
import MapIntelligenceView from './MapIntelligenceView';
import AIAnalyticsView from './AIAnalyticsView';
import AIPredictionsView from './AIPredictionsView';
import CivicAssistantView from './CivicAssistantView';
import DepartmentManagementView from './DepartmentManagementView';
import FieldWorkforceView from './FieldWorkforceView';
import CitizensManagementView from './CitizensManagementView';
import ResolutionTrackingView from './ResolutionTrackingView';
import CitizenFeedbackView from './CitizenFeedbackView';
import NotificationsView from './NotificationsView';
import AuditLogsView from './AuditLogsView';
import AdminSettingsView from './AdminSettingsView';
import ComplaintTimeline from '../citizen/ComplaintTimeline';
import ProgressManagementModal from './ProgressManagementModal';
import { Complaint, DashboardStats, Department, Announcement, ComplaintStatus, User, UserRole, NotificationItem } from '../../types';

interface GovernmentDashboardProps {
  stats: DashboardStats | null;
  complaints: Complaint[];
  departments: Department[];
  announcements: Announcement[];
  notifications?: NotificationItem[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefreshData: () => void;
  onStatusUpdate: (id: string, status: ComplaintStatus) => void;
  onOpenAnnouncementsPortal?: () => void;
  user?: User | null;
  onLogout?: () => void;
  onSwitchToCitizen?: () => void;
  onSwitchRole?: (role: UserRole) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenEmergencySOS?: () => void;
}

export default function GovernmentDashboard({
  stats,
  complaints,
  departments,
  announcements,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  activeTab,
  onTabChange,
  onRefreshData,
  onStatusUpdate,
  onOpenAnnouncementsPortal,
  user = null,
  onLogout = () => {},
  onSwitchToCitizen,
  onSwitchRole,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenEmergencySOS,
}: GovernmentDashboardProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [progressModalComplaint, setProgressModalComplaint] = useState<Complaint | null>(null);

  // Map incoming activeTab string to AdminNavigationTab
  const validTabs: AdminNavigationTab[] = [
    'overview',
    'complaints',
    'report',
    'map',
    'tracking',
    'analytics',
    'predictions',
    'assistant',
    'departments',
    'workforce',
    'citizens',
    'feedback',
    'notifications',
    'audit_logs',
    'settings',
  ];

  const currentTab: AdminNavigationTab = validTabs.includes(activeTab as AdminNavigationTab)
    ? (activeTab as AdminNavigationTab)
    : 'overview';

  const handleTabSelect = (tab: AdminNavigationTab) => {
    onTabChange(tab);
  };

  const pendingCount = complaints.filter(
    (c) => c.status === 'Submitted' || c.status === 'Pending' || c.status === 'Verified'
  ).length;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1120] text-[#111827] dark:text-[#F9FAFB] flex flex-col antialiased transition-colors duration-200">
      {/* 1. Left Sidebar (#111827 / #080E1A Dark Navy) */}
      <AdminSidebar
        activeTab={currentTab}
        onTabChange={handleTabSelect}
        user={user}
        onLogout={onLogout}
        onSwitchToCitizen={onSwitchToCitizen}
        onSwitchRole={onSwitchRole}
        complaintsCount={complaints.length}
        pendingCount={pendingCount}
        unreadNotificationsCount={unreadNotificationsCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Content Area (Offset for 64w Sidebar on Desktop) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navigation */}
        <AdminTopNav
          activeTab={currentTab}
          user={user}
          onLogout={onLogout}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
          complaints={complaints}
          notifications={notifications}
          onMarkNotificationRead={onMarkNotificationRead}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          onNavigateTab={handleTabSelect}
          onSearchSelectComplaint={(c) => setSelectedComplaint(c)}
          onOpenEmergencySOS={onOpenEmergencySOS}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <EnterpriseOverview
              stats={stats}
              complaints={complaints}
              departments={departments}
              user={user}
              onNavigateTab={handleTabSelect}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
              onRefreshData={onRefreshData}
            />
          )}

          {currentTab === 'complaints' && (
            <LiveComplaintsView
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
              onRefreshData={onRefreshData}
              onStatusUpdate={onStatusUpdate}
            />
          )}

          {currentTab === 'report' && (
            <EnterpriseReportIssueView
              user={user}
              onNavigateTab={handleTabSelect}
              onSubmitSuccess={(ticket) => {
                onRefreshData();
              }}
            />
          )}

          {currentTab === 'map' && (
            <MapIntelligenceView
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          )}

          {currentTab === 'tracking' && (
            <ResolutionTrackingView
              complaints={complaints}
              onRefreshData={onRefreshData}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          )}

          {currentTab === 'analytics' && (
            <AIAnalyticsView
              complaints={complaints}
              departments={departments}
              onNavigateTab={handleTabSelect}
            />
          )}

          {currentTab === 'predictions' && (
            <AIPredictionsView
              complaints={complaints}
              departments={departments}
              onNavigateTab={handleTabSelect}
            />
          )}

          {currentTab === 'assistant' && (
            <CivicAssistantView
              user={user}
              complaints={complaints}
              onNavigateTab={handleTabSelect}
            />
          )}

          {currentTab === 'departments' && (
            <DepartmentManagementView
              departments={departments}
              complaints={complaints}
              onRefreshData={onRefreshData}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          )}

          {currentTab === 'workforce' && (
            <FieldWorkforceView
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
              onRefreshData={onRefreshData}
            />
          )}

          {currentTab === 'citizens' && (
            <CitizensManagementView
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          )}

          {currentTab === 'feedback' && (
            <CitizenFeedbackView
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsView
              complaints={complaints}
              notifications={notifications}
              onMarkNotificationRead={onMarkNotificationRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          )}

          {currentTab === 'audit_logs' && (
            <AuditLogsView />
          )}

          {currentTab === 'settings' && (
            <AdminSettingsView
              complaints={complaints}
              onRefreshData={onRefreshData}
            />
          )}
        </main>
      </div>

      {/* Global Modals for Complaint Lifecycle Details and Updates */}
      {selectedComplaint && (
        <ComplaintTimeline
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onFeedbackSubmitted={() => {
            onRefreshData();
            setSelectedComplaint(null);
          }}
        />
      )}

      {progressModalComplaint && (
        <ProgressManagementModal
          complaint={progressModalComplaint}
          onClose={() => setProgressModalComplaint(null)}
          onUpdateSuccess={() => {
            onRefreshData();
            setProgressModalComplaint(null);
          }}
        />
      )}
    </div>
  );
}
