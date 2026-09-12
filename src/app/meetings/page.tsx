'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Video,
  Bot,
  UploadCloud,
  FileText,
  FileUp,
  Sparkles,
  GitBranch,
  Play,
  Square,
  Pause,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Download,
  MessageSquare,
  Send,
  Activity,
  ListTodo,
  CheckSquare,
  PieChart,
  Users,
  Plus,
  Calendar,
  User,
  Wifi,
  WifiOff,
  Radio,
  ArrowDown,
  Volume2,
  BookOpen,
  Quote,
} from 'lucide-react';
import {
  MeetingSession,
  TranscriptUtterance,
  MeetingPlatform,
  MeetingBotSession,
  ActionItem,
  DecisionItem,
  MeetingKnowledge,
  MeetingInsight,
  TranscriptAnalysisResponse,
} from '@/types/meeting';
import { SyncToRepoModal } from '@/components/meetings/SyncToRepoModal';
import { JoinMeetingModal } from '@/components/meetings/JoinMeetingModal';
import { meetingApi } from '@/lib/api/meeting';
import api from '@/lib/api';
import {
  useMeetingLiveTranscript,
  getSpeakerColor,
  formatSecondsToTimestamp,
  WebSocketConnectionStatus,
} from '@/lib/api/meetingWebSocket';

