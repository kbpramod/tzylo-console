'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TranscriptUtterance } from '@/types/meeting';

export type WebSocketConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface BackendLiveSegment {
  id?: string;
  speaker?: string;
  text?: string;
  completed?: boolean;
  start_time?: number;
  end_time?: number;
  startTime?: number;
  endTime?: number;
  timestamp?: string;
}

export interface BackendLiveStreamMessage {
  type: 'connected' | 'catch_up' | 'transcript' | 'status' | 'pong' | 'error';
  meeting_id?: string;
  speakers?: string[];
  total_segments?: number;
  segments?: BackendLiveSegment[];
  segment?: BackendLiveSegment;
  status?: string;
}

// Consistent palette for speakers
const SPEAKER_COLORS = [
  '#38bdf8', // Cyan
  '#34d399', // Emerald
  '#a78bfa', // Purple
  '#f472b6', // Pink
  '#fbbf24', // Amber
  '#fb923c', // Orange
  '#2dd4bf', // Teal
  '#818cf8', // Indigo
];

export function getSpeakerColor(speaker: string): string {
  if (!speaker) return '#38bdf8';
  let hash = 0;
  for (let i = 0; i < speaker.length; i++) {
    hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % SPEAKER_COLORS.length;
  return SPEAKER_COLORS[idx];
}

export function formatSecondsToTimestamp(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `00:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getLiveMeetingWsUrl(meetingId: string): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  let base = envBase;

  if (!base && typeof window !== 'undefined') {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    base = `${proto}//${host}:8000`;
  }

  base = base || 'http://localhost:8000';

  const wsProto = base.startsWith('https') ? 'wss:' : 'ws:';
  const cleanHost = base.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `${wsProto}//${cleanHost}/api/v1/meetings/${encodeURIComponent(meetingId)}/live/ws`;
}

function normalizeSegment(seg: BackendLiveSegment, indexFallback: number): TranscriptUtterance {
  const speakerName = seg.speaker || 'Speaker';
  const startTime = seg.start_time ?? seg.startTime;
  const endTime = seg.end_time ?? seg.endTime;
  const completed = seg.completed !== false; // defaults to true unless explicitly false

  return {
    id: seg.id || `seg_${Date.now()}_${indexFallback}`,
    speaker: speakerName,
    text: seg.text || '',
    timestamp: seg.timestamp || formatSecondsToTimestamp(startTime),
    speakerColor: getSpeakerColor(speakerName),
    completed,
    isDraft: !completed,
    startTime: startTime ?? undefined,
    endTime: endTime ?? undefined,
  };
}

export interface UseMeetingLiveTranscriptOptions {
  meetingId: string | null;
  enabled?: boolean;
  initialTranscript?: TranscriptUtterance[];
  onStatusChange?: (status: string) => void;
  onNewUtterance?: (utterance: TranscriptUtterance) => void;
}

