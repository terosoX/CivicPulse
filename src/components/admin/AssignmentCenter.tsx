import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, CheckCircle2 } from 'lucide-react';
import { Complaint, Department } from '../../types';
import { api } from '../../services/api';
import { formatNumber, translatePriority } from '../../utils/i18n';

interface AssignmentCenterProps {
  complaints: Complaint[];
  departments: Department[];
  onAssignmentComplete: () => void;
}

const OFFICERS_LIST = [
  'Eng. Vikram Sethi (Senior Roads Inspector)',
  'Eng. Priya Nair (Solid Waste Supervisor)',
  'Eng. Rajesh Kumar (Hydro Works Lead)',
  'Eng. Ananya Roy (Electrical Maintenance Chief)',
  'Eng. Suresh Menon (Drainage Operations)',
];

export default function AssignmentCenter({ complaints, departments, onAssignmentComplete }: AssignmentCenterProps) {
  const { t, i18n } = useTranslation();
  const unassignedList = complaints.filter(
    (c) => c.status === 'Submitted' || c.status === 'Verified' || !c.officerAssigned
  );

  const [selectedTicketId, setSelectedTicketId] = useState<string>(unassignedList[0]?.id || '');
  const [department, setDepartment] = useState<string>(departments[0]?.name || 'Roads & Infrastructure');
  const [officer, setOfficer] = useState<string>(OFFICERS_LIST[0]);
  const [estDate, setEstDate] = useState<string>('2026-07-25T18:00');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const activeTicket = complaints.find((c) => c.id === selectedTicketId) || unassignedList[0];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await api.assignComplaint(
        activeTicket.id,
        department,
        officer,
        new Date(estDate).toISOString()
      );
      setSuccessMsg(i18n.language === 'hi' ? `टिकट ${activeTicket.ticketNumber} सफलतापूर्वक प्रेषित किया गया` : `Ticket ${activeTicket.ticketNumber} successfully dispatched to ${officer}`);
      onAssignmentComplete();
    } catch (err: any) {
      setErrorMsg(err?.message || (i18n.language === 'hi' ? 'आवंटन विफल रहा' : 'Assignment failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      {/* Unassigned Tickets List */}
      <div className="lg:col-span-5 bg-white dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#374151] p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB] dark:border-[#374151]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />
            <h3 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB]">
              {i18n.language === 'hi' ? 'लंबित आवंटन कतार' : 'Pending Dispatch Queue'} ({formatNumber(unassignedList.length)})
            </h3>
          </div>
        </div>

        {unassignedList.length === 0 ? (
          <div className="text-center py-12 text-[#667085] dark:text-[#9CA3AF] text-xs">
            {i18n.language === 'hi' ? 'सभी वर्तमान टिकट टीमों को प्रेषित किए जा चुके हैं।' : 'All current tickets have been dispatched to field crews.'}
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {unassignedList.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedTicketId(c.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  activeTicket?.id === c.id
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#2563EB] shadow-xs'
                    : 'bg-[#F9FAFB] dark:bg-[#1F2937] border-[#E5E7EB] dark:border-[#374151] hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
                    {c.ticketNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.priority === 'Critical' ? 'bg-red-600 text-white' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    {translatePriority(c.priority)}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-[#111827] dark:text-[#F9FAFB] mt-1 line-clamp-1">
                  {c.title}
                </h4>

                <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                  {i18n.language === 'hi' ? 'वार्ड: ' : 'Ward: '}{c.location.ward}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispatch Control Form */}
      <div className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#374151] p-6 sm:p-8 shadow-xs">
        {activeTicket ? (
          <form onSubmit={handleAssign} className="space-y-5">
            <div className="pb-4 border-b border-[#E5E7EB] dark:border-[#374151]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
                {i18n.language === 'hi' ? 'प्रेषण फॉर्म' : 'Dispatch Form'}
              </span>
              <h3 className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB] mt-0.5">
                {i18n.language === 'hi' ? 'टिकट प्रेषण: ' : 'Dispatching Ticket: '}{activeTicket.ticketNumber}
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
                "{activeTicket.title}" — {activeTicket.location.address}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Department Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {i18n.language === 'hi' ? 'विभाग असाइन करें' : 'Assign Department'}
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Officer Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {i18n.language === 'hi' ? 'प्रभारी अधिकारी चुनें' : 'Assign Field Supervisor / Lead Officer'}
              </label>
              <select
                value={officer}
                onChange={(e) => setOfficer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
              >
                {OFFICERS_LIST.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated SLA Completion */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {i18n.language === 'hi' ? 'समाधान की अंतिम समय-सीमा' : 'SLA Target Resolution Deadline'}
              </label>
              <input
                type="datetime-local"
                value={estDate}
                onChange={(e) => setEstDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? (i18n.language === 'hi' ? 'भेजा जा रहा है...' : 'Dispatching...') : (i18n.language === 'hi' ? 'विभाग आवंटन की पुष्टि करें' : 'Confirm Department Dispatch')}
            </button>
          </form>
        ) : (
          <div className="text-center py-20 text-slate-400 text-xs">
            {i18n.language === 'hi' ? 'बाईं ओर की कतार से टिकट चुनें।' : 'Select a pending ticket from the queue on the left to dispatch.'}
          </div>
        )}
      </div>
    </div>
  );
}
