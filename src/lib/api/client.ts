import axios from "axios";
import { tokenStore } from "@tzylo/auth-ce";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000",
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  let accessToken: string | null = null;

  // Retrieve token from tokenStore if available
  try {
    accessToken = tokenStore.getToken();
  } catch {
    // Ignore fallback
  }

  // Retrieve active session token from Clerk dynamically in browser environment
  if (!accessToken && typeof window !== "undefined") {
    try {
      const clerk = (window as any).Clerk;
      if (clerk?.session) {
        accessToken = await clerk.session.getToken();
      } else if (typeof clerk?.getToken === "function") {
        accessToken = await clerk.getToken();
      }
    } catch (err) {
      console.warn("Could not retrieve Clerk session token:", err);
    }
  }

  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});