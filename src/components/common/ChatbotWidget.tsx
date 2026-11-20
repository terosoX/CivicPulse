import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, X, Minimize2, Maximize2, Trash2, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';
import { User as UserType } from '../../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface ChatbotWidgetProps {
  currentUser?: UserType | null;
}

const QUICK_SUGGESTIONS = [
  'Status of CIV-2026-8812',
  'How do I file a complaint?',
  'Emergency helpline numbers',
  'List municipal departments',
];

export default function ChatbotWidget({ currentUser }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: `Hello ${currentUser ? currentUser.name.split(' ')[0] : 'Citizen'}. I am the **CivicPulse Municipal Assistant**.\n\nI can help you look up ticket statuses, learn how to file reports with photo evidence, or locate emergency helpline contacts.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history,
          userContext: currentUser ? { name: currentUser.name, ward: currentUser.ward, role: currentUser.role } : null,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "I am unable to retrieve that information right now. Please call the municipal toll-free helpline at 1800-233-2484.";

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        text: "The municipal helpdesk service is temporarily unreachable. Please verify your connection or call 1800-233-CIVIC.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `reset_${Date.now()}`,
        role: 'assistant',
        text: 'Chat history cleared. How can I assist you with municipal services today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-xs text-slate-900 dark:text-white mt-1.5 mb-0.5">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
            <span>{parseInlineBold(line.substring(2))}</span>
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1" />;
      }

      return (
        <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-0.5">
          {parseInlineBold(line)}
        </p>
      );
    });
  };

  const parseInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Unobtrusive, professional entry point anchored at bottom-right */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open Municipal Support Assistant"
          className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl shadow-lg border border-slate-700 text-xs font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Bot className="w-4 h-4 text-blue-400" />
          <span className="hidden min-[400px]:inline">Municipal Assistant</span>
          <span className="min-[400px]:hidden">Assistant</span>
        </button>
      )}

      {/* Slide-over / Modal Chat Window */}
      {isOpen && (
        <aside
          aria-label="CivicPulse Assistant Window"
          className={`fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-5 sm:right-5 z-40 sm:w-[380px] bg-white dark:bg-[#111827] rounded-xl border border-[#E5E7EB] dark:border-[#374151] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-14' : 'h-[min(520px,82dvh)] max-h-[82dvh]'
          }`}
        >
          {/* Header */}
          <div className="bg-[#111827] dark:bg-[#080E1A] text-white p-2.5 px-3.5 sm:px-4 flex items-center justify-between shrink-0 border-b border-[#1F2937] dark:border-[#374151]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-blue-700 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-xs text-white leading-tight truncate">
                  CivicPulse Assistant
                </h3>
                <p className="text-[10px] text-slate-400 leading-tight truncate">
                  Municipal Advisory System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={clearChat}
                title="Clear Chat"
                aria-label="Clear chat"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close assistant"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Official Advisory Banner */}
              <div className="px-3 py-1.5 bg-[#F9FAFB] dark:bg-[#1F2937] border-b border-[#E5E7EB] dark:border-[#374151] flex items-center gap-1.5 text-[10px] text-[#667085] dark:text-[#9CA3AF]">
                <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Advisory information only. Official decisions are verified by city staff.</span>
              </div>

              {/* Quick Suggestions Bar */}
              <div className="p-2 border-b border-[#E5E7EB] dark:border-[#374151] overflow-x-auto no-scrollbar shrink-0 flex gap-1.5 text-[11px] bg-white dark:bg-[#111827]">
                {QUICK_SUGGESTIONS.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(chip)}
                    className="px-2.5 py-1.5 min-h-[32px] rounded bg-[#F9FAFB] dark:bg-[#1F2937] hover:bg-[#E5E7EB] dark:hover:bg-[#374151] text-[#111827] dark:text-[#D1D5DB] border border-[#E5E7EB] dark:border-[#374151] whitespace-nowrap transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Conversation Area */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-white dark:bg-[#111827]">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#F9FAFB] dark:bg-[#1F2937] text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#374151]'
                      }`}
                    >
                      {renderFormattedText(m.text)}
                    </div>
                    <span className="text-[10px] text-[#667085] dark:text-[#9CA3AF] mt-0.5 px-1 font-mono">
                      {m.timestamp}
                    </span>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-[#667085] dark:text-[#9CA3AF] py-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2563EB] dark:text-[#60A5FA]" />
                    <span>Processing municipal query...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="p-2.5 pb-safe bg-[#F9FAFB] dark:bg-[#1F2937] border-t border-[#E5E7EB] dark:border-[#374151] shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about ticket, category, or helpline..."
                    className="flex-1 min-w-0 px-3 py-2 rounded-md border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm sm:text-xs text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#667085] dark:placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-md bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    aria-label="Send query"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
}
