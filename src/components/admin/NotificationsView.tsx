import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  Check
} from 'lucide-react';
import { Complaint, NotificationItem } from '../../types';
import { api } from '../../services/api';
import { formatDate } from '../../utils/i18n';

interface NotificationsViewProps {
  complaints?: Complaint[];
  notifications?: NotificationItem[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onSelectComplaint?: (c: Complaint) => void;
}

export default function NotificationsView({
  complaints = [],
  notifications: propNotifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSelectComplaint,
}: NotificationsViewProps) {
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>(propNotifications || []);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    if (propNotifications) {
      setLocalNotifications(propNotifications);
    } else {
      api.getNotifications().then((data) => setLocalNotifications(data || [])).catch(() => {});
    }
  }, [propNotifications]);

  const notifications = propNotifications ?? localNotifications;

  const mapCategoryLabel = (type: NotificationItem['type']) => {
    switch (type) {
      case 'assignment':
        return 'Field Crew';
      case 'status_update':
        return 'Status Update';
      case 'announcement':
        return 'Public Notice';
      case 'message':
      default:
        return 'System Alert';
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterType === 'Unread') return !n.read;
    if (filterType !== 'All' && mapCategoryLabel(n.type) !== filterType) return false;
    return true;
  });

  const handleMarkAllRead = async () => {
    if (onMarkAllNotificationsRead) {
      onMarkAllNotificationsRead();
    } else {
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await api.markAllNotificationsRead().catch(() => {});
    }
  };

  const handleMarkRead = async (n: NotificationItem) => {
    if (!n.read) {
      if (onMarkNotificationRead) {
        onMarkNotificationRead(n.id);
      } else {
        setLocalNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
        );
        await api.markNotificationRead(n.id).catch(() => {});
      }
    }
    if (n.complaintId && onSelectComplaint) {
      const target = complaints.find((c) => c.id === n.complaintId);
      if (target) onSelectComplaint(target);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB] dark:border-[#374151]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
              Municipal Notification & Dispatch Center
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DC2626]/10 text-[#DC2626] dark:text-red-400 border border-[#FCA5A5] dark:border-red-900/60">
              {unreadCount} Unread Alerts
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
            Real-time telemetry feeds from field crew dispatch, citizen submissions, and SLA monitors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#111827] text-xs font-semibold text-[#344054] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Check className="w-3.5 h-3.5 text-[#16A34A] dark:text-emerald-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] rounded-xl text-xs font-medium w-full sm:w-fit overflow-x-auto no-scrollbar shadow-2xs">
        {['All', 'Unread', 'Status Update', 'Field Crew', 'Public Notice', 'System Alert'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-3 py-2 min-h-[36px] rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              filterType === f
                ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                : 'text-[#667085] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications Stream */}
      <div className="rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs divide-y divide-[#E5E7EB] dark:divide-[#374151] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[#667085] dark:text-[#9CA3AF]">
            <Bell className="w-8 h-8 mx-auto text-[#98A2B3] mb-2" />
            <div className="font-semibold text-sm text-[#111827] dark:text-[#F9FAFB]">
              No notifications in this view
            </div>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-0.5">All municipal telemetry channels are clear.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n)}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 transition-colors cursor-pointer ${
                n.read
                  ? 'bg-white dark:bg-[#111827] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937]'
                  : 'bg-[#EFF6FF]/40 dark:bg-blue-950/20 hover:bg-[#EFF6FF]/70 dark:hover:bg-blue-950/30'
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === 'message'
                      ? 'bg-[#FEF2F2] dark:bg-red-950/40 text-[#DC2626] dark:text-red-400 border border-[#FCA5A5] dark:border-red-900/60'
                      : n.type === 'announcement'
                      ? 'bg-[#FFFBEB] dark:bg-amber-950/40 text-[#D97706] dark:text-amber-400 border border-[#FDE68A] dark:border-amber-900/60'
                      : n.type === 'assignment'
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] border border-[#BFDBFE] dark:border-blue-900/60'
                      : 'bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#16A34A] dark:text-emerald-400 border border-[#A7F3D0] dark:border-emerald-900/60'
                  }`}
                >
                  {n.type === 'message' ? (
                    <Flame className="w-4 h-4" />
                  ) : n.type === 'announcement' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : n.type === 'assignment' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-[#111827] dark:text-[#F9FAFB]">
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#60A5FA] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#344054] dark:text-[#D1D5DB] mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-[#667085] dark:text-[#9CA3AF]">
                    <span className="px-2 py-0.5 rounded font-medium bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151]">
                      {mapCategoryLabel(n.type)}
                    </span>
                    <span className="font-mono text-[#667085] dark:text-[#9CA3AF]">{formatDate(n.createdAt)}</span>
                  </div>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(n);
                  }}
                  className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline shrink-0 self-start sm:self-center ml-12 sm:ml-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
