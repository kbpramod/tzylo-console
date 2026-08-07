'use client';

import { useState } from 'react';
import { Github, Check, Loader2, X, ExternalLink } from 'lucide-react';
import { Repository } from '@/lib/mockData';

interface ConnectRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (repo: Repository) => void;
}

export const GITHUB_APP_INSTALL_URL = 'https://github.com/apps/tzylo/installations/new';

const AVAILABLE_GITHUB_REPOS = [
  'tzylo/payments-service',
  'tzylo/notification-engine',
  'tzylo/frontend-dashboard',
  'tzylo/ml-pipeline',
];

export function ConnectRepoModal({ isOpen, onClose, onConnect }: ConnectRepoModalProps) {
  const [selectedRepo, setSelectedRepo] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState<'select' | 'syncing'>('select');

  if (!isOpen) return null;

  const handleConnect = () => {
    if (!selectedRepo) return;
    setIsConnecting(true);
    setStep('syncing');

    setTimeout(() => {
      const repoName = selectedRepo.split('/')[1] || selectedRepo;
      const newRepo: Repository = {
        id: repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name: repoName,
        status: 'Indexing',
        lastSync: 'Syncing now...',
        knowledgeNodes: 154,
        docPages: 12,
        githubUrl: `https://github.com/${selectedRepo}`,
        connectedAt: new Date().toISOString().split('T')[0],
      };
      onConnect(newRepo);
      setIsConnecting(false);
      setStep('select');
      setSelectedRepo('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-[#121215] border border-zinc-800 rounded-lg w-full max-w-md p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-zinc-100" />
            <h2 className="text-base font-medium text-zinc-100">Connect GitHub Repository</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'select' ? (
          <>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Connect your repository via the official Tzylo GitHub App to continuously extract engineering knowledge from pull requests.
            </p>

            {/* Banner linking directly to official GitHub App installation */}
            <div className="border border-zinc-800 bg-zinc-900/60 rounded p-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-zinc-200">Don&apos;t see your repository?</p>
                <p className="text-[11px] text-zinc-400">Install the Tzylo GitHub App to grant access.</p>
              </div>
              <a
                href={GITHUB_APP_INSTALL_URL}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-medium rounded transition flex items-center gap-1 shrink-0"
              >
                Install App
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                Installed Repositories
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {AVAILABLE_GITHUB_REPOS.map((repo) => (
                  <button
                    key={repo}
                    onClick={() => setSelectedRepo(repo)}
                    className={`w-full flex items-center justify-between p-2.5 text-xs rounded border text-left transition ${
                      selectedRepo === repo
                        ? 'border-zinc-300 bg-zinc-800/80 text-zinc-100'
                        : 'border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="font-mono">{repo}</span>
                    {selectedRepo === repo && <Check className="w-3.5 h-3.5 text-zinc-100" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs border border-zinc-800 rounded text-zinc-400 hover:bg-zinc-900 transition"
              >
                Cancel
              </button>
              <button
                disabled={!selectedRepo}
                onClick={handleConnect}
                className="px-4 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-950 rounded hover:bg-white disabled:opacity-40 transition"
              >
                Connect Repository
              </button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Connecting {selectedRepo}...</p>
              <p className="text-xs text-zinc-500 mt-1">Configuring GitHub App webhooks & indexing PR history...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
