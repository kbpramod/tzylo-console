'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, GitBranch, ArrowRight, RefreshCw, CheckCircle2, Clock, Inbox, Loader2 } from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Repository } from '@/types/repository';
import { ConnectRepoModal, GITHUB_APP_INSTALL_URL } from '@/components/ConnectRepoModal';
import api from '@/lib/api';

export default function DashboardPage() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRepositories = async () => {
    try {
      setIsLoading(true);
      const res = await api.repositories.list();
      setRepositories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
      setRepositories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleConnectRepositoryClick = async () => {
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
        console.error('Failed to retrieve state-protected GitHub install URL:', err);
        window.open(GITHUB_APP_INSTALL_URL, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleAddRepo = async (newRepo: Repository) => {
    try {
      await api.repositories.connect({ repository: newRepo.name });
      await fetchRepositories();
    } catch (err) {
      console.error('Failed to connect repo:', err);
      setRepositories((prev) => [newRepo, ...prev]);
    }
  };

  return (
    <div className="space-y-10">
      {/* Welcome Banner Card */}
      <div className="border border-zinc-800 bg-[#121215] rounded-lg p-8 md:p-10 space-y-6">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Welcome to Tzylo
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Connect a GitHub repository to build a living knowledge base. Tzylo automatically extracts durable engineering facts from pull requests and code changes to power documentation, search, and AI tools.
          </p>
        </div>

        <div>
          <button
            onClick={handleConnectRepositoryClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-zinc-100 text-zinc-950 rounded hover:bg-white transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Connect Repository
          </button>
        </div>
      </div>

      {/* Repositories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400">
            Repositories ({repositories.length})
          </h2>
        </div>

        {/* Minimal Table */}
        <div className="border border-zinc-800/80 rounded-lg overflow-hidden bg-[#0c0c0e]">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
              <p className="text-xs font-mono text-zinc-500">Loading repositories from backend...</p>
            </div>
          ) : repositories.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-3">
              <Inbox className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">No connected repositories found</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Connect your first GitHub repository using the button above to begin indexing documentation and knowledge graphs.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-500 font-mono">
                  <th className="py-3 px-4 font-normal">Name</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 font-normal">Last Sync</th>
                  <th className="py-3 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {repositories.map((repo) => (
                  <tr key={repo.id} className="hover:bg-zinc-900/40 transition group">
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-200">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-zinc-500" />
                        <span>{repo.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono ${
                          repo.status === 'Ready'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        }`}
                      >
                        {repo.status === 'Ready' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                        )}
                        {repo.status || 'Ready'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{repo.lastSync || 'Just now'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/repositories/${repo.id}`}
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100 font-medium transition"
                      >
                        Open
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConnectRepoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleAddRepo}
      />
    </div>
  );
}

