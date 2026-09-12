import { api } from "./client";
import {
  Organization,
  OrganizationMember,
  CreateOrganizationPayload,
  InviteMemberPayload,
  UpdateMemberPayload,
} from "@/types/organization";

export type {
  Organization,
  OrganizationMember,
  CreateOrganizationPayload,
  InviteMemberPayload,
  UpdateMemberPayload,
};

export const organizationApi = {
  create: (data: CreateOrganizationPayload) =>
    api.post<Organization>("/organizations", data),

  getCurrent: () =>
    api.get<Organization>("/organizations/current"),

  getMembers: () =>
    api.get<OrganizationMember[]>("/organizations/current/members"),

  inviteMember: (data: InviteMemberPayload) =>
    api.post<OrganizationMember>("/organizations/current/members/invite", data),

  updateMember: (userId: string, data: UpdateMemberPayload) =>
    api.patch<OrganizationMember>(`/organizations/current/members/${encodeURIComponent(userId)}`, data),

  removeMember: (userId: string) =>
    api.delete(`/organizations/current/members/${encodeURIComponent(userId)}`),
};

export default organizationApi;
