import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  Send,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  Navigation,
  HelpCircle,
  QrCode,
  Download
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IssueCategory, PriorityLevel, LocationData, AIAnalysisResult, User } from '../../types';
import { api } from '../../services/api';
import { exportComplaintsToPDF } from '../../utils/pdfExport';

interface EnterpriseReportIssueViewProps {
  user: User | null;
  onSubmitSuccess?: (ticketNumber: string) => void;
  onNavigateTab?: (tab: any) => void;
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

export default function EnterpriseReportIssueView({
  user,
  onSubmitSuccess,
  onNavigateTab,
}: EnterpriseReportIssueViewProps) {
  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Potholes & Road Damage');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [images, setImages] = useState<string[]>([]);
  const [address, setAddress] = useState('Central Promenade, Ward 4');
  const [ward, setWard] = useState('Ward 4 - Central Promenade');
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.209);
  const [citizenName, setCitizenName] = useState(user?.name || 'Aarav Sharma');
  const [citizenEmail, setCitizenEmail] = useState(user?.email || 'citizen@smartcity.gov');
  const [citizenPhone, setCitizenPhone] = useState(user?.phone || '+91 98765 43210');

  // AI Inference State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  // Submission & Validation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState('');

  // Leaflet Map Ref for interactive pin selection
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Fix default marker icon assets
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 14,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setLat(pos.lat);
      setLng(pos.lng);
      setAddress(`Pinned Point (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
    });

    map.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      setLat(clickLat);
      setLng(clickLng);
      marker.setLatLng([clickLat, clickLng]);
      setAddress(`Pinned Point (${clickLat.toFixed(4)}, ${clickLng.toFixed(4)})`);
    });

    mapInstanceRef.current = map;

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            map.invalidateSize();
          })
        : null;
    if (resizeObserver && mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver?.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker position when lat/lng change from GPS
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  // Image Upload & AI Analysis Handler
  const handleImageFile = (file: File) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      setFormErrors((prev) => ({ ...prev, image: 'Invalid file type. Only PNG, JPG, or WEBP images are allowed.' }));
      return;
    }
    if (file.size === 0 || file.size > maxBytes) {
      setFormErrors((prev) => ({ ...prev, image: 'Image file size must be 5 MB or less.' }));
      return;
    }
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      runAIInference(base64);
      try {
        const uploaded = await api.uploadImage(base64);
        setImages((prev) => [...prev, uploaded?.url || base64]);
      } catch {
        setImages((prev) => [...prev, base64]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const runAIInference = async (imgBase64: string) => {
    setAiAnalyzing(true);
    try {
      const res = await api.analyzeIssue({
        title: title || 'Reported Civic Issue',
        description: description || 'Visual infrastructure hazard captured on ground.',
        imageBase64: imgBase64,
        location: { lat, lng, address, ward },
      });

      if (res?.aiAnalysis) {
        setAiResult(res.aiAnalysis);
        if (res.aiAnalysis.detectedCategory) setCategory(res.aiAnalysis.detectedCategory);
        if (res.aiAnalysis.suggestedPriority) setPriority(res.aiAnalysis.suggestedPriority);
      }
    } catch (e: any) {
      if (e?.message) {
        setFormErrors((prev) => ({ ...prev, image: e.message }));
      }
    } finally {
      setAiAnalyzing(false);
    }
  };

  // GPS Auto-Detect
  const handleDetectGPS = () => {
    setGpsDetecting(true);
    setGpsStatusMsg('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setAddress(`GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          setGpsDetecting(false);
        },
        () => {
          setGpsDetecting(false);
          setGpsStatusMsg('GPS permission unavailable. Click anywhere on the map below to drop a pin.');
        }
      );
    } else {
      setGpsDetecting(false);
      setGpsStatusMsg('Browser geolocation unavailable. Click anywhere on the map below to drop a pin.');
    }
  };

  // Form Validation & Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 4) {
      errors.title = 'Title must be at least 4 characters long';
    }
    if (!description.trim() || description.trim().length < 8) {
      errors.description = 'Please provide a detailed description (min 8 characters)';
    }
    if (!address.trim()) {
      errors.address = 'Location address or map pin is required';
    }
    if (!citizenName.trim()) {
      errors.citizenName = 'Contact name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);

    try {
      const created = await api.createComplaint({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        location: { lat, lng, address: address.trim(), ward },
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800'],
        citizenName: citizenName.trim(),
        citizenId: user?.id || 'citizen_web_user',
        isAnonymous: false,
        aiAnalysis: aiResult || undefined,
        departmentAssigned: aiResult?.recommendedDepartment || 'Municipal Engineering',
      });

      setSubmittedTicket(created.ticketNumber);
      if (onSubmitSuccess) onSubmitSuccess(created.ticketNumber);
    } catch (err: any) {
      setFormErrors({ form: err.message || 'Failed to submit complaint' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-[#EAECF0] dark:border-[#1E293B]">
        <h2 className="text-xl font-bold text-[#101828] dark:text-white tracking-tight">
          Report an Issue
        </h2>
        <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
          Submit a verified civic infrastructure report with automatic CivicPulse Local AI triage & spatial geocoding
        </p>
      </div>

      {/* Confirmation State Card */}
      {submittedTicket ? (
        <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#ECFDF5] text-[#16A34A] flex items-center justify-center mx-auto border border-[#A7F3D0]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#16A34A]">
              Complaint Lodged Successfully
            </span>
            <h3 className="text-lg font-bold text-[#101828] dark:text-white mt-1">
              Ticket Number: <span className="font-mono text-[#2563EB]">{submittedTicket}</span>
            </h3>
            <p className="text-xs text-[#667085] dark:text-slate-400 max-w-md mx-auto mt-2">
              Your report has been securely registered in the municipal database. The AI triage engine has notified the dispatch unit for inspection.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => {
                setSubmittedTicket(null);
                setTitle('');
                setDescription('');
                setImages([]);
                setAiResult(null);
              }}
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors"
            >
              Report Another Issue
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('complaints')}
                className="px-4 py-2 rounded-lg bg-white dark:bg-[#0F172A] border border-[#D0D5DD] dark:border-[#334155] text-[#344054] dark:text-slate-200 text-xs font-semibold hover:bg-[#F9FAFB] transition-colors"
              >
                Track in Live Registry
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Submission Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {formErrors.form && (
            <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs">
              {formErrors.form}
            </div>
          )}

          {/* 1. Photograph Upload & Drag-and-Drop Area */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-[#101828] dark:text-white uppercase tracking-wider">
                  1. Evidence Photograph
                </h3>
                <p className="text-[11px] text-[#667085] dark:text-slate-400">
                  Upload an image of the pothole, waste dump, or broken infrastructure
                </p>
              </div>
              <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded font-semibold border border-[#BFDBFE] shrink-0">
                AI Auto-Triage Enabled
              </span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#D0D5DD] dark:border-[#334155] hover:border-[#2563EB] rounded-xl p-6 text-center transition-colors bg-[#F9FAFB] dark:bg-[#0F172A]"
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                id="photo-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                  e.target.value = '';
                }}
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1E293B] shadow-2xs flex items-center justify-center text-[#2563EB] border border-[#EAECF0] dark:border-[#334155]">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-[#2563EB] hover:underline">
                    Click to upload
                  </span>{' '}
                  <span className="text-[#667085]">or drag and drop evidence</span>
                </div>
                <p className="text-[11px] text-[#98A2B3]">PNG, JPG, or WEBP up to 5MB</p>
              </label>
            </div>
            {formErrors.image && (
              <p className="text-[11px] text-[#DC2626] font-medium">{formErrors.image}</p>
            )}

            {/* Image Preview Row */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-[#EAECF0] dark:border-[#334155]">
                    <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* AI Analysis Panel */}
            {aiAnalyzing && (
              <div className="p-3.5 rounded-lg bg-[#EFF6FF] dark:bg-[#0F1E36] border border-[#BFDBFE] dark:border-[#1E3A8A] flex items-center gap-2.5 text-xs text-[#1E40AF] dark:text-[#93C5FD]">
                <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                <span className="font-medium">
                  CivicPulse Local AI engine is analyzing photo features, detecting severity, and predicting department...
                </span>
              </div>
            )}

            {aiResult && !aiAnalyzing && (
              <div className="p-4 rounded-xl bg-[#EFF6FF] dark:bg-[#0F1E36] border border-[#BFDBFE] dark:border-[#1E3A8A] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#DBEAFE] dark:border-[#1E3A8A]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-xs font-bold text-[#1E40AF] dark:text-[#93C5FD]">
                      Rule-Based Bilingual Triage Panel
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#1E40AF] dark:text-[#93C5FD] bg-white dark:bg-[#111827] px-2 py-0.5 rounded border border-[#BFDBFE] dark:border-[#1E3A8A]">
                    {aiResult.trainedModelLoaded ? 'Hybrid ML + Rules' : `Deterministic Ontology (${aiResult.matchedRuleCount ?? aiResult.keyKeywords?.length ?? 0} keyword matches)`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[#667085] dark:text-slate-400 block">
                      Predicted Category
                    </span>
                    <span className="font-semibold text-[#101828] dark:text-white">
                      {aiResult.detectedCategory}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#667085] dark:text-slate-400 block">
                      Suggested Priority
                    </span>
                    <span className="font-semibold text-[#101828] dark:text-white">
                      {aiResult.suggestedPriority}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#667085] dark:text-slate-400 block">
                      Suggested Department
                    </span>
                    <span className="font-semibold text-[#101828] dark:text-white">
                      {aiResult.recommendedDepartment}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#1E40AF] dark:text-slate-300 pt-1 border-t border-[#DBEAFE] dark:border-[#1E3A8A]">
                  <strong>Detection Result:</strong> {aiResult.summary}
                </div>
              </div>
            )}
          </div>

          {/* 2. Issue Details */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#101828] dark:text-white uppercase tracking-wider">
              2. Issue Details & Category
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                Incident Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole causing vehicular blockage near Metro Gate 2"
                className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
              {formErrors.title && (
                <p className="text-[11px] text-[#DC2626] mt-1">{formErrors.title}</p>
              )}
            </div>

            {/* Category & Priority Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                  Issue Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-medium text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                  Priority Level *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-medium text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                >
                  <option value="Low">Low – Non-urgent aesthetic issue</option>
                  <option value="Medium">Medium – Standard maintenance request</option>
                  <option value="High">High – Traffic impediment or sanitation risk</option>
                  <option value="Critical">Critical – Immediate public hazard</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                Description & Circumstances *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue size, depth, safety danger, or duration of the problem..."
                className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none leading-relaxed"
              />
              {formErrors.description && (
                <p className="text-[11px] text-[#DC2626] mt-1">{formErrors.description}</p>
              )}
            </div>
          </div>

          {/* 3. Location & Interactive Map Pin Selector */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-[#101828] dark:text-white uppercase tracking-wider">
                  3. Location & GPS Geocoding
                </h3>
                <p className="text-[11px] text-[#667085] dark:text-slate-400">
                  Specify street address or click anywhere on the city map to drop a pin
                </p>
              </div>

              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={gpsDetecting}
                className="w-full sm:w-auto min-h-[36px] px-3 py-1.5 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/40 hover:bg-[#DBEAFE] dark:hover:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#BFDBFE] dark:border-blue-900/60 shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{gpsDetecting ? 'Detecting...' : 'Detect My GPS'}</span>
              </button>
            </div>

            {gpsStatusMsg && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                {gpsStatusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                  Street Address / Landmark *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, crossroad, or nearby building"
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                  Ward Jurisdiction
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-medium text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
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

            {/* Interactive Leaflet Map Selector */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#667085]">
                <span>Click on map or drag pin to fine-tune exact coordinates</span>
                <span className="font-mono text-[#2563EB]">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
              </div>
              <div
                ref={mapContainerRef}
                className="h-52 sm:h-56 w-full rounded-lg border border-[#EAECF0] dark:border-[#334155] overflow-hidden"
              />
            </div>
          </div>

          {/* 4. Contact Information */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#101828] dark:text-white uppercase tracking-wider">
              4. Citizen Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={citizenEmail}
                  onChange={(e) => setCitizenEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Municipal Core...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Grievance Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
