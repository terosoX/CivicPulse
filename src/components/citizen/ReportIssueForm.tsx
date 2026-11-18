import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  Send,
  X,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { IssueCategory, PriorityLevel, LocationData, AIAnalysisResult, User } from '../../types';
import { api } from '../../services/api';
import VoiceInputButton from '../common/VoiceInputButton';
import { translateCategory, translatePriority } from '../../utils/i18n';

interface ReportIssueFormProps {
  user: User | null;
  onSubmitSuccess: (ticketNumber: string) => void;
  onCancel: () => void;
}

const CATEGORIES: IssueCategory[] = [
  'Potholes & Road Damage',
  'Garbage & Solid Waste',
  'Water Leakage & Supply',
  'Streetlighting & Electrical',
  'Drainage & Sewage Overflow',
  'Illegal Dumping & Encroachment',
  'Fallen Tree & Horticulture',
  'Parks & Public Amenities',
  'Public Health & Sanitation',
  'Traffic & Signage Issues',
];

export default function ReportIssueForm({ user, onSubmitSuccess, onCancel }: ReportIssueFormProps) {
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Potholes & Road Damage');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [address, setAddress] = useState('Central Promenade, Ward 4');
  const [ward, setWard] = useState('Ward 4 - Central Promenade');
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.209);
  const [gpsDetecting, setGpsDetecting] = useState(false);

  // AI State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [supportingDuplicate, setSupportingDuplicate] = useState(false);
  const [error, setError] = useState('');

  // Check duplicate on blur or title change
  const checkForDuplicates = async () => {
    if (!title || title.length < 5) return;
    try {
      const res = await api.checkDuplicate({ title, description, category, location: { lat, lng } });
      if (res.duplicateFound) {
        setDuplicateMatch(res);
      } else {
        setDuplicateMatch(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSupportExisting = async () => {
    if (!duplicateMatch?.existingComplaint) return;
    setSupportingDuplicate(true);
    try {
      await api.upvoteComplaint(duplicateMatch.existingComplaint.id, user?.id || 'user_citizen_1');
      onSubmitSuccess(duplicateMatch.existingComplaint.ticketNumber);
    } catch (e: any) {
      setError(e.message || 'Failed to support existing ticket');
    } finally {
      setSupportingDuplicate(false);
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024;
    setError('');

    Array.from(files).forEach((file: File) => {
      if (!allowedTypes.includes(file.type)) {
        setError(i18n.language === 'hi' ? 'केवल PNG, JPEG या WEBP छवियाँ अनुमत हैं।' : 'Invalid file type. Only PNG, JPEG, or WEBP images are allowed.');
        return;
      }
      if (file.size === 0 || file.size > maxBytes) {
        setError(i18n.language === 'hi' ? 'छवि का आकार 5 MB से कम होना चाहिए।' : 'Image file size must be 5 MB or less.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImages((prev) => [...prev, base64]);
        // Trigger AI analysis on photo upload
        triggerAIAnalysis(base64);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Trigger CivicPulse Local AI Triage
  const triggerAIAnalysis = async (imgBase64?: string) => {
    setAiAnalyzing(true);
    try {
      const locationData: LocationData = { lat, lng, address, ward };
      const res = await api.analyzeIssue({
        title,
        description,
        imageBase64: imgBase64 || (images[0] || ''),
        location: locationData,
      });

      if (res.aiAnalysis) {
        setAiResult(res.aiAnalysis);
        // Auto-apply AI suggestions if user hasn't explicitly chosen
        if (res.aiAnalysis.detectedCategory) setCategory(res.aiAnalysis.detectedCategory);
        if (res.aiAnalysis.suggestedPriority) setPriority(res.aiAnalysis.suggestedPriority);
      }
    } catch (e: any) {
      if (imgBase64 && e?.message) {
        setError(e.message);
      }
    } finally {
      setAiAnalyzing(false);
    }
  };

  // GPS Auto-Detect
  const handleDetectGPS = () => {
    setGpsDetecting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          setLat(latitude);
          setLng(longitude);
          setAddress(`GPS Coords: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Verified Location)`);
          setGpsDetecting(false);
        },
        () => {
          // Fallback to ward default
          setLat(28.6139);
          setLng(77.209);
          setAddress('Central Station Road, Ward 4 - Central Promenade');
          setGpsDetecting(false);
        },
        { enableHighAccuracy: false, timeout: 6000 }
      );
    } else {
      setGpsDetecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError(i18n.language === 'hi' ? 'कृपया शीर्षक और विवरण प्रदान करें' : 'Please provide issue title and description');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const location: LocationData = { lat, lng, address, ward };
      const complaint = await api.createComplaint({
        title,
        description,
        category,
        priority,
        location,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop'],
        isAnonymous,
        citizenId: user ? user.id : 'user_citizen_1',
        citizenName: user ? user.name : 'Aarav Sharma',
        aiAnalysis: aiResult || undefined,
      });

      onSubmitSuccess(complaint.ticketNumber);
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111827] rounded-xl border border-[#E5E7EB] dark:border-[#374151] p-6 sm:p-8 max-w-3xl mx-auto shadow-xs text-left">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5E7EB] dark:border-[#374151]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              <Camera className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('nav.reportIssue')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {i18n.language === 'hi' 
              ? 'तस्वीरें और स्थान विवरण सबमिट करें। नगर निगम विभाग समीक्षा कर फील्ड टीम को भेजेगा।'
              : 'Submit photo evidence and street location for municipal review and dispatch.'}
          </p>
        </div>

        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* AI Duplicate Warning Banner */}
      {duplicateMatch && duplicateMatch.duplicateFound && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-amber-900 dark:text-amber-200">
                {i18n.language === 'hi' ? 'समान शिकायत पहले से दर्ज है' : 'Similar Complaint Already Active Nearby'}
              </h4>
              <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                Ticket <strong className="font-mono text-blue-700">{duplicateMatch.existingComplaint.ticketNumber}</strong> was logged within {duplicateMatch.distanceMeters}m of this location.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSupportExisting}
            disabled={supportingDuplicate}
            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            {supportingDuplicate ? 'Adding Support...' : `Support Ticket #${duplicateMatch.existingComplaint.ticketNumber}`}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title & Dictate Voice */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {i18n.language === 'hi' ? 'शिकायत का शीर्षक *' : 'Issue Title *'}
            </label>
            <VoiceInputButton
              onParsed={(data) => {
                setTitle(data.title);
                setDescription(data.description);
                if (data.category) setCategory(data.category as IssueCategory);
                if (data.priority) setPriority(data.priority as PriorityLevel);
              }}
            />
          </div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              triggerAIAnalysis();
              checkForDuplicates();
            }}
            placeholder={i18n.language === 'hi' ? 'उदा. मुख्य सड़क पर गहरा गड्ढा' : 'e.g., Deep Hazardous Pothole on Main Market Road'}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {i18n.language === 'hi' ? 'विस्तृत विवरण *' : 'Detailed Description *'}
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => triggerAIAnalysis()}
            placeholder={i18n.language === 'hi' ? 'समस्या का विस्तार से वर्णन करें...' : 'Describe the exact problem, depth/size, safety hazards...'}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {i18n.language === 'hi' ? 'श्रेणी' : 'Category'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {translateCategory(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {i18n.language === 'hi' ? 'प्राथमिकता' : 'Priority'}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Low', 'Medium', 'High', 'Critical'] as PriorityLevel[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    priority === p
                      ? p === 'Critical'
                        ? 'bg-red-600 text-white border-red-600'
                        : p === 'High'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {translatePriority(p)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upload Multiple Images */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {i18n.language === 'hi' ? 'तस्वीरें अपलोड करें' : 'Upload Issue Photos'}
          </label>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-900/50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {i18n.language === 'hi' ? 'यहां तस्वीरें खींचें या ' : 'Drag & drop images here or '}
              <label className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                {i18n.language === 'hi' ? 'फ़ाइलें चुनें' : 'browse files'}
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {i18n.language === 'hi' ? 'PNG, JPG, या WEBP अधिकतम 5MB तक' : 'PNG, JPG, or WEBP up to 5MB'}
            </p>

            {/* Uploaded Previews */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                    <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-red-600 text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location & GPS Detection */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                {i18n.language === 'hi' ? 'GPS स्थान एवं पता' : 'GPS Location & Address Selection'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={gpsDetecting}
              className="px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-200 flex items-center gap-1.5"
            >
              {gpsDetecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              <span>{i18n.language === 'hi' ? 'GPS से खोजें' : 'Auto-Detect GPS'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {i18n.language === 'hi' ? 'पूरा पता' : 'Full Street Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {i18n.language === 'hi' ? 'वार्ड' : 'Municipal Ward'}
              </label>
              <select
                value={ward}
                onChange={e => setWard(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="Ward 1 - Metro North">Ward 1 - Metro North</option>
                <option value="Ward 2 - Civic Tech Hub">Ward 2 - Civic Tech Hub</option>
                <option value="Ward 3 - Heritage Square">Ward 3 - Heritage Square</option>
                <option value="Ward 4 - Central Promenade">Ward 4 - Central Promenade</option>
                <option value="Ward 5 - Waterfront East">Ward 5 - Waterfront East</option>
                <option value="Ward 6 - Southern Industrial Park">Ward 6 - Southern Industrial Park</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Triage Card Preview */}
        {aiResult && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>CivicPulse AI Triage</span>
              </div>
              <div className="flex items-center gap-2">
                {typeof aiResult.priorityConfidence === 'number' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                    Confidence: {aiResult.priorityConfidence}%
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                  Routed to: {aiResult.recommendedDepartment}
                </span>
              </div>
            </div>
            <p className="text-xs text-indigo-800 dark:text-indigo-300">
              "{aiResult.summary}"
            </p>
            {aiResult.keyKeywords && aiResult.keyKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {aiResult.keyKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Anonymous Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {i18n.language === 'hi' ? 'गुमनाम नागरिक के रूप में सबमिट करें' : 'Submit as Anonymous Citizen'}
              </div>
              <div className="text-[11px] text-slate-500">
                {i18n.language === 'hi' ? 'आपका नाम सार्वजनिक लॉग से छिपा रहेगा।' : 'Your name will be hidden from public logs.'}
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {i18n.language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-medium text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{i18n.language === 'hi' ? 'दर्ज हो रहा है...' : 'Lodging Ticket...'}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{i18n.language === 'hi' ? 'शिकायत सबमिट करें' : 'Submit Complaint Ticket'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