export function useMeetingLiveTranscript({
  meetingId,
  enabled = true,
  initialTranscript = [],
  onStatusChange,
  onNewUtterance,
}: UseMeetingLiveTranscriptOptions) {
  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>('idle');
  const [liveTranscript, setLiveTranscript] = useState<TranscriptUtterance[]>(initialTranscript);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [knownSpeakers, setKnownSpeakers] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const activeSpeakerTimeoutRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  // Sync initial transcript if provided and state is empty
  useEffect(() => {
    if (initialTranscript.length > 0 && liveTranscript.length === 0) {
      setLiveTranscript(initialTranscript);
    }
  }, [initialTranscript, liveTranscript.length]);

  const clearTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (activeSpeakerTimeoutRef.current) {
      clearTimeout(activeSpeakerTimeoutRef.current);
      activeSpeakerTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!meetingId || !enabled) {
      setConnectionStatus('idle');
      return;
    }

    clearTimers();

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsUrl = getLiveMeetingWsUrl(meetingId);
    console.log(`[MeetingWS] Connecting to ${wsUrl}`);
    setConnectionStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log(`[MeetingWS] Connected to meeting ${meetingId}`);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Keepalive ping every 20 seconds
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
            } catch (e) {
              // Ignore
            }
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg: BackendLiveStreamMessage = JSON.parse(event.data);

          if (msg.type === 'connected') {
            setConnectionStatus('connected');
            if (msg.speakers && Array.isArray(msg.speakers)) {
              setKnownSpeakers(msg.speakers);
            }
          } else if (msg.type === 'catch_up' && Array.isArray(msg.segments)) {
            const normalizedBacklog = msg.segments.map((s, idx) => normalizeSegment(s, idx));
            setLiveTranscript((prev) => {
              // If we already have live utterances, preserve any new ones not in backlog
              if (prev.length === 0) return normalizedBacklog;
              const backlogIds = new Set(normalizedBacklog.map((s) => s.id));
              const extras = prev.filter((p) => !backlogIds.has(p.id) && !p.id.startsWith('init_'));
              return [...normalizedBacklog, ...extras];
            });
            const speakers = Array.from(new Set(msg.segments.map((s) => s.speaker || 'Speaker')));
            setKnownSpeakers((prev) => Array.from(new Set([...prev, ...speakers])));
          } else if (msg.type === 'transcript' && msg.segment) {
            const incoming = normalizeSegment(msg.segment, Date.now());

            // Update active speaker indicator
            setActiveSpeaker(incoming.speaker);
            setIsTranscribing(!incoming.completed);
            if (activeSpeakerTimeoutRef.current) {
              clearTimeout(activeSpeakerTimeoutRef.current);
            }
            activeSpeakerTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                setActiveSpeaker(null);
                setIsTranscribing(false);
              }
            }, 3500);

            setKnownSpeakers((prev) =>
              prev.includes(incoming.speaker) ? prev : [...prev, incoming.speaker]
            );

            setLiveTranscript((prev) => {
              // Reconcile logic:
              // 1. If segment exists by ID, update it in place
              const existingIdx = prev.findIndex((utt) => utt.id === incoming.id);
              if (existingIdx !== -1) {
                const next = [...prev];
                next[existingIdx] = incoming;
                return next;
              }

              // 2. If it's a draft update for the last utterance from the same speaker
              if (
                prev.length > 0 &&
                prev[prev.length - 1].isDraft &&
                prev[prev.length - 1].speaker === incoming.speaker
              ) {
                const next = [...prev];
                next[next.length - 1] = incoming;
                return next;
              }

              // 3. Otherwise append as new utterance
              if (onNewUtterance) {
                onNewUtterance(incoming);
              }
              return [...prev, incoming];
            });
          } else if (msg.type === 'status' && msg.status) {
            if (onStatusChange) {
              onStatusChange(msg.status);
            }
          }
        } catch (err) {
          console.warn('[MeetingWS] Failed to parse message frame:', err, event.data);
        }
      };

      ws.onerror = (err) => {
        console.warn(`[MeetingWS] Error on connection for meeting ${meetingId}:`, err);
        if (mountedRef.current) {
          setConnectionStatus('error');
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        console.log(`[MeetingWS] Disconnected (code=${event.code}) for meeting ${meetingId}`);
        setConnectionStatus('disconnected');

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Automatic exponential backoff reconnection if meeting is active
        if (enabled && reconnectAttemptsRef.current < 8) {
          const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 15000);
          reconnectAttemptsRef.current += 1;
          console.log(`[MeetingWS] Reconnecting in ${delay}ms (attempt #${reconnectAttemptsRef.current})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, delay);
        }
      };
    } catch (exc) {
      console.error('[MeetingWS] Exception initializing WebSocket:', exc);
      setConnectionStatus('error');
    }
  }, [meetingId, enabled, clearTimers, onNewUtterance, onStatusChange]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, clearTimers]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  const sendPing = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    liveTranscript,
    setLiveTranscript,
    activeSpeaker,
    isTranscribing,
    knownSpeakers,
    reconnect,
    sendPing,
  };
}
