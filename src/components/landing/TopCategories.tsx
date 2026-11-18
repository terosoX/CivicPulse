import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Car,
  Trash2,
  Droplets,
  Lightbulb,
  Pipette,
  TreeDeciduous,
  ShieldAlert,
  Trees,
  ArrowRight
} from 'lucide-react';
import { IssueCategory } from '../../types';
import { translateCategory } from '../../utils/i18n';

interface TopCategoriesProps {
  onSelectCategory: (category: IssueCategory) => void;
}

const CATEGORIES_DATA: { name: IssueCategory; icon: any; descEn: string; descHi: string }[] = [
  { name: 'Potholes & Road Damage', icon: Car, descEn: 'Asphalt craters, cave-ins, loose pavers, road cuts', descHi: 'सड़क गड्ढे, धंसी सड़कें, टूटे पेवर्स' },
  { name: 'Garbage & Solid Waste', icon: Trash2, descEn: 'Overflowing bins, illegal open dumps, commercial debris', descHi: 'खुले में कचरा, भरे हुए कूड़ेदान, गंदगी' },
  { name: 'Water Leakage & Supply', icon: Droplets, descEn: 'Pipeline breaches, pressure drops, valve leaks', descHi: 'पाइपलाइन लीकेज, पानी की किल्लत, गंदा पानी' },
  { name: 'Streetlighting & Electrical', icon: Lightbulb, descEn: 'Dark poles, hanging wires, damaged feeder pillars', descHi: 'खराब स्ट्रीटलाइट, लटकते बिजली के तार' },
  { name: 'Drainage & Sewage Overflow', icon: Pipette, descEn: 'Blocked stormwater drains, manhole backflows', descHi: 'बंद नाले, ओवरफ्लो सीवर, जलभराव' },
  { name: 'Fallen Tree & Horticulture', icon: TreeDeciduous, descEn: 'Storm-felled boughs, overgrown sightline obstruction', descHi: 'गिरे पेड़, अवरुद्ध शाखाएं, पार्कों की छंटाई' },
  { name: 'Illegal Dumping & Encroachment', icon: ShieldAlert, descEn: 'Footway obstruction, construction waste dumping', descHi: 'फुटपाथ पर अवैध कब्जा, निर्माण मलबा' },
  { name: 'Parks & Public Amenities', icon: Trees, descEn: 'Broken playground fixtures, damaged public benches', descHi: 'पार्क के टूटे झूले, खराब सार्वजनिक सुविधाएं' },
];

export default function TopCategories({ onSelectCategory }: TopCategoriesProps) {
  const { t, i18n } = useTranslation();

  return (
    <section className="py-12 sm:py-16 bg-[#F5F7FA] dark:bg-[#0B1120] border-b border-[#E5E7EB] dark:border-[#374151] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
              Municipal Services Directory
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('landing.topCategories')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Report public infrastructure issues by category for direct dispatch to relevant city departments.
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES_DATA.map((cat) => {
            const Icon = cat.icon;
            const title = translateCategory(cat.name);
            const description = i18n.language === 'hi' ? cat.descHi : cat.descEn;

            return (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className="p-4 rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] hover:border-blue-400 dark:hover:border-blue-600 transition-colors text-left flex flex-col justify-between group shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-medium text-slate-500 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                  <span>Report this issue</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
