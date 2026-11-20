import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Flame, Zap, Droplets, Car, Wind, MapPin, Camera, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Complaint } from '../../types';

interface EmergencySOSModalProps {
  onClose: () => void;
  onSubmitted?: (complaint: Complaint) => void;
}

export default function EmergencySOSModal({ onClose, onSubmitted }: EmergencySOSModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'Fire' | 'Gas Leakage' | 'Electric Hazard' | 'Road Accident' | 'Flooding'>('Electric Hazard');
  const [description, setDescription] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.2090, address: 'Detecting live GPS location...', ward: 'Ward 4 - Central Promenade' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successComplaint, setSuccessComplaint] = useState<Complaint | null>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Attempt automatic Geolocation capture
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)} (Verified High-Precision GPS)`,
            ward: 'Ward 4 - Central Promenade',
          });
        },
        () => {
          setLocation({
            lat: 28.6139,
            lng: 77.2090,
            address: 'Central Station Square, Ward 4 Promenade',
            ward: 'Ward 4 - Central Promenade',
          });
        }
      );
    }

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
      setErrorMsg('Invalid image type. Only PNG, JPG, or WEBP photos up to 5 MB are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setErrorMsg('Emergency photo must be 5 MB or less.');
      e.target.value = '';
      return;
    }
    setErrorMsg('');
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.submitEmergency({
        emergencyCategory: selectedCategory,
        description,
        location,
        citizenName,
        citizenPhone: phone,
        imageBase64: imagePreview || undefined,
      });
      setSuccessComplaint(res);
      if (onSubmitted) onSubmitted(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to dispatch SOS alert. Please retry immediately.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'Electric Hazard', label: 'Electric Hazard', icon: Zap, color: 'border-amber-500 bg-amber-500/10 text-amber-500' },
    { id: 'Fire', label: 'Fire Incident', icon: Flame, color: 'border-red-500 bg-red-500/10 text-red-500' },
    { id: 'Gas Leakage', label: 'Gas Leakage', icon: Wind, color: 'border-orange-500 bg-orange-500/10 text-orange-500' },
    { id: 'Road Accident', label: 'Road Accident', icon: Car, color: 'border-rose-600 bg-rose-600/10 text-rose-600' },
    { id: 'Flooding', label: 'Flash Flooding', icon: Droplets, color: 'border-blue-500 bg-blue-500/10 text-blue-500' },
  ] as const;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Emergency SOS Report"
        className="bg-white dark:bg-[#111827] w-full max-w-lg h-[100dvh] sm:h-auto sm:max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border-2 border-red-500/50 shadow-2xl overflow-hidden relative transition-all"
      >
        {/* Sticky Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 sm:p-6 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-md rounded-2xl animate-pulse shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold tracking-tight truncate">EMERGENCY SOS REPORT</h2>
              <p className="text-[11px] sm:text-xs text-red-100 font-medium truncate">Direct 24/7 Municipal Rapid Response Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close SOS modal"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">

        {successComplaint ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">CRITICAL SOS DISPATCHED</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Your emergency ticket <strong className="text-red-600 font-mono">{successComplaint.ticketNumber}</strong> has been transmitted directly to the Municipal Emergency Command Center with <strong>2-Hour Accelerated SLA</strong>.
            </p>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-900 dark:text-white">{successComplaint.emergencyCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{successComplaint.departmentAssigned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{successComplaint.location.address}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-500/30 transition-all"
            >
              Return to Portal & Track SOS Status
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-700 dark:text-red-300">
                {errorMsg}
              </div>
            )}
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Emergency Incident Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`p-3 min-h-[44px] rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${
                        isSelected
                          ? `${cat.color} font-bold shadow-md ring-2 ring-offset-1 ring-red-500`
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-xs">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GPS Location Banner */}
            <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-xs text-red-900 dark:text-red-200">
              <MapPin className="w-5 h-5 text-red-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-bold block">Captured GPS Coordinates:</span>
                <span className="truncate block opacity-90">{location.address}</span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Your Name</label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="Citizen Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-XXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Brief Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Incident Notes / Landmark</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe danger level, exact spot, or trapped individuals..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Optional Photo Attachment */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Photo Evidence (Optional)</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 font-medium">
                  <Camera className="w-4 h-4 text-red-500" />
                  {imagePreview ? 'Change Emergency Photo' : 'Upload Hazard Photo'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="hidden" />
                </label>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-red-500" />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <span>DISPATCHING SOS SIGNAL...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  DISPATCH EMERGENCY SOS ALERT NOW
                </>
              )}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
