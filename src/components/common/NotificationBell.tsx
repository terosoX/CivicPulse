import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, CheckCheck } from 'lucide-react';
import { api } from '../../services/api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 15000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch {
      // silent catch
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await api.markNotificationRead(id);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl text-[#667085] dark:text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-[#1F2937] transition-colors relative border border-[#E5E7EB] dark:border-[#374151]"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#111827]">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-[#E5E7EB] dark:border-[#374151] z-50 overflow-hidden text-left">
          <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#374151] flex items-center justify-between">
            <div className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
              Notifications
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#667085] dark:text-[#9CA3AF] font-medium">
                {unreadCount} unread
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-[#374151]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#667085] dark:text-[#9CA3AF]">
                No recent municipal notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`p-3.5 hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] cursor-pointer transition-colors ${
                    !n.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#2563EB] dark:text-[#60A5FA]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] flex items-center justify-between gap-2">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-[#667085] dark:text-[#9CA3AF] font-normal shrink-0">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
