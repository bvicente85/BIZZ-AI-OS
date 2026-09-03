'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConversations, createConversation } from '@/lib/services/api';
import { Conversation } from '@/types/database';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      // Fetch only general conversations (case_id === null)
      const data = await getConversations(null);
      setConversations(data);
    } catch (err) {
      console.error('Error fetching general conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await createConversation({
        title,
        case_id: null,
        summary: summary.trim() || undefined,
      });
      setTitle('');
      setSummary('');
      setIsCreating(false);
      await loadData();
    } catch (err: unknown) {
      console.error('Failed to create conversation:', err);
      setError(err instanceof Error ? err.message : 'Falha ao criar conversa');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Conversas Gerais</h1>
          <p className="text-sm text-zinc-400">
            Sessões de estratégia, planeamento e triagem com o Chief of Staff fora de um Case específico.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-sm font-medium transition-colors"
        >
          {isCreating ? 'Cancelar' : '+ Nova Conversa Geral'}
        </button>
      </div>

      {/* Creation Modal / Form */}
      {isCreating && (
        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h2 className="text-base font-semibold text-white">Nova Conversa com Chief of Staff</h2>
          {error && (
            <div className="p-3 rounded-md bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Título ou Assunto *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Prioridades da semana, Planeamento de novos cursos, Triagem de leads..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Objetivo / Resumo Inicial (Opcional)
              </label>
              <input
                type="text"
                placeholder="Breve enquadramento do que pretendes alinhar..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {submitting ? 'A criar...' : 'Iniciar Conversa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Conversations List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-500">A carregar conversas...</div>
        ) : conversations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-zinc-400 text-sm">Nenhuma conversa geral registada ainda.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              Criar conversa com o Chief of Staff
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/conversations/${conv.id}`}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors block"
              >
                <div className="space-y-1">
                  <span className="font-semibold text-white text-base hover:text-emerald-400 transition-colors">
                    {conv.title}
                  </span>
                  {conv.summary && (
                    <p className="text-xs text-zinc-400">{conv.summary}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs px-2.5 py-0.5 rounded-full capitalize font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                    {conv.status}
                  </span>
                  <span className="text-zinc-500 text-xs">Abrir Chat →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
