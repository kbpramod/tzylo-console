'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { GitBranch, BookOpen, MessageSquare, Plug, Settings, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Repository } from '@/types/repository';
import api from '@/lib/api';

export default function RepositoryOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRepo() {
      try {
        setIsLoading(true);
        const res = await api.repositories.get(id);
        setRepo(res.data);
      } catch (err) {
        console.error('Failed to fetch repo detail:', err);
        setRepo({
          id,
          name: id,
          status: 'Ready',
          lastSync: 'Sync pending',
          knowledgeNodes: 0,
          docPages: 0,
          githubUrl: `https://github.com/${id}`,
          connectedAt: new Date().toISOString().split('T')[0],
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchRepo();
  }, [id]);

  const navTabs = [
    { name: 'Overview', href: `/repositories/${id}`, active: true },
    { name: 'Documentation', href: `/repositories/${id}/docs`, active: false },
    { name: 'Query', href: `/repositories/${id}/query`, active: false },
    { name: 'MCP', href: `/repositories/${id}/mcp`, active: false },
    { name: 'Settings', href: `/repositories/${id}/settings`, active: false },
  ];

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
        <p className="text-xs font-mono text-zinc-500">Loading repository details...</p>
      </div>
    );
  }

  const currentRepo = repo || {
    id,
    name: id,
    status: 'Ready',
    lastSync: 'Sync pending',
    knowledgeNodes: 0,
    docPages: 0,
    githubUrl: `https://github.com/${id}`,
    connectedAt: new Date().toISOString().split('T')[0],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-mono font-semibold text-zinc-100">{currentRepo.name}</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
              {currentRepo.status || 'Ready'}
            </span>
          </div>

          {currentRepo.githubUrl && (
            <a
              href={currentRepo.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition font-mono"
            >
              GitHub
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-zinc-800 text-xs font-mono">
          {navTabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`pb-3 transition border-b-2 -mb-px ${
                tab.active
                  ? 'border-zinc-100 text-zinc-100 font-medium'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-zinc-800/80 bg-[#0c0c0e] rounded-lg p-5 space-y-2">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Knowledge Nodes
          </p>
          <p className="text-2xl font-mono font-semibold text-zinc-100">
            {(currentRepo.knowledgeNodes ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="border border-zinc-800/80 bg-[#0c0c0e] rounded-lg p-5 space-y-2">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Documentation Pages
          </p>
          <p className="text-2xl font-mono font-semibold text-zinc-100">
            {currentRepo.docPages ?? 0}
          </p>
        </div>

        <div className="border border-zinc-800/80 bg-[#0c0c0e] rounded-lg p-5 space-y-2">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Last Updated
          </p>
          <p className="text-2xl font-mono font-semibold text-zinc-100">
            {currentRepo.lastSync || 'Sync pending'}
          </p>
        </div>

        <div className="border border-zinc-800/80 bg-[#0c0c0e] rounded-lg p-5 space-y-2">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            GitHub Connection
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-mono text-zinc-200">Connected</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="pt-4 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          Knowledge Surfaces
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/repositories/${id}/docs`}
            className="border border-zinc-800/80 bg-[#0c0c0e] hover:border-zinc-700 rounded-lg p-5 space-y-3 transition group"
          >
            <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-zinc-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white transition">
                Documentation
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Browse auto-generated engineering documentation.
              </p>
            </div>
          </Link>

          <Link
            href={`/repositories/${id}/query`}
            className="border border-zinc-800/80 bg-[#0c0c0e] hover:border-zinc-700 rounded-lg p-5 space-y-3 transition group"
          >
            <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-zinc-300">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white transition">
                Ask Repository
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Query repository knowledge using natural language.
              </p>
            </div>
          </Link>

          <Link
            href={`/repositories/${id}/mcp`}
            className="border border-zinc-800/80 bg-[#0c0c0e] hover:border-zinc-700 rounded-lg p-5 space-y-3 transition group"
          >
            <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-zinc-300">
              <Plug className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white transition">
                MCP Endpoint
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Connect AI agents via Model Context Protocol.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

