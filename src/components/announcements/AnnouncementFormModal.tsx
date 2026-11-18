import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Megaphone,
  Plus,
  Trash2,
  Paperclip,
  Check,
} from 'lucide-react';
import { Announcement, AnnouncementCategory, AnnouncementPriority, AnnouncementAttachment } from '../../types';
import { translateCategory, translatePriority } from '../../utils/i18n';

interface AnnouncementFormModalProps {
  initialData?: Announcement | null;
  onClose: () => void;
  onSave: (data: Partial<Announcement>) => Promise<void>;
}

const CATEGORIES: AnnouncementCategory[] = [
  'Road Closure',
  'Traffic Advisory',
  'Water Supply',
  'Electricity Maintenance',
  'Garbage Collection',
  'Drainage',
  'Public Health',
  'Emergency',
  'Weather Alert',
  'Events',
  'Municipal Notice',
  'Construction',
  'Environment',
  'Education',
  'Public Safety',
  'Others',
];

const PRIORITIES: AnnouncementPriority[] = ['Critical', 'High', 'Medium', 'Low'];

const DEPARTMENTS = [
  'Municipal Executive Administration',
  'Roads & Infrastructure',
  'Solid Waste & Sanitation',
  'Water Supply & Sewage',
  'Electrical & Streetlighting',
  'Drainage & Stormwater',
  'Parks & Horticulture',
  'Public Health & Encroachment',
];

