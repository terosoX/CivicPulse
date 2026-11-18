import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, CheckCircle2 } from 'lucide-react';
import { Complaint } from '../../types';

interface CommunicationToolsProps {
  complaints: Complaint[];
}

export default function CommunicationTools({ complaints }: CommunicationToolsProps) {
  const { t, i18n } = useTranslation();
  const [selectedTicketId, setSelectedTicketId] = useState(complaints[0]?.id || '');
  const [channel, setChannel] = useState<'SMS' | 'EMAIL' | 'PORTAL'>('SMS');
  const [message, setMessage] = useState('Your municipal complaint ticket # extends field work today.');
  const [sentMsg, setSentMsg] = useState('');

  const activeTicket = complaints.find((c) => c.id === selectedTicketId) || complaints[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSentMsg(
      i18n.language === 'hi'
        ? `${channel} के माध्यम से नागरिक ${activeTicket?.citizenName || 'आरव शर्मा'} को सूचना भेजी गई`
        : `Notification sent via ${channel} to citizen ${activeTicket?.citizenName || 'Aarav Sharma'}`
    );
    setTimeout(() => setSentMsg(''), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          {i18n.language === 'hi' ? 'नागरिक टिकट चुनें' : 'Select Citizen Ticket'}
        </h3>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {complaints.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedTicketId(c.id)}
              className={`p-3 rounded-2xl border cursor-pointer ${
                activeTicket?.id === c.id
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 font-bold'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="text-xs font-mono text-blue-600 dark:text-blue-400">{c.ticketNumber}</div>
              <div className="text-xs text-slate-900 dark:text-white font-semibold truncate">{c.title}</div>
              <div className="text-[10px] text-slate-400">{i18n.language === 'hi' ? 'नागरिक: ' : 'Citizen: '}{c.citizenName}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
          {i18n.language === 'hi' ? 'नागरिक को संचार सूचना भेजें' : 'Send Citizen Communication Notice'}
        </h3>

        {sentMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{sentMsg}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {i18n.language === 'hi' ? 'माध्यम' : 'Channel'}
            </label>
            <div className="flex gap-2">
              {(['SMS', 'EMAIL', 'PORTAL'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                    channel === ch
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {i18n.language === 'hi' ? 'सूचना संदेश पाठ' : 'Notification Message Text'}
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{i18n.language === 'hi' ? 'नागरिक को नोटिस भेजें' : 'Dispatch Notice to Citizen'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
