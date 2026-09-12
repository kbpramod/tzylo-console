export type MeetingPlatform = 'google_meet' | 'zoom' | 'teams' | 'custom';

export type BotStatus =
  | 'idle'
  | 'deploying'
  | 'in_meeting'
  | 'recording'
  | 'transcribing'
  | 'paused'
  | 'ended'
  | 'failed';

export interface TranscriptUtterance {
  id: string;
  speaker: string;
  timestamp: string;
  text: string;
  confidence?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  speakerColor?: string;
  completed?: boolean;
  isDraft?: boolean;
  startTime?: number;
  endTime?: number;
}

export interface SourceReference {
  text?: string;
  speaker?: string;
  timestamp?: string;
}

export interface MeetingDecision {
  id: string;
  decision: string;
  rationale?: string;
  participants?: string[];
  source_reference?: SourceReference;
}

export interface MeetingTask {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  deadline?: string;
  status: 'open' | 'completed' | string;
  source_reference?: SourceReference;
}

export interface MeetingKnowledge {
  id: string;
  topic: string;
  content: string;
  source_reference?: SourceReference;
}

export interface TranscriptAnalysisResponse {
  meeting_id: string;
  status: string;
  source: string;
  decisions_count: number;
  tasks_count: number;
  knowledge_count: number;
  decisions: MeetingDecision[];
  tasks: MeetingTask[];
  knowledge: MeetingKnowledge[];
  error?: string;
}

export interface UploadTranscriptPayload {
  file: File;
  title?: string | null;
}

export interface IngestPastedTranscriptPayload {
  title?: string;
  transcript: string;
}

export interface ActionItem {
  id: string;
  title: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  description?: string;
  owner?: string;
  deadline?: string;
  status?: string;
  source_reference?: SourceReference;
}

export interface DecisionItem {
  id: string;
  title: string;
  context?: string;
  timestamp?: string;
  decision?: string;
  rationale?: string;
  participants?: string[];
  source_reference?: SourceReference;
}

export interface TopicItem {
  id: string;
  title: string;
  timestamp: string;
  duration?: string;
  summary?: string;
}

export interface SpeakerTalkTime {
  speaker: string;
  seconds: number;
  percentage: number;
  utteranceCount: number;
  color: string;
}

export interface MeetingInsight {
  summary: string;
  keyTakeaways: string[];
  actionItems: ActionItem[];
  decisions: DecisionItem[];
  topics: TopicItem[];
  talkTimeStats: SpeakerTalkTime[];
  knowledge?: MeetingKnowledge[];
  rawAnalysis?: TranscriptAnalysisResponse;
}

export interface MeetingBotSession {
  botId: string;
  meetingId: string;
  platform: MeetingPlatform;
  meetingUrl?: string;
  botName: string;
  status: BotStatus;
  startedAt: string;
  durationSeconds: number;
  participantCount: number;
  autoRecord: boolean;
  language: string;
  errorMessage?: string;
}

export interface MeetingSession {
  id: string;
  title: string;
  platform: MeetingPlatform;
  meetingUrl?: string;
  date: string;
  duration: string;
  status: 'live' | 'completed' | 'processing';
  botSession?: MeetingBotSession;
  transcript: TranscriptUtterance[];
  insights?: MeetingInsight;
  organizer?: string;
  syncedRepoId?: string;
  syncedAt?: string;
  sourceType: 'bot' | 'file_upload' | 'pasted_text' | 'live_simulation';
}
