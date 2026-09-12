import axios from "axios";
import { User } from "@/types/user";
import { tokenStore } from "@tzylo/auth-ce";

const mainApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000",
  withCredentials: true,
});

mainApi.interceptors.request.use(async (config) => {
  let accessToken = tokenStore.getToken();

  // Retrieve active session token from Clerk dynamically in browser environment
  if (!accessToken && typeof window !== "undefined" && (window as any).Clerk?.session) {
    try {
      accessToken = await (window as any).Clerk.session.getToken();
    } catch (err) {
      console.warn("Could not retrieve Clerk session token:", err);
    }
  }

  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default {
  users: {
    updateProfile: (data: User) => mainApi.patch("/api/user/profile", data),
    getProfile: () => mainApi.get("/api/user/profile"),
    me: () => mainApi.get("/api/user/me"),
  },
  onboarding: {
    create: (data: User) => mainApi.post("/api/onboarding", data),
  },
  projects: {
    getMyProject: () => mainApi.get("/api/projects"),
  },
  repositories: {
    list: () => mainApi.get("/api/repositories"),
    connect: (data: { repository: string }) => mainApi.post("/api/repositories/connect", data),
    get: (repoId: string) => mainApi.get(`/api/repositories/${repoId}`),
    update: (repoId: string, data: { name?: string }) => mainApi.patch(`/api/repositories/${repoId}`, data),
    delete: (repoId: string) => mainApi.delete(`/api/repositories/${repoId}`),
    getDocs: (repoId: string) => mainApi.get(`/api/repositories/${repoId}/docs`),
    query: (repoId: string, question: string) => mainApi.post(`/api/repositories/${repoId}/query`, { question }),
  },
  memory: {
    update: (data: unknown) => mainApi.post("/memory/update", data),
    search: (data: unknown) => mainApi.post("/memory/search", data),
  },
  github: {
    install: () => mainApi.get("/api/github/install"),
  },
  meetings: {
    deployBot: async (data: {
      platform: string;
      meeting_url?: string;
      native_meeting_id?: string;
      bot_name?: string;
      language?: string;
      auto_record?: boolean;
    }) => {
      return await mainApi.post("/api/v1/meetings/join", data);
    },
    getBotStatus: async (botId: string) => {
      return await mainApi.get(`/api/v1/meetings/bots/${botId}`);
    },
    stopBot: async (botId: string) => {
      return await mainApi.delete(`/api/v1/meetings/bots/${botId}`);
    },
    uploadTranscript: async (file: File, title?: string | null) => {
      const formData = new FormData();
      formData.append("file", file);
      if (title) {
        formData.append("title", title);
      }
      return await mainApi.post("/api/v1/meetings/transcript/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    ingestPastedTranscript: async (
      data: { title?: string; transcript: string } | string,
      title?: string
    ) => {
      const payload =
        typeof data === "string"
          ? { transcript: data, title: title || "Untitled Meeting" }
          : { title: data.title || "Untitled Meeting", transcript: data.transcript };
      return await mainApi.post("/api/v1/meetings/transcript", payload);
    },
    parseRawTranscript: async (rawText: string, title?: string) => {
      return await mainApi.post("/api/v1/meetings/transcript", {
        transcript: rawText,
        title: title || "Untitled Meeting",
      });
    },
    generateInsights: async (meetingId: string, transcript: any[]) => {
      return await mainApi.post("/api/v1/meetings/ai-insights", {
        meeting_id: meetingId,
        transcript,
      });
    },
    askQuestion: async (meetingId: string, question: string, transcript: any[]) => {
      return await mainApi.post("/api/v1/meetings/ai-insights", {
        meeting_id: meetingId,
        question,
        transcript,
        mode: "qa",
      });
    },
    syncToRepository: async (data: {
      repoId: string;
      meetingId: string;
      title: string;
      content: string;
      actionItems?: any[];
      decisions?: any[];
    }) => {
      return await mainApi.post("/api/v1/meetings/sync-repo", data);
    },
    list: async (statusFilter?: string) => {
      return await mainApi.get("/api/v1/meetings", {
        params: statusFilter ? { status_filter: statusFilter } : {},
      });
    },
    get: async (meetingId: string) => {
      return await mainApi.get(`/api/v1/meetings/${encodeURIComponent(meetingId)}`);
    },
    getLiveTranscript: async (meetingId: string) => {
      return await mainApi.get(`/api/v1/meetings/${encodeURIComponent(meetingId)}/live/transcript`);
    },
    ingestLiveChunk: async (
      meetingId: string,
      chunk: {
        speaker: string;
        text: string;
        completed?: boolean;
        start_time?: number;
        end_time?: number;
        id?: string;
      }
    ) => {
      return await mainApi.post(
        `/api/v1/meetings/${encodeURIComponent(meetingId)}/live/transcript-chunk`,
        chunk
      );
    },
  },
  health: {
    checkDb: () => mainApi.get("/health/db"),
  },
};
