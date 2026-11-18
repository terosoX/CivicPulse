import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Megaphone,
  Search,
  Filter,
  Bookmark,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Building2,
  AlertTriangle,
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  ArrowUpDown,
  Pin,
  Star,
  Layers,
  ChevronRight,
  RefreshCw,
  Archive,
  Edit,
  Trash2,
  Copy,
  SlidersHorizontal,
  X,
  ExternalLink
} from 'lucide-react';
import { Announcement, User, AnnouncementCategory, AnnouncementPriority } from '../../types';
import { api } from '../../services/api';
import AnnouncementDetailModal from './AnnouncementDetailModal';
import AnnouncementFormModal from './AnnouncementFormModal';

interface AnnouncementsPortalProps {
  user: User | null;
  announcements: Announcement[];
  onRefreshData: () => void;
  onOpenLogin?: (role?: 'citizen' | 'admin') => void;
}

const CATEGORIES: AnnouncementCategory[] = [
  'Road Closure',
  'Traffic Advisory',
  'Water Supply',
  'Electricity Maintenance',
  'Garbage Collection',
  'Drainage',
  'Public Health',
  'Emergency',
  'Weather Alert',
  'Events',
  'Municipal Notice',
  'Construction',
  'Environment',
  'Education',
  'Public Safety',
  'Others',
];

