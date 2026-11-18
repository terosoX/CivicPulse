import React, { useState } from 'react';
import {
  GitCommitHorizontal,
  CheckCircle2,
  Clock,
  Building2,
  UserCheck,
  FileText,
  Calendar,
  Eye,
  Camera,
  Star,
  ArrowRight,
  ShieldCheck,
  Download,
  AlertCircle
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../../types';
import { formatDate } from '../../utils/i18n';
import { exportResolutionCertificatePDF } from '../../utils/pdfExport';
import BeforeAfterSlider from '../common/BeforeAfterSlider';
import { api } from '../../services/api';

interface ResolutionTrackingViewProps {
  complaints: Complaint[];
  onRefreshData?: () => void;
  onSelectComplaint?: (c: Complaint) => void;
}

const LIFECYCLE_STAGES = [
  { id: 'all', label: 'All Lifecycle Stages' },
  { id: 'Reported', label: '1. Reported' },
  { id: 'AI Verification', label: '2. AI Verification' },
  { id: 'Department Assignment', label: '3. Dept Assignment' },
  { id: 'Work in Progress', label: '4. Work in Progress' },
  { id: 'Resolved', label: '5. Resolved' },
  { id: 'Citizen Feedback', label: '6. Citizen Feedback' },
];

export default function ResolutionTrackingView({
  complaints,
  onRefreshData,
  onSelectComplaint,
}: ResolutionTrackingViewProps) {
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    complaints.find((c) => c.status === 'Resolved' || c.afterImage) || complaints[0] || null
  );

  React.useEffect(() => {
    if (selectedComplaint) {
      const fresh = complaints.find((c) => c.id === selectedComplaint.id);
      if (fresh) setSelectedComplaint(fresh);
    } else if (complaints.length > 0) {
      setSelectedComplaint(complaints.find((c) => c.status === 'Resolved' || c.afterImage) || complaints[0]);
    }
  }, [complaints]);

  // Map internal status to 6-stage lifecycle
  const getStageIndex = (status: ComplaintStatus, hasFeedback?: boolean) => {
    if (hasFeedback) return 5; // Citizen Feedback
    switch (status) {
      case 'Submitted':
      case 'Pending':
        return 0; // Reported
      case 'Verified':
        return 1; // AI Verification
      case 'Assigned':
        return 2; // Dept Assignment
      case 'Officer En Route':
      case 'Work Started':
      case 'In Inspection':
        return 3; // Work in Progress
      case 'Resolved':
      case 'Closed':
        return 4; // Resolved
      default:
        return 0;
    }
  };

  const filteredTickets = complaints.filter((c) => {
    if (selectedStage === 'all') return true;
    const idx = getStageIndex(c.status, Boolean(c.feedback));
    if (selectedStage === 'Reported' && idx === 0) return true;
    if (selectedStage === 'AI Verification' && idx === 1) return true;
    if (selectedStage === 'Department Assignment' && idx === 2) return true;
    if (selectedStage === 'Work in Progress' && idx === 3) return true;
    if (selectedStage === 'Resolved' && idx === 4) return true;
    if (selectedStage === 'Citizen Feedback' && idx === 5) return true;
    return false;
  });

  const activeComplaint = selectedComplaint || complaints[0];
  const activeStageIdx = activeComplaint ? getStageIndex(activeComplaint.status, Boolean(activeComplaint.feedback)) : 0;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="pb-2 border-b border-[#EAECF0] dark:border-[#1E293B]">
        <h2 className="text-xl font-bold text-[#101828] dark:text-white tracking-tight">
          Resolution Tracking & Audit Trail
        </h2>
        <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
          Full complaint resolution workflow: Reported → AI Verification → Department Assignment → Work in Progress → Resolved → Citizen Feedback
        </p>
      </div>

      {/* 6-Stage Visual Workflow Stepper Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs">
        <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-3">
          Standard Civic Operating Procedure (6-Stage Pipeline)
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[700px] relative px-3">
            {/* Connecting Track Line */}
            <div className="absolute left-6 right-6 top-4 h-0.5 bg-[#EAECF0] dark:bg-[#334155] -z-0" />

            {[
              { num: 1, title: 'Reported', desc: 'Lodged by citizen or sensor' },
              { num: 2, title: 'AI Verification', desc: 'Local AI visual triage' },
              { num: 3, title: 'Dept Assignment', desc: 'Official crew dispatched' },
              { num: 4, title: 'Work in Progress', desc: 'On-site field repair' },
              { num: 5, title: 'Resolved', desc: 'Verified after-image' },
              { num: 6, title: 'Citizen Feedback', desc: '5-star audit close' },
            ].map((step, idx) => {
              const isPassed = idx <= activeStageIdx;
              const isCurrent = idx === activeStageIdx;

              return (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center w-28">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-white dark:bg-[#0F172A] text-[#98A2B3] border border-[#D0D5DD] dark:border-[#334155]'
                    } ${isCurrent ? 'ring-4 ring-[#BFDBFE] dark:ring-[#1E3A8A]' : ''}`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                  </div>
                  <span
                    className={`text-xs font-bold mt-2 ${
                      isCurrent ? 'text-[#2563EB]' : isPassed ? 'text-[#101828] dark:text-white' : 'text-[#98A2B3]'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="text-[10px] text-[#667085] leading-tight mt-0.5 max-w-[100px]">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Resolution Workspace: Ticket Selector (4 cols) & Lifecycle Details (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Complaints List in this lifecycle (4 cols) */}
        <div className="lg:col-span-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7] dark:border-[#2D3748]">
            <h3 className="text-xs font-bold text-[#101828] dark:text-white uppercase tracking-wider">
              Tracked Incidents
            </h3>
            <span className="text-xs font-mono font-semibold text-[#2563EB]">
              {filteredTickets.length} items
            </span>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1">
            {LIFECYCLE_STAGES.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStage(s.id)}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                  selectedStage === s.id
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#F2F4F7] dark:bg-[#0F172A] text-[#667085] hover:text-[#101828]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pt-1">
            {filteredTickets.map((c) => {
              const isSelected = activeComplaint?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedComplaint(c)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-[#EFF6FF] dark:bg-[#0F1E36] border-[#2563EB] shadow-2xs'
                      : 'bg-[#F9FAFB] dark:bg-[#0F172A] border-[#EAECF0] dark:border-[#334155] hover:border-[#D0D5DD]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#2563EB]">
                      {c.ticketNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-white dark:bg-[#1E293B] text-[#344054] dark:text-slate-200 border border-[#D0D5DD] dark:border-[#334155]">
                      {c.status}
                    </span>
                  </div>
                  <div className="font-semibold text-[#101828] dark:text-white truncate mt-1">
                    {c.title}
                  </div>
                  <div className="text-[10px] text-[#667085] truncate mt-0.5">
                    {c.location.address}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Comprehensive Lifecycle Inspection Workspace (8 cols) */}
        {activeComplaint && (
          <div className="lg:col-span-8 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs p-5 sm:p-6 space-y-6">
            {/* Top Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAECF0] dark:border-[#334155]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded border border-[#BFDBFE]">
                    {activeComplaint.ticketNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ECFDF5] text-[#16A34A] border border-[#A7F3D0]">
                    Current Status: {activeComplaint.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#101828] dark:text-white mt-2">
                  {activeComplaint.title}
                </h3>
              </div>

              {/* Certificate Download if resolved */}
              {(activeComplaint.status === 'Resolved' || activeComplaint.status === 'Closed') && (
                <button
                  onClick={() => exportResolutionCertificatePDF(activeComplaint)}
                  className="px-3.5 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Resolution Certificate PDF</span>
                </button>
              )}
            </div>

            {/* Department & Assigned Officer Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#EAECF0] dark:border-[#334155] text-xs">
              <div>
                <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">Department</span>
                <span className="font-semibold text-[#101828] dark:text-white flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{activeComplaint.departmentAssigned || 'Municipal Engineering'}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">Assigned Officer</span>
                <span className="font-semibold text-[#101828] dark:text-white flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>{activeComplaint.officerAssigned || 'Eng. Vikram Sethi'}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">Reported Timestamp</span>
                <span className="font-mono text-[#667085] mt-0.5 block">
                  {formatDate(activeComplaint.createdAt)}
                </span>
              </div>
            </div>

            {/* Before / After Evidence Visual Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#101828] dark:text-white uppercase tracking-wider">
                  Field Verification Evidence (Before vs After)
                </span>
                <span className="text-[11px] text-[#667085]">
                  Drag middle handle to compare field repair
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-[#EAECF0] dark:border-[#334155]">
                <BeforeAfterSlider
                  beforeImage={activeComplaint.beforeImage || activeComplaint.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800'}
                  afterImage={activeComplaint.afterImage || 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?q=80&w=800'}
                  beforeLabel="Reported Hazard (Before)"
                  afterLabel="Municipal Field Repair (After)"
                  heightClass="h-56 sm:h-72"
                />
              </div>
            </div>

            {/* Timeline of Actions & Timestamps */}
            <div>
              <div className="text-xs font-bold text-[#101828] dark:text-white uppercase tracking-wider mb-2.5">
                Timeline of Actions & Audit Log
              </div>

              <div className="border border-[#EAECF0] dark:border-[#334155] rounded-xl overflow-hidden divide-y divide-[#F2F4F7] dark:divide-[#1E293B] bg-white dark:bg-[#0F172A]">
                {activeComplaint.statusHistory?.map((step, idx) => (
                  <div key={idx} className="p-3.5 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-[#101828] dark:text-white">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                        <span>{step.status}</span>
                        <span className="text-[11px] font-normal text-[#667085]">by {step.updatedBy}</span>
                      </div>
                      {step.notes && (
                        <p className="text-[11px] text-[#475467] dark:text-slate-300 mt-1 pl-4 leading-relaxed">
                          "{step.notes}"
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[#98A2B3] shrink-0">
                      {formatDate(step.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Citizen Feedback Verification Details (If feedback submitted) */}
            {activeComplaint.feedback && (
              <div className="p-4 rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/30 border border-[#A7F3D0] dark:border-emerald-900/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#065F46] dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-[#16A34A] dark:text-emerald-400" />
                    <span>Citizen Verification & Closure Rating</span>
                  </div>
                  <div className="flex text-[#F59E0B]">
                    {'★'.repeat(activeComplaint.feedback.rating)}
                    {'☆'.repeat(5 - activeComplaint.feedback.rating)}
                  </div>
                </div>
                <p className="text-xs text-[#065F46] dark:text-emerald-200 italic">
                  "{activeComplaint.feedback.review}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
