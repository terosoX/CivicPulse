import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldAlert,
  Sparkles,
  Bell,
  Save,
  CheckCircle2,
  Lock,
  Smartphone,
  AlertTriangle,
  Building
} from 'lucide-react';
import { SystemSettings } from '../../types';

interface SystemSettingsModuleProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => Promise<void>;
}

export default function SystemSettingsModule({
  settings,
  onUpdateSettings,
}: SystemSettingsModuleProps) {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-[#1F2937] text-slate-700 dark:text-slate-300">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Global Platform Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure system branding, CivicPulse AI classification thresholds, SLA breach alerts, MFA security policies, and Maintenance Mode.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Settings Saved Successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand & Contact Info */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-4 h-4 text-blue-500" />
            Branding & Public Contact Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Portal Name
              </label>
              <input
                type="text"
                value={formData.portalName}
                onChange={(e) => setFormData({ ...formData, portalName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                City Corporation Name
              </label>
              <input
                type="text"
                value={formData.cityCorporationName}
                onChange={(e) => setFormData({ ...formData, cityCorporationName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Public Helpline Toll-Free Phone
              </label>
              <input
                type="text"
                value={formData.helplinePhone}
                onChange={(e) => setFormData({ ...formData, helplinePhone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* CivicPulse AI & Automation Controls */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#374151] shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-[#374151] pb-3">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            CivicPulse AI Auto-Triage & Spam Detection Settings
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Enable CivicPulse AI Auto-Classification</div>
                <div className="text-slate-500">Automatically predict category, priority, and department for incoming issues</div>
              </div>
              <input
                type="checkbox"
                checked={formData.aiClassificationEnabled}
                onChange={(e) => setFormData({ ...formData, aiClassificationEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>AI Spam / Fake Report Sensitivity Score ({formData.aiSpamDetectionSensitivity}%)</span>
                <span>Threshold: {formData.aiSpamDetectionSensitivity}</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={formData.aiSpamDetectionSensitivity}
                onChange={(e) => setFormData({ ...formData, aiSpamDetectionSensitivity: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
              <p className="text-[11px] text-slate-500">Reports flagged above this confidence level will be routed to spam moderation</p>
            </div>
          </div>
        </div>

        {/* Security & System Controls */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-purple-500" />
            Security & Emergency Overrides
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
              <div>
                <div className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  System Emergency Maintenance Mode
                </div>
                <div className="text-red-600/80 dark:text-red-400">
                  When enabled, non-admin citizens will see a maintenance notice banner.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.maintenanceMode}
                onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                className="w-5 h-5 rounded text-red-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Enforce MFA for All Municipal Admins</div>
                <div className="text-slate-500">Require 2-Factor Authentication for department staff & admins</div>
              </div>
              <input
                type="checkbox"
                checked={formData.mfaEnforcedForAllAdmins}
                onChange={(e) => setFormData({ ...formData, mfaEnforcedForAllAdmins: e.target.checked })}
                className="w-5 h-5 rounded text-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            Save Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
}
