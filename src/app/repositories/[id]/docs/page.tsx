'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, FileText } from 'lucide-react';
import { MOCK_DOCS, DocSection } from '@/lib/mockData';

export default function DocumentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const repoDocs: DocSection[] = MOCK_DOCS[id] || MOCK_DOCS['auth-service'];

  const [activeSectionId, setActiveSectionId] = useState<string>(
    repoDocs[0]?.id || 'authentication'
  );

  const activeDoc = repoDocs.find((d) => d.id === activeSectionId) || repoDocs[0];

  const navTabs = [
    { name: 'Overview', href: `/repositories/${id}`, active: false },
    { name: 'Documentation', href: `/repositories/${id}/docs`, active: true },
    { name: 'Query', href: `/repositories/${id}/query`, active: false },
    { name: 'MCP', href: `/repositories/${id}/mcp`, active: false },
    { name: 'Settings', href: `/repositories/${id}/settings`, active: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="space-y-4">
        <h1 className="text-2xl font-mono font-semibold text-zinc-100">{id} Documentation</h1>

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

      {/* Main Documentation Split Container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Sections Sidebar */}
        <div className="border border-zinc-800/80 bg-[#0c0c0e] rounded-lg p-3 space-y-1 md:col-span-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 px-2 py-1 mb-1">
            Knowledge Sections
          </p>

          {repoDocs.map((section) => {
            const isActive = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition font-mono ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{section.title}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
              </button>
            );
          })}
        </div>

        {/* Documentation Content Viewer */}
        <div className="md:col-span-3 border border-zinc-800/80 bg-[#0c0c0e] rounded-lg p-6 md:p-8 min-h-[450px]">
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-medium text-zinc-100 font-sans">
                {activeDoc.title}
              </h2>
              <p className="text-xs font-mono text-zinc-500 mt-1">
                Generated from repository knowledge graph • Refreshed on PR merge
              </p>
            </div>

            {/* Formatted Markdown Content Container */}
            <div className="prose prose-invert prose-zinc max-w-none text-xs leading-relaxed space-y-4 font-mono text-zinc-300">
              <div className="whitespace-pre-line leading-relaxed">
                {activeDoc.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
