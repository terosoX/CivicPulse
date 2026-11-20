import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle, FileText, Clock, AlertTriangle, CheckCircle2, ArrowRight, MapPin } from 'lucide-react';
import { User, Complaint } from '../../types';
import { formatDate, formatNumber, translateStatus } from '../../utils/i18n';

interface CitizenOverviewProps {
  user: User | null;
  complaints: Complaint[];
  onNewReport: () => void;
  onViewTicket: (c: Complaint) => void;
}

export default function CitizenOverview({ user, complaints, onNewReport, onViewTicket }: CitizenOverviewProps) {
  const { t, i18n } = useTranslation();

  const userComplaints = complaints.filter(
    c => user && c.citizenId === user.id
  );

  const pending = userComplaints.filter(c => c.status === 'Submitted' || c.status === 'Verified').length;
  const inProgress = userComplaints.filter(c => c.status === 'Assigned' || c.status === 'Work Started' || c.status === 'In Inspection').length;
  const resolved = userComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Welcome & Overview Header */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 shadow-xs">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
            <span>Citizen Portal</span>
            <span>·</span>
            <span className="truncate">{user?.ward || 'Ward 4 - Central Promenade'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight break-words">
            {t('citizen.welcome')}, {user ? user.name : (i18n.language === 'hi' ? 'नागरिक' : 'Citizen')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {i18n.language === 'hi'
              ? 'अपनी दर्ज शिकायतों को ट्रैक करें, मरम्मत प्रगति देखें और नगर निगम कार्यों पर अपनी प्रतिक्रिया दें।'
              : 'Monitor submitted infrastructure tickets, review municipal repair progress, and provide verified resolution feedback.'}
          </p>
        </div>

        <button
          onClick={onNewReport}
          className="w-full md:w-auto min-h-[42px] px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-medium text-xs shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>{t('nav.reportIssue')}</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 gap-1.5">
            <span className="truncate">{t('landing.totalComplaints')}</span>
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatNumber(userComplaints.length)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">Submitted by your account</div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 gap-1.5">
            <span className="truncate">{translateStatus('Pending')}</span>
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {formatNumber(pending)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">Awaiting municipal triage</div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 gap-1.5">
            <span className="truncate">{translateStatus('In Progress')}</span>
            <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {formatNumber(inProgress)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">Field crew dispatched</div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 gap-1.5">
            <span className="truncate">{t('landing.resolved')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatNumber(resolved)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">Work completed & verified</div>
        </div>
      </div>

      {/* Recent My Complaints Table / List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              {i18n.language === 'hi' ? 'आपकी हालिया शिकायतें' : 'Your Logged Complaints'}
            </h2>
            <p className="text-xs text-slate-500">
              {userComplaints.length} tickets lodged in municipal records
            </p>
          </div>
        </div>

        {userComplaints.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No complaint tickets lodged yet
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              If you observe a pothole, broken streetlight, or garbage issue, use the Report button to lodge a ticket.
            </p>
            <button
              onClick={onNewReport}
              className="mt-4 min-h-[40px] px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report First Issue</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {userComplaints.slice(0, 5).map((c) => {
              const isResolved = c.status === 'Resolved' || c.status === 'Closed';
              return (
                <div
                  key={c.id}
                  onClick={() => onViewTicket(c)}
                  className="p-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {c.ticketNumber}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs text-slate-500 truncate">{c.category}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {c.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{c.location.address || c.location.ward}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        isResolved
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                          : c.status === 'Assigned' || c.status === 'Work Started'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200'
                      }`}
                    >
                      {translateStatus(c.status)}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 hidden md:inline">
                        {formatDate(c.createdAt)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
