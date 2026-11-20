import React from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, CheckSquare, Users2, Wrench, Star } from 'lucide-react';

export default function HowItWorks() {
  const { t, i18n } = useTranslation();

  const STEPS = [
    {
      step: '01',
      title: i18n.language === 'hi' ? 'समस्या रिपोर्ट करें' : '1. Citizen Report',
      desc: i18n.language === 'hi' ? 'फोटो अपलोड करें और मैप पर लोकेशन चुनें।' : 'Citizen uploads evidence photo, description, and GPS coordinates.',
      icon: Camera,
    },
    {
      step: '02',
      title: i18n.language === 'hi' ? 'नगर निगम सत्यापन' : '2. Verification',
      desc: i18n.language === 'hi' ? 'एआई और नोडल अधिकारी द्वारा त्वरित सत्यापन।' : 'Automated AI classification verifies genuine report against duplicates.',
      icon: CheckSquare,
    },
    {
      step: '03',
      title: i18n.language === 'hi' ? 'विभाग असाइनमेंट' : '3. Assignment',
      desc: i18n.language === 'hi' ? 'वार्ड के संबंधित विभाग व अधिकारी को कार्य आवंटन।' : 'Dispatched to ward field team with priority-based SLA deadline.',
      icon: Users2,
    },
    {
      step: '04',
      title: i18n.language === 'hi' ? 'मरम्मत व समाधान' : '4. Field Repair',
      desc: i18n.language === 'hi' ? 'फील्ड दल द्वारा कार्य पूरा कर फोटो अपलोड करना।' : 'Municipal crew completes repair and uploads after-photo proof.',
      icon: Wrench,
    },
    {
      step: '05',
      title: i18n.language === 'hi' ? 'संतुष्टि रेटिंग' : '5. Feedback & Close',
      desc: i18n.language === 'hi' ? 'नागरिक द्वारा समाधान सत्यापित कर स्टार रेटिंग।' : 'Citizen verifies resolution and provides satisfaction rating.',
      icon: Star,
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white dark:bg-[#0B1120] border-b border-[#E5E7EB] dark:border-[#374151] transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
            Grievance Redressal Lifecycle
          </div>
          <h2 className="fluid-section-title font-bold text-slate-900 dark:text-white">
            {t('landing.howItWorks')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            A transparent 5-stage municipal resolution workflow ensuring accountability at every step.
          </p>
        </div>

        {/* 5-Step Process Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="p-5 rounded-lg bg-[#F9FAFB] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                      STEP {s.step}
                    </span>
                    <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