export default function AnnouncementsPortal({
  user,
  announcements = [],
  onRefreshData,
  onOpenLogin,
}: AnnouncementsPortalProps) {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'active' | 'bookmarked' | 'archived'>('active');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_viewed' | 'priority'>('newest');

  // Bookmarks saved in local storage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('civic_bookmarked_announcements');
      return saved ? JSON.parse(saved) : ['ann_1', 'ann_5'];
    } catch {
      return ['ann_1', 'ann_5'];
    }
  });

  // Modal States
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('civic_bookmarked_announcements', JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  const handleToggleBookmark = async (id: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(id);
    let nextIds: string[];
    if (isCurrentlyBookmarked) {
      nextIds = bookmarkedIds.filter((bId) => bId !== id);
    } else {
      nextIds = [...bookmarkedIds, id];
    }
    setBookmarkedIds(nextIds);

    try {
      await api.bookmarkAnnouncement(id, !isCurrentlyBookmarked);
      onRefreshData();
    } catch (e) {}
  };

  const handleShareCard = (a: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}?announcement=${a.id}`;
    if (navigator.share) {
      navigator.share({ title: a.title, text: a.content.slice(0, 100), url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedId(a.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleOpenDetail = (a: Announcement) => {
    setSelectedAnnouncement(a);
    api.viewAnnouncement(a.id).then(() => onRefreshData()).catch(() => {});
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setActionError(null);
    try {
      await api.deleteAnnouncement(id);
      setConfirmDeleteId(null);
      onRefreshData();
    } catch (err: any) {
      setActionError(err?.message || (i18n.language === 'hi' ? 'सूचना हटाने में विफल' : 'Failed to delete announcement'));
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionError(null);
    try {
      await api.archiveAnnouncement(id);
      onRefreshData();
    } catch (err: any) {
      setActionError(err?.message || (i18n.language === 'hi' ? 'सूचना संग्रहित करने में विफल' : 'Failed to archive announcement'));
    }
  };

  const handleDuplicate = async (a: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionError(null);
    try {
      await api.createAnnouncement({
        ...a,
        id: undefined,
        title: `${a.title} (${i18n.language === 'hi' ? 'प्रतिलिपि' : 'Copy'})`,
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      });
      onRefreshData();
    } catch (err: any) {
      setActionError(err?.message || (i18n.language === 'hi' ? 'सूचना की प्रतिलिपि बनाने में विफल' : 'Failed to duplicate announcement'));
    }
  };

  // Critical Emergency Banner Item
  const criticalEmergency = useMemo(() => {
    return announcements.find(
      (a) => (a.priority === 'Critical' || a.priority === 'Emergency') && a.status !== 'Archived'
    );
  }, [announcements]);

  // Featured Announcement Item (Pinned or Featured)
  const featuredAnnouncement = useMemo(() => {
    return (
      announcements.find((a) => a.isFeatured && a.status !== 'Archived') ||
      announcements.find((a) => a.isPinned && a.status !== 'Archived') ||
      announcements[0]
    );
  }, [announcements]);

  // Filtered List Computation
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      // Tab filter
      if (activeTab === 'archived') {
        if (a.status !== 'Archived') return false;
      } else if (activeTab === 'bookmarked') {
        if (!bookmarkedIds.includes(a.id)) return false;
      } else {
        if (a.status === 'Archived') return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchContent = a.content.toLowerCase().includes(q);
        const matchSub = a.subtitle?.toLowerCase().includes(q);
        const matchCat = a.category?.toLowerCase().includes(q);
        const matchDept = a.department?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchSub && !matchCat && !matchDept) return false;
      }

      // Category
      if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;

      // Priority
      if (selectedPriority !== 'All' && a.priority !== selectedPriority) return false;

      // Department
      if (selectedDepartment !== 'All' && a.department !== selectedDepartment) return false;

      return true;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'oldest') {
        return new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime();
      }
      if (sortBy === 'most_viewed') {
        return (b.views || 0) - (a.views || 0);
      }
      if (sortBy === 'priority') {
        const score: Record<string, number> = { Critical: 4, Emergency: 4, High: 3, Urgent: 3, Medium: 2, Low: 1 };
        return (score[b.priority] || 0) - (score[a.priority] || 0);
      }
      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    });
  }, [announcements, activeTab, bookmarkedIds, searchQuery, selectedCategory, selectedPriority, selectedDepartment, sortBy]);

  // Admin Analytics Stats
  const adminStats = useMemo(() => {
    const total = announcements.length;
    const published = announcements.filter((a) => a.status === 'Published' || !a.status).length;
    const scheduled = announcements.filter((a) => a.status === 'Scheduled').length;
    const archived = announcements.filter((a) => a.status === 'Archived').length;
    const totalViews = announcements.reduce((acc, a) => acc + (a.views || 0), 0);
    const totalBookmarks = announcements.reduce((acc, a) => acc + (a.bookmarks || 0), 0);
    return { total, published, scheduled, archived, totalViews, totalBookmarks };
  }, [announcements]);

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

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1120] text-[#111827] dark:text-[#F9FAFB] pb-16 text-left">
      
      {/* 1. CRITICAL EMERGENCY TOP ALERT BANNER (If present) */}
      {criticalEmergency && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-3 shadow-md border-b border-red-500/40">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-xl bg-white/20 text-white animate-pulse shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <span className="font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-[10px] mr-2">
                  Emergency Directive
                </span>
                <span className="font-bold">{criticalEmergency.title}</span>
              </div>
            </div>

            <button
              onClick={() => handleOpenDetail(criticalEmergency)}
              className="px-3.5 py-1.5 rounded-xl bg-white text-red-700 font-extrabold text-[11px] hover:bg-slate-100 transition-colors shrink-0 shadow-xs flex items-center gap-1"
            >
              <span>Read Safety Advisory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. PAGE HERO HEADER */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Smart City Government Digital Services</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Municipal Announcements & Gazettes
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Official public advisories, road closures, water maintenance schedules, emergency alerts, and municipal corporation gazette publications for all city wards.
              </p>
            </div>

            {/* Quick Metrics Badge Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Bulletins</div>
                <div className="text-lg font-black text-white mt-0.5">{announcements.length}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Views</div>
                <div className="text-lg font-black text-blue-400 mt-0.5">{adminStats.totalViews || 5800}+</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md hidden sm:block">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Saved Bookmarks</div>
                <div className="text-lg font-black text-amber-400 mt-0.5">{bookmarkedIds.length}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ADMIN MANAGEMENT COMMAND BAR (Visible to Admin & Super Admin Users) */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <section className="bg-blue-950/80 border-b border-blue-800/60 py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="p-2 rounded-xl bg-blue-600 text-white font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Government Administration Control Center</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                    Live Manager Mode
                  </span>
                </div>
                <div className="text-[11px] text-blue-200">
                  Total: {adminStats.total} | Live: {adminStats.published} | Archived: {adminStats.archived} | Saved: {adminStats.totalBookmarks}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Municipal Notice</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. MAIN CONTAINER CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {actionError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-between gap-3">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* FEATURED HERO ANNOUNCEMENT CARD */}
        {featuredAnnouncement && activeTab === 'active' && !searchQuery && selectedCategory === 'All' && (
          <section className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all group">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {featuredAnnouncement.bannerImage && (
                <div className="lg:col-span-6 relative h-64 lg:h-auto min-h-[260px] bg-slate-900 overflow-hidden">
                  <img
                    src={featuredAnnouncement.bannerImage}
                    alt={featuredAnnouncement.title}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-md flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    Featured Priority Notice
                  </span>
                </div>
              )}

              <div className={`${featuredAnnouncement.bannerImage ? 'lg:col-span-6' : 'lg:col-span-12'} p-6 sm:p-8 flex flex-col justify-between space-y-4`}>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getPriorityBadgeClass(featuredAnnouncement.priority)}`}>
                      {featuredAnnouncement.priority} Priority
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {featuredAnnouncement.category}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold ml-auto flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(featuredAnnouncement.publishedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {featuredAnnouncement.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {featuredAnnouncement.subtitle || featuredAnnouncement.content}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span>{featuredAnnouncement.department || 'Executive Authority'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark(featuredAnnouncement.id);
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                      title="Bookmark"
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarkedIds.includes(featuredAnnouncement.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleOpenDetail(featuredAnnouncement)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                    >
                      <span>Read Gazette Notice</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. SEARCH & FILTER CONTROLS BAR */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          
          {/* Top Row: Search Input + Tabs */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Field */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notices by keyword, title, department, or ward..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Tabs Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'active'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Active Notices ({announcements.filter((a) => a.status !== 'Archived').length})
              </button>
              <button
                onClick={() => setActiveTab('bookmarked')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'bookmarked'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved ({bookmarkedIds.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'archived'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archived</span>
              </button>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Categories:
            </span>
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Bottom Filter Selectors Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              {/* Priority Filter */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="text-slate-400">Priority:</span>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical Only</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="text-slate-400">Department:</span>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                >
                  <option value="All">All Departments</option>
                  <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                  <option value="Solid Waste & Sanitation">Solid Waste & Sanitation</option>
                  <option value="Water Supply & Sewage">Water Supply & Sewage</option>
                  <option value="Electrical & Streetlighting">Electrical & Streetlighting</option>
                  <option value="Drainage & Stormwater">Drainage & Stormwater</option>
                </select>
              </div>
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-2 ml-auto text-xs font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="priority">Priority High-to-Low</option>
              </select>
            </div>
          </div>
        </section>

        {/* 6. ANNOUNCEMENT CARDS GRID */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>Showing {filteredAnnouncements.length} Gazette Bulletins</span>
              {(selectedCategory !== 'All' || selectedPriority !== 'All' || searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedPriority('All');
                    setSelectedDepartment('All');
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </h3>

            <span className="text-xs text-slate-400">
              Updated Live • Smart City Official System
            </span>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                No Municipal Bulletins Found
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active announcements match your search or filter criteria. Try clearing filters or searching for other terms like 'water', 'road', or 'monsoon'.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedPriority('All');
                  setSelectedDepartment('All');
                  setActiveTab('active');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnouncements.map((a) => {
                const isSaved = bookmarkedIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    onClick={() => handleOpenDetail(a)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer group relative"
                  >
                    <div>
                      {/* Banner Image or Top Header Color */}
                      {a.bannerImage ? (
                        <div className="relative h-44 bg-slate-900 overflow-hidden">
                          <img
                            src={a.bannerImage}
                            alt={a.title}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                          
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border backdrop-blur-md shadow-xs ${getPriorityBadgeClass(a.priority)}`}>
                              {a.priority} Priority
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBookmark(a.id);
                              }}
                              className="p-1.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md hover:scale-110 transition-transform"
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                          </div>

                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-semibold text-white">
                            <span className="bg-slate-900/80 px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                              {a.category}
                            </span>
                            <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10 text-[10px]">
                              <Eye className="w-3 h-3 text-blue-400" />
                              {a.views || 1}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 pb-0 flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getPriorityBadgeClass(a.priority)}`}>
                            {a.priority} Priority
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {a.category}
                          </span>
                        </div>
                      )}

                      {/* Card Content Body */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>{new Date(a.publishedAt).toLocaleDateString()}</span>
                          {a.targetWards?.[0] && (
                            <span className="truncate max-w-[140px] ml-auto font-bold text-slate-500 dark:text-slate-400">
                              📍 {a.targetWards[0]}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                          {a.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                          {a.subtitle || a.content}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-5 pt-0 space-y-3">
                      {/* Attachments indicator if present */}
                      {a.attachments && a.attachments.length > 0 && (
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            <span>{a.attachments.length} Gazette Attachment(s)</span>
                          </span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400">Downloadable</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                          {a.department || 'Executive Authority'}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Admin Controls */}
                          {(user?.role === 'admin' || user?.role === 'super_admin') && (
                            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-[#374151] pr-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAnnouncement(a);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1F2937]"
                                title="Edit Notice"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={(e) => handleArchive(a.id, e)}
                                className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1F2937]"
                                title={a.status === 'Archived' ? 'Unarchive' : 'Archive'}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>

                              {confirmDeleteId === a.id ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => handleDelete(a.id, e)}
                                    className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 text-[10px] font-semibold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => handleDelete(a.id, e)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1F2937]"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          <button
                            onClick={(e) => handleShareCard(a, e)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            title="Share Link"
                          >
                            {copiedId === a.id ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                          </button>

                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Read
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* 7. ANNOUNCEMENT DETAIL OVERLAY MODAL */}
      {selectedAnnouncement && (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          allAnnouncements={announcements}
          isBookmarked={bookmarkedIds.includes(selectedAnnouncement.id)}
          onToggleBookmark={handleToggleBookmark}
          onClose={() => setSelectedAnnouncement(null)}
          onSelectAnnouncement={(rel) => handleOpenDetail(rel)}
        />
      )}

      {/* 8. ADMIN ANNOUNCEMENT FORM MODAL */}
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
            onRefreshData();
          }}
        />
      )}

    </div>
  );
}
