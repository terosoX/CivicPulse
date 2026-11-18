import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Plus, Trash2, ExternalLink, Edit } from 'lucide-react';
import { Announcement } from '../../types';
import { api } from '../../services/api';
import AnnouncementFormModal from '../announcements/AnnouncementFormModal';
import { formatDate, formatNumber, translateCategory, translatePriority } from '../../utils/i18n';

interface AnnouncementsAdminProps {
  announcements: Announcement[];
  onRefresh: () => void;
  onOpenPortal?: () => void;
}

export default function AnnouncementsAdmin({ announcements, onRefresh, onOpenPortal }: AnnouncementsAdminProps) {
  const { t, i18n } = useTranslation();
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDelete = async (id: string) => {
    setErrorMsg('');
    try {
      await api.deleteAnnouncement(id);
      setConfirmDeleteId(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err?.message || (i18n.language === 'hi' ? 'सूचना हटाने में विफल' : 'Failed to delete announcement'));
    }
  };

  return (
    <div className="space-y-6 text-left">
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="underline ml-3">Dismiss</button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#111827] via-[#1E3A8A] to-[#0F172A] rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md border border-[#1F2937]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-300">
            <Megaphone className="w-4 h-4" />
            <span>{i18n.language === 'hi' ? 'सरकारी डिजिटल सेवाएं • राजपत्र प्रबंधन' : 'Government Digital Services • Gazette Management'}</span>
          </div>
          <h2 className="text-xl font-bold">{t('dashboard.announcements.title')}</h2>
          <p className="text-xs text-slate-300">
            {i18n.language === 'hi' ? 'सभी नगर वार्डों के लिए आधिकारिक सूचनाएं, आपातकालीन चेतावनियां और पानी के समय की घोषणाएं प्रकाशित करें।' : 'Publish official notices, emergency warnings, road closures, and water schedules for all city wards.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenPortal && (
            <button
              onClick={onOpenPortal}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{i18n.language === 'hi' ? 'सार्वजनिक पोर्टल खोलें' : 'Open Public Portal'}</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingAnnouncement(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{i18n.language === 'hi' ? 'नई सूचना बनाएं' : 'Create New Notice'}</span>
          </button>
        </div>
      </div>

      {/* Grid List of Active Announcements */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">
            {i18n.language === 'hi' ? 'सक्रिय नगर सूचनाएं' : 'Active Municipal Notices & Gazettes'} ({formatNumber(announcements.length)})
          </h3>
          <span className="text-xs text-[#667085] dark:text-[#9CA3AF]">{i18n.language === 'hi' ? 'सार्वजनिक बुलेटिन प्रबंधित करें' : 'Manage, Edit, or Archive Public Bulletins'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {translateCategory(a.category)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {translatePriority(a.priority)} • {formatDate(a.publishedAt || a.createdAt || new Date())}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">{a.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{a.subtitle || a.content}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-semibold">{a.department || (i18n.language === 'hi' ? 'कार्यकारी प्राधिकरण' : 'Executive Authority')}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingAnnouncement(a);
                      setIsFormOpen(true);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{i18n.language === 'hi' ? 'संपादित करें' : 'Edit'}</span>
                  </button>

                  {confirmDeleteId === a.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold"
                      >
                        {i18n.language === 'hi' ? 'पुष्टि करें' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded-md bg-slate-200 dark:bg-[#374151] text-slate-700 dark:text-slate-200 text-[11px] font-semibold"
                      >
                        {i18n.language === 'hi' ? 'रद्द करें' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(a.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs font-bold flex items-center gap-1"
                      title={i18n.language === 'hi' ? 'हटाएं' : 'Delete notice'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rich Form Modal */}
      {isFormOpen && (
        <AnnouncementFormModal
          initialData={editingAnnouncement}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAnnouncement(null);
          }}
          onSave={async (data) => {
            if (editingAnnouncement) {
              await api.updateAnnouncement(editingAnnouncement.id, data);
            } else {
              await api.createAnnouncement(data);
            }
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