const PRESET_BANNERS = [
  { label: 'Road Construction', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Water Utility', url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Sanitation', url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Electrical Grid', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Flood & Storm', url: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?q=80&w=1200&auto=format&fit=crop' },
  { label: 'City Hall Hallway', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop' },
];

export default function AnnouncementFormModal({
  initialData,
  onClose,
  onSave,
}: AnnouncementFormModalProps) {
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState(initialData?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [category, setCategory] = useState<string>(initialData?.category || 'Road Closure');
  const [priority, setPriority] = useState<string>(initialData?.priority || 'High');
  const [department, setDepartment] = useState<string>(
    initialData?.department || 'Roads & Infrastructure'
  );
  const [bannerImage, setBannerImage] = useState<string>(
    initialData?.bannerImage || PRESET_BANNERS[0].url
  );
  const [content, setContent] = useState(initialData?.content || '');
  const [location, setLocation] = useState(initialData?.location || 'Central City Ward');
  const [duration, setDuration] = useState(initialData?.duration || 'Active Notice');
  const [expiresAt, setExpiresAt] = useState(
    initialData?.expiresAt ? initialData.expiresAt.slice(0, 10) : ''
  );
  const [targetWard, setTargetWard] = useState<string>(
    initialData?.targetWards?.[0] || 'All Wards'
  );
  const [status, setStatus] = useState<'Published' | 'Scheduled' | 'Draft' | 'Archived'>(
    initialData?.status || 'Published'
  );
  const [isPinned, setIsPinned] = useState<boolean>(initialData?.isPinned || false);
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.isFeatured || false);

  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(
    initialData?.attachments || []
  );
  const [newAttName, setNewAttName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddAttachment = () => {
    if (!newAttName) return;
    const newAtt: AnnouncementAttachment = {
      id: `att_${Date.now()}`,
      name: newAttName.endsWith('.pdf') ? newAttName : `${newAttName}.pdf`,
      url: '#',
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      type: 'pdf',
    };
    setAttachments([...attachments, newAtt]);
    setNewAttName('');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setErrorMsg(i18n.language === 'hi' ? 'कृपया शीर्षक और विवरण दर्ज करें।' : 'Please enter both headline and notice description.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await onSave({
        title,
        subtitle,
        category: category as any,
        priority: priority as any,
        department,
        bannerImage,
        content,
        location,
        duration,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : '',
        targetWards: [targetWard],
        status,
        isPinned,
        isFeatured,
        attachments,
        author: 'Dr. Rajesh Verma',
        authorRole: 'Municipal Commissioner',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || (i18n.language === 'hi' ? 'सूचना सहेजने में विफल' : 'Failed to save announcement'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto text-left relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5E7EB] dark:border-[#374151] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#1F2937] shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-600 text-white font-bold">
              <Megaphone className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {initialData ? (i18n.language === 'hi' ? 'नगर सूचना संपादित करें' : 'Edit Municipal Notice') : (i18n.language === 'hi' ? 'नगर सूचना बनाएं व प्रकाशित करें' : 'Create & Publish Municipal Notice')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {i18n.language === 'hi' ? 'आधिकारिक राजपत्र संचार व आपातकालीन बुलेटिन' : 'Official Gazette Communications & Emergency Bulletins'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-[#374151] text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}
          {/* Title & Subtitle */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'सूचना का शीर्षक *' : 'Announcement Headline / Title *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={i18n.language === 'hi' ? 'उदा. फ्लाईओभर पर आपातकालीन रखरखाव' : 'e.g., Emergency Maintenance on Central Promenade Flyover'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'उपशीर्षक / संक्षिप्त सारांश' : 'Subtitle / Short Summary'}
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder={i18n.language === 'hi' ? 'प्रभावित क्षेत्रों का संक्षिप्त विवरण' : 'Brief high-level summary of affected areas or timing'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* 3 Grid Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'श्रेणी' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {translateCategory(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'प्राथमिकता' : 'Priority Level'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {translatePriority(p)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'स्थिति' : 'Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
              >
                <option value="Published">{i18n.language === 'hi' ? 'प्रकाशित (लाइव)' : 'Published (Live)'}</option>
                <option value="Scheduled">{i18n.language === 'hi' ? 'अनुसूचित' : 'Scheduled'}</option>
                <option value="Draft">{i18n.language === 'hi' ? 'ड्राफ्ट' : 'Draft'}</option>
                <option value="Archived">{i18n.language === 'hi' ? 'अभिलेखागार' : 'Archived'}</option>
              </select>
            </div>
          </div>

          {/* Department & Target Ward */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'प्रकाशन विभाग' : 'Publishing Department'}
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'लक्ष्यित वार्ड' : 'Target Ward'}
              </label>
              <select
                value={targetWard}
                onChange={(e) => setTargetWard(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value="All Wards">{i18n.language === 'hi' ? 'सभी वार्ड (पूरा शहर)' : 'All Wards (Citywide)'}</option>
                <option value="Ward 1 - Metro North">Ward 1 - Metro North</option>
                <option value="Ward 2 - Civic Tech Hub">Ward 2 - Civic Tech Hub</option>
                <option value="Ward 3 - Heritage Square">Ward 3 - Heritage Square</option>
                <option value="Ward 4 - Central Promenade">Ward 4 - Central Promenade</option>
                <option value="Ward 5 - Waterfront East">Ward 5 - Waterfront East</option>
                <option value="Ward 6 - Southern Industrial Park">Ward 6 - Southern Industrial Park</option>
              </select>
            </div>
          </div>

          {/* Banner Preset Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {i18n.language === 'hi' ? 'बैनर छवि या कस्टम URL' : 'Banner Image Presets or Custom URL'}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
              {PRESET_BANNERS.map((b, i) => (
                <div
                  key={i}
                  onClick={() => setBannerImage(b.url)}
                  className={`relative h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    bannerImage === b.url ? 'border-blue-600 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={b.url} alt={b.label} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center text-[9px] font-bold text-white text-center p-0.5">
                    {b.label}
                  </div>
                </div>
              ))}
            </div>
            <input
              type="text"
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              placeholder="Custom image URL (https://...)"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>

          {/* Main Description */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {i18n.language === 'hi' ? 'पूरा विवरण व निर्देश *' : 'Full Notice Description & Directives *'}
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={i18n.language === 'hi' ? 'पूरा विवरण, समय, वैकल्पिक मार्ग, हेल्पलाइन नंबर दर्ज करें...' : 'Provide complete details, exact work hours, diversion routes, helpline numbers, and safety precautions...'}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed"
            />
          </div>

          {/* Location & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'विशिष्ट स्थान' : 'Specific Location'}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Central Flyover"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'अनुमानित अवधि' : 'Estimated Duration'}
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 8 Hours (Overnight)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {i18n.language === 'hi' ? 'समाप्ति तिथि' : 'Expiry Date'}
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* Flags Checkboxes */}
          <div className="flex items-center gap-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              📌 {i18n.language === 'hi' ? 'शीर्ष पर पिन करें' : 'Pin Announcement at Top'}
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              ⭐ {i18n.language === 'hi' ? 'मुख्य बैनर के रूप में सेट करें' : 'Set as Featured Hero Banner'}
            </label>
          </div>

          {/* Attachments Upload Manager */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              {i18n.language === 'hi' ? 'आधिकारिक पीडीएफ / दस्तावेज संलग्नक' : 'Official PDF / Document Attachments'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAttName}
                onChange={(e) => setNewAttName(e.target.value)}
                placeholder={i18n.language === 'hi' ? 'दस्तावेज़ का नाम (उदा. Map_2026.pdf)' : 'Document name (e.g., Diversion_Map_2026.pdf)'}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> {i18n.language === 'hi' ? 'जोड़ें' : 'Add Document'}
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-slate-900 dark:text-white">{a.name}</span>
                      <span className="text-[10px] text-slate-400">({a.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(a.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {i18n.language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md flex items-center gap-2"
            >
              {loading ? (
                <span>{i18n.language === 'hi' ? 'प्रकाशित हो रहा है...' : 'Publishing...'}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialData ? (i18n.language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes') : (i18n.language === 'hi' ? 'राजपत्र लाइव प्रकाशित करें' : 'Publish Gazette Live')}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
