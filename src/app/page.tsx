'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, GitBranch, ArrowRight, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { INITIAL_REPOSITORIES, Repository } from '@/lib/mockData';
import { ConnectRepoModal } from '@/components/ConnectRepoModal';

export default function DashboardPage() {
  const [repositories, setRepositories] = useState<Repository[]>(INITIAL_REPOSITORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddRepo = (newRepo: Repository) => {
    setRepositories((prev) => [newRepo, ...prev]);
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-zinc-100 text-zinc-950 rounded hover:bg-white transition"
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
                      {repo.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{repo.lastSync}</span>
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
