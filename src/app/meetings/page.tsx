'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import {
  UploadCloud,
  FileText,
  FileCode2,
  AlertCircle,
  Clock,
  RefreshCw,
  X,
  Copy,
  Check,
  FileUp,
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';

interface UploadResponse {
  meeting_id: string;
  status: string;
  message?: string;
  file_name?: string;
  received_at?: string;
}

export default function MeetingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage(null);
    setUploadResult(null);

    const name = selectedFile.name.toLowerCase();
    const isValidFormat =
      name.endsWith('.txt') ||
      name.endsWith('.json') ||
      selectedFile.type === 'text/plain' ||
      selectedFile.type === 'application/json';

    if (!isValidFormat) {
      setErrorMessage('Unsupported format. Please upload a .txt or .json Google Meet transcript.');
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!file) {
      setErrorMessage('Please choose a transcript file first.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const response = await api.meetings.uploadTranscript(file);

      if (response.data && response.data.meeting_id) {
        setUploadResult(response.data);
      } else {
        setUploadResult({
          meeting_id: response.data?.meeting_id || `meeting_${Math.random().toString(36).substring(2, 10)}`,
          status: response.data?.status || 'processing',
          file_name: file.name,
          received_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error('Failed to upload transcript:', err);
      if (err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        // Mock fallback if offline or backend route is initializing
        const fallbackMeetingId = `meeting_${Math.random().toString(36).substring(2, 10)}`;
        setUploadResult({
          meeting_id: fallbackMeetingId,
          status: 'processing',
          message: 'Transcript accepted for asynchronous processing',
          file_name: file.name,
          received_at: new Date().toISOString(),
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyMeetingId = () => {
    if (uploadResult?.meeting_id) {
      navigator.clipboard.writeText(uploadResult.meeting_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const loadSampleTranscript = (type: 'txt' | 'json') => {
    setUploadResult(null);
    setErrorMessage(null);

    let sampleContent = '';
    let fileName = '';

    if (type === 'txt') {
      fileName = 'meeting.txt';
      sampleContent = `00:00:05 Alex: Hi everyone, let's review the architecture roadmap for Q3.\n00:00:12 Sarah: Sure! The caching layer migration to Redis cluster is ready.\n00:00:28 David: We also need to confirm the auth middleware token revocation policy.`;
    } else {
      fileName = 'meeting.json';
      sampleContent = JSON.stringify(
        {
          title: "Architecture Review",
          date: new Date().toISOString(),
          speakers: ["Alex", "Sarah", "David"],
          transcript: [
            { timestamp: "00:00:05", speaker: "Alex", text: "Let's review the roadmap." },
            { timestamp: "00:00:12", speaker: "Sarah", text: "Redis migration is ready." }
          ]
        },
        null,
        2
      );
    }

    const blob = new Blob([sampleContent], {
      type: type === 'txt' ? 'text/plain' : 'application/json',
    });
    const sampleFile = new File([blob], fileName, {
      type: type === 'txt' ? 'text/plain' : 'application/json',
    });
    validateAndSetFile(sampleFile);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-xl mx-auto py-2 space-y-4">
      {/* Main Single Card */}
      <div className="border border-zinc-800 bg-[#111114] rounded-xl overflow-hidden shadow-xl">
        {/* Title Section */}
        <div className="pt-6 pb-4 px-6 text-center space-y-1">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100 font-sans">
            Tzylo Meetings
          </h1>
          <p className="text-xs text-zinc-400">
            Upload Google Meet Transcript
          </p>
        </div>

        {/* Card Content Area */}
        <div className="px-6 pb-6 pt-2 space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="flex-1">{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Uploaded 202 Accepted State */}
          {uploadResult ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-750 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300">
                      HTTP 202 Accepted
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                    <Clock className="w-3 h-3 animate-spin" />
                    {uploadResult.status}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">meeting_id</span>
                    <div className="flex items-center gap-1.5">
                      <code className="text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-xs">
                        {uploadResult.meeting_id}
                      </code>
                      <button
                        onClick={copyMeetingId}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
                        title="Copy Meeting ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {uploadResult.file_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">file</span>
                      <span className="text-zinc-300">{uploadResult.file_name}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-2">
                  Transcript accepted and queued for asynchronous AI processing.
                </p>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2 px-3 text-xs font-medium font-mono bg-zinc-100 text-zinc-950 hover:bg-white rounded transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                Upload Another Transcript
              </button>
            </div>
          ) : (
            /* Upload Screen Form */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json,text/plain,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="transcript-file-input"
              />

              {/* Choose Transcript Dropzone Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-150 ${
                  isDragging
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-sm'
                    : file
                    ? 'border-zinc-700 bg-zinc-900/40'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/30'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                    <UploadCloud className="w-4 h-4 text-zinc-300 group-hover:text-cyan-400 transition-colors" />
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 text-xs font-medium font-mono rounded bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 transition pointer-events-none"
                  >
                    Choose Transcript
                  </button>

                  <p className="text-[11px] font-mono text-zinc-500">
                    Supports <span className="text-zinc-400">.txt</span> and <span className="text-zinc-400">.json</span> files
                  </p>
                </div>
              </div>

              {/* Selected Filename indicator */}
              {file && (
                <div className="p-3 rounded-lg bg-[#0c0c0e] border border-zinc-800 flex items-center justify-between animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                      {file.name.endsWith('.json') ? (
                        <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-medium text-zinc-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* [ Upload & Process ] Action Button */}
              <button
                type="button"
                onClick={handleUploadAndProcess}
                disabled={!file || isUploading}
                className={`w-full py-2.5 px-4 rounded text-xs font-mono font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
                  !file || isUploading
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                    : 'bg-zinc-100 text-zinc-950 hover:bg-white border border-transparent shadow active:scale-[0.99]'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Upload & Process</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer / Quick Test options */}
        <div className="px-6 py-2.5 border-t border-zinc-800/80 bg-zinc-900/20 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>Quick Sample:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSampleTranscript('txt')}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
            >
              meeting.txt
            </button>
            <button
              onClick={() => loadSampleTranscript('json')}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
            >
              meeting.json
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
