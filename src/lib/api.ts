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
    uploadTranscript: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      // Calls /api/v1/meetings/transcript
      try {
        return await axios.post("/api/v1/meetings/transcript", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        // Fallback to mainApi if relative route fails
        return await mainApi.post("/api/v1/meetings/transcript", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    },
  },
  health: {
    checkDb: () => mainApi.get("/health/db"),
  },
};

