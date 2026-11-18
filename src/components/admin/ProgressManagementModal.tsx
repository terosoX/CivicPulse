import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Camera, Clock } from 'lucide-react';
import { Complaint, ComplaintStatus } from '../../types';
import { api } from '../../services/api';
import { translateStatus } from '../../utils/i18n';

interface ProgressManagementModalProps {
  complaint: Complaint;
  onClose: () => void;
  onUpdateSuccess: (updated: Complaint) => void;
}

const VALID_TRANSITIONS_MAP: Record<string, ComplaintStatus[]> = {
  'Submitted': ['Verified', 'Rejected', 'Assigned'],
  'Pending': ['Verified', 'Submitted', 'Rejected', 'Assigned'],
  'Verified': ['Assigned', 'Work Started', 'In Inspection', 'Officer En Route', 'Rejected'],
  'Assigned': ['Officer En Route', 'Work Started', 'In Inspection', 'Verified', 'Rejected'],
  'Officer En Route': ['Work Started', 'In Inspection', 'Assigned', 'Rejected'],
  'Work Started': ['In Inspection', 'Resolved', 'Assigned', 'Rejected'],
  'In Inspection': ['Work Started', 'Resolved', 'Rejected'],
  'Inspection': ['Work Started', 'Resolved', 'Rejected'],
  'Resolved': ['Closed', 'Work Started', 'Assigned', 'Rejected'],
  'Closed': ['Work Started'],
  'Rejected': ['Submitted', 'Verified'],
};

export default function ProgressManagementModal({
  complaint,
  onClose,
  onUpdateSuccess,
}: ProgressManagementModalProps) {
  const { t, i18n } = useTranslation();
  const allowedNext = VALID_TRANSITIONS_MAP[complaint.status] || ['Submitted', 'Verified', 'Assigned', 'Work Started', 'Resolved'];
  const [status, setStatus] = useState<ComplaintStatus>(allowedNext[0] || complaint.status);
  const [notes, setNotes] = useState('');
  const [afterImage, setAfterImage] = useState<string | undefined>(complaint.afterImage);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);

  // Keyboard trap ESC listener & body scroll lock
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [onClose]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(i18n.language === 'hi' ? 'केवल PNG, JPG या WEBP छवियाँ अनुमत हैं।' : 'Invalid file format. Only PNG, JPG, or WEBP images are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setErrorMessage(i18n.language === 'hi' ? 'छवि का आकार 5 MB से कम होना चाहिए।' : 'Image file size must be 5 MB or less.');
      e.target.value = '';
      return;
    }
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAfterImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const updated = await api.updateComplaintStatus(complaint.id, {
        status,
        notes,
        updatedBy: 'Eng. Vikram Sethi (Municipal Official)',
        afterImage,
      });

      onUpdateSuccess(updated);
    } catch (err: any) {
      const msg = err?.message || (i18n.language === 'hi' ? 'स्थिति अपडेट करने में विफल' : 'Failed to update status');
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

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
        aria-labelledby="progress-modal-title"
        className="bg-white dark:bg-[#111827] w-full max-w-lg h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-xl border border-slate-200 dark:border-[#374151] shadow-2xl overflow-hidden relative text-left transition-all"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 shrink-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-[#374151] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-200 dark:border-blue-800">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h3 id="progress-modal-title" className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                {i18n.language === 'hi' ? 'क्षेत्रीय प्रगति व स्थिति अपडेट करें' : 'Update Field Progress & Status'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {i18n.language === 'hi' ? 'टिकट' : 'Ticket'} <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{complaint.ticketNumber}</span> • Current: <span className="font-semibold text-slate-700 dark:text-slate-300">{translateStatus(complaint.status)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <form id="progress-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {i18n.language === 'hi' ? 'अनुमत अगली स्थिति चुनें' : 'Permitted Next Workflow Stage'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#374151] bg-slate-50 dark:bg-[#1F2937] text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {allowedNext.map((s) => (
                  <option key={s} value={s}>
                    {translateStatus(s)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {i18n.language === 'hi' ? 'आधिकारिक कार्य टिप्पणी' : 'Official Work Notes / Triage Observations'}
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={i18n.language === 'hi' ? 'उदा. काम शुरू किया गया...' : 'e.g. Field crew deployed with asphalt batch. Pothole filled, leveled, and compacted.'}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#374151] bg-slate-50 dark:bg-[#1F2937] text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {i18n.language === 'hi' ? 'कार्य पूर्ण होने की फोटो अपलोड करें (बाद का चित्र)' : 'Upload Work Completion Photo (After Image)'}
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-[#374151] rounded-xl p-4 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="after-photo"
                />
                <label
                  htmlFor="after-photo"
                  className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>{afterImage ? (i18n.language === 'hi' ? 'फोटो बदलें' : 'Change Photo') : (i18n.language === 'hi' ? 'फोटो अपलोड करें' : 'Upload Field Completion Photo')}</span>
                </label>
                {afterImage && (
                  <img src={afterImage} alt="After" className="w-28 h-28 object-cover rounded-lg mx-auto mt-3 border border-slate-200 dark:border-[#374151] shadow-xs" />
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-20 shrink-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-6 py-3.5 border-t border-slate-200 dark:border-[#374151] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {i18n.language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="submit"
            form="progress-form"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (i18n.language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving Update...') : (i18n.language === 'hi' ? 'अपडेट सहेजें व प्रकाशित करें' : 'Save & Publish Status Update')}
          </button>
        </div>
      </div>
    </div>
  );
}
