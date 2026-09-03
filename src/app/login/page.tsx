'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const [supabase] = useState(() => createClient());

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Credenciais inválidas. Verifique o seu e-mail e palavra-passe.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('O seu e-mail ainda não foi confirmado no Supabase.');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data?.user) {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Ocorreu um erro inesperado ao tentar iniciar sessão.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Acesso Restrito ao Sistema
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">BIZZ-AI-OS</h1>
          <p className="text-sm text-zinc-400">
            AI Business Operating System • Inicie sessão para aceder aos seus dados
          </p>
        </div>

        {/* Login Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-2xl backdrop-blur-sm space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/70 border border-red-800/80 text-red-300 text-xs leading-relaxed flex items-start gap-2">
              <span className="text-sm font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="o-seu-email@exemplo.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Palavra-passe
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold tracking-wide shadow-md hover:shadow-emerald-950/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>A autenticar...</span>
                </>
              ) : (
                <span>Entrar no BIZZ-AI-OS</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800 text-center">
            <p className="text-[11px] text-zinc-500">
              Protegido por Supabase Auth e Row Level Security (RLS).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
