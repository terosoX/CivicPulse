import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Upload, CheckCircle2, X, Send, Camera } from 'lucide-react';
import { Complaint } from '../../types';
import { api } from '../../services/api';

interface CitizenFeedbackModalProps {
  complaint: Complaint;
  onClose: () => void;
  onSubmitted: (updatedComplaint: Complaint) => void;
}

export default function CitizenFeedbackModal({ complaint, onClose, onSubmitted }: CitizenFeedbackModalProps) {
  const { t, i18n } = useTranslation();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [confirmed, setConfirmed] = useState(true);
  const [verificationImage, setVerificationImage] = useState<string | undefined>(undefined);
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
      setErrorMessage(i18n.language === 'hi' ? 'केवल PNG, JPG या WEBP फ़ाइलें अनुमत हैं।' : 'Invalid file format. Only PNG, JPG, or WEBP images are allowed.');
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
      setVerificationImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const updated = await api.submitFeedback(complaint.id, {
        rating,
        review,
        verificationImage,
        confirmedResolved: confirmed,
      });

      onSubmitted(updated);
    } catch (err: any) {
      setErrorMessage(err?.message || (i18n.language === 'hi' ? 'प्रतिक्रिया भेजने में विफल' : 'Failed to submit feedback'));
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
        aria-labelledby="feedback-modal-title"
        className="bg-white dark:bg-[#111827] w-full max-w-md h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-xl border border-[#E5E7EB] dark:border-[#374151] shadow-2xl overflow-hidden relative text-left transition-all"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 shrink-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-6 py-4 border-b border-[#E5E7EB] dark:border-[#374151] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="feedback-modal-title" className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                {i18n.language === 'hi' ? 'नागरिक कार्य सत्यापन व समीक्षा' : 'Citizen Work Verification'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {i18n.language === 'hi' ? 'टिकट' : 'Ticket'} <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{complaint.ticketNumber}</span>
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
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <form id="feedback-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {i18n.language === 'hi' ? 'नागरिक संतुष्टि रेटिंग' : 'Citizen Satisfaction Rating'}
              </label>
              <div className="flex gap-2 justify-between sm:justify-start">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'टिप्पणी / समीक्षा' : 'Comments / Review Notes'}
              </label>
              <textarea
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={i18n.language === 'hi' ? 'उदा. काम बहुत अच्छी तरह से पूरा किया गया है।' : 'e.g. Field crew did a fantastic job. Site is completely clean and smooth now.'}
                className="w-full p-3 rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#1F2937] text-xs text-[#111827] dark:text-[#F9FAFB] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Verification Image */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'सत्यापन फोटो अपलोड करें (वैकल्पिक)' : 'Upload Verification Photo (Optional)'}
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="verify-photo"
                />
                <label
                  htmlFor="verify-photo"
                  className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>{verificationImage ? (i18n.language === 'hi' ? 'सत्यापन फोटो बदलें' : 'Change Verification Photo') : (i18n.language === 'hi' ? 'सत्यापन फोटो अपलोड करें' : 'Upload Citizen Verification Photo')}</span>
                </label>
                {verificationImage && (
                  <img src={verificationImage} alt="Verification" className="w-24 h-24 object-cover rounded-lg mx-auto mt-3 border border-slate-200 dark:border-slate-700 shadow-xs" />
                )}
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                id="confirm-res"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0"
              />
              <label htmlFor="confirm-res" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                {i18n.language === 'hi' ? 'मैं पुष्टि करता हूं कि समस्या का मौके पर समाधान हो गया है।' : 'I confirm the issue is satisfactorily resolved on ground.'}
              </label>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-20 shrink-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-6 py-3.5 border-t border-[#E5E7EB] dark:border-[#374151] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {i18n.language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="submit"
            form="feedback-form"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (i18n.language === 'hi' ? 'भेजा जा रहा है...' : 'Submitting...') : (i18n.language === 'hi' ? 'सत्यापन जमा करें व टिकट बंद करें' : 'Submit Verification & Close Ticket')}
          </button>
        </div>
      </div>
    </div>
  );
}
