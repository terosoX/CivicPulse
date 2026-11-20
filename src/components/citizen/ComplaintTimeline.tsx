import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  QrCode,
  MapPin,
  Calendar,
  Building2,
  Star,
  X
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../../types';
import QRCodeModal from '../common/QRCodeModal';
import CitizenFeedbackModal from './CitizenFeedbackModal';
import BeforeAfterSlider from '../common/BeforeAfterSlider';
import { formatDate, translateCategory, translateStatus } from '../../utils/i18n';
import { exportResolutionCertificatePDF, exportComplaintsToPDF } from '../../utils/pdfExport';

interface ComplaintTimelineProps {
  complaint: Complaint;
  onClose: () => void;
  onFeedbackSubmitted: (updated: Complaint) => void;
}

const TIMELINE_STEPS: { status: ComplaintStatus; labelKey: string; fallbackLabel: string }[] = [
  { status: 'Submitted', labelKey: 'Submitted', fallbackLabel: 'Submitted' },
  { status: 'Verified', labelKey: 'Verified', fallbackLabel: 'Verified' },
  { status: 'Assigned', labelKey: 'Assigned', fallbackLabel: 'Assigned' },
  { status: 'Work Started', labelKey: 'Work Started', fallbackLabel: 'Work Started' },
  { status: 'In Inspection', labelKey: 'In Inspection', fallbackLabel: 'In Inspection' },
  { status: 'Resolved', labelKey: 'Resolved', fallbackLabel: 'Resolved' },
  { status: 'Closed', labelKey: 'Closed', fallbackLabel: 'Closed' },
];

