'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Github, Trash2, Check, ExternalLink } from 'lucide-react';
import { GITHUB_APP_INSTALL_URL } from '@/components/ConnectRepoModal';

export default function RepositorySettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [repoName, setRepoName] = useState(id);
  const [savedName, setSavedName] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navTabs = [
    { name: 'Overview', href: `/repositories/${id}`, active: false },
    { name: 'Documentation', href: `/repositories/${id}/docs`, active: false },
    { name: 'Query', href: `/repositories/${id}/query`, active: false },
    { name: 'MCP', href: `/repositories/${id}/mcp`, active: false },
    { name: 'Settings', href: `/repositories/${id}/settings`, active: true },
  ];

  const handleSave = () => {
    setSavedName(true);
    setTimeout(() => setSavedName(false), 2000);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete repository ${id}? This action cannot be undone.`)) {
      setIsDeleting(true);
      setTimeout(() => {
        router.push('/');
      }, 500);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header Tabs */}
      <div className="space-y-4">
        <h1 className="text-2xl font-mono font-semibold text-zinc-100">{id} Settings</h1>

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

      {/* General Settings Card */}
      <div className="border border-zinc-800 bg-[#0c0c0e] rounded-lg p-6 space-y-6">
        <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400">
          General Settings
        </h2>

        <div className="space-y-2">
          <label className="text-xs font-mono text-zinc-300">Repository Display Name</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="flex-1 bg-[#121215] border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 rounded hover:text-white transition flex items-center gap-1.5"
            >
              {savedName ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Saved
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>

        {/* GitHub Integration Info */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-zinc-300" />
              <span className="text-xs font-mono text-zinc-200">GitHub App Integration</span>
            </div>
            <a
              href={GITHUB_APP_INSTALL_URL}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 transition flex items-center gap-1"
            >
              Manage App
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            Connected via the official Tzylo GitHub App. Webhooks are active for automatic pull request ingestion and real-time knowledge graph updates.
          </p>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="border border-red-900/40 bg-red-950/10 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <h2 className="text-xs font-mono uppercase tracking-wider font-semibold">
            Danger Zone
          </h2>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-medium text-zinc-200">Delete Repository</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Permanently remove this knowledge base and associated MCP keys.
            </p>
          </div>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3.5 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded text-xs font-mono transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Repository
          </button>
        </div>
      </div>
    </div>
  );
}
