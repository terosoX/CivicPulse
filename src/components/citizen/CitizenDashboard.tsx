import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CitizenOverview from './CitizenOverview';
import ReportIssueForm from './ReportIssueForm';
import ComplaintHistory from './ComplaintHistory';
import InteractiveCityMap from './InteractiveCityMap';
import CommunityFeed from './CommunityFeed';
import ComplaintTimeline from './ComplaintTimeline';
import Footer from '../common/Footer';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MapPin,
  Flame,
  Building2,
  Phone
} from 'lucide-react';
import { User, Complaint } from '../../types';
import { formatNumber } from '../../utils/i18n';

interface CitizenDashboardProps {
  user: User | null;
  complaints: Complaint[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefreshData: () => void;
  onUpvote: (id: string) => void;
}

export default function CitizenDashboard({
  user,
  complaints,
  activeTab,
  onTabChange,
  onRefreshData,
  onUpvote,
}: CitizenDashboardProps) {
  const { t, i18n } = useTranslation();
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1120] text-[#111827] dark:text-[#F9FAFB] flex flex-col justify-between transition-colors">
      <div>
        {/* Navigation Tabs Bar (sticky on md+ only so small mobile never suffers double sticky crowding) */}
        <div className="bg-white dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#374151] md:sticky md:top-16 z-30">
          <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
            <button
              onClick={() => onTabChange('overview')}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span>{t('nav.dashboard')}</span>
            </button>

            <button
              onClick={() => onTabChange('report')}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'report'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{t('nav.reportIssue')}</span>
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>{t('nav.complaintTracking')} ({formatNumber(complaints.length)})</span>
            </button>

            <button
              onClick={() => onTabChange('map')}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'map'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{t('nav.interactiveMap')}</span>
            </button>

            <button
              onClick={() => onTabChange('feed')}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'feed'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>{t('nav.communityFeed')}</span>
            </button>

            <button
              onClick={() => onTabChange('ward')}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'ward'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>{i18n.language === 'hi' ? 'वार्ड प्रतिनिधि' : 'Ward Representatives'}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <main className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
          {activeTab === 'overview' && (
            <CitizenOverview
              user={user}
              complaints={complaints}
              onNewReport={() => onTabChange('report')}
              onViewTicket={(c) => setActiveComplaint(c)}
            />
          )}

          {activeTab === 'report' && (
            <ReportIssueForm
              user={user}
              onSubmitSuccess={() => {
                onRefreshData();
                onTabChange('history');
              }}
              onCancel={() => onTabChange('overview')}
            />
          )}

          {activeTab === 'history' && (
            <ComplaintHistory
              complaints={complaints}
              onViewComplaint={(c) => setActiveComplaint(c)}
              onUpvote={onUpvote}
            />
          )}

          {activeTab === 'map' && (
            <InteractiveCityMap
              complaints={complaints}
              onSelectComplaint={(c) => setActiveComplaint(c)}
            />
          )}

          {activeTab === 'feed' && (
            <CommunityFeed
              complaints={complaints}
              onUpvote={onUpvote}
              onViewComplaint={(c) => setActiveComplaint(c)}
            />
          )}

          {activeTab === 'ward' && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#374151] p-4 sm:p-6 md:p-8 text-left space-y-5 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
                <span>{i18n.language === 'hi' ? 'नगर निगम वार्ड प्रतिनिधि निर्देशिका' : 'Municipal Ward Representatives Directory'}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#2563EB] dark:text-[#60A5FA]">{i18n.language === 'hi' ? 'वार्ड 4 प्रतिनिधि' : 'Ward 4 Representative'}</span>
                  <h3 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">{i18n.language === 'hi' ? 'राजेश वी. शर्मा' : 'Hon. Rajesh V. Sharma'}</h3>
                  <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">{i18n.language === 'hi' ? 'सेंट्रल प्रोमेनेड नगर निगम कार्यालय' : 'Central Promenade Municipal Office'}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[#2563EB] dark:text-[#60A5FA] font-bold pt-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+1 555-0199</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#2563EB] dark:text-[#60A5FA]">{i18n.language === 'hi' ? 'वार्ड 2 प्रतिनिधि' : 'Ward 2 Representative'}</span>
                  <h3 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">{i18n.language === 'hi' ? 'अंजली रॉय' : 'Hon. Anjali Roy'}</h3>
                  <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">{i18n.language === 'hi' ? 'सिविक टेक हब म्यूनिसिपल डेस्क' : 'Civic Tech Hub Municipal Desk'}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[#2563EB] dark:text-[#60A5FA] font-bold pt-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+1 555-0188</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#2563EB] dark:text-[#60A5FA]">{i18n.language === 'hi' ? 'वार्ड 6 प्रतिनिधि' : 'Ward 6 Representative'}</span>
                  <h3 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">{i18n.language === 'hi' ? 'विक्रम पटेल' : 'Hon. Vikram Patel'}</h3>
                  <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">{i18n.language === 'hi' ? 'साउदर्न इंडस्ट्रियल पार्क डेस्क' : 'Southern Industrial Park Desk'}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[#2563EB] dark:text-[#60A5FA] font-bold pt-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+1 555-0177</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal for complaint tracking timeline */}
      {activeComplaint && (
        <ComplaintTimeline
          complaint={activeComplaint}
          onClose={() => setActiveComplaint(null)}
          onFeedbackSubmitted={() => {
            onRefreshData();
            setActiveComplaint(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
