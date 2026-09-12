import { api } from "./client";
import {
  TranscriptAnalysisResponse,
  IngestPastedTranscriptPayload,
} from "@/types/meeting";

export type JoinMeetingPayload = {
  meeting_url: string;
  bot_name?: string;
};

export interface LiveChunkPayload {
  speaker: string;
  text: string;
  completed?: boolean;
  start_time?: number;
  end_time?: number;
  id?: string;
}

export const meetingApi = {
  join: (payload: JoinMeetingPayload) => api.post("/api/v1/meetings/join", payload),
  list: (statusFilter?: string) =>
    api.get("/api/v1/meetings", { params: statusFilter ? { status_filter: statusFilter } : {} }),
  get: (meetingId: string) => api.get(`/api/v1/meetings/${encodeURIComponent(meetingId)}`),
  getLiveTranscript: (meetingId: string) =>
    api.get(`/api/v1/meetings/${encodeURIComponent(meetingId)}/live/transcript`),
  ingestLiveChunk: (meetingId: string, chunk: LiveChunkPayload) =>
    api.post(`/api/v1/meetings/${encodeURIComponent(meetingId)}/live/transcript-chunk`, chunk),
  stopLiveSession: (meetingId: string) =>
    api.post(`/api/v1/meetings/${encodeURIComponent(meetingId)}/live/stop`),

  /**
   * Upload and analyze meeting transcript file (.txt, .md, .docx)
   * POST /api/v1/meetings/transcript/upload
   */
  uploadTranscript: (file: File, title?: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) {
      formData.append("title", title);
    }
    return api.post<TranscriptAnalysisResponse>("/api/v1/meetings/transcript/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * Ingest and analyze pasted meeting transcript text
   * POST /api/v1/meetings/transcript
   */
  ingestPastedTranscript: (payload: IngestPastedTranscriptPayload) => {
    return api.post<TranscriptAnalysisResponse>("/api/v1/meetings/transcript", {
      title: payload.title || "Untitled Meeting",
      transcript: payload.transcript,
    });
  },
};