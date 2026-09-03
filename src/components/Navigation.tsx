'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';

export function Navigation() {
  const pathname = usePathname();
  const [supabaseActive] = useState(() => isSupabaseConfigured());

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Clientes', href: '/clients' },
    { label: 'Cases', href: '/cases' },
    { label: 'Conversas Gerais', href: '/conversations' },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 text-zinc-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-white text-lg">BIZZ-AI-OS</span>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              Sprint 1A
            </span>
          </Link>

          <nav className="flex items-center gap-1">
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
        </div>

        <div className="flex items-center gap-3 text-xs">
          {supabaseActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Supabase Ligado
            </span>
          ) : (
            <span
              title="Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ficheiro .env.local para ligar a base de dados remota."
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Armazenamento Local Ativo
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
