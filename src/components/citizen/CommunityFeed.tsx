import React from 'react';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, Flame, TrendingUp, CheckCircle2, MapPin, ArrowRight } from 'lucide-react';
import { Complaint } from '../../types';
import { formatNumber, translateStatus } from '../../utils/i18n';

interface CommunityFeedProps {
  complaints: Complaint[];
  onUpvote: (id: string) => void;
  onViewComplaint: (c: Complaint) => void;
}

export default function CommunityFeed({ complaints, onUpvote, onViewComplaint }: CommunityFeedProps) {
  const { t, i18n } = useTranslation();
  // Hot Trending issues sorted by upvotes
  const trending = [...complaints].sort((a, b) => b.upvotes - a.upvotes);
  // Recently Resolved
  const recentResolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed');

  // Compute top active wards dynamically from live complaints
  const wardCountMap = complaints.reduce<Record<string, number>>((acc, c) => {
    const w = c.location?.ward || 'Unassigned Ward';
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});
  const topWards = Object.entries(wardCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      {/* Left Main Feed (Trending & Active Issues) */}
      <div className="lg:col-span-8 space-y-4 min-w-0">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">
              {i18n.language === 'hi' ? 'चर्चित नागरिक मुद्दे' : 'Trending Public Issues'}
            </h3>
          </div>
          <span className="text-xs text-[#667085] dark:text-[#9CA3AF] font-semibold">
            {i18n.language === 'hi' ? 'नागरिकों द्वारा समर्थित' : 'Upvoted by Citizens'}
          </span>
        </div>

        <div className="space-y-4">
          {trending.map((c) => (
            <div
              key={c.id}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs hover:border-blue-500/50 transition-all flex flex-col sm:flex-row gap-4 sm:gap-5"
            >
              <img
                src={c.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800'}
                alt={c.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
                }}
                className="w-full sm:w-36 h-40 sm:h-32 rounded-2xl object-cover shrink-0 bg-slate-100 dark:bg-[#1F2937]"
              />

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
                      {c.ticketNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Resolved' || c.status === 'Closed' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    }`}>
                      {translateStatus(c.status)}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] mt-1">
                    {c.title}
                  </h4>

                  <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1 line-clamp-2">
                    {c.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{c.location.ward}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#374151] flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => onUpvote(c.id)}
                    className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatNumber(c.upvotes)} {i18n.language === 'hi' ? 'समर्थन' : 'Upvotes'}</span>
                  </button>

                  <button
                    onClick={() => onViewComplaint(c)}
                    className="min-h-[36px] px-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-[#60A5FA] flex items-center gap-1 cursor-pointer"
                  >
                    <span>{i18n.language === 'hi' ? 'विवरण देखें' : 'View Audit Trail'}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar (Hotspots & Resolved Highlights) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Most Active Wards */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-[#374151]">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-xs text-[#111827] dark:text-[#F9FAFB] uppercase tracking-wider">
              {i18n.language === 'hi' ? 'सर्वाधिक सक्रिय वार्ड' : 'Most Active Municipal Wards'}
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            {topWards.length > 0 ? (
              topWards.map(([wardName, count]) => (
                <div key={wardName} className="flex justify-between items-center p-2.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB]/60 dark:border-[#374151]">
                  <span className="font-semibold text-[#111827] dark:text-[#F9FAFB] truncate pr-2">{wardName}</span>
                  <span className="font-mono font-bold text-[#2563EB] dark:text-[#60A5FA] shrink-0">
                    {formatNumber(count)} {i18n.language === 'hi' ? 'टिकट' : count === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#667085] dark:text-[#9CA3AF]">
                {i18n.language === 'hi' ? 'कोई सक्रिय वार्ड डेटा उपलब्ध नहीं।' : 'No active ward activity recorded yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Recently Resolved Spotlight */}
        <div className="p-5 rounded-3xl bg-emerald-950 text-white border border-emerald-900 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300">
              {i18n.language === 'hi' ? 'हाल ही में हल हुए मुद्दे' : 'Recently Resolved Spotlight'}
            </h4>
          </div>

          {recentResolved.length > 0 ? (
            <div className="space-y-2">
              <h5 className="font-bold text-sm text-white">{recentResolved[0].title}</h5>
              <p className="text-xs text-emerald-200/80 line-clamp-2">
                "{recentResolved[0].description}"
              </p>
              <div className="pt-2 text-[10px] text-emerald-400 font-mono">
                {i18n.language === 'hi' ? `${recentResolved[0].location.ward} में निवारित` : `Resolved in ${recentResolved[0].location.ward}`}
              </div>
            </div>
          ) : (
            <div className="text-xs text-emerald-300">{i18n.language === 'hi' ? 'कोई हालिया निवारित समस्या नहीं।' : 'No recently resolved issues.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
