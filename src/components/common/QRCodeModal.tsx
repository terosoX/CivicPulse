import React from 'react';
import { X, QrCode, Copy, Check } from 'lucide-react';
import { Complaint } from '../../types';

interface QRCodeModalProps {
  complaint: Complaint;
  onClose: () => void;
}

export default function QRCodeModal({ complaint, onClose }: QRCodeModalProps) {
  const [copied, setCopied] = React.useState(false);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const trackUrl = `${window.location.origin}?ticket=${complaint.ticketNumber}`;

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

  const handleCopy = () => {
    navigator.clipboard.writeText(trackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qrcode-modal-title"
        className="bg-white dark:bg-[#111827] w-full max-w-sm flex flex-col rounded-t-2xl sm:rounded-xl border border-[#E5E7EB] dark:border-[#374151] shadow-2xl overflow-hidden relative text-center transition-all"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#374151]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <h3 id="qrcode-modal-title" className="font-bold text-sm text-slate-900 dark:text-white">
              Ticket QR Tracking
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scan QR code to access live status & field updates
          </p>

          {/* Generated SVG QR Code representation */}
          <div className="my-4 p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-inner inline-block">
            <svg className="w-40 h-40" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="#ffffff" />
              <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" fill="#0f172a" />
              <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" fill="#0f172a" />
              <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" fill="#0f172a" />
              <rect x="50" y="50" width="10" height="10" fill="#2563eb" />
              <rect x="70" y="50" width="10" height="20" fill="#0f172a" />
              <rect x="50" y="70" width="20" height="10" fill="#0f172a" />
              <rect x="80" y="80" width="10" height="10" fill="#2563eb" />
              <rect x="45" y="15" width="10" height="20" fill="#0f172a" />
              <rect x="15" y="45" width="20" height="10" fill="#0f172a" />
            </svg>
          </div>

          <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 py-1.5 px-3 rounded-xl inline-block mb-4 border border-blue-200 dark:border-blue-900">
            {complaint.ticketNumber}
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link Copied to Clipboard' : 'Copy Tracking Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
