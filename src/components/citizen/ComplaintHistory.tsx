import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, ThumbsUp, ArrowRight, Eye, Calendar, Clock } from 'lucide-react';
import { Complaint } from '../../types';
import { formatDate, formatNumber, translateCategory, translatePriority, translateStatus } from '../../utils/i18n';

interface ComplaintHistoryProps {
  complaints: Complaint[];
  onViewComplaint: (c: Complaint) => void;
  onUpvote: (id: string) => void;
}

export default function ComplaintHistory({ complaints, onViewComplaint, onUpvote }: ComplaintHistoryProps) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [wardFilter, setWardFilter] = useState<string>('All');

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    if (wardFilter !== 'All' && c.location.ward !== wardFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.ticketNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Search & Filter Header Bar */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={i18n.language === 'hi' ? 'टिकट #, शीर्षक या पते द्वारा खोजें...' : 'Search by Ticket #, Title, Keyword or Address...'}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-[#111827] dark:text-[#F9FAFB] text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 md:flex md:flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto min-h-[38px] px-2.5 py-2 rounded-lg text-xs font-medium bg-white dark:bg-[#1F2937] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#374151] focus:outline-none cursor-pointer"
            >
              <option value="All">{i18n.language === 'hi' ? 'सभी स्थितियाँ' : 'All Statuses'}</option>
              <option value="Submitted">{translateStatus('Submitted')}</option>
              <option value="Verified">{translateStatus('Verified')}</option>
              <option value="Assigned">{translateStatus('Assigned')}</option>
              <option value="Work Started">{translateStatus('Work Started')}</option>
              <option value="In Inspection">{translateStatus('In Inspection')}</option>
              <option value="Resolved">{translateStatus('Resolved')}</option>
              <option value="Closed">{translateStatus('Closed')}</option>
              <option value="Rejected">{translateStatus('Rejected')}</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-auto md:max-w-[160px] min-h-[38px] px-2.5 py-2 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="All">{i18n.language === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}</option>
              <option value="Potholes & Road Damage">{translateCategory('Potholes & Road Damage')}</option>
              <option value="Garbage & Solid Waste">{translateCategory('Garbage & Solid Waste')}</option>
              <option value="Water Leakage & Supply">{translateCategory('Water Leakage & Supply')}</option>
              <option value="Streetlighting & Electrical">{translateCategory('Streetlighting & Electrical')}</option>
              <option value="Drainage & Sewage Overflow">{translateCategory('Drainage & Sewage Overflow')}</option>
              <option value="Fallen Tree & Horticulture">{translateCategory('Fallen Tree & Horticulture')}</option>
              <option value="Illegal Dumping & Encroachment">{translateCategory('Illegal Dumping & Encroachment')}</option>
              <option value="Parks & Public Amenities">{translateCategory('Parks & Public Amenities')}</option>
              <option value="Public Health & Sanitation">{translateCategory('Public Health & Sanitation')}</option>
              <option value="Traffic & Signage Issues">{translateCategory('Traffic & Signage Issues')}</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full md:w-auto md:max-w-[140px] min-h-[38px] px-2.5 py-2 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="All">{i18n.language === 'hi' ? 'सभी प्राथमिकताएं' : 'All Priorities'}</option>
              <option value="Critical">{translatePriority('Critical')}</option>
              <option value="High">{translatePriority('High')}</option>
              <option value="Medium">{translatePriority('Medium')}</option>
              <option value="Low">{translatePriority('Low')}</option>
            </select>

            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="w-full md:w-auto md:max-w-[160px] min-h-[38px] px-2.5 py-2 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="All">{i18n.language === 'hi' ? 'सभी वार्ड' : 'All Wards'}</option>
              <option value="Ward 1 - Metro North">Ward 1 - Metro North</option>
              <option value="Ward 2 - Civic Tech Hub">Ward 2 - Civic Tech Hub</option>
              <option value="Ward 3 - Heritage Square">Ward 3 - Heritage Square</option>
              <option value="Ward 4 - Central Promenade">Ward 4 - Central Promenade</option>
              <option value="Ward 5 - Waterfront East">Ward 5 - Waterfront East</option>
              <option value="Ward 6 - Southern Industrial Park">Ward 6 - Southern Industrial Park</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
          <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
            {i18n.language === 'hi' ? 'कोई शिकायत नहीं मिली' : 'No complaints match the selected filters'}
          </p>
          <p className="text-slate-500 mt-1">
            Try adjusting your search query, status, or ward filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const isResolved = c.status === 'Resolved' || c.status === 'Closed';
            return (
              <div
                key={c.id}
                className="bg-white dark:bg-[#111827] rounded-xl border border-[#E5E7EB] dark:border-[#374151] overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-[#1F2937]">
                    <img
                      src={c.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop'}
                      alt={c.title}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop';
                      }}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold bg-slate-900/90 text-white px-2 py-0.5 rounded shadow-xs">
                        {c.ticketNumber}
                      </span>
                      {c.priority === 'Critical' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white">
                          Critical
                        </span>
                      )}
                    </div>

                    <span
                      className={`absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isResolved
                          ? 'bg-emerald-700 text-white'
                          : c.status === 'Assigned' || c.status === 'Work Started'
                          ? 'bg-blue-700 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {translateStatus(c.status)}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{translateCategory(c.category)}</span>
                      <span>{formatDate(c.createdAt)}</span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {c.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.location.address || c.location.ward}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#F9FAFB] dark:bg-[#1F2937] border-t border-[#E5E7EB] dark:border-[#374151] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => onUpvote(c.id)}
                    className="min-h-[36px] px-2 flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 font-medium cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{formatNumber(c.upvotes)} upvotes</span>
                  </button>

                  <button
                    onClick={() => onViewComplaint(c)}
                    className="min-h-[36px] px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Track</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
