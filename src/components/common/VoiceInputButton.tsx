import React, { useState } from 'react';
import { Mic, MicOff, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface VoiceInputButtonProps {
  onParsed: (data: { title: string; description: string; category: string; priority: string }) => void;
}

export default function VoiceInputButton({ onParsed }: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartListening = () => {
    setErrorMessage(null);
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMessage('Speech recognition is not supported by your browser. Please type the complaint directly.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListening(true);
      setTranscript('');
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      setProcessing(true);

      try {
        const parsed = await api.parseVoice(text);
        onParsed(parsed);
      } catch {
        onParsed({
          title: text.slice(0, 40),
          description: text,
          category: 'Potholes & Road Damage',
          priority: 'Medium',
        });
      } finally {
        setProcessing(false);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setProcessing(false);
      setErrorMessage('Unable to capture voice audio. Please check microphone permissions or type directly.');
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={handleStartListening}
        disabled={listening || processing}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
          listening
            ? 'bg-red-500 text-white animate-pulse'
            : processing
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
        }`}
      >
        {processing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : listening ? (
          <MicOff className="w-3.5 h-3.5" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
        <span>
          {listening ? 'Listening...' : processing ? 'AI Structuring Voice...' : 'Dictate Issue (Voice)'}
        </span>
        <Sparkles className="w-3 h-3 text-amber-500" />
      </button>
      {transcript && (
        <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-1 italic">
          "{transcript}"
        </p>
      )}
      {errorMessage && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
}
