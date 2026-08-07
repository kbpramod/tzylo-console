'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Eye, EyeOff, Key, Terminal } from 'lucide-react';

export default function McpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const mcpEndpoint = `https://mcp.tzylo.dev/v1/${id}`;
  
  const [apiKey, setApiKey] = useState('tz_live_9f8a2b4c1d6e3f5a7b9c0d1e');
  const [showKey, setShowKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const navTabs = [
    { name: 'Overview', href: `/repositories/${id}`, active: false },
    { name: 'Documentation', href: `/repositories/${id}/docs`, active: false },
    { name: 'Query', href: `/repositories/${id}/query`, active: false },
    { name: 'MCP', href: `/repositories/${id}/mcp`, active: true },
    { name: 'Settings', href: `/repositories/${id}/settings`, active: false },
  ];

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(mcpEndpoint);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleGenerateKey = () => {
    const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setApiKey(`tz_live_${randomHex}`);
  };

  return (
    <div className="space-y-8">
      {/* Header Tabs */}
      <div className="space-y-4">
        <h1 className="text-2xl font-mono font-semibold text-zinc-100">{id} MCP Integration</h1>

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

      {/* Main MCP Configuration Panel */}
      <div className="max-w-2xl space-y-6">
        {/* Repository info */}
        <div className="border border-zinc-800 bg-[#0c0c0e] rounded-lg p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Repository Context
            </p>
            <p className="text-sm font-mono text-zinc-200">{id}</p>
          </div>

          {/* MCP Endpoint Box */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              MCP Endpoint
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={mcpEndpoint}
                className="flex-1 bg-[#121215] border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200"
              />
              <button
                onClick={handleCopyEndpoint}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 rounded hover:text-zinc-100 transition flex items-center gap-1.5"
              >
                {copiedEndpoint ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* API Key Box */}
          <div className="space-y-2 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                API Key
              </p>
              <button
                onClick={handleGenerateKey}
                className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition"
              >
                Generate New Key
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                readOnly
                value={apiKey}
                className="flex-1 bg-[#121215] border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded hover:text-zinc-200 transition"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleCopyKey}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 rounded hover:text-zinc-100 transition flex items-center gap-1.5"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Client Config Snippet */}
        <div className="border border-zinc-800/80 bg-[#0c0c0e] rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-mono font-medium text-zinc-200">
              mcp.json Configuration
            </h3>
          </div>
          <pre className="bg-[#121215] border border-zinc-800/80 p-4 rounded text-xs font-mono text-zinc-300 overflow-x-auto">
{`{
  "mcpServers": {
    "tzylo-${id}": {
      "url": "${mcpEndpoint}",
      "headers": {
        "Authorization": "Bearer ${apiKey}"
      }
    }
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
