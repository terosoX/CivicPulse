import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, AlertCircle, ChevronRight } from 'lucide-react';
import { Announcement } from '../../types';
import { formatDate } from '../../utils/i18n';

interface AnnouncementsTickerProps {
  announcements: Announcement[];
  onViewAllClick?: () => void;
}

export default function AnnouncementsTicker({ announcements, onViewAllClick }: AnnouncementsTickerProps) {
  const { i18n } = useTranslation();

  if (!announcements || announcements.length === 0) return null;

  // Prioritize critical emergency alert if one exists, otherwise most recent published
  const emergencyNotice = announcements.find((a) => a.priority === 'Critical' && (a.status || 'Published') === 'Published');
  const activeNotice = emergencyNotice || announcements[0];
  const isEmergency = activeNotice.priority === 'Critical';

  return (
    <aside
      aria-label="Official Municipal Bulletin"
      className={`border-b text-xs transition-colors ${
        isEmergency
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
          : 'bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-slate-700 dark:text-slate-300'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Official Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              isEmergency
                ? 'bg-rose-700 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isEmergency ? <AlertCircle className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
            <span>{isEmergency ? (i18n.language === 'hi' ? 'आपातकालीन चेतावनी' : 'Emergency Alert') : (i18n.language === 'hi' ? 'सरकारी सूचना' : 'Official Notice')}</span>
          </span>

          {/* Bulletin Text */}
          <div className="truncate">
            <span className="font-semibold text-slate-900 dark:text-white mr-1.5">
              {activeNotice.title}
            </span>
            <span className="hidden md:inline text-slate-500 dark:text-slate-400">
              — {activeNotice.subtitle || activeNotice.content.slice(0, 95)}...
            </span>
          </div>
        </div>

        {/* Action Link & Date */}
        <div className="flex items-center gap-3 shrink-0 text-[11px] self-end sm:self-center">
          <span className="text-slate-400 dark:text-slate-500 hidden lg:inline">
            {formatDate(activeNotice.publishedAt || activeNotice.createdAt)}
          </span>
          <button
            onClick={onViewAllClick}
            className={`font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer ${
              isEmergency ? 'text-rose-700 dark:text-rose-300' : 'text-blue-700 dark:text-blue-400'
            }`}
          >
            <span>{i18n.language === 'hi' ? 'सभी सूचनाएं देखें' : 'View all notices'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
