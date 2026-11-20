import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, MapPin, Building2, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';

interface AuthModalProps {
  initialRole?: 'citizen' | 'admin';
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
}

export default function AuthModal({ initialRole = 'citizen', onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [role, setRole] = useState<'citizen' | 'admin'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('Ward 4 - Central Promenade');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password, role);
        onSuccess(res.user, res.token);
      } else if (mode === 'register') {
        const res = await api.register({ name, email, password, phone, ward });
        onSuccess(res.user, res.token);
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setMessage(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoRole: 'citizen' | 'admin' | 'officer' | 'field_worker' | 'super_admin') => {
    setPassword('password123');
    if (demoRole === 'citizen') {
      setEmail('citizen@smartcity.gov');
      setRole('citizen');
    } else if (demoRole === 'admin') {
      setEmail('admin@smartcity.gov');
      setRole('admin');
    } else if (demoRole === 'officer') {
      setEmail('roads@smartcity.gov');
      setRole('admin');
    } else if (demoRole === 'field_worker') {
      setEmail('worker@smartcity.gov');
      setRole('admin');
    } else if (demoRole === 'super_admin') {
      setEmail('superadmin@smartcity.gov');
      setRole('admin');
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
        aria-labelledby="auth-modal-title"
        className="bg-white dark:bg-[#111827] w-full max-w-md h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-[#374151] shadow-2xl overflow-hidden relative text-left transition-all"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 shrink-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-[#374151] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 id="auth-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              CivicPulse Identity Portal
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Role Selector Tabs */}
          <div className="flex bg-slate-100 dark:bg-[#1F2937] p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('citizen')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                role === 'citizen'
                  ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Citizen Portal
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                role === 'admin'
                  ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Government Official
            </button>
          </div>

          {/* Subheading */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'login' && (role === 'citizen' ? 'Citizen Sign In' : 'Municipal Official Sign In')}
              {mode === 'register' && 'Register Citizen Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'login' && 'Access municipal services, track reports & updates'}
              {mode === 'register' && 'Join the Smart City digital citizen network'}
              {mode === 'forgot' && 'Enter your registered email to receive a recovery link'}
            </p>
          </div>

          {/* Demo Credentials Helper */}
          <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs">
            <div className="text-blue-900 dark:text-blue-200 font-bold mb-2 flex items-center justify-between">
              <span>Quick Role Demo (Zero API Key):</span>
              <span className="text-[10px] font-normal text-blue-700 dark:text-blue-300">Self-Managed Auth</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('citizen')}
                className="px-2 py-2 min-h-[36px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-colors text-center"
              >
                1. Citizen
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="px-2 py-2 min-h-[36px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] transition-colors text-center"
              >
                2. Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('officer')}
                className="px-2 py-2 min-h-[36px] rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] transition-colors text-center"
              >
                3. Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('field_worker')}
                className="px-2 py-2 min-h-[36px] rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition-colors text-center"
              >
                4. Field Worker
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('super_admin')}
                className="px-2 py-2 min-h-[36px] rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] transition-colors col-span-2 sm:col-span-1 text-center"
              >
                5. Super Admin
              </button>
            </div>
            <div className="text-[10px] text-blue-800 dark:text-blue-300 font-mono truncate">
              {email || 'Select a role above'} • password123
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              {message}
            </div>
          )}

          <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="citizen@smartcity.gov"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 555-0192"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Municipal Ward / Area
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={ward}
                      onChange={e => setWard(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#374151] bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
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
              </>
            )}
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-20 shrink-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 pb-safe border-t border-slate-200 dark:border-[#374151] flex flex-col gap-3">
          <button
            type="submit"
            form="auth-form"
            disabled={loading}
            className="w-full py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In to Portal'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'forgot' && 'Send Password Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
            {mode === 'login' ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 text-[11px]"
                >
                  Forgot Password?
                </button>
                {role === 'citizen' && (
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                  >
                    Create Account
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-blue-600 dark:text-blue-400 mx-auto hover:underline text-[11px]"
              >
                ← Return to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
