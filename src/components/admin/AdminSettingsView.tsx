import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  Download,
  Bell,
  Database,
  CheckCircle2,
  Save
} from 'lucide-react';
import { Complaint } from '../../types';
import { api } from '../../services/api';

interface AdminSettingsViewProps {
  complaints: Complaint[];
  onRefreshData?: () => void;
}

export default function AdminSettingsView({
  complaints,
  onRefreshData,
}: AdminSettingsViewProps) {
  // Settings Form States
  const [criticalSlaHours, setCriticalSlaHours] = useState(2);
  const [highSlaHours, setHighSlaHours] = useState(24);
  const [mediumSlaHours, setMediumSlaHours] = useState(48);
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(85);
  const [autoEscalateUpvotes, setAutoEscalateUpvotes] = useState(10);
  const [enableSmsBroadcast, setEnableSmsBroadcast] = useState(true);
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    api.getSystemSettings()
      .then((s) => {
        if (!s || typeof s !== 'object') return;
        if (typeof s.slaBreachHoursThreshold === 'number') {
          setHighSlaHours(s.slaBreachHoursThreshold);
        }
        if (typeof s.aiSpamDetectionSensitivity === 'number') {
          setAiConfidenceThreshold(s.aiSpamDetectionSensitivity);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await api.updateSystemSettings({
        slaBreachHoursThreshold: highSlaHours,
        aiSpamDetectionSensitivity: aiConfidenceThreshold,
      });
      setSavedSuccess(true);
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save system configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleExportDatabase = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(complaints, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CivicPulse_Database_Export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-[#EAECF0] dark:border-[#1E293B]">
        <h2 className="text-xl font-bold text-[#101828] dark:text-white tracking-tight">
          Platform Settings & System Configuration
        </h2>
        <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
          Configure SLA turnaround limits, CivicPulse AI parameters, priority escalation triggers, and data backup
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-5">
        {/* 1. SLA Turnaround Standards */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-xs font-bold text-[#101828] dark:text-white uppercase tracking-wider">
              1. Municipal SLA Turnaround Limits
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                Critical Severity SLA (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={criticalSlaHours}
                onChange={(e) => setCriticalSlaHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-mono font-bold text-[#DC2626]"
              />
              <span className="text-[10px] text-[#667085] mt-0.5 block">For emergency hazards & fires</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                High Priority SLA (Hours)
              </label>
              <input
                type="number"
                min={6}
                max={72}
                value={highSlaHours}
                onChange={(e) => setHighSlaHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-mono font-bold text-[#D97706]"
              />
              <span className="text-[10px] text-[#667085] mt-0.5 block">For major arterial road damage</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                Medium Priority SLA (Hours)
              </label>
              <input
                type="number"
                min={12}
                max={120}
                value={mediumSlaHours}
                onChange={(e) => setMediumSlaHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-mono font-bold text-[#2563EB]"
              />
              <span className="text-[10px] text-[#667085] mt-0.5 block">Standard maintenance requests</span>
            </div>
          </div>
        </div>

        {/* 2. AI Model & Classification Sensitivity */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#14B8A6]" />
            <h3 className="text-xs font-bold text-[#111827] dark:text-[#F9FAFB] uppercase tracking-wider">
              2. CivicPulse AI Sensitivity & Escalation Logic
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                Auto-Routing Confidence Threshold ({aiConfidenceThreshold}%)
              </label>
              <input
                type="range"
                min={50}
                max={99}
                value={aiConfidenceThreshold}
                onChange={(e) => setAiConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-[#2563EB]"
              />
              <span className="text-[10px] text-[#667085] mt-1 block">
                Reports exceeding this threshold auto-route directly to the field crew without manual triage.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] dark:text-slate-300 mb-1">
                Upvote Escalation Threshold ({autoEscalateUpvotes} Citizens)
              </label>
              <input
                type="range"
                min={3}
                max={25}
                value={autoEscalateUpvotes}
                onChange={(e) => setAutoEscalateUpvotes(Number(e.target.value))}
                className="w-full accent-[#2563EB]"
              />
              <span className="text-[10px] text-[#667085] mt-1 block">
                Complaints supported by this number of citizens automatically elevate to Critical priority.
              </span>
            </div>
          </div>
        </div>

        {/* 3. Notifications & Telemetry Broadcasts */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="text-xs font-bold text-[#101828] dark:text-white uppercase tracking-wider">
              3. Telemetry & Citizen Alerts
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={enableSmsBroadcast}
                onChange={(e) => setEnableSmsBroadcast(e.target.checked)}
                className="rounded border-[#D0D5DD] text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span className="text-[#344054] dark:text-slate-300">
                Dispatch automated SMS updates to citizens on ticket status changes
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={enableEmailAlerts}
                onChange={(e) => setEnableEmailAlerts(e.target.checked)}
                className="rounded border-[#D0D5DD] text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span className="text-[#344054] dark:text-slate-300">
                Email department heads immediately upon Critical SLA breach
              </span>
            </label>
          </div>
        </div>

        {/* 4. Municipal Data Backup & JSON Snapshot */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#16A34A]" />
              <h3 className="text-xs font-bold text-[#101828] dark:text-white uppercase tracking-wider">
                Municipal Data Backup & Export
              </h3>
            </div>
            <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1">
              Download the complete atomic JSON snapshot of all {complaints.length} tickets, coordinates, and audit records
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportDatabase}
            className="w-full sm:w-auto px-3.5 py-2.5 min-h-[40px] rounded-lg bg-white dark:bg-[#0F172A] border border-[#D0D5DD] dark:border-[#334155] text-[#344054] dark:text-slate-200 text-xs font-semibold hover:bg-[#F9FAFB] transition-colors flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#667085]" />
            <span>Download JSON Snapshot</span>
          </button>
        </div>

        {/* Save Changes Button */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {saveError && (
            <span className="text-xs font-semibold text-[#DC2626] dark:text-red-400">
              {saveError}
            </span>
          )}
          {savedSuccess && (
            <span className="text-xs font-semibold text-[#16A34A] dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings saved successfully!</span>
            </span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[42px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
