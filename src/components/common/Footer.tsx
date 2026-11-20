import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Phone, Mail, MapPin, ShieldCheck, X, Copy, Check } from 'lucide-react';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const openInfoModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <footer className="bg-white dark:bg-[#0B1120] text-[#667085] dark:text-[#9CA3AF] border-t border-[#E5E7EB] dark:border-[#374151] py-10 sm:py-12 px-4 sm:px-6 lg:px-8 text-left transition-colors pb-safe">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[#111827] dark:text-[#F9FAFB] font-bold text-lg">CivicPulse</span>
          </div>
          <p className="text-xs leading-relaxed text-[#667085] dark:text-[#9CA3AF]">
            {i18n.language === 'hi' 
              ? 'स्मार्ट सिटी नगर निगम प्रशासन एवं नागरिक शिकायत निवारण प्रणाली। पारदर्शिता, जवाबदेही और स्वचालित सेवा के लिए।'
              : 'Next-generation Smart City Municipal Administration & Citizen Grievance Resolution Infrastructure. Engineered for transparency and accountability.'}
          </p>
        </div>

        <div>
          <h4 className="text-[#111827] dark:text-[#F9FAFB] text-xs font-bold uppercase tracking-wider mb-3">
            {i18n.language === 'hi' ? 'नगर निगम विभाग' : 'Municipal Departments'}
          </h4>
          <ul className="space-y-2 text-xs">
            <li
              onClick={() =>
                openInfoModal(
                  i18n.language === 'hi' ? 'सड़क एवं अवसंरचना विभाग' : 'Roads & Infrastructure Department',
                  'Oversees asphalt repairs, manhole replacements, and bridge integrity across all city wards.'
                )
              }
              className="hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {i18n.language === 'hi' ? 'सड़क एवं अवसंरचना' : 'Roads & Infrastructure'}
            </li>
            <li
              onClick={() =>
                openInfoModal(
                  i18n.language === 'hi' ? 'ठोस अपशिष्ट प्रबंधन विभाग' : 'Solid Waste Management Department',
                  'Manages daily door-to-door waste collection, street sweeping, and recycling processing.'
                )
              }
              className="hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {i18n.language === 'hi' ? 'ठोस अपशिष्ट प्रबंधन' : 'Solid Waste Management'}
            </li>
            <li
              onClick={() =>
                openInfoModal(
                  i18n.language === 'hi' ? 'जल आपूर्ति विभाग' : 'Water Supply & Hydro Works Department',
                  'Responsible for municipal drinking water quality and pipeline leakage repair.'
                )
              }
              className="hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {i18n.language === 'hi' ? 'जल आपूर्ति एवं जलकार्य' : 'Water Supply & Hydro Works'}
            </li>
            <li
              onClick={() =>
                openInfoModal(
                  i18n.language === 'hi' ? 'स्ट्रीटलाइट एवं विद्युत विभाग' : 'Urban Electrical & Streetlighting Department',
                  'Maintains smart LED streetlights and electrical junction safety.'
                )
              }
              className="hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {i18n.language === 'hi' ? 'स्ट्रीटलाइट एवं विद्युत' : 'Urban Electrical & Streetlighting'}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#111827] dark:text-[#F9FAFB] text-xs font-bold uppercase tracking-wider mb-3">
            {i18n.language === 'hi' ? 'नागरिक सेवा' : 'Citizen Governance'}
          </h4>
          <ul className="space-y-2 text-xs">
            <li
              onClick={() =>
                openInfoModal(
                  i18n.language === 'hi' ? 'सूचकांक एवं चार्टर' : 'Civic Service Charter',
                  'Guarantees 100% grievance response and field verification.'
                )
              }
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              {i18n.language === 'hi' ? 'नागरिक सेवा अधिकार' : 'Civic Service Charter'}
            </li>
            <li
              onClick={() =>
                openInfoModal(
                  i18n.language === 'hi' ? 'सूचना का अधिकार (RTI)' : 'Right to Information (RTI)',
                  'Submit digital RTI applications online for official records.'
                )
              }
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              {i18n.language === 'hi' ? 'सूचना का अधिकार (RTI)' : 'Right to Information (RTI)'}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#111827] dark:text-[#F9FAFB] text-xs font-bold uppercase tracking-wider mb-3">
            {t('footer.helpline')}
          </h4>
          <div className="space-y-2 text-xs">
            <button
              onClick={() => handleCopy('18002332484', 'phone')}
              className="flex items-center gap-2 hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors cursor-pointer group text-left w-full"
            >
              <Phone className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
              <span>1800-233-CIVIC</span>
              {copied === 'phone' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#667085] ml-auto" />
              )}
            </button>
            <button
              onClick={() => handleCopy('helpdesk@smartcity.gov', 'email')}
              className="flex items-center gap-2 hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors cursor-pointer group text-left w-full"
            >
              <Mail className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
              <span>helpdesk@smartcity.gov</span>
              {copied === 'email' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#667085] ml-auto" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />
              <span>{i18n.language === 'hi' ? 'नगर निगम मुख्यालय, सिटी प्लाजा' : 'Municipal Executive Center, City Plaza'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto pt-6 border-t border-[#E5E7EB] dark:border-[#374151] flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] dark:text-[#9CA3AF] gap-4 text-center sm:text-left">
        <div>
          © 2026 Smart City Municipal Corporation. {t('footer.rights')}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() =>
              openInfoModal(
                t('footer.privacyPolicy'),
                'CivicPulse protects citizen personal identity and location data.'
              )
            }
            className="hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer min-h-[36px] px-1"
          >
            {t('footer.privacyPolicy')}
          </button>
          <button
            type="button"
            onClick={() =>
              openInfoModal(
                t('footer.termsOfService'),
                'Citizens agree to submit genuine photos and details.'
              )
            }
            className="hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer min-h-[36px] px-1"
          >
            {t('footer.termsOfService')}
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {modalTitle && (
        <div className="fixed inset-0 z-[9000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] rounded-t-2xl sm:rounded-3xl p-5 sm:p-6 pb-safe max-w-md w-full shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#374151] pb-3">
              <div className="flex items-center gap-2 text-[#2563EB] dark:text-[#60A5FA] min-w-0">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-sm text-[#111827] dark:text-[#F9FAFB] truncate">{modalTitle}</h3>
              </div>
              <button
                onClick={() => setModalTitle(null)}
                aria-label="Close modal"
                className="w-11 h-11 rounded-xl hover:bg-[#F5F7FA] dark:hover:bg-[#1F2937] text-[#667085] dark:text-[#9CA3AF] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] leading-relaxed">{modalContent}</p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setModalTitle(null)}
                className="w-full sm:w-auto min-h-[42px] px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

