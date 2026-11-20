import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, MapPin, ArrowRight, Eye, Star } from 'lucide-react';
import { Complaint } from '../../types';
import { formatDate, translateStatus, translateCategory } from '../../utils/i18n';

interface RecentResolvedProps {
  complaints: Complaint[];
  onViewComplaint: (c: Complaint) => void;
}

export default function RecentResolvedSection({ complaints, onViewComplaint }: RecentResolvedProps) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<'resolved' | 'all'>('resolved');

  const resolvedList = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed');
  const displayList = filter === 'resolved' ? resolvedList : complaints;

  return (
    <section className="py-12 sm:py-16 bg-white dark:bg-[#0B1120] border-b border-[#E5E7EB] dark:border-[#374151] transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Public Service Transparency</span>
            </div>
            <h2 className="fluid-section-title font-bold text-slate-900 dark:text-white">
              {filter === 'resolved' ? t('landing.recentResolved') : 'Recent Civic Reports'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Authentic civic complaints recorded and processed by municipal maintenance teams.
            </p>
          </div>

          {/* Clean Segmented Filter */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium self-start sm:self-auto max-w-full overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter('resolved')}
              className={`min-h-[36px] px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === 'resolved'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Verified Resolutions ({resolvedList.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`min-h-[36px] px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Reports ({complaints.length})
            </button>
          </div>
        </div>

        {/* Content Rows / Cards */}
        {displayList.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No complaint records found in this view.
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit an issue using the Report button to initiate municipal action.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayList.slice(0, 6).map((c) => {
              const isResolved = c.status === 'Resolved' || c.status === 'Closed';
              return (
                <div
                  key={c.id}
                  onClick={() => onViewComplaint(c)}
                  className="rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-xs cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Verification photo comparison (if resolved) or single before photo */}
                    {isResolved && (c.beforeImage || c.afterImage) ? (
                      <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-[#374151] h-40">
                        <div className="relative bg-slate-100 dark:bg-[#1F2937] overflow-hidden">
                          <img
                            src={c.beforeImage || c.images[0]}
                            alt="Before repair"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
                            }}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900/80 text-white">
                            Before
                          </span>
                        </div>
                        <div className="relative bg-slate-100 dark:bg-[#1F2937] overflow-hidden">
                          <img
                            src={c.afterImage || c.beforeImage || c.images[0]}
                            alt="After repair"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
                            }}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-800 text-white">
                            Resolved
                          </span>
                        </div>
                      </div>
                    ) : c.images && c.images[0] ? (
                      <div className="h-40 bg-slate-100 dark:bg-[#1F2937] overflow-hidden relative">
                        <img
                          src={c.images[0]}
                          alt={c.title}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
                          }}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900/80 text-white">
                          Lodged Photo
                        </span>
                      </div>
                    ) : null}

                    {/* Metadata Header */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500 font-semibold text-[11px]">
                          {c.ticketNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            isResolved
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                              : c.status === 'Assigned' || c.status === 'Work Started'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                          }`}
                        >
                          {translateStatus(c.status)}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {c.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.location.address || c.location.ward}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-[#F9FAFB] dark:bg-[#1F2937] border-t border-[#E5E7EB] dark:border-[#374151] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      {formatDate(c.updatedAt || c.createdAt)}
                    </span>
                    <span className="font-medium text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 hover:underline shrink-0">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
