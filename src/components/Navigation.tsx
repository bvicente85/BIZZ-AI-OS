'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export function Navigation() {
  const pathname = usePathname();
  const { user, workspaceName, workspaceRole, signOut, loading } = useAuth();
  const isConfigured = isSupabaseConfigured();

  const isLoginPage = pathname === '/login';

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Clientes', href: '/clients' },
    { label: 'Cases', href: '/cases' },
    { label: 'Conversas Gerais', href: '/conversations' },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 text-zinc-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-white text-lg">BIZZ-AI-OS</span>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              Sprint 1B
            </span>
          </Link>

          {!isLoginPage && user && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 text-xs">
          {/* Supabase Status */}
          {isConfigured ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Supabase Ligado
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Modo Local
            </span>
          )}

          {/* Logged in User Profile */}
          {!loading && user ? (
            <div className="flex items-center gap-3">
              {workspaceName && (
                <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                  <span className="text-zinc-500">Workspace:</span>
                  <span className="font-semibold text-white">{workspaceName}</span>
                  {workspaceRole && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 ml-1">
                      {workspaceRole}
                    </span>
                  )}
                </span>
              )}

              <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[160px]" title={user.email}>
                {user.email}
              </span>

              <button
                onClick={() => signOut()}
                className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors cursor-pointer"
              >
                Terminar Sessão
              </button>
            </div>
          ) : !loading && !isLoginPage ? (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors"
            >
              Iniciar Sessão
            </Link>
          ) : null}
        </div>
      </div>

      {/* Mobile Nav */}
      {!isLoginPage && user && (
        <div className="md:hidden border-t border-zinc-800/80 px-4 py-2 flex items-center justify-around bg-zinc-900/50">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs px-2 py-1 rounded ${
                  isActive ? 'text-white font-bold bg-zinc-800' : 'text-zinc-400'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
