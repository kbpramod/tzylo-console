'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Home, BookOpen, MessageSquare, Plug, Settings, ChevronDown, Layers } from 'lucide-react';
import { INITIAL_REPOSITORIES } from '@/lib/mockData';

interface ConsoleShellProps {
  children: React.ReactNode;
}

export function ConsoleShell({ children }: ConsoleShellProps) {
  const pathname = usePathname();

  // Extract repo ID from URL if inside /repositories/[id]...
  const repoMatch = pathname?.match(/\/repositories\/([^/]+)/);
  const currentRepoId = repoMatch ? repoMatch[1] : 'auth-service';

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      exact: true,
    },
    {
      name: 'Documentation',
      href: `/repositories/${currentRepoId}/docs`,
      icon: BookOpen,
    },
    {
      name: 'Query',
      href: `/repositories/${currentRepoId}/query`,
      icon: MessageSquare,
    },
    {
      name: 'MCP',
      href: `/repositories/${currentRepoId}/mcp`,
      icon: Plug,
    },
    {
      name: 'Settings',
      href: `/repositories/${currentRepoId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 antialiased font-sans">
      {/* Header */}
      <header className="h-13 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wider text-zinc-100 hover:opacity-90">
            <div className="w-5 h-5 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs">
              T
            </div>
            TZYLO
          </Link>

          {/* Repository Selector Indicator */}
          {repoMatch && (
            <div className="flex items-center gap-2 text-xs font-mono border-l border-zinc-800 pl-6">
              <span className="text-zinc-500">repo:</span>
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded text-zinc-200">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>{currentRepoId}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-60 border-r border-zinc-800/80 p-4 shrink-0 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 px-2 mb-2">
                Navigation
              </p>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                        isActive
                          ? 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/50'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-zinc-400" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Repository Context Switcher */}
            <div className="pt-4 border-t border-zinc-800/60">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 px-2 mb-2">
                Active Repository
              </p>
              <div className="space-y-1">
                {INITIAL_REPOSITORIES.map((repo) => (
                  <Link
                    key={repo.id}
                    href={`/repositories/${repo.id}`}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-mono transition ${
                      currentRepoId === repo.id
                        ? 'text-zinc-100 font-semibold bg-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="truncate">{repo.name}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        repo.status === 'Ready' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                      }`}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="px-2 pt-4 border-t border-zinc-800/60 text-[11px] text-zinc-500 space-y-1">
            <p className="font-mono">Tzylo Console v1.0</p>
            <p className="text-zinc-600">Living Repository Knowledge Base</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
