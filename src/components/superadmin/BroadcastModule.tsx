import React, { useState } from 'react';
import {
  Bell,
  Send,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Globe,
  MessageSquare
} from 'lucide-react';
import { EmergencyBroadcast } from '../../types';

interface BroadcastModuleProps {
  broadcasts: EmergencyBroadcast[];
  onSendBroadcast: (broadcast: {
    title: string;
    message: string;
    severity: 'Info' | 'Warning' | 'Critical';
    targetWards: string[];
    channels: string[];
  }) => Promise<void>;
}

export default function BroadcastModule({
  broadcasts,
  onSendBroadcast,
}: BroadcastModuleProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'Info' | 'Warning' | 'Critical'>('Warning');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['SMS', 'Push', 'Web Banner']);
  const [sentSuccess, setSentSuccess] = useState(false);

  const toggleChannel = (ch: string) => {
    if (selectedChannels.includes(ch)) {
      setSelectedChannels(selectedChannels.filter(c => c !== ch));
    } else {
      setSelectedChannels([...selectedChannels, ch]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    await onSendBroadcast({
      title,
      message,
      severity,
      targetWards: ['All Wards'],
      channels: selectedChannels,
    });

    setTitle('');
    setMessage('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Emergency Broadcast & Citizen Alert Dispatcher
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dispatch high-priority municipal alerts, severe weather warnings, or road closure notifications across mobile push, SMS gateway, and citizen portal banners.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-[#374151] pb-3">
            <Bell className="w-4 h-4 text-red-500" />
            Compose Emergency Alert
          </h3>

          {sentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Emergency Broadcast Dispatched Successfully to Citizen Channels!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alert Headline / Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. FLASH FLOOD WARNING: Ward 4 Low-Lying Promenade Road Closure"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Severity Tier
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white font-bold"
                >
                  <option value="Info">Info Notice</option>
                  <option value="Warning">Warning Priority</option>
                  <option value="Critical">Critical Emergency</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dispatch Channels
                </label>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {['SMS', 'Push', 'Web Banner'].map((ch) => (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`px-3 py-2 min-h-[36px] rounded-lg text-xs font-bold transition-all ${
                        selectedChannels.includes(ch)
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#1F2937] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Broadcast Detailed Message
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide advisory instructions, safety guidelines, or detour routes for citizens..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                Dispatch Emergency Alert Now
              </button>
            </div>
          </form>
        </div>

        {/* History Stream */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-[#374151] pb-3">
            <Radio className="w-4 h-4 text-amber-500" />
            Sent Broadcast History
          </h3>

          <div className="space-y-3">
            {broadcasts.map((bc) => (
              <div
                key={bc.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1F2937]/60 border border-slate-200/60 dark:border-[#374151]/60 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{bc.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      bc.severity === 'Critical'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {bc.severity}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">{bc.message}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40 dark:border-[#374151]/40">
                  <span>Reach: {bc.reachCount.toLocaleString()} Citizens</span>
                  <span>{new Date(bc.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
