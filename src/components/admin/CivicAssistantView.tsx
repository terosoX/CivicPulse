import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User as UserIcon,
  Send,
  Trash2,
  RefreshCw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Languages
} from 'lucide-react';
import { User, Complaint } from '../../types';

interface CivicAssistantViewProps {
  user: User | null;
  complaints: Complaint[];
  onNavigateTab?: (tab: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const PRESET_QUERIES_EN = [
  'What is the status of ticket CIV-2026-8812?',
  'Which wards have active road damage complaints?',
  'Show average resolution time for Water Supply',
  'How do citizens submit photo evidence for potholes?',
  'List all high-severity complaints currently pending',
];

const PRESET_QUERIES_HI = [
  'शिकायत CIV-2026-8812 की वर्तमान स्थिति क्या है?',
  'वार्ड 4 में सड़क मरम्मत की क्या स्थिति है?',
  'सड़क के गड्ढों की शिकायत कैसे दर्ज करें?',
  'आपातकालीन हेल्पलाइन नंबर बताएं',
];

export default function CivicAssistantView({
  user,
  complaints,
  onNavigateTab,
}: CivicAssistantViewProps) {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      role: 'assistant',
      text:
        'Greetings! I am the **CivicPulse Smart City AI Intelligence Assistant**.\n\nI can analyze complaint patterns, track live ticket lifecycles, explain municipal SOPs, and provide instant bilingual operational summaries for city administrators and citizens.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (customQuery?: string) => {
    const query = (customQuery || inputValue).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputValue('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const token = localStorage.getItem('civic_token');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: query,
          history,
          userContext: user ? { name: user.name, role: user.role, ward: user.ward } : null,
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        'The Municipal Intelligence Core has recorded your inquiry. For direct dispatch coordination, contact the Central Control Room at 1800-233-2484.';

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const fallbackMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text:
          'Local offline fallback: Municipal knowledge base indicates active monitoring across 6 wards. For emergency dispatches, use the Emergency SOS button in the navigation header.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'init_fresh',
        role: 'assistant',
        text:
          lang === 'hi'
            ? 'सत्र रीसेट किया गया। मैं आपकी किस प्रकार सहायता कर सकता हूँ?'
            : 'Session refreshed. How can I assist you with city intelligence operations today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const currentPresets = lang === 'hi' ? PRESET_QUERIES_HI : PRESET_QUERIES_EN;

  return (
    <div className="space-y-3 sm:space-y-4 text-left max-w-5xl mx-auto flex flex-col h-[calc(100dvh-8.5rem)] min-h-[460px]">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAECF0] dark:border-[#1E293B] shrink-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-[#101828] dark:text-white tracking-tight">
              Civic Intelligence Assistant
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14B8A6]/10 text-[#0D9488] border border-[#99F6E4] whitespace-nowrap">
              Bilingual • EN / हिन्दी
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
            Real-time querying of ticket status, resolution telemetry, municipal policies, and dispatch directives
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-xs font-semibold text-[#344054] dark:text-slate-300 hover:bg-[#F9FAFB] flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Languages className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{lang === 'en' ? 'हिन्दी में पूछें' : 'Switch to English'}</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-xs font-semibold text-[#667085] hover:text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="flex-1 rounded-xl bg-white dark:bg-[#111827] border border-[#EAECF0] dark:border-[#374151] shadow-xs flex flex-col overflow-hidden min-h-0">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'bg-[#101828] text-[#14B8A6] border border-[#1E293B]'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-3.5 rounded-xl border relative group ${
                    isUser
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-[#F9FAFB] dark:bg-[#1F2937] text-[#101828] dark:text-slate-100 border-[#EAECF0] dark:border-[#374151]'
                  }`}
                >
                  <div className="whitespace-pre-line text-xs font-normal">
                    {m.text}
                  </div>

                  <div
                    className={`mt-2 flex items-center justify-between text-[10px] ${
                      isUser ? 'text-blue-100' : 'text-[#98A2B3]'
                    }`}
                  >
                    <span>{m.timestamp}</span>

                    {!isUser && (
                      <button
                        onClick={() => handleCopyText(m.id, m.text)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-[#101828] dark:hover:text-white"
                        title="Copy text"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-[#16A34A]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 text-xs leading-relaxed max-w-md">
              <div className="w-8 h-8 rounded-lg bg-[#101828] text-[#14B8A6] border border-[#1E293B] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3 rounded-xl bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] flex items-center gap-2 text-[#667085]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                <span>Processing municipal query...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="p-2.5 sm:p-3 bg-[#F9FAFB] dark:bg-[#1F2937] border-t border-[#EAECF0] dark:border-[#374151] shrink-0">
          <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#2563EB]" />
            <span>Suggested Municipal Intelligence Queries</span>
          </div>
          <div className="flex sm:flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
            {currentPresets.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="shrink-0 sm:shrink whitespace-nowrap sm:whitespace-normal px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-medium bg-white dark:bg-[#111827] border border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-slate-200 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-2.5 sm:p-3 pb-safe bg-white dark:bg-[#111827] border-t border-[#EAECF0] dark:border-[#374151] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                lang === 'hi'
                  ? 'शिकायत संख्या, वार्ड विवरण या नगर निगम नीति के बारे में पूछें...'
                  : 'Ask about ticket status, ward infrastructure, SLA policies, or dispatch status...'
              }
              disabled={loading}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-xs text-[#101828] dark:text-white placeholder-[#98A2B3] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="min-h-[40px] px-3.5 sm:px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send Query</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
