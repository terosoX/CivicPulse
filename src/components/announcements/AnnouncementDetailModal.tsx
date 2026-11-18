import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Building2,
  User,
  Share2,
  Bookmark,
  Printer,
  Download,
  Check,
  AlertTriangle,
  Megaphone,
  ShieldAlert,
  FileText,
  ExternalLink,
  Tag,
  Eye,
  Layers
} from 'lucide-react';
import { Announcement } from '../../types';

interface AnnouncementDetailModalProps {
  announcement: Announcement;
  allAnnouncements?: Announcement[];
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onClose: () => void;
  onSelectAnnouncement?: (announcement: Announcement) => void;
}

export default function AnnouncementDetailModal({
  announcement,
  allAnnouncements = [],
  isBookmarked,
  onToggleBookmark,
  onClose,
  onSelectAnnouncement,
}: AnnouncementDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Critical':
      case 'Emergency':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      case 'High':
      case 'Urgent':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}?announcement=${announcement.id}`;
    if (navigator.share) {
      navigator.share({
        title: announcement.title,
        text: announcement.subtitle || announcement.content.slice(0, 100),
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadAttachment = (name: string) => {
    const blob = new Blob([`Official Municipal Document: ${name}\nPublished by: ${announcement.department || 'Smart City Municipal Corporation'}\nTitle: ${announcement.title}\nDate: ${announcement.publishedAt}`], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
  };

  const related = allAnnouncements.filter(
    (a) => a.id !== announcement.id && (a.category === announcement.category || a.department === announcement.department)
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto text-left relative max-h-[92vh] flex flex-col">
        
        {/* Sticky Header Control Bar */}
        <div className="p-4 sm:px-6 border-b border-[#E5E7EB] dark:border-[#374151] flex items-center justify-between bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Megaphone className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Official Municipal Notice
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Ref ID: #{announcement.id.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(announcement.id)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isBookmarked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isBookmarked ? 'Bookmarked' : 'Save Bookmark'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
              <span className="hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Link Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold hidden sm:flex items-center gap-1.5 transition-colors"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Banner Image with Overlay Badges */}
          {announcement.bannerImage && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video sm:aspect-[21/9] bg-slate-900 shadow-md">
              <img
                src={announcement.bannerImage}
                alt={announcement.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop';
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${getPriorityBadgeClass(announcement.priority)}`}>
                    {announcement.priority} Priority
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-white/20 backdrop-blur-md shadow-sm">
                    {announcement.category}
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-slate-200 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>{announcement.views || 1} Views</span>
                </div>
              </div>
            </div>
          )}

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {announcement.title}
            </h1>
            {announcement.subtitle && (
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {announcement.subtitle}
              </p>
            )}
          </div>

          {/* Metadata Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Department</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {announcement.department || 'Executive Admin'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Published Date</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {new Date(announcement.publishedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Duration / Status</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {announcement.duration || announcement.status || 'Active Notice'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>Location</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {announcement.location || (announcement.targetWards?.[0] || 'Citywide')}
              </div>
            </div>
          </div>

          {/* Author Details Banner */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
              {(announcement.author || 'A').charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Issued by: {announcement.author || 'Municipal Administration Authority'}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                {announcement.authorRole || 'Authorized Government Authority'}
              </div>
            </div>
          </div>

          {/* Main Content Render */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-3 whitespace-pre-wrap font-normal">
            {announcement.content}
          </div>

          {/* Target Wards Badges */}
          {announcement.targetWards && announcement.targetWards.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                Impacted Wards & Territories:
              </span>
              <div className="flex flex-wrap gap-2">
                {announcement.targetWards.map((w, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    📍 {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Official Attachments Section */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Official Gazette Attachments ({announcement.attachments.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400">PDF / DOCX Certified</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {announcement.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:border-blue-400 transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {att.type.toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {att.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Size: {att.size}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadAttachment(att.name)}
                      className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-xs"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Announcements */}
          {related.length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Related Municipal Directives
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {related.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectAnnouncement && onSelectAnnouncement(rel)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 cursor-pointer transition-all space-y-1.5"
                  >
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      {rel.category}
                    </span>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                      {rel.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {rel.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 border-t border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            <span>Verified Smart City Municipal Gazette Communications</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md hover:opacity-90 transition-opacity"
            >
              Close Gazette
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
