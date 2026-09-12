'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOrganization, useOrganizationList, OrganizationList, useUser, useClerk } from '@clerk/nextjs';
import {
  Users,
  Building2,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  X,
  Crown,
  UserCheck,
  Calendar,
  GitBranch,
  Plus,
  Layers,
  Search,
  ExternalLink,
  BookOpen,
  MessageSquare,
  Plug,
  FolderGit2,
  Clock,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  Organization,
  OrganizationMember,
  OrganizationRole,
} from '@/types/organization';
import { Repository } from '@/types/repository';
import { organizationApi } from '@/lib/api/organization';
import api from '@/lib/api';
import { ConnectRepoModal, GITHUB_APP_INSTALL_URL } from '@/components/ConnectRepoModal';

export default function OrganizationPage() {
  const { organization: clerkOrg, isLoaded: isClerkLoaded } = useOrganization();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  // Navigation tab within organization
  const [activeTab, setActiveTab] = useState<'members' | 'projects' | 'settings'>('members');

  // Organization & Members state
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Projects state
  const [projects, setProjects] = useState<Repository[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('member');
  const [isInviting, setIsInviting] = useState(false);

  // Create Org modal state (kept compact)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Member modification state
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchOrganizationData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      let currentOrg: Organization | null = null;
      try {
        const orgRes = await organizationApi.getCurrent();
        currentOrg = orgRes.data;
        setOrganization(currentOrg);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setOrganization(null);
        } else {
          console.warn('Failed to load current organization from API:', err);
        }
      }

      if (currentOrg) {
        try {
          const membersRes = await organizationApi.getMembers();
          setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
        } catch (err: any) {
          console.warn('Failed to load members from API:', err);
          setMembers([]);
        }
      } else {
        setMembers([]);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || err.message || 'Error loading organization.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setIsProjectsLoading(true);
      const res = await api.repositories.list();
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to fetch organization projects:', err);
      setProjects([]);
    } finally {
      setIsProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationData();
    fetchProjects();
  }, [clerkOrg?.id]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      setIsCreating(true);
      setErrorMessage(null);
      const res = await organizationApi.create({
        name: newOrgName.trim(),
        slug: newOrgSlug.trim() || undefined,
      });

      setOrganization(res.data);
      setIsCreateOpen(false);
      setNewOrgName('');
      setNewOrgSlug('');
      setSuccessMessage(`Organization "${res.data.name}" created successfully.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchOrganizationData();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || err.response?.data?.error || 'Failed to create organization.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      setErrorMessage(null);
      const res = await organizationApi.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      const newMember = res.data;
      setMembers((prev) => {
        const exists = prev.some((m) => m.user_id === newMember.user_id || m.email === newMember.email);
        if (exists) {
          return prev.map((m) => (m.user_id === newMember.user_id ? newMember : m));
        }
        return [...prev, newMember];
      });

      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      setSuccessMessage(`Invitation sent to ${inviteEmail.trim()}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || err.response?.data?.error || 'Failed to send invitation.'
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: OrganizationRole) => {
    try {
      setActingUserId(userId);
      setErrorMessage(null);
      await organizationApi.updateMember(userId, { role: newRole });

      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
      );
      setSuccessMessage('Member role updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || err.response?.data?.error || 'Failed to update member role.'
      );
    } finally {
      setActingUserId(null);
    }
  };

  const handleRemoveMember = async (userId: string, email?: string) => {
    const displayName = email || `user ${userId}`;
    if (!confirm(`Are you sure you want to remove ${displayName} from this organization?`)) {
      return;
    }

    try {
      setActingUserId(userId);
      setErrorMessage(null);
      await organizationApi.removeMember(userId);

      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      setSuccessMessage('Member removed successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || err.response?.data?.error || 'Failed to remove member.'
      );
    } finally {
      setActingUserId(null);
    }
  };

  const handleConnectRepoClick = async () => {
    if (!isSignedIn) {
      openSignIn();
    } else {
      try {
        const res = await api.github.install();
        if (res.data?.url) {
          window.location.href = res.data.url;
        } else {
          window.open(GITHUB_APP_INSTALL_URL, '_blank', 'noopener,noreferrer');
        }
      } catch (err) {
        console.error('Failed to get GitHub install URL:', err);
        window.open(GITHUB_APP_INSTALL_URL, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const getRoleBadge = (role: string) => {
    const normalized = role.toLowerCase();
    if (normalized === 'owner') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
          <Crown className="w-3 h-3 text-amber-400" />
          OWNER
        </span>
      );
    }
    if (normalized === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
          <Shield className="w-3 h-3 text-cyan-400" />
          ADMIN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800">
        <UserCheck className="w-3 h-3 text-zinc-400" />
        MEMBER
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    const normalized = (status || 'active').toLowerCase();
    if (normalized === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-amber-950/40 text-amber-400 border border-amber-800/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        {status || 'Pending'}
      </span>
    );
  };

  const filteredMembers = members.filter((m) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      m.role.toLowerCase().includes(q)
    );
  });

  const displayOrgName = organization?.name || clerkOrg?.name || 'My Organization';
  const displayOrgSlug = organization?.slug || clerkOrg?.slug;
  const displayOrgId = organization?.id || clerkOrg?.id;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-mono font-semibold text-zinc-100">
              {displayOrgName}
            </h1>
            {organization?.role && getRoleBadge(organization.role)}

            {/* Small subtle New Org button when an organization is active */}
            {(organization || clerkOrg) && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="text-[11px] font-mono text-zinc-500 hover:text-zinc-200 px-2 py-0.5 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 transition flex items-center gap-1 cursor-pointer ml-1"
                title="Create a new organization and become admin"
              >
                <Plus className="w-3 h-3 text-cyan-400" />
                <span>New Org</span>
              </button>
            )}
          </div>

          <p className="text-xs font-mono text-zinc-400">
            {displayOrgSlug ? `slug: ${displayOrgSlug}` : 'Organization workspace and permissions'}
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchOrganizationData();
              fetchProjects();
            }}
            disabled={isLoading || isProjectsLoading}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded text-xs transition cursor-pointer"
            title="Refresh organization data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoading || isProjectsLoading ? 'animate-spin text-cyan-400' : ''
              }`}
            />
          </button>

          {activeTab === 'members' && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-mono font-medium rounded transition cursor-pointer shadow"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </button>
          )}

          {activeTab === 'projects' && (
            <button
              onClick={handleConnectRepoClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-mono font-medium rounded transition cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Repository</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs (Members / Team, Projects, Settings) */}
      <div className="flex items-center gap-2 border-b border-zinc-800 text-xs font-mono">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition cursor-pointer ${
            activeTab === 'members'
              ? 'border-cyan-400 text-zinc-100 font-semibold bg-cyan-950/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Members</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-normal">
            {members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition cursor-pointer ${
            activeTab === 'projects'
              ? 'border-cyan-400 text-zinc-100 font-semibold bg-cyan-950/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>Projects</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-normal">
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition cursor-pointer ${
            activeTab === 'settings'
              ? 'border-cyan-400 text-zinc-100 font-semibold bg-cyan-950/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* TAB 1: TEAM MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Members Table Card */}
          <div className="border border-zinc-800 bg-[#0c0c0e] rounded-xl overflow-hidden shadow-lg">
            {/* Table Controls Header */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Filter team members by name, email, or role..."
                  className="w-full bg-[#121215] border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="flex items-center gap-3 text-zinc-400 text-xs">
                <span>Total: <strong className="text-zinc-200">{members.length}</strong></span>
                <span>•</span>
                <span>Admins: <strong className="text-zinc-200">{members.filter((m) => m.role.toLowerCase() === 'admin' || m.role.toLowerCase() === 'owner').length}</strong></span>
              </div>
            </div>

            {/* Members List Rows */}
            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-500 space-y-2">
                <p>No team members matching your filter.</p>
                {memberSearchQuery && (
                  <button
                    onClick={() => setMemberSearchQuery('')}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {filteredMembers.map((member) => {
                  const isActing = actingUserId === member.user_id;
                  const initials = (member.name || member.email || 'U')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={member.user_id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/30 transition text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-200 shrink-0">
                          {initials}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-100">
                              {member.name || member.email || `User ${member.user_id}`}
                            </span>
                            {getStatusBadge(member.status)}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                            {member.email && <span>{member.email}</span>}
                            {member.joined_at && (
                              <span>Joined: {new Date(member.joined_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pl-11 sm:pl-0">
                        {/* Role selection dropdown */}
                        <select
                          value={member.role}
                          disabled={isActing}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500 transition cursor-pointer disabled:opacity-50"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>

                        {/* Remove member button */}
                        <button
                          onClick={() => handleRemoveMember(member.user_id, member.email)}
                          disabled={isActing || member.role === 'owner'}
                          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            member.role === 'owner'
                              ? 'Cannot remove organization owner'
                              : 'Remove member'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              Repositories and active knowledge engines connected to this organization.
            </span>
          </div>

          {projects.length === 0 && !isProjectsLoading ? (
            <div className="border border-dashed border-zinc-800 bg-[#0c0c0e]/50 rounded-xl p-8 text-center space-y-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
                <FolderGit2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-mono font-semibold text-zinc-200">
                  No Projects Connected Yet
                </h3>
                <p className="text-xs font-mono text-zinc-500 max-w-sm mx-auto">
                  Connect a GitHub repository to this organization to start building living documentation and knowledge graphs.
                </p>
              </div>
              <button
                onClick={handleConnectRepoClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-mono font-medium rounded transition cursor-pointer shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect First Repository</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="border border-zinc-800 bg-[#0c0c0e] hover:border-zinc-700 rounded-xl p-5 shadow-lg space-y-4 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-mono font-semibold text-zinc-100">
                          {proj.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        ID: {proj.id}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                        proj.status === 'Ready'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                          : proj.status === 'Indexing' || proj.status === 'Syncing'
                          ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40 animate-pulse'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 text-xs font-mono">
                    <div className="bg-zinc-900/50 border border-zinc-850 p-2 rounded">
                      <span className="text-[10px] text-zinc-500 block">Knowledge Nodes</span>
                      <span className="text-zinc-200 font-bold">{proj.knowledgeNodes ?? 0}</span>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-850 p-2 rounded">
                      <span className="text-[10px] text-zinc-500 block">Doc Pages</span>
                      <span className="text-zinc-200 font-bold">{proj.docPages ?? 0}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                      <Link
                        href={`/repositories/${proj.id}/docs`}
                        className="hover:text-zinc-200 transition flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        Docs
                      </Link>
                      <Link
                        href={`/repositories/${proj.id}/query`}
                        className="hover:text-zinc-200 transition flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Query
                      </Link>
                      <Link
                        href={`/repositories/${proj.id}/mcp`}
                        className="hover:text-zinc-200 transition flex items-center gap-1"
                      >
                        <Plug className="w-3 h-3" />
                        MCP
                      </Link>
                    </div>

                    <Link
                      href={`/repositories/${proj.id}`}
                      className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Overview →</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SETTINGS & DETAILS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="border border-zinc-800 bg-[#0c0c0e] rounded-xl p-6 shadow-lg space-y-5">
            <h3 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
              Organization Metadata & Access Keys
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-zinc-800/60 gap-2">
                <span className="text-zinc-500">Organization Name:</span>
                <span className="text-zinc-100 font-semibold">{displayOrgName}</span>
              </div>

              {displayOrgSlug && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-zinc-800/60 gap-2">
                  <span className="text-zinc-500">Slug:</span>
                  <span className="text-zinc-300">{displayOrgSlug}</span>
                </div>
              )}

              {displayOrgId && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-zinc-800/60 gap-2">
                  <span className="text-zinc-500">Organization Identifier:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                      {displayOrgId}
                    </code>
                    <button
                      onClick={() => handleCopyId(displayOrgId)}
                      className="p-1 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
                      title="Copy ID"
                    >
                      {copiedId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {organization?.created_at && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-zinc-800/60 gap-2">
                  <span className="text-zinc-500">Created:</span>
                  <span className="text-zinc-400">
                    {new Date(organization.created_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Clerk Workspace Switcher / Management */}
          <div className="border border-zinc-800 bg-[#0c0c0e] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
                Clerk Organization Directory
              </h4>
            </div>
            <OrganizationList
              hidePersonal={true}
              afterCreateOrganizationUrl="/organization"
              afterSelectOrganizationUrl="/organization"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-transparent border-0 shadow-none text-zinc-100',
                  organizationListPreviewButton:
                    'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-mono text-xs',
                },
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL: INVITE MEMBER */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-mono font-semibold text-zinc-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                Invite Team Member
              </h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full bg-[#121215] border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-zinc-300">Access Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                >
                  <option value="member">Member — Standard view & edit workspace access</option>
                  <option value="admin">Admin — Manage team members & repository settings</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-mono font-medium rounded transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow"
                >
                  {isInviting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPACT MODAL: CREATE ORGANIZATION */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-mono font-semibold text-zinc-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Create New Organization
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-zinc-300">Organization Name</label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug || newOrgSlug === newOrgName.toLowerCase().replace(/\s+/g, '-')) {
                      setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                    }
                  }}
                  placeholder="Acme Engineering"
                  className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-zinc-300">Slug (Optional)</label>
                <input
                  type="text"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="acme-engineering"
                  className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newOrgName.trim()}
                  className="px-4 py-2 bg-cyan-500 text-zinc-950 hover:bg-cyan-400 text-xs font-mono font-semibold rounded transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow"
                >
                  {isCreating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5" />
                  )}
                  <span>Create Organization</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
