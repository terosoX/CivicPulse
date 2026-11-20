import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2
} from 'lucide-react';

interface HeroSectionProps {
  onReportClick: () => void;
  onExploreMapClick: () => void;
  onTrackClick: () => void;
  onTrackTicket?: (ticketId: string) => void;
}

export default function HeroSection({
  onReportClick,
  onExploreMapClick,
  onTrackClick,
  onTrackTicket,
}: HeroSectionProps) {
  const { t, i18n } = useTranslation();
  const [ticketSearch, setTicketSearch] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSearch.trim()) {
      onTrackClick();
      return;
    }
    if (onTrackTicket) {
      onTrackTicket(ticketSearch.trim().toUpperCase());
    } else {
      onTrackClick();
    }
  };

  return (
    <section className="bg-white dark:bg-[#0B1120] border-b border-[#E5E7EB] dark:border-[#374151] transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Direct, authoritative headline & clear action hierarchy */}
          <div className="lg:col-span-7 space-y-5 min-w-0">
            {/* Institutional Kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-700 dark:bg-blue-400 shrink-0" />
              <span className="leading-snug">Smart City Municipal Corporation · Public Grievance Portal</span>
            </div>

            {/* Clear, readable headline without distracting rainbow gradients */}
            <h1 className="fluid-hero-title font-bold text-slate-900 dark:text-white">
              {i18n.language === 'hi' 
                ? 'नागरिक समस्याओं की रिपोर्ट करें। समाधान ट्रैक करें।'
                : 'Report public infrastructure issues. Track resolution in real time.'}
            </h1>

            {/* Concise supporting copy */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {i18n.language === 'hi'
                ? 'सड़क गड्ढे, कचरा ढेर, स्ट्रीटलाइट खराबी और जल आपूर्ति समस्याओं की रिपोर्ट करें। नगर निगम विभाग फोटो प्रमाण के साथ पारदर्शी समाधान प्रदान करते हैं।'
                : 'Directly report damaged roads, garbage overflows, broken streetlights, and water pipeline leaks. Municipal departments dispatch field crews with verified before-and-after photo evidence.'}
            </p>

            {/* Clear Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={onReportClick}
                className="w-full min-[420px]:w-auto justify-center min-h-[42px] px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-medium text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>{t('landing.reportIssueCta')}</span>
              </button>

              <button
                onClick={onTrackClick}
                className="flex-1 min-[420px]:flex-initial justify-center min-h-[42px] px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('landing.trackReportCta')}</span>
              </button>

              <button
                onClick={onExploreMapClick}
                className="min-h-[42px] px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('landing.exploreMapCta')}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>

            {/* Trust and institutional governance points */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-5 gap-y-2.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Verified photo inspection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>48-Hour municipal SLA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                <span>Anonymous lodging supported</span>
              </div>
            </div>
          </div>

          {/* Right Column: Serious Operational Tracking & Search Interface */}
          <div className="lg:col-span-5 min-w-0">
            <div className="bg-[#F9FAFB] dark:bg-[#111827] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-4 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB] dark:border-[#374151]">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white truncate">
                    Grievance Tracking Console
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-500 shrink-0">MUNICIPAL DESK</span>
              </div>

              {/* Instant Ticket Lookup Form */}
              <form onSubmit={handleTrackSubmit} className="space-y-2">
                <label htmlFor="ticketSearchInput" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Search by Complaint Reference Number
                </label>
                <div className="flex flex-col min-[380px]:flex-row gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="ticketSearchInput"
                      type="text"
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      placeholder="e.g. CIV-2026-8812"
                      className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="min-h-[42px] px-4 py-2 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Track
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Enter the 12-character reference code from your SMS or digital submission receipt.
                </p>
              </form>

              {/* Service SLA & Operations Summary */}
              <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#374151] grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151]">
                  <div className="font-semibold text-[#111827] dark:text-[#F9FAFB]">6 Municipal Wards</div>
                  <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">Active field crew coverage</div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151]">
                  <div className="font-semibold text-[#111827] dark:text-[#F9FAFB]">7 Departments</div>
                  <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">Automated triage & routing</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
