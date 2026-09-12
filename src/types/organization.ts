export type OrganizationRole = 'owner' | 'admin' | 'member' | string;
export type MemberStatus = 'active' | 'invited' | 'pending' | string;

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  owner_id?: string;
  role?: OrganizationRole;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationMember {
  id?: string;
  user_id: string;
  organization_id?: string;
  email?: string;
  name?: string;
  role: OrganizationRole;
  joined_at?: string;
  status?: MemberStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrganizationPayload {
  name: string;
  slug?: string;
}

export interface InviteMemberPayload {
  email: string;
  role?: OrganizationRole;
}

export interface UpdateMemberPayload {
  role: OrganizationRole;
}
