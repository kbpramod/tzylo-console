'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Mic,
  Globe,
  UserCheck,
  Sparkles,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (params: {
    meetingUrl: string;
    botName: string;
    transcribe: boolean;
    language: string;
  }) => Promise<void>;
  isDeploying?: boolean;
}

export function JoinMeetingModal({
  isOpen,
  onClose,
  onJoin,
  isDeploying = false,
}: JoinMeetingModalProps) {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [botName, setBotName] = useState('Tzylo');
  const [transcribe, setTranscribe] = useState(true);
  const [language, setLanguage] = useState('auto');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingUrl.trim()) {
      setError('Please paste a valid meeting URL.');
      return;
    }
    setError(null);
    try {
      await onJoin({
        meetingUrl: meetingUrl.trim(),
        botName: botName.trim() || 'Tzylo',
        transcribe,
        language,
      });
      setMeetingUrl('');
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to dispatch meeting bot.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-50 w-full max-w-md rounded-xl border border-zinc-800 bg-[#09090b] p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex flex-col gap-1.5 text-left pb-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center">
              <Video className="h-4 w-4 text-zinc-950" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
              Join a Meeting
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Paste a Google Meet, Zoom, or Teams URL to start transcribing automatically
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Meeting URL */}
          <div className="space-y-1.5">
            <label
              htmlFor="meetingInput"
              className="text-xs font-medium text-zinc-300"
            >
              Meeting URL or Code
            </label>
            <div className="relative">
              <input
                id="meetingInput"
                type="text"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="Paste meeting URL (Google Meet, Zoom, or Teams)..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-zinc-100 font-mono placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition h-11"
                autoFocus
              />
            </div>
          </div>

          {/* Bot Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="botName"
              className="text-xs font-medium text-zinc-300"
            >
              Bot Name
            </label>
            <input
              id="botName"
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="Tzylo"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 transition h-10 font-mono"
            />
          </div>

          {/* Real-time Transcription Switch */}
          <div className="flex items-center justify-between py-1">
            <label
              htmlFor="transcribe"
              className="text-xs font-medium text-zinc-300 flex items-center gap-2 cursor-pointer select-none"
            >
              <Mic className="h-3.5 w-3.5 text-cyan-400" />
              Real-time Transcription
            </label>
            <button
              type="button"
              role="switch"
              id="transcribe"
              aria-checked={transcribe}
              onClick={() => setTranscribe(!transcribe)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                transcribe ? 'bg-cyan-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  transcribe ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Transcription Language */}
          <div className="space-y-1.5">
            <label
              htmlFor="language"
              className="text-xs font-medium text-zinc-300 flex items-center gap-2"
            >
              <Globe className="h-3.5 w-3.5 text-zinc-400" />
              Transcription Language
            </label>
            <div className="relative">
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 transition h-10 appearance-none cursor-pointer"
              >
                <option value="auto">Auto-detect</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="ja-JP">Japanese</option>
                <option value="hi-IN">Hindi</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            </div>
            <p className="text-[11px] text-zinc-500">
              Auto-detect: the service will detect the language automatically.
            </p>
          </div>

          {/* Authenticated Switch (Disabled / Soon) */}
          <div className="flex items-center justify-between opacity-50 py-1">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-2 cursor-not-allowed select-none">
              <UserCheck className="h-3.5 w-3.5" />
              Authenticated
              <span className="text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                Soon
              </span>
            </label>
            <button
              type="button"
              role="switch"
              disabled
              className="inline-flex h-5 w-9 shrink-0 cursor-not-allowed items-center rounded-full bg-zinc-800 transition-colors"
            >
              <span className="block h-3.5 w-3.5 rounded-full bg-zinc-600 translate-x-1" />
            </button>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!meetingUrl.trim() || isDeploying}
              className="w-full h-11 rounded-lg font-medium text-sm bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow cursor-pointer font-sans"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Deploying Bot...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-zinc-950" />
                  <span>Start Transcription</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-md p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}