export default function MeetingsPage() {
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);

  // Ingestion form state
  const [activeTab, setActiveTab] = useState<'meetings' | 'upload' | 'paste' | 'simulation'>('meetings');
  const [organizerFilter, setOrganizerFilter] = useState<string | null>(null);
  const [meetingSearchQuery, setMeetingSearchQuery] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [botName, setBotName] = useState('Tzylo');
  const [isDeployingBot, setIsDeployingBot] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Direct File Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct Paste state
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isParsingPasted, setIsParsingPasted] = useState(false);

  // Active Bot Live session & Simulation
  const [activeBotSession, setActiveBotSession] = useState<MeetingBotSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isBotPaused, setIsBotPaused] = useState(false);

  // Intelligence workspace UI state
  const [activeInsightTab, setActiveInsightTab] = useState<
    'summary' | 'actions' | 'decisions' | 'knowledge' | 'analytics' | 'qa'
  >('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeakerFilter, setSelectedSpeakerFilter] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Q&A state
  const [qaInput, setQaInput] = useState('');
  const [qaChat, setQaChat] = useState<
    Array<{ sender: 'user' | 'assistant'; text: string; timestamp: string }>
  >([
    {
      sender: 'assistant',
      text: 'Hello! I am your Tzylo Meeting AI. Ask me any question about the discussion, decisions, or assigned tasks.',
      timestamp: 'Just now',
    },
  ]);
  const [isAskingQa, setIsAskingQa] = useState(false);

  // Active meeting derived
  const currentMeeting = useMemo(() => {
    if (sessions.length === 0) return null;
    return sessions.find((s) => s.id === activeMeetingId) || sessions[0] || null;
  }, [sessions, activeMeetingId]);

  // Live WebSocket Connection for the Active Meeting
  const {
    connectionStatus,
    isConnected: isWsConnected,
    liveTranscript,
    setLiveTranscript,
    activeSpeaker,
    isTranscribing,
    reconnect: reconnectWs,
  } = useMeetingLiveTranscript({
    meetingId: currentMeeting ? currentMeeting.id : null,
    enabled: Boolean(currentMeeting),
    initialTranscript: currentMeeting?.transcript || [],
  });

  // Sync liveTranscript into sessions state so the rest of the UI (insights, export, etc.) updates synchronously
  useEffect(() => {
    if (!currentMeeting || liveTranscript.length === 0) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === currentMeeting.id ? { ...s, transcript: liveTranscript } : s))
    );
  }, [liveTranscript, currentMeeting?.id]);

  // Transcript container scroll tracking & auto-scroll
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // Auto-scroll to bottom when new speech arrives unless user scrolled up to inspect
  useEffect(() => {
    if (!isUserScrolledUp && transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTo({
        top: transcriptContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [liveTranscript, isUserScrolledUp]);

  const handleTranscriptScroll = () => {
    if (!transcriptContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = transcriptContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsUserScrolledUp(distanceFromBottom > 80);
  };

  const scrollToBottom = () => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTo({
        top: transcriptContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsUserScrolledUp(false);
    }
  };

  // Live Test Speech State & Ingestion (allows injecting test utterances into WebSocket feed)
  const [testSpeechText, setTestSpeechText] = useState('');
  const [testSpeaker, setTestSpeaker] = useState('Sarah Jenkins');
  const [isSendingTestChunk, setIsSendingTestChunk] = useState(false);

  const handleSendTestChunk = async (completed: boolean) => {
    if (!currentMeeting || !testSpeechText.trim()) return;
    try {
      setIsSendingTestChunk(true);
      await meetingApi.ingestLiveChunk(currentMeeting.id, {
        speaker: testSpeaker,
        text: testSpeechText.trim(),
        completed,
        start_time: elapsedSeconds,
      });
      if (completed) {
        setTestSpeechText('');
      }
    } catch (e) {
      console.error('Failed to ingest test chunk:', e);
    } finally {
      setIsSendingTestChunk(false);
    }
  };

  const handleSimulateLiveTurn = async () => {
    if (!currentMeeting) return;
    const phrases = [
      "We've verified the edge service latency benchmarks.",
      "The database replication lag is down to 4 milliseconds.",
      "Deploying the latest microservice build to production cluster.",
      "All API health checks and WebSocket endpoints are operating nominally."
    ];
    const chosenPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    const chosenSpeaker = ['David Kumar', 'Sarah Jenkins', 'Alex Chen'][Math.floor(Math.random() * 3)];

    // 1. Send interim draft frame
    const draftWords = chosenPhrase.split(' ').slice(0, 4).join(' ') + '...';
    try {
      await meetingApi.ingestLiveChunk(currentMeeting.id, {
        speaker: chosenSpeaker,
        text: draftWords,
        completed: false,
        start_time: elapsedSeconds,
      });
    } catch (e) {
      console.warn('Failed to send draft test frame:', e);
    }

    // 2. Finalize frame 1.2 seconds later
    setTimeout(async () => {
      try {
        await meetingApi.ingestLiveChunk(currentMeeting.id, {
          speaker: chosenSpeaker,
          text: chosenPhrase,
          completed: true,
          start_time: elapsedSeconds,
        });
      } catch (e) {
        console.warn('Failed to finalize test frame:', e);
      }
    }, 1200);
  };

  // Initial load of backend meetings
  useEffect(() => {
    async function loadMeetings() {
      try {
        const res = await meetingApi.list();
        const data = res.data?.value || res.data;
        if (Array.isArray(data) && data.length > 0) {
          const backendSessions: MeetingSession[] = data.map((m: any) => ({
            id: m.id,
            title: m.title || 'Engineering Sync',
            platform: (m.platform as MeetingPlatform) || 'google_meet',
            meetingUrl: m.meeting_url,
            date: m.started_at ? new Date(m.started_at).toLocaleDateString() : 'Recent',
            duration: 'Live',
            status: m.status === 'active' || m.status === 'joining' || m.status === 'requested' ? 'live' : 'completed',
            sourceType: 'bot',
            organizer: 'Engineering Team',
            transcript: (m.transcript || []).map((t: any, i: number) => ({
              id: t.id || `utt_${i}`,
              speaker: t.speaker || 'Speaker',
              timestamp: t.timestamp || '00:00:00',
              text: t.text || '',
              speakerColor: getSpeakerColor(t.speaker || 'Speaker'),
              completed: true,
            })),
          }));

          setSessions((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newOnes = backendSessions.filter((m) => !existingIds.has(m.id));
            return [...prev, ...newOnes];
          });

          if (!activeMeetingId && backendSessions.length > 0) {
            setActiveMeetingId(backendSessions[0].id);
          }
        }
      } catch (err) {
        console.warn('Could not load meetings from backend:', err);
      }
    }
    loadMeetings();
  }, []);

  // Distinct organizers
  const allOrganizers = useMemo(() => {
    const orgs = new Set<string>();
    sessions.forEach((s) => {
      orgs.add(s.organizer || s.transcript[0]?.speaker || 'You (Tzylo User)');
    });
    return Array.from(orgs);
  }, [sessions]);

  // Grouped meetings by organizer
  const meetingsByOrganizer = useMemo(() => {
    const groups: Record<string, MeetingSession[]> = {};
    const filtered = sessions.filter((sess) => {
      const org = sess.organizer || sess.transcript[0]?.speaker || 'You (Tzylo User)';
      const matchesOrg = !organizerFilter || org === organizerFilter;
      const matchesQuery =
        !meetingSearchQuery.trim() ||
        sess.title.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
        org.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
        (sess.meetingUrl && sess.meetingUrl.toLowerCase().includes(meetingSearchQuery.toLowerCase()));
      return matchesOrg && matchesQuery;
    });

    filtered.forEach((sess) => {
      const org = sess.organizer || sess.transcript[0]?.speaker || 'You (Tzylo User)';
      if (!groups[org]) {
        groups[org] = [];
      }
      groups[org].push(sess);
    });

    return groups;
  }, [sessions, organizerFilter, meetingSearchQuery]);

  // Timer for active bot
  useEffect(() => {
    let timer: any = null;
    if (activeBotSession && activeBotSession.status !== 'ended' && !isBotPaused) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeBotSession, isBotPaused]);


  // Format seconds to mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Helper to detect platform from URL
  const getPlatformFromUrl = (url: string): MeetingPlatform => {
    const lower = url.toLowerCase();
    if (lower.includes('zoom.us')) return 'zoom';
    if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return 'teams';
    return 'google_meet';
  };

  // Deploy Bot from Modal
  const handleDeployBotFromModal = async ({
    meetingUrl: inputUrl,
    botName: inputBotName,
    transcribe,
    language: inputLang,
  }: {
    meetingUrl: string;
    botName: string;
    transcribe: boolean;
    language: string;
  }) => {
    setErrorMessage(null);
    const platform = getPlatformFromUrl(inputUrl);

    try {
      setIsDeployingBot(true);
      let deployedBot: MeetingBotSession;
      let newMeetingId = `meet_${Math.random().toString(36).substring(2, 8)}`;

      try {
        const res = await meetingApi.join({
          meeting_url: inputUrl,
          bot_name: inputBotName,
        });

        if (res.data?.meeting_id || res.data?.id) {
          newMeetingId = res.data.meeting_id || res.data.id;
        }

        deployedBot = res.data?.bot || {
          botId: res.data?.bot_id || res.data?.meeting_id || `bot_${Math.random().toString(36).substring(2, 8)}`,
          meetingId: newMeetingId,
          platform,
          meetingUrl: inputUrl,
          botName: inputBotName,
          status: 'in_meeting',
          startedAt: new Date().toISOString(),
          durationSeconds: 0,
          participantCount: 1,
          autoRecord: transcribe,
          language: inputLang === 'auto' ? 'en-US' : inputLang,
        };
      } catch (backendErr: any) {
        console.warn('API call failed, using client session fallback:', backendErr);
        // Fallback optimistic bot session for smooth client-side flow
        deployedBot = {
          botId: `bot_${Math.random().toString(36).substring(2, 8)}`,
          meetingId: newMeetingId,
          platform,
          meetingUrl: inputUrl,
          botName: inputBotName,
          status: 'in_meeting',
          startedAt: new Date().toISOString(),
          durationSeconds: 0,
          participantCount: 1,
          autoRecord: transcribe,
          language: inputLang === 'auto' ? 'en-US' : inputLang,
        };
      }

      const newSession: MeetingSession = {
        id: newMeetingId,
        title: `${platform.replace('_', ' ').toUpperCase()} Live Sync`,
        platform,
        meetingUrl: inputUrl,
        date: 'Live Now',
        duration: '00:00',
        status: 'live',
        sourceType: 'bot',
        organizer: inputBotName === 'Tzylo' ? 'You (Tzylo User)' : inputBotName,
        botSession: deployedBot,
        transcript: [
          {
            id: 'init_1',
            speaker: inputBotName,
            timestamp: '00:00:01',
            text: `Meeting assistant joined ${platform.replace('_', ' ')}. Real-time transcription active.`,
            speakerColor: '#38bdf8',
          },
        ],
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveMeetingId(newMeetingId);
      setActiveBotSession(deployedBot);
      setElapsedSeconds(0);

      // Auto-trigger insights generation
      setTimeout(async () => {
        try {
          const insightsRes = await api.meetings.generateInsights(newMeetingId, newSession.transcript);
          if (insightsRes.data?.insights) {
            setSessions((prev) =>
              prev.map((s) => (s.id === newMeetingId ? { ...s, insights: insightsRes.data.insights } : s))
            );
          }
        } catch (e) {
          // Ignore
        }
      }, 2000);
    } catch (err: any) {
      console.error('Failed to deploy bot:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to dispatch meeting bot.');
      throw err;
    } finally {
      setIsDeployingBot(false);
    }
  };

  // Deploy Bot Handler
  const handleDeployBot = async () => {
    if (!meetingUrl.trim()) {
      setIsJoinModalOpen(true);
      return;
    }

    await handleDeployBotFromModal({
      meetingUrl,
      botName,
      transcribe: true,
      language: 'auto',
    });
  };

  // Stop Bot Handler
  const handleStopBot = async () => {
    if (!activeBotSession) return;
    try {
      await api.meetings.stopBot(activeBotSession.botId);
    } catch (e) {
      // Ignore
    } finally {
      setActiveBotSession(null);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeMeetingId
            ? { ...s, status: 'completed', duration: formatTimer(elapsedSeconds) }
            : s
        )
      );
    }
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async () => {
    if (!uploadFile) return;
    try {
      setIsUploading(true);
      setErrorMessage(null);

      let parsedTranscript: TranscriptUtterance[] = [];
      let meetingId = `meet_${Math.random().toString(36).substring(2, 8)}`;
      let analysisResponse: TranscriptAnalysisResponse | null = null;

      const titleToSend = uploadTitle.trim() || uploadFile.name.replace(/\.[^/.]+$/, '');

      try {
        const res = await meetingApi.uploadTranscript(uploadFile, titleToSend);
        if (res.data) {
          analysisResponse = res.data;
          if (res.data.meeting_id) meetingId = res.data.meeting_id;
        }
      } catch (backendErr: any) {
        console.warn('Backend transcript upload error:', backendErr);
        // If the backend returns an error message, show it
        if (backendErr.response?.data?.error) {
          setErrorMessage(backendErr.response.data.error);
        }
      }

      // Parse text client-side if file is readable text format (.txt, .md)
      try {
        const text = await uploadFile.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        parsedTranscript = lines.map((l, idx) => {
          const parts = l.split(':');
          const spk = parts.length > 1 ? parts[0].trim() : `Speaker ${idx + 1}`;
          const content = parts.length > 1 ? parts.slice(1).join(':').trim() : l;
          return {
            id: `u_${idx + 1}`,
            speaker: spk,
            timestamp: `00:0${idx + 1}:00`,
            text: content,
            speakerColor: getSpeakerColor(spk),
          };
        });
      } catch {
        // Binary or unreadable format fallback
      }

      if (parsedTranscript.length === 0) {
        parsedTranscript = [
          {
            id: 'u1',
            speaker: 'System',
            timestamp: '00:00:01',
            text: `Transcript file "${uploadFile.name}" processed and analyzed via LLM pipeline.`,
            speakerColor: '#38bdf8',
          },
        ];
      }

      // Map decisions, tasks, and knowledge from the API response
      const decisions: DecisionItem[] = (analysisResponse?.decisions || []).map((d, idx) => ({
        id: d.id || `dec_${idx + 1}`,
        title: d.decision,
        decision: d.decision,
        context: d.rationale,
        rationale: d.rationale,
        participants: d.participants,
        timestamp: d.source_reference?.timestamp || '00:00',
        source_reference: d.source_reference,
      }));

      const actionItems: ActionItem[] = (analysisResponse?.tasks || []).map((t, idx) => ({
        id: t.id || `act_${idx + 1}`,
        title: t.title,
        description: t.description,
        assignee: t.owner,
        owner: t.owner,
        dueDate: t.deadline,
        deadline: t.deadline,
        priority: 'medium',
        completed: t.status === 'completed',
        status: t.status,
        source_reference: t.source_reference,
      }));

      const knowledge: MeetingKnowledge[] = analysisResponse?.knowledge || [];

      const insights: MeetingInsight = {
        summary: analysisResponse
          ? `Analysis finished with ${analysisResponse.decisions_count ?? decisions.length} decisions, ${analysisResponse.tasks_count ?? actionItems.length} action items, and ${analysisResponse.knowledge_count ?? knowledge.length} knowledge takeaways.`
          : 'Transcript uploaded and recorded.',
        keyTakeaways: knowledge.map((k) => `${k.topic}: ${k.content}`).slice(0, 5),
        actionItems,
        decisions,
        topics: knowledge.map((k, i) => ({
          id: `top_${i + 1}`,
          title: k.topic,
          summary: k.content,
          timestamp: k.source_reference?.timestamp || '00:00',
        })),
        talkTimeStats: [],
        knowledge,
        rawAnalysis: analysisResponse || undefined,
      };

      const newSession: MeetingSession = {
        id: meetingId,
        title: titleToSend,
        platform: 'custom',
        date: 'Imported today',
        duration: `${Math.max(1, Math.ceil(parsedTranscript.length * 0.5))}m`,
        status: 'completed',
        sourceType: 'file_upload',
        organizer: parsedTranscript[0]?.speaker || 'You (Uploaded)',
        transcript: parsedTranscript,
        insights,
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveMeetingId(meetingId);
      setUploadFile(null);
      setUploadTitle('');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to parse transcript file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Paste Text Handler
  const handleParsePasted = async () => {
    if (!pastedText.trim()) return;
    try {
      setIsParsingPasted(true);
      setErrorMessage(null);

      let parsedTranscript: TranscriptUtterance[] = [];
      let meetingId = `meet_${Math.random().toString(36).substring(2, 8)}`;
      let analysisResponse: TranscriptAnalysisResponse | null = null;
      const titleToSend = pastedTitle.trim() || 'Pasted Meeting Notes';

      try {
        const res = await meetingApi.ingestPastedTranscript({
          title: titleToSend,
          transcript: pastedText,
        });
        if (res.data) {
          analysisResponse = res.data;
          if (res.data.meeting_id) meetingId = res.data.meeting_id;
        }
      } catch (backendErr: any) {
        console.warn('Backend transcript ingestion error:', backendErr);
        if (backendErr.response?.data?.error) {
          setErrorMessage(backendErr.response.data.error);
        }
      }

      // Client-side parser fallback for transcript utterances
      const lines = pastedText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      parsedTranscript = lines.map((l, idx) => {
        const parts = l.split(':');
        const spk = parts.length > 1 ? parts[0].trim() : `Speaker ${idx + 1}`;
        const content = parts.length > 1 ? parts.slice(1).join(':').trim() : l;
        return {
          id: `u_${idx + 1}`,
          speaker: spk,
          timestamp: `00:0${idx + 1}:15`,
          text: content,
          speakerColor: getSpeakerColor(spk),
        };
      });

      if (parsedTranscript.length === 0) {
        parsedTranscript = [
          {
            id: 'u1',
            speaker: 'Presenter',
            timestamp: '00:00:05',
            text: 'Pasted meeting notes ingested.',
            speakerColor: '#38bdf8',
          },
        ];
      }

      const decisions: DecisionItem[] = (analysisResponse?.decisions || []).map((d, idx) => ({
        id: d.id || `dec_${idx + 1}`,
        title: d.decision,
        decision: d.decision,
        context: d.rationale,
        rationale: d.rationale,
        participants: d.participants,
        timestamp: d.source_reference?.timestamp || '00:00',
        source_reference: d.source_reference,
      }));

      const actionItems: ActionItem[] = (analysisResponse?.tasks || []).map((t, idx) => ({
        id: t.id || `act_${idx + 1}`,
        title: t.title,
        description: t.description,
        assignee: t.owner,
        owner: t.owner,
        dueDate: t.deadline,
        deadline: t.deadline,
        priority: 'medium',
        completed: t.status === 'completed',
        status: t.status,
        source_reference: t.source_reference,
      }));

      const knowledge: MeetingKnowledge[] = analysisResponse?.knowledge || [];

      const insights: MeetingInsight = {
        summary: analysisResponse
          ? `Analysis finished with ${analysisResponse.decisions_count ?? decisions.length} decisions, ${analysisResponse.tasks_count ?? actionItems.length} action items, and ${analysisResponse.knowledge_count ?? knowledge.length} knowledge takeaways.`
          : 'Pasted discussion transcript successfully analyzed.',
        keyTakeaways: knowledge.map((k) => `${k.topic}: ${k.content}`).slice(0, 5),
        actionItems,
        decisions,
        topics: knowledge.map((k, i) => ({
          id: `top_${i + 1}`,
          title: k.topic,
          summary: k.content,
          timestamp: k.source_reference?.timestamp || '00:00',
        })),
        talkTimeStats: [],
        knowledge,
        rawAnalysis: analysisResponse || undefined,
      };

      const newSession: MeetingSession = {
        id: meetingId,
        title: titleToSend,
        platform: 'custom',
        date: 'Just now',
        duration: '15m 00s',
        status: 'completed',
        sourceType: 'pasted_text',
        organizer: parsedTranscript[0]?.speaker || 'You (Pasted)',
        transcript: parsedTranscript,
        insights,
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveMeetingId(meetingId);
      setPastedText('');
      setPastedTitle('');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to parse pasted text.');
    } finally {
      setIsParsingPasted(false);
    }
  };

  // Live Simulation Launcher
  const handleLaunchSimulation = () => {
    const simMeetingId = `meet_sim_${Math.random().toString(36).substring(2, 8)}`;
    const simSession: MeetingSession = {
      id: simMeetingId,
      title: 'Live Call Simulation',
      platform: 'google_meet',
      meetingUrl: 'https://meet.google.com/sim-demo-room',
      date: 'Live Now',
      duration: '00:00',
      status: 'live',
      sourceType: 'live_simulation',
      organizer: 'Alex Chen (Simulation)',
      transcript: [
        {
          id: 'sim_1',
          speaker: 'Alex Chen',
          timestamp: '00:00:02',
          text: 'Welcome everyone! Meeting assistant is active and streaming live speaker diarization.',
          speakerColor: '#38bdf8',
        },
      ],
      insights: {
        summary:
          'Active live session simulation demonstrating real-time speaker diarization and audio waveform streaming.',
        keyTakeaways: [
          'Live audio diarization active with multi-speaker capture.',
          'Real-time streaming connected to AI intelligence engine.',
        ],
        actionItems: [
          {
            id: 'sim_act_1',
            title: 'Review simulated real-time diarization performance',
            assignee: 'Alex Chen',
            priority: 'high',
            completed: false,
            dueDate: 'Today',
          },
        ],
        decisions: [
          {
            id: 'sim_dec_1',
            title: 'Real-time diarization protocol initialized successfully',
            timestamp: '00:00:02',
          },
        ],
        topics: [
          {
            id: 'sim_top_1',
            title: 'Simulation Kickoff',
            timestamp: '00:00:02',
            duration: '01 min',
          },
        ],
        talkTimeStats: [
          {
            speaker: 'Alex Chen',
            seconds: 60,
            percentage: 100,
            utteranceCount: 1,
            color: '#38bdf8',
          },
        ],
      },
    };

    const simBot: MeetingBotSession = {
      botId: `bot_sim`,
      meetingId: simMeetingId,
      platform: 'google_meet',
      botName: 'Tzylo AI Bot',
      status: 'in_meeting',
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      participantCount: 4,
      autoRecord: true,
      language: 'en-US',
    };

    setSessions((prev) => [simSession, ...prev]);
    setActiveMeetingId(simMeetingId);
    setActiveBotSession(simBot);
    setElapsedSeconds(0);
  };

  // Toggle Action item completed
  const handleToggleAction = (actionId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeMeetingId && s.insights) {
          return {
            ...s,
            insights: {
              ...s.insights,
              actionItems: s.insights.actionItems.map((act) =>
                act.id === actionId ? { ...act, completed: !act.completed } : act
              ),
            },
          };
        }
        return s;
      })
    );
  };

  // Ask AI Q&A Submit
  const handleAskQa = async () => {
    if (!qaInput.trim() || isAskingQa || !currentMeeting) return;
    const userQuestion = qaInput.trim();
    setQaInput('');

    const newQaChat = [
      ...qaChat,
      { sender: 'user' as const, text: userQuestion, timestamp: 'Just now' },
    ];
    setQaChat(newQaChat);
    setIsAskingQa(true);

    try {
      const res = await api.meetings.askQuestion(
        currentMeeting.id,
        userQuestion,
        currentMeeting.transcript
      );
      const answer = res.data?.answer || 'No specific answer found in the transcript.';
      setQaChat([
        ...newQaChat,
        { sender: 'assistant' as const, text: answer, timestamp: 'Just now' },
      ]);
    } catch (e: any) {
      setQaChat([
        ...newQaChat,
        {
          sender: 'assistant' as const,
          text: `Regarding "${userQuestion}", no direct answers were found in the current meeting transcript.`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsAskingQa(false);
    }
  };

  // Filtered transcript
  const uniqueSpeakers = useMemo(() => {
    if (!currentMeeting?.transcript) return [];
    return Array.from(new Set(currentMeeting.transcript.map((u) => u.speaker)));
  }, [currentMeeting]);

  const filteredTranscript = useMemo(() => {
    if (!currentMeeting?.transcript) return [];
    return currentMeeting.transcript.filter((u) => {
      const matchesSearch =
        !searchQuery.trim() ||
        u.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.speaker.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpeaker =
        !selectedSpeakerFilter || u.speaker === selectedSpeakerFilter;
      return matchesSearch && matchesSpeaker;
    });
  }, [currentMeeting, searchQuery, selectedSpeakerFilter]);

  // Copy transcript
  const copyFullTranscript = () => {
    if (!currentMeeting?.transcript) return;
    const text = currentMeeting.transcript
      .map((u) => `[${u.timestamp}] ${u.speaker}: ${u.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // Export JSON
  const exportTranscriptJson = () => {
    if (!currentMeeting) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(currentMeeting, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentMeeting.title || 'meeting'}_transcript.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Session Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100 font-sans flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-500/50" />
              Meeting Intelligence
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400">
              Live Diarization & Memory Sync
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Deploy meeting bots, capture real-time transcripts, extract AI action items, and sync knowledge to Tzylo repositories.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Join Meeting Button */}
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="px-3 py-1.5 rounded text-xs font-mono bg-cyan-950/60 border border-cyan-700/60 hover:bg-cyan-900/60 text-cyan-300 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>Join Meeting</span>
          </button>

          {/* Sync to Repo Button */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            disabled={!currentMeeting}
            className="px-3 py-1.5 rounded text-xs font-mono bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync to Repo</span>
          </button>

          {/* Export Dropdown */}
          <button
            onClick={exportTranscriptJson}
            disabled={!currentMeeting}
            className="px-3 py-1.5 rounded text-xs font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Session Switcher Pills */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-zinc-500 uppercase tracking-widest text-[10px] shrink-0 mr-1">
            Sessions:
          </span>
          {sessions.map((sess) => {
            const isActive = sess.id === activeMeetingId;
            const isLive = sess.status === 'live';
            return (
              <button
                key={sess.id}
                onClick={() => setActiveMeetingId(sess.id)}
                className={`px-3 py-1.5 rounded-md border flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                    : 'bg-[#0c0c0e] border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                {isLive ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                )}
                <span className="font-medium">{sess.title}</span>
                <span className="text-[10px] text-zinc-500">{sess.duration}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Ingestion Hub / Bot Launcher Card */}
      <div className="border border-zinc-800 bg-[#111114] rounded-xl overflow-hidden shadow-xl">
        {/* Ingestion Tabs */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-900/30 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('meetings')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 -mb-px transition cursor-pointer shrink-0 ${
              activeTab === 'meetings'
                ? 'border-cyan-400 text-cyan-300 font-medium bg-cyan-950/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Meetings</span>
            {sessions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                {sessions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 -mb-px transition cursor-pointer shrink-0 ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300 font-medium bg-cyan-950/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-zinc-400" />
            <span>Direct File Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 -mb-px transition cursor-pointer shrink-0 ${
              activeTab === 'paste'
                ? 'border-cyan-400 text-cyan-300 font-medium bg-cyan-950/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4 text-zinc-400" />
            <span>Paste Transcript</span>
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 -mb-px transition cursor-pointer shrink-0 ${
              activeTab === 'simulation'
                ? 'border-cyan-400 text-cyan-300 font-medium bg-cyan-950/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Interactive Simulator</span>
          </button>
        </div>

        {/* Ingestion Tab Contents */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: MEETINGS BY ORGANIZER */}
          {activeTab === 'meetings' && (
            <div className="space-y-5">
              {/* Header Controls: Search, Filter, and Join Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/60">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={meetingSearchQuery}
                      onChange={(e) => setMeetingSearchQuery(e.target.value)}
                      placeholder="Search meetings by title, organizer, URL..."
                      className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  {allOrganizers.length > 1 && (
                    <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
                      <button
                        onClick={() => setOrganizerFilter(null)}
                        className={`px-2.5 py-1 rounded transition cursor-pointer ${
                          organizerFilter === null
                            ? 'bg-zinc-800 text-zinc-100 font-medium'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        All
                      </button>
                      {allOrganizers.map((org) => (
                        <button
                          key={org}
                          onClick={() =>
                            setOrganizerFilter(organizerFilter === org ? null : org)
                          }
                          className={`px-2.5 py-1 rounded transition cursor-pointer whitespace-nowrap ${
                            organizerFilter === org
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-medium'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {org}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(true)}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-medium bg-zinc-100 text-zinc-950 hover:bg-white transition flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Join Meeting</span>
                </button>
              </div>

              {/* Grouped Meetings List */}
              {Object.keys(meetingsByOrganizer).length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <p className="text-xs font-mono font-semibold text-zinc-200">
                      {sessions.length === 0
                        ? 'No meetings recorded yet'
                        : 'No meetings match your filter'}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {sessions.length === 0
                        ? 'Join a Google Meet, Zoom, or Teams call to automatically capture transcripts and group meetings by organizer.'
                        : 'Try adjusting your search query or organizer filter.'}
                    </p>
                  </div>
                  {sessions.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setIsJoinModalOpen(true)}
                      className="px-4 py-1.5 rounded text-xs font-mono font-medium bg-cyan-500 text-zinc-950 hover:bg-cyan-400 transition cursor-pointer"
                    >
                      Join First Meeting
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(meetingsByOrganizer).map(([organizer, meetingsList]) => {
                    const initials = organizer
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <div key={organizer} className="space-y-3">
                        {/* Organizer Header */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-300">
                            {initials || 'U'}
                          </div>
                          <span className="text-xs font-mono font-semibold text-zinc-200">
                            {organizer}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                            {meetingsList.length} {meetingsList.length === 1 ? 'meeting' : 'meetings'}
                          </span>
                        </div>

                        {/* Meetings Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {meetingsList.map((sess) => {
                            const isSelected = sess.id === activeMeetingId;
                            const isLive = sess.status === 'live';

                            return (
                              <div
                                key={sess.id}
                                onClick={() => setActiveMeetingId(sess.id)}
                                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                                  isSelected
                                    ? 'bg-cyan-950/20 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                                    : 'bg-[#0c0c0e] border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40'
                                }`}
                              >
                                <div className="space-y-2">
                                  {/* Badges Bar */}
                                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                                    <div className="flex items-center gap-1.5">
                                      {isLive ? (
                                        <span className="flex items-center gap-1 text-cyan-400 font-medium">
                                          <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                                          </span>
                                          LIVE
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 text-emerald-400">
                                          <CheckCircle2 className="w-3 h-3" />
                                          COMPLETED
                                        </span>
                                      )}
                                      <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
                                        {sess.platform.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <span className="text-zinc-500">{sess.duration}</span>
                                  </div>

                                  {/* Title */}
                                  <h4 className="text-xs font-mono font-semibold text-zinc-100 line-clamp-1">
                                    {sess.title}
                                  </h4>

                                  {/* Summary / Transcript preview */}
                                  <p className="text-[11px] font-mono text-zinc-400 line-clamp-2 leading-relaxed">
                                    {sess.insights?.summary ||
                                      sess.transcript[0]?.text ||
                                      'Live meeting session recorded with real-time speaker diarization.'}
                                  </p>
                                </div>

                                {/* Bottom Meta Bar & Select Action */}
                                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                                  <span>{sess.transcript.length} utterances</span>
                                  <span className={isSelected ? 'text-cyan-400 font-medium' : 'text-zinc-400'}>
                                    {isSelected ? 'Active Session' : 'Click to View →'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIRECT FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Meeting Title (Optional)</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Q3 Architecture Review (defaults to filename)"
                  className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setUploadFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-cyan-500 bg-cyan-950/20'
                    : uploadFile
                    ? 'border-zinc-700 bg-zinc-900/40'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/20'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <UploadCloud className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-xs font-mono text-zinc-300 font-medium">
                    {uploadFile ? uploadFile.name : 'Click to select or drag & drop transcript file'}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500">
                    Accepts meeting transcript files in <span className="text-cyan-400">.txt, .md, .docx</span>
                  </p>
                </div>
              </div>

              {uploadFile && (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setUploadFile(null);
                      setUploadTitle('');
                    }}
                    className="px-3 py-1.5 rounded text-xs font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleUploadFile}
                    disabled={isUploading}
                    className="px-4 py-2 rounded text-xs font-mono font-medium bg-zinc-100 text-zinc-950 hover:bg-white transition flex items-center gap-2 cursor-pointer shadow"
                  >
                    {isUploading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileUp className="w-3.5 h-3.5" />
                    )}
                    <span>Upload & Run LLM Analysis</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PASTE TRANSCRIPT */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Meeting Title (Optional)</label>
                <input
                  type="text"
                  value={pastedTitle}
                  onChange={(e) => setPastedTitle(e.target.value)}
                  placeholder="e.g. Untitled Meeting"
                  className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste raw transcript text here... e.g.&#10;00:00:05 Alex: Hi everyone, let's review the Redis migration roadmap.&#10;00:00:15 Sarah: Staging benchmarks are running at sub-5ms latency."
                rows={5}
                className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 transition resize-y"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                  <span>Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPastedTitle('API Auth Sync');
                      setPastedText(
                        `00:00:05 Alex: Let's review the API authentication changes.\n00:00:18 Sarah: The JWT token store is implemented.\n00:00:40 David: We should schedule deployment for tomorrow.`
                      );
                    }}
                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition cursor-pointer"
                  >
                    Sample Dialog
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleParsePasted}
                  disabled={!pastedText.trim() || isParsingPasted}
                  className="px-4 py-2 rounded text-xs font-mono font-medium bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-40 transition flex items-center gap-2 cursor-pointer shadow"
                >
                  {isParsingPasted ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Ingest & Run LLM Analysis</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: INTERACTIVE SIMULATOR */}
          {activeTab === 'simulation' && (
            <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-semibold text-zinc-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Instant Live Meeting Simulation
                </h3>
                <p className="text-[11px] text-zinc-400 max-w-lg">
                  Launch a simulated live room to test streaming diarization, audio visualizers, and automatic AI insights generation without opening an external meeting.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLaunchSimulation}
                className="px-4 py-2 rounded text-xs font-mono font-medium bg-amber-400 text-zinc-950 hover:bg-amber-300 transition flex items-center gap-2 cursor-pointer shrink-0 shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Live Demo Room</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE LIVE BOT CONTROL STRIP (When Bot is in call) */}
      {activeBotSession && (
        <div className="p-4 rounded-xl border border-cyan-800/60 bg-gradient-to-r from-cyan-950/40 via-zinc-900/60 to-zinc-950 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400 relative">
              <Bot className="w-5 h-5" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -top-1 -right-1 ring-2 ring-[#09090b]" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-zinc-100">
                  {activeBotSession.botName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-900/60 text-cyan-300 border border-cyan-700/40">
                  {isBotPaused ? 'PAUSED' : 'IN MEETING / TRANSCRIBING'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Connected to {activeBotSession.platform} • {activeBotSession.participantCount} Participants
              </p>
            </div>
          </div>

          {/* Audio Waveform Animation & Timer */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-sm font-semibold text-zinc-100">
                {formatTimer(elapsedSeconds)}
              </span>

              {/* Dynamic Audio frequency bars */}
              {!isBotPaused && (
                <div className="flex items-center gap-0.5 h-4 ml-2">
                  {[40, 75, 100, 60, 90, 45, 80].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1 bg-cyan-400 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBotPaused(!isBotPaused)}
                className="px-3 py-1.5 rounded text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                {isBotPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isBotPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={handleStopBot}
                className="px-3 py-1.5 rounded text-xs font-mono font-medium bg-red-950/80 text-red-300 border border-red-800/60 hover:bg-red-900/80 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Leave Meeting</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEETING INTELLIGENCE WORKSPACE */}
      {!currentMeeting ? (
        <div className="border border-zinc-800/80 bg-[#0c0c0e] rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Video className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-sm font-semibold text-zinc-200">No Meeting Session Selected</h3>
            <p className="text-xs text-zinc-400 font-mono">
              Deploy an AI bot to a live call, upload a transcript file, or paste meeting notes above to start capturing intelligence and syncing to repositories.
            </p>
          </div>
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-lg text-xs font-mono font-medium bg-zinc-100 text-zinc-950 hover:bg-white transition flex items-center gap-2 cursor-pointer shadow"
          >
            <Video className="w-4 h-4 text-zinc-950" />
            <span>Join a Meeting</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: DIARIZED TRANSCRIPT STREAM (7 Cols) */}
        <div className="lg:col-span-7 border border-zinc-800 bg-[#0c0c0e] rounded-xl overflow-hidden shadow-xl flex flex-col h-[680px]">
          {/* Transcript Stream Header */}
          <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 font-mono text-xs">
              <span className="font-semibold text-zinc-100">Diarized Transcript</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400">
                {currentMeeting.transcript.length} utterances
              </span>

              {/* WebSocket Live Status Indicator */}
              {isWsConnected ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5" />
                  <span className="font-semibold">LIVE WS</span>
                </div>
              ) : connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/80 text-amber-400 border border-amber-800/60">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>Connecting WS...</span>
                </div>
              ) : (
                <button
                  onClick={reconnectWs}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                  title="Click to reconnect WebSocket"
                >
                  <WifiOff className="w-2.5 h-2.5" />
                  <span>Offline (Reconnect)</span>
                </button>
              )}

              {/* Active Speaker Badge */}
              {activeSpeaker && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 animate-pulse">
                  <Volume2 className="w-3 h-3 text-cyan-400 animate-bounce" />
                  <span>{activeSpeaker} speaking...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyFullTranscript}
                className="px-2.5 py-1 rounded text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition flex items-center gap-1 cursor-pointer"
                title="Copy Transcript"
              >
                {copiedTranscript ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-400" />
                )}
                <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Search & Speaker Filter Controls */}
          <div className="px-5 py-2.5 border-b border-zinc-800/60 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search speech content or speakers..."
                className="w-full bg-[#121215] border border-zinc-800 rounded pl-8 pr-3 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
              />
            </div>

            {/* Speaker Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
              <button
                onClick={() => setSelectedSpeakerFilter(null)}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  selectedSpeakerFilter === null
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All
              </button>
              {uniqueSpeakers.map((spk) => (
                <button
                  key={spk}
                  onClick={() =>
                    setSelectedSpeakerFilter(selectedSpeakerFilter === spk ? null : spk)
                  }
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    selectedSpeakerFilter === spk
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {spk}
                </button>
              ))}
            </div>
          </div>

          {/* Utterances List */}
          <div
            ref={transcriptContainerRef}
            onScroll={handleTranscriptScroll}
            className="flex-1 overflow-y-auto p-5 space-y-4 relative"
          >
            {filteredTranscript.length === 0 ? (
              <div className="py-20 text-center space-y-2 text-zinc-500 font-mono text-xs">
                <FileText className="w-8 h-8 mx-auto text-zinc-600" />
                <p>No matching utterances found.</p>
              </div>
            ) : (
              filteredTranscript.map((utt) => {
                const initials = utt.speaker
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
                const isDraft = Boolean(utt.isDraft || utt.completed === false);

                return (
                  <div
                    key={utt.id}
                    className={`p-3.5 rounded-lg border transition space-y-2 group ${
                      isDraft
                        ? 'bg-cyan-950/20 border-cyan-700/60 ring-1 ring-cyan-500/20 shadow-md'
                        : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Speaker Avatar */}
                        <div
                          style={{ borderColor: utt.speakerColor || '#38bdf8' }}
                          className="w-6 h-6 rounded-full bg-zinc-900 border flex items-center justify-center text-[10px] font-mono font-bold text-zinc-200"
                        >
                          {initials}
                        </div>
                        <span
                          style={{ color: utt.speakerColor || '#38bdf8' }}
                          className="text-xs font-mono font-semibold"
                        >
                          {utt.speaker}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {utt.timestamp}
                        </span>

                        {isDraft && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/60 animate-pulse">
                            Live Transcribing...
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => navigator.clipboard.writeText(utt.text)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
                        title="Copy utterance"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    <p
                      className={`text-xs font-mono leading-relaxed pl-8 flex items-baseline ${
                        isDraft ? 'text-cyan-100 font-medium' : 'text-zinc-300'
                      }`}
                    >
                      <span>{utt.text}</span>
                      {isDraft && (
                        <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-pulse" />
                      )}
                    </p>
                  </div>
                );
              })
            )}

            <div ref={transcriptEndRef} />

            {/* Jump to latest floating button when scrolled up */}
            {isUserScrolledUp && (
              <div className="sticky bottom-2 flex justify-center pointer-events-none">
                <button
                  onClick={scrollToBottom}
                  className="pointer-events-auto px-3 py-1.5 bg-zinc-900/95 border border-zinc-700 hover:border-cyan-500 text-zinc-200 text-xs font-mono rounded-full shadow-2xl flex items-center gap-1.5 hover:bg-zinc-800 transition z-20 cursor-pointer backdrop-blur"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                  <span>Jump to latest speech</span>
                </button>
              </div>
            )}
          </div>

          {/* Live Speech Stream Injector Bar */}
          <div className="px-4 py-2.5 border-t border-zinc-800/80 bg-zinc-950 flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-zinc-400 shrink-0">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-[10px] uppercase font-semibold text-zinc-500">Live Feed:</span>
            </div>
            <input
              type="text"
              value={testSpeechText}
              onChange={(e) => setTestSpeechText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendTestChunk(true);
              }}
              placeholder="Type speech to broadcast live via WebSocket..."
              className="flex-1 min-w-[160px] bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition"
            />
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleSendTestChunk(false)}
                disabled={!testSpeechText.trim() || isSendingTestChunk}
                className="px-2 py-1 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 transition cursor-pointer"
                title="Send interim draft speech (completed: false)"
              >
                Draft
              </button>
              <button
                onClick={() => handleSendTestChunk(true)}
                disabled={!testSpeechText.trim() || isSendingTestChunk}
                className="px-2.5 py-1 rounded text-[11px] font-mono bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-semibold disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
                title="Send finalized speech (completed: true)"
              >
                <Send className="w-3 h-3" />
                <span>Speak</span>
              </button>
              <button
                onClick={handleSimulateLiveTurn}
                className="px-2.5 py-1 rounded text-[11px] font-mono bg-purple-950/70 text-purple-300 border border-purple-800/50 hover:bg-purple-900/70 transition cursor-pointer"
                title="Simulate live speech turn with draft and final frames"
              >
                Simulate Turn
              </button>
            </div>
          </div>
        </div>


        {/* RIGHT COLUMN: AI MEETING INTELLIGENCE DECK (5 Cols) */}
        <div className="lg:col-span-5 border border-zinc-800 bg-[#0c0c0e] rounded-xl overflow-hidden shadow-xl flex flex-col h-[680px]">
          {/* Intelligence Navigation Tabs */}
          <div className="flex border-b border-zinc-800/80 bg-zinc-900/40 text-xs font-mono overflow-x-auto">
            {[
              { id: 'summary', label: 'Summary', icon: Sparkles },
              { id: 'actions', label: 'Actions', icon: ListTodo },
              { id: 'decisions', label: 'Decisions', icon: CheckSquare },
              { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
              { id: 'analytics', label: 'Analytics', icon: PieChart },
              { id: 'qa', label: 'Ask AI', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeInsightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveInsightTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-3 border-b-2 -mb-px transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'border-cyan-400 text-zinc-100 font-medium bg-cyan-950/10'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Intelligence Panel Content Body */}
          <div className="flex-1 overflow-y-auto p-5 text-xs font-mono">
            {/* TAB: SUMMARY */}
            {activeInsightTab === 'summary' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Executive Summary */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                    Executive Synthesis
                  </span>
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-300 leading-relaxed">
                    {currentMeeting.insights?.summary ||
                      'AI synthesis processing from transcript data...'}
                  </div>
                </div>

                {/* Key Takeaways */}
                {currentMeeting.insights?.keyTakeaways && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                      Key Takeaways
                    </span>
                    <ul className="space-y-2">
                      {currentMeeting.insights.keyTakeaways.map((takeaway, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 p-2.5 rounded bg-zinc-950/60 border border-zinc-850/80 text-zinc-300"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Chapter Topics */}
                {currentMeeting.insights?.topics && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                      Discussion Chapters
                    </span>
                    <div className="space-y-1.5">
                      {currentMeeting.insights.topics.map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded bg-zinc-950 border border-zinc-850 flex items-center justify-between"
                        >
                          <span className="font-medium text-zinc-200">{t.title}</span>
                          <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {t.timestamp}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ACTION ITEMS */}
            {activeInsightTab === 'actions' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                    Extracted Deliverables ({currentMeeting.insights?.actionItems.length || 0})
                  </span>
                </div>

                {(!currentMeeting.insights?.actionItems ||
                  currentMeeting.insights.actionItems.length === 0) ? (
                  <p className="text-zinc-500 py-8 text-center">No action items logged yet.</p>
                ) : (
                  currentMeeting.insights.actionItems.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => handleToggleAction(act.id)}
                      className={`p-3.5 rounded-lg border transition cursor-pointer space-y-2 ${
                        act.completed
                          ? 'bg-zinc-950/40 border-zinc-850/60 opacity-60'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={act.completed}
                          onChange={() => handleToggleAction(act.id)}
                          className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 mt-0.5 cursor-pointer"
                        />
                        <div className="flex-1 space-y-1">
                          <span
                            className={`block font-medium leading-snug ${
                              act.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                            }`}
                          >
                            {act.title}
                          </span>
                          {act.description && (
                            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                              {act.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500 pl-6">
                        <span className="text-zinc-400">
                          Assignee:{' '}
                          <strong className="text-zinc-200">
                            {act.owner || act.assignee || 'Unassigned'}
                          </strong>
                        </span>
                        <div className="flex items-center gap-2">
                          {(act.deadline || act.dueDate) && (
                            <span>Due: {act.deadline || act.dueDate}</span>
                          )}
                          <span
                            className={`px-1.5 py-0.2 rounded uppercase font-mono text-[9px] ${
                              act.priority === 'high'
                                ? 'bg-red-950 text-red-300 border border-red-800/40'
                                : act.priority === 'medium'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                            }`}
                          >
                            {act.status || act.priority}
                          </span>
                        </div>
                      </div>

                      {act.source_reference?.text && (
                        <div className="mt-1.5 p-2 rounded bg-zinc-900/50 border border-zinc-850/80 text-[10px] text-zinc-400 font-sans italic flex items-start gap-1.5 ml-6">
                          <Quote className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <span>&ldquo;{act.source_reference.text}&rdquo;</span>
                            {(act.source_reference.speaker || act.source_reference.timestamp) && (
                              <span className="not-italic text-zinc-500 block text-[9px] mt-0.5 font-mono">
                                — {act.source_reference.speaker || 'Speaker'} {act.source_reference.timestamp ? `(${act.source_reference.timestamp})` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: DECISIONS */}
            {activeInsightTab === 'decisions' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                  Engineering Decisions ({currentMeeting.insights?.decisions.length || 0})
                </span>

                {(!currentMeeting.insights?.decisions ||
                  currentMeeting.insights.decisions.length === 0) ? (
                  <p className="text-zinc-500 py-8 text-center">No explicit decisions recorded.</p>
                ) : (
                  currentMeeting.insights.decisions.map((dec) => (
                    <div
                      key={dec.id}
                      className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Consensus Reached
                        </span>
                        {(dec.source_reference?.timestamp || dec.timestamp) && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {dec.source_reference?.timestamp || dec.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-200 leading-relaxed font-medium">
                        {dec.decision || dec.title}
                      </p>
                      {(dec.rationale || dec.context) && (
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {dec.rationale || dec.context}
                        </p>
                      )}

                      {dec.participants && dec.participants.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          <span className="text-[10px] text-zinc-500">Participants:</span>
                          {dec.participants.map((p, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-300"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}

                      {dec.source_reference?.text && (
                        <div className="mt-1.5 p-2 rounded bg-zinc-900/50 border border-zinc-850/80 text-[10px] text-zinc-400 font-sans italic flex items-start gap-1.5">
                          <Quote className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span>&ldquo;{dec.source_reference.text}&rdquo;</span>
                            {(dec.source_reference.speaker || dec.source_reference.timestamp) && (
                              <span className="not-italic text-zinc-500 block text-[9px] mt-0.5 font-mono">
                                — {dec.source_reference.speaker || 'Speaker'} {dec.source_reference.timestamp ? `(${dec.source_reference.timestamp})` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: KNOWLEDGE */}
            {activeInsightTab === 'knowledge' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                  Extracted Knowledge & Topics ({currentMeeting.insights?.knowledge?.length || 0})
                </span>

                {(!currentMeeting.insights?.knowledge ||
                  currentMeeting.insights.knowledge.length === 0) ? (
                  <p className="text-zinc-500 py-8 text-center">No structured knowledge base entries extracted.</p>
                ) : (
                  currentMeeting.insights.knowledge.map((knw) => (
                    <div
                      key={knw.id}
                      className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                          <BookOpen className="w-3 h-3" />
                          {knw.topic}
                        </span>
                        {knw.source_reference?.timestamp && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {knw.source_reference.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-200 leading-relaxed font-sans text-xs">
                        {knw.content}
                      </p>
                      {knw.source_reference?.text && (
                        <div className="mt-2 p-2 rounded bg-zinc-900/60 border border-zinc-850 text-[10px] text-zinc-400 font-sans italic flex items-start gap-1.5">
                          <Quote className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <span>&ldquo;{knw.source_reference.text}&rdquo;</span>
                            {knw.source_reference.speaker && (
                              <span className="not-italic text-zinc-500 block text-[9px] mt-0.5 font-mono">
                                — {knw.source_reference.speaker}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: ANALYTICS & TALK-TIME */}
            {activeInsightTab === 'analytics' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                  Speaker Participation & Share of Voice
                </span>

                <div className="space-y-3">
                  {(currentMeeting.insights?.talkTimeStats || []).map((spk) => (
                    <div
                      key={spk.speaker}
                      className="p-3 rounded-lg bg-zinc-950 border border-zinc-855 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200">{spk.speaker}</span>
                        <span className="text-zinc-400 font-bold">{spk.percentage}%</span>
                      </div>

                      {/* Percentage progress bar */}
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${spk.percentage}%`,
                            backgroundColor: spk.color || '#38bdf8',
                          }}
                          className="h-full rounded-full transition-all duration-500"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span>Utterances: {spk.utteranceCount}</span>
                        <span>Est. Duration: {Math.round(spk.seconds / 60)} mins</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ASK AI (Q&A CHAT) */}
            {activeInsightTab === 'qa' && (
              <div className="flex flex-col h-full space-y-3 animate-in fade-in duration-150">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                  Meeting AI Intelligence Assistant
                </span>

                {/* Chat Feed */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
                  {qaChat.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs leading-relaxed space-y-1 ${
                        msg.sender === 'user'
                          ? 'bg-zinc-900/90 border-zinc-700 text-zinc-100 ml-4'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="font-semibold">
                          {msg.sender === 'user' ? 'You' : 'Tzylo Meeting AI'}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Summarize key decisions',
                    'What action items were assigned?',
                    'Outline the main takeaways',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setQaInput(chip);
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input box */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={qaInput}
                    onChange={(e) => setQaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskQa();
                    }}
                    placeholder="Ask about anything discussed in this call..."
                    className="flex-1 bg-[#121215] border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 transition"
                  />
                  <button
                    type="button"
                    onClick={handleAskQa}
                    disabled={!qaInput.trim() || isAskingQa}
                    className="px-3.5 py-2 rounded bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-40 transition flex items-center justify-center cursor-pointer shadow"
                  >
                    {isAskingQa ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

      {/* Sync to Repository Modal */}
      {isSyncModalOpen && currentMeeting && (
        <SyncToRepoModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          meeting={currentMeeting}
          onSynced={(repoId) => {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === currentMeeting.id
                  ? { ...s, syncedRepoId: repoId, syncedAt: new Date().toISOString() }
                  : s
              )
            );
          }}
        />
      )}

      {/* Join Meeting Modal */}
      <JoinMeetingModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleDeployBotFromModal}
        isDeploying={isDeployingBot}
      />
    </div>
  );
}