export default function ComplaintTimeline({ complaint, onClose, onFeedbackSubmitted }: ComplaintTimelineProps) {
  const { t, i18n } = useTranslation();
  const [qrOpen, setQrOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const backdropRef = React.useRef<HTMLDivElement>(null);

  // Keyboard trap ESC listener & body scroll lock
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Save previous overflow state
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [onClose]);

  // Calculate current step index
  const getStepIndex = (status: ComplaintStatus) => {
    switch (status) {
      case 'Submitted': return 0;
      case 'Verified': return 1;
      case 'Assigned': return 2;
      case 'Work Started': return 3;
      case 'In Inspection': return 4;
      case 'Resolved': return 5;
      case 'Closed': return 6;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(complaint.status);

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-modal-title"
        className="bg-white dark:bg-[#111827] w-full max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-xl border border-[#E5E7EB] dark:border-[#374151] shadow-2xl overflow-hidden relative text-left transition-all"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 shrink-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-4 sm:px-7 py-3.5 sm:py-4 border-b border-[#E5E7EB] dark:border-[#374151] flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                {complaint.ticketNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {translateStatus(complaint.status)}
              </span>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-block">
                • {translateCategory(complaint.category)}
              </span>
            </div>
            <h2 id="complaint-modal-title" className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white mt-1 line-clamp-2 sm:truncate">
              {complaint.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
            {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
              <button
                onClick={() => exportResolutionCertificatePDF(complaint)}
                className="px-2.5 sm:px-3 py-2 min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Download Official Resolution Certificate PDF"
              >
                <span>📜</span>
                <span className="hidden sm:inline">Certificate PDF</span>
              </button>
            )}

            <button
              onClick={() => exportComplaintsToPDF([complaint], `Grievance Receipt - ${complaint.ticketNumber}`)}
              className="px-2.5 sm:px-3 py-2 min-h-[38px] rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
              title="Download Complaint Receipt PDF"
            >
              <span>📄</span>
              <span className="hidden sm:inline">Receipt</span>
            </button>

            <button
              onClick={() => setQrOpen(true)}
              className="px-2.5 sm:px-3 py-2 min-h-[38px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
              title="View QR Code Ticket"
            >
              <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">{i18n.language === 'hi' ? 'क्यूआर टिकट' : 'QR Ticket'}</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-6">
          {/* Location Bar */}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-medium truncate">{complaint.location.address} ({complaint.location.ward})</span>
          </div>

          {/* Interactive Timeline Progress */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              {i18n.language === 'hi' ? 'शिकायत समाधान समयरेखा' : 'Lifecycle Resolution Timeline'}
            </h3>

            {/* Mobile Vertical Stepper (< md) */}
            <div className="flex flex-col gap-3 md:hidden">
              {TIMELINE_STEPS.map((step, idx) => {
                const isDone = idx <= currentIndex;
                const isCurrent = idx === currentIndex;
                const isLast = idx === TIMELINE_STEPS.length - 1;
                return (
                  <div key={step.status} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 transition-all ${
                          isDone
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                        } ${isCurrent ? 'ring-3 ring-blue-100 dark:ring-blue-950' : ''}`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-4 mt-1 ${idx < currentIndex ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      )}
                    </div>
                    <div className="pt-1 flex items-center justify-between flex-1 min-w-0">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400' : isDone ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {translateStatus(step.status)}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Horizontal Stepper (md+) */}
            <div className="hidden md:block">
              <div className="relative flex items-center justify-between px-4 py-2">
                {/* Background Line */}
                <div className="absolute left-8 right-8 top-6 h-1 bg-slate-200 dark:bg-slate-700 -z-0" />
                <div
                  className="absolute left-8 top-6 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500 -z-0"
                  style={{ width: `${(currentIndex / (TIMELINE_STEPS.length - 1)) * 88}%` }}
                />

                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;

                  return (
                    <div key={step.status} className="relative z-10 flex flex-col items-center text-center flex-1 min-w-0 px-1">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isDone
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                        } ${isCurrent ? 'ring-4 ring-blue-100 dark:ring-blue-950 scale-110' : ''}`}
                      >
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <span className={`text-[11px] font-bold mt-2 truncate max-w-full ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {translateStatus(step.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Officer & Assignment Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {i18n.language === 'hi' ? 'संबंधित नगर निगम विभाग' : 'Assigned Municipal Department'}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{complaint.departmentAssigned || 'Roads & Infrastructure'}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {i18n.language === 'hi' ? 'प्रभारी अधिकारी: ' : 'Officer In-Charge: '}{complaint.officerAssigned || (i18n.language === 'hi' ? 'आवंटन लंबित' : 'Pending Assignment')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {i18n.language === 'hi' ? 'अनुमानित समाधान तिथि' : 'Target Resolution Date'}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>
                  {complaint.estimatedResolutionDate
                    ? formatDate(complaint.estimatedResolutionDate)
                    : (i18n.language === 'hi' ? '24-48 घंटों के भीतर' : 'Within 24-48 Hours')}
                </span>
              </div>
            </div>
          </div>

          {/* Description & AI Triage */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {i18n.language === 'hi' ? 'समस्या का विवरण' : 'Issue Description'}
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {complaint.description}
            </p>
            {complaint.aiAnalysis && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500 font-medium">{i18n.language === 'hi' ? 'नियम-आधारित श्रेणी: ' : 'Rule-Based Triage: '}<strong className="text-blue-600 dark:text-blue-400">{translateCategory(complaint.aiAnalysis.detectedCategory as any)}</strong></span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{i18n.language === 'hi' ? 'प्राथमिकता: ' : 'Priority: '}{complaint.aiAnalysis.suggestedPriority}</span>
              </div>
            )}
          </div>

          {/* Before & After Image Comparison Section */}
          {complaint.afterImage ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <BeforeAfterSlider
                beforeImage={complaint.beforeImage || complaint.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800'}
                afterImage={complaint.afterImage}
                beforeLabel={i18n.language === 'hi' ? 'शिकायत के समय (पहले)' : 'Reported Evidence (Before)'}
                afterLabel={i18n.language === 'hi' ? 'मरम्मत के बाद (बाद में)' : 'Municipal Field Repair (After)'}
                heightClass="h-60 sm:h-80"
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151]">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {i18n.language === 'hi' ? 'सबमिट की गई तस्वीर' : 'Reported Field Evidence Photo'}
              </div>
              <img
                src={complaint.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800'}
                alt={complaint.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
                }}
                className="w-full max-h-[280px] sm:max-h-[380px] object-cover rounded-xl border border-[#E5E7EB] dark:border-[#374151] shadow-xs"
              />
            </div>
          )}

          {/* Detailed Audit History Log */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {i18n.language === 'hi' ? 'ऑडिट गतिविधि एवं शासकीय टिप्पणियाँ' : 'Audit Activity & Official Notes'}
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              {complaint.statusHistory.map((item, i) => (
                <div key={i} className="p-3.5 text-xs flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{translateStatus(item.status)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{i18n.language === 'hi' ? 'द्वारा' : 'by'} {item.updatedBy}</span>
                    </div>
                    {item.notes && (
                      <p className="text-slate-600 dark:text-slate-300 mt-1 font-medium">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen Feedback Section: Show existing rating OR prompt for verification */}
          {complaint.feedback ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {i18n.language === 'hi' ? 'नागरिक द्वारा सत्यापित व रेटेड' : 'Citizen Verified & Rated'}
                  </h4>
                </div>
                <div className="flex items-center gap-1 text-amber-500 text-sm" aria-label={`Rated ${complaint.feedback.rating} out of 5`}>
                  {'★'.repeat(complaint.feedback.rating)}
                  {'☆'.repeat(Math.max(0, 5 - complaint.feedback.rating))}
                  <span className="ml-1 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    ({complaint.feedback.rating}/5)
                  </span>
                </div>
              </div>
              {complaint.feedback.review && (
                <p className="text-xs text-emerald-800 dark:text-emerald-300 italic">
                  "{complaint.feedback.review}"
                </p>
              )}
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                {i18n.language === 'hi' ? 'प्रस्तुत तिथि: ' : 'Submitted: '}
                {formatDate(complaint.feedback.createdAt || complaint.updatedAt)}
              </div>
            </div>
          ) : (
            (complaint.status === 'Resolved' || complaint.status === 'Closed') && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {i18n.language === 'hi' ? 'नगर निगम दल द्वारा कार्य पूर्ण' : 'Work Completed by Municipal Crew'}
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    {i18n.language === 'hi' ? 'कृपया मरम्मत की पुष्टि करें और टिकट बंद करने के लिए रेटिंग दें।' : 'Please verify the site repair and leave your rating to close this ticket.'}
                  </p>
                </div>

                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>{i18n.language === 'hi' ? 'सत्यापित करें और रेटिंग दें' : 'Verify & Rate Work'}</span>
                </button>
              </div>
            )
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-20 shrink-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-4 sm:px-7 py-3.5 pb-safe border-t border-[#E5E7EB] dark:border-[#374151] flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            {i18n.language === 'hi' ? 'बंद करने के लिए ESC दबाएं या बाहर क्लिक करें' : 'Press ESC or click outside to dismiss'}
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 min-h-[42px] rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs"
          >
            {i18n.language === 'hi' ? 'विवरण बंद करें' : 'Close Details'}
          </button>
        </div>

        {/* Nested Modals */}
        {qrOpen && <QRCodeModal complaint={complaint} onClose={() => setQrOpen(false)} />}
        {feedbackOpen && (
          <CitizenFeedbackModal
            complaint={complaint}
            onClose={() => setFeedbackOpen(false)}
            onSubmitted={(updated) => {
              onFeedbackSubmitted(updated);
              setFeedbackOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
