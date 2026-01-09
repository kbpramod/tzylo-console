import axios from "axios";
import { User } from "@/types/user";
import { tokenStore } from "@tzylo/auth-ce";
import { apiKeyData } from "@/types/flux";

const mainApi = axios.create({
  baseURL: process.env.BASE_URL || "http://localhost:4000",
  withCredentials: true,
});

mainApi.interceptors.request.use((config) => {
  const accessToken = tokenStore.getToken();
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
    create: (data:User) => mainApi.post("/api/onboarding",data)
  },
  projects: {
    getMyProject: () => mainApi.get("/api/projects")
  },
  fluxApiKeys: {
    list: (projectId:string) => mainApi.get(`/api/flux/api-keys/${projectId}/list`),
    generate: (data:apiKeyData) => mainApi.post(`/api/flux/api-keys/generate`, data)
  },
  fluxDomains: {
    list: (projectId: string) => mainApi.get(`/api/flux/domains/${projectId}/domains`),
    update: (projectId: string, domains: string[])  => mainApi.post(`/api/flux/domains/${projectId}/domains`, {domains}),
    add: (projectId: string, value: string)  => mainApi.post(`/api/flux/domains/${projectId}/domains`, {domain : value}),
    remove: (projectId: string, domainId: string)  => mainApi.delete(`/api/flux/domains/${projectId}/domain/${domainId}`)
  },
  smtp: {
    me: (projectId: string) => mainApi.get(`/api/flux/smtp/${projectId}/smtp`),
    save: (projectId: string, payload: any) => mainApi.put(`/api/flux/smtp/${projectId}/smtp`, payload)
  }
};
