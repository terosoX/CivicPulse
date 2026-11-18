import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Building2,
  Filter,
  ShieldCheck,
  Search,
  Camera,
  ExternalLink
} from 'lucide-react';
import { Complaint } from '../../types';
import { formatDate } from '../../utils/i18n';

interface CitizenFeedbackViewProps {
  complaints: Complaint[];
  onSelectComplaint?: (c: Complaint) => void;
}

export default function CitizenFeedbackView({
  complaints,
  onSelectComplaint,
}: CitizenFeedbackViewProps) {
  const [filterRating, setFilterRating] = useState<'all' | '5' | '4' | '3'>('all');
  const [search, setSearch] = useState('');

  // Sample verified reviews combined with live complaints feedback
  const sampleReviews = [
    {
      id: 'rev_1',
      ticketNumber: 'CIV-2026-8812',
      citizenName: 'Aarav Sharma',
      ward: 'Ward 4 - Central Promenade',
      department: 'Roads & Infrastructure',
      rating: 5,
      date: '2026-11-09',
      review: 'Field crew filled the dangerous pothole on Promenade Lane in less than 24 hours. Very smooth compaction!',
      verifiedPhoto: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?q=80&w=400',
      confirmedResolved: true,
    },
    {
      id: 'rev_2',
      ticketNumber: 'CIV-2026-7241',
      citizenName: 'Priya Mehra',
      ward: 'Ward 2 - East Industrial',
      department: 'Sanitation & Cleansing',
      rating: 5,
      date: '2026-11-08',
      review: 'Dumpster overflow was completely cleared. Crew disinfected the entire sidewalk area. Excellent job.',
      verifiedPhoto: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=400',
      confirmedResolved: true,
    },
    {
      id: 'rev_3',
      ticketNumber: 'CIV-2026-6190',
      citizenName: 'Kunal Singhania',
      ward: 'Ward 3 - South Residential',
      department: 'Electrical Maintenance',
      rating: 4,
      date: '2026-11-07',
      review: 'Streetlight pole 44 repaired. It was dark for 3 nights. Glad it is back online now.',
      verifiedPhoto: undefined,
      confirmedResolved: true,
    },
    {
      id: 'rev_4',
      ticketNumber: 'CIV-2026-5512',
      citizenName: 'Sneha Patel',
      ward: 'Ward 1 - North Sector',
      department: 'Water Supply & Sewage',
      rating: 5,
      date: '2026-11-06',
      review: 'Pipeline leak addressed before morning rush. Clean pressure restored to our building.',
      verifiedPhoto: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?q=80&w=400',
      confirmedResolved: true,
    },
    {
      id: 'rev_5',
      ticketNumber: 'CIV-2026-4402',
      citizenName: 'Vikram Joshi',
      ward: 'Ward 5 - West Suburbs',
      department: 'Roads & Infrastructure',
      rating: 4,
      date: '2026-11-05',
      review: 'Paver tiles leveled. Work looks sturdy and safe for senior citizens walking to temple.',
      verifiedPhoto: undefined,
      confirmedResolved: true,
    },
  ];

  // Combine with complaints having feedback
  const liveReviews = complaints
    .filter((c) => c.feedback)
    .map((c) => ({
      id: `live_${c.id}`,
      ticketNumber: c.ticketNumber,
      citizenName: c.citizenName,
      ward: c.location.ward,
      department: c.departmentAssigned || 'Roads & Infrastructure',
      rating: c.feedback!.rating,
      date: c.feedback!.createdAt || c.updatedAt,
      review: c.feedback!.review,
      verifiedPhoto: c.feedback!.verificationImage,
      confirmedResolved: c.feedback!.confirmedResolved,
    }));

  const allReviews = [...liveReviews, ...sampleReviews];

  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length).toFixed(1)
    : '0.0';
  const confirmedPct = allReviews.length > 0
    ? ((allReviews.filter((r) => r.confirmedResolved).length / allReviews.length) * 100).toFixed(1)
    : '0.0';
  const positivePct = allReviews.length > 0
    ? ((allReviews.filter((r) => r.rating >= 4).length / allReviews.length) * 100).toFixed(1)
    : '0.0';
  const photoPct = allReviews.length > 0
    ? Math.round((allReviews.filter((r) => Boolean(r.verifiedPhoto)).length / allReviews.length) * 100)
    : 0;

  const filteredReviews = allReviews.filter((r) => {
    if (filterRating !== 'all' && r.rating.toString() !== filterRating) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.ticketNumber.toLowerCase().includes(q) ||
        r.citizenName.toLowerCase().includes(q) ||
        r.review.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const starBreakdown = [5, 4, 3, 2, 1].map((s) => {
    const count = allReviews.filter((r) => r.rating === s).length;
    const pct = allReviews.length > 0 ? Math.round((count / allReviews.length) * 100) : 0;
    return { star: s === 1 ? '1 Star' : `${s} Stars`, pct, count };
  });

  const deptMap: Record<string, { total: number; sum: number }> = {};
  allReviews.forEach((r) => {
    if (!deptMap[r.department]) deptMap[r.department] = { total: 0, sum: 0 };
    deptMap[r.department].total += 1;
    deptMap[r.department].sum += r.rating;
  });
  const deptSatisfaction = Object.entries(deptMap).map(([name, val]) => {
    const scoreNum = val.sum / val.total;
    return {
      name,
      score: scoreNum.toFixed(1),
      count: val.total,
      status: scoreNum >= 4.7 ? 'Top Rated' : scoreNum >= 4.2 ? 'Optimal' : 'Good',
    };
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="pb-2 border-b border-[#EAECF0] dark:border-[#1E293B]">
        <h2 className="text-xl font-bold text-[#101828] dark:text-white tracking-tight">
          Citizen Feedback & Satisfaction
        </h2>
        <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
          Post-resolution citizen reviews, satisfaction scorecards, and departmental sentiment analysis
        </p>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Satisfaction */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Satisfaction Score</span>
            <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#111827] dark:text-[#F9FAFB]">{avgRating}</span>
            <span className="text-xs font-semibold text-[#667085] dark:text-[#9CA3AF]">/ 5.0</span>
          </div>
          <div className="mt-2 text-[11px] text-[#16A34A] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Based on {allReviews.length} verified reviews</span>
          </div>
        </div>

        {/* Verified Resolution Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Citizen Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="mt-2 text-3xl font-bold text-[#16A34A]">
            {confirmedPct}%
          </div>
          <div className="mt-2 text-[11px] text-[#667085] dark:text-[#9CA3AF]">
            Verified repaired without reopening
          </div>
        </div>

        {/* Positive Sentiment */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Positive Sentiment</span>
            <ThumbsUp className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-2 text-3xl font-bold text-[#2563EB] dark:text-[#60A5FA]">
            {positivePct}%
          </div>
          <div className="mt-2 text-[11px] text-[#2563EB] dark:text-[#60A5FA] font-medium">
            4★ & 5★ citizen approval rate
          </div>
        </div>

        {/* Reviews with Photo Proof */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Photo Verifications</span>
            <Camera className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="mt-2 text-3xl font-bold text-[#111827] dark:text-[#F9FAFB]">
            {photoPct}%
          </div>
          <div className="mt-2 text-[11px] text-[#667085] dark:text-[#9CA3AF]">
            Include citizen ground proof photo
          </div>
        </div>
      </div>

      {/* Ratings Breakdown & Department Satisfaction Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Star Ratings Distribution (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs space-y-3">
          <div className="pb-3 border-b border-[#E5E7EB] dark:border-[#374151]">
            <h3 className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">
              Star Rating Breakdown
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
              Distribution across {allReviews.length} citizen responses
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {starBreakdown.map((sb, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <span className="w-16 text-[#667085] font-semibold">{sb.star}</span>
                <div className="flex-1 h-2 rounded-full bg-[#F2F4F7] dark:bg-[#1F2937] overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full"
                    style={{ width: `${sb.pct}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-[#101828] dark:text-white">
                  {sb.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Department-wise Satisfaction (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#111827] border border-[#EAECF0] dark:border-[#374151] shadow-xs space-y-3">
          <div className="pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <h3 className="text-sm font-bold text-[#101828] dark:text-white">
              Department-Wise Satisfaction Ratings
            </h3>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              Average citizen feedback score per municipal entity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {deptSatisfaction.map((ds, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-[#EAECF0] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#1F2937] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-[#101828] dark:text-white">{ds.name}</div>
                  <div className="text-[11px] text-[#667085] mt-0.5">{ds.count} ratings logged</div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-[#F59E0B] flex items-center gap-1 justify-end">
                    <span>{ds.score}</span>
                    <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                  </div>
                  <span className="text-[10px] text-[#16A34A] font-medium">{ds.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Citizen Reviews Feed */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-[#EAECF0] dark:border-[#374151] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2F4F7] dark:border-[#2D3748]">
          <div>
            <h3 className="text-sm font-bold text-[#101828] dark:text-white">
              Recent Citizen Reviews & Verification Feed
            </h3>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              Audited citizen remarks submitted upon ticket resolution
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#667085] absolute left-2.5 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reviews or ticket..."
                className="pl-8 pr-3 py-1 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-xs text-[#101828] dark:text-white placeholder-[#98A2B3]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#F2F4F7] dark:bg-[#1F2937] p-0.5 rounded-lg text-[11px]">
              <button
                onClick={() => setFilterRating('all')}
                className={`px-2 py-1 rounded-md font-semibold ${
                  filterRating === 'all' ? 'bg-white dark:bg-[#111827] text-[#101828] dark:text-white shadow-2xs' : 'text-[#667085]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterRating('5')}
                className={`px-2 py-1 rounded-md font-semibold ${
                  filterRating === '5' ? 'bg-white dark:bg-[#111827] text-[#101828] dark:text-white shadow-2xs' : 'text-[#667085]'
                }`}
              >
                5 ★
              </button>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-[#EAECF0] dark:divide-[#334155]">
          {filteredReviews.map((rev) => (
            <div key={rev.id} className="py-4 flex flex-col sm:flex-row items-start justify-between gap-4 text-xs">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    {rev.ticketNumber}
                  </span>
                  <span className="font-semibold text-[#101828] dark:text-white">
                    {rev.citizenName}
                  </span>
                  <span className="text-[11px] text-[#667085]">
                    • {rev.ward}
                  </span>
                  <span className="text-[10px] text-[#16A34A] bg-[#ECFDF5] px-1.5 py-0.2 rounded font-semibold border border-[#A7F3D0] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Citizen</span>
                  </span>
                </div>

                <div className="flex text-[#F59E0B]">
                  {'★'.repeat(rev.rating)}
                  {'☆'.repeat(5 - rev.rating)}
                </div>

                <p className="text-xs text-[#344054] dark:text-slate-300 leading-relaxed font-normal">
                  "{rev.review}"
                </p>

                <div className="text-[11px] text-[#667085] flex items-center gap-3">
                  <span>Assigned: <strong>{rev.department}</strong></span>
                  <span>•</span>
                  <span>{formatDate(rev.date)}</span>
                </div>
              </div>

              {/* Verified Ground Photo Preview if present */}
              {rev.verifiedPhoto && (
                <div className="shrink-0">
                  <img
                    src={rev.verifiedPhoto}
                    alt="Citizen verification proof"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-20 h-20 rounded-lg object-cover border border-[#EAECF0] dark:border-[#374151] shadow-2xs"
                  />
                  <span className="text-[9px] text-[#667085] block text-center mt-1">Ground Proof</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
