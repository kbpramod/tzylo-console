'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Send, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { QueryResult } from '@/types/repository';
import api from '@/lib/api';

export default function QueryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [question, setQuestion] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queries, setQueries] = useState<QueryResult[]>([]);

  const navTabs = [
    { name: 'Overview', href: `/repositories/${id}`, active: false },
    { name: 'Documentation', href: `/repositories/${id}/docs`, active: false },
    { name: 'Query', href: `/repositories/${id}/query`, active: true },
    { name: 'MCP', href: `/repositories/${id}/mcp`, active: false },
    { name: 'Settings', href: `/repositories/${id}/settings`, active: false },
  ];

  const handleAsk = async (queryText?: string) => {
    const qToAsk = queryText || question;
    if (!qToAsk.trim()) return;

    setIsQuerying(true);
    try {
      const res = await api.repositories.query(id, qToAsk);
      const data = res.data;
      const newQueryResult: QueryResult = {
        id: data.id || Date.now().toString(),
        question: qToAsk,
        answer: data.answer || data.response || 'No answer returned by repository model.',
        sources: Array.isArray(data.sources) ? data.sources : [],
        timestamp: 'Just now',
      };
      setQueries((prev) => [newQueryResult, ...prev]);
    } catch (err) {
      console.error('Failed to submit repository query:', err);
      const fallbackResult: QueryResult = {
        id: Date.now().toString(),
        question: qToAsk,
        answer: `Query submitted to backend (${id}). Connect FastAPI database to retrieve real RAG context embeddings.`,
        sources: [],
        timestamp: 'Just now',
      };
      setQueries((prev) => [fallbackResult, ...prev]);
    } finally {
      setIsQuerying(false);
      setQuestion('');
    }
  };

  const samplePrompts = [
    'How is JWT authentication implemented?',
    'What database entities exist in this service?',
    'Where are API rate limits configured?',
  ];

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="space-y-4">
        <h1 className="text-2xl font-mono font-semibold text-zinc-100">Ask {id}</h1>

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

      {/* Query Input Card */}
      <div className="border border-zinc-800 bg-[#0c0c0e] rounded-lg p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Ask your repository...
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleAsk();
              }
            }}
            placeholder="e.g. How is JWT authentication implemented?"
            className="w-full h-24 bg-[#121215] border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600 transition resize-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500">Try asking:</span>
            {samplePrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setQuestion(prompt);
                  handleAsk(prompt);
                }}
                className="text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          <button
            disabled={!question.trim() || isQuerying}
            onClick={() => handleAsk()}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-950 rounded hover:bg-white disabled:opacity-40 transition shrink-0 cursor-pointer"
          >
            {isQuerying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Ask
          </button>
        </div>
      </div>

      {/* Results Feed */}
      <div className="space-y-6 pt-2">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          Query Results ({queries.length})
        </h2>

        {queries.length === 0 ? (
          <div className="border border-zinc-800/80 bg-[#0c0c0e] rounded-lg p-8 text-center text-xs font-mono text-zinc-500 space-y-1">
            <p>No queries submitted yet for {id}.</p>
            <p className="text-[11px] text-zinc-600">Type a question above or click a prompt to query the knowledge graph.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queries.map((q) => (
              <div key={q.id} className="border border-zinc-800 bg-[#0c0c0e] rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <span className="text-xs font-mono font-medium text-zinc-200">
                    Q: {q.question}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">{q.timestamp}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest text-[10px]">
                    Answer
                  </p>
                  <div className="text-xs font-mono text-zinc-200 leading-relaxed bg-[#121215] border border-zinc-800/60 p-4 rounded">
                    {q.answer}
                  </div>
                </div>

                {q.sources && q.sources.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest text-[10px]">
                      Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {q.sources.map((src, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900/60 text-xs font-mono"
                        >
                          <BookOpen className="w-3 h-3 text-zinc-500" />
                          <span className="text-zinc-300">{src.title}</span>
                          <span className="text-zinc-600">({src.path})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

