'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCaseById, getClientById, getConversations, createConversation } from '@/lib/services/api';
import { Case, Client, Conversation } from '@/types/database';
import { useAuth } from '@/lib/context/AuthContext';

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params?.id as string;
  const { workspaceId } = useAuth();

  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Conversation form state
  const [isAddingConv, setIsAddingConv] = useState(false);
  const [convTitle, setConvTitle] = useState('');
  const [convSummary, setConvSummary] = useState('');
  const [submittingConv, setSubmittingConv] = useState(false);

  const loadData = useCallback(async () => {
    if (!caseId) return;
    try {
      const c = await getCaseById(caseId);
      setCurrentCase(c);
      if (c?.client_id) {
        const cl = await getClientById(c.client_id);
        setClient(cl);
      }
      const convs = await getConversations(caseId, workspaceId);
      setConversations(convs);
    } catch (err) {
      console.error('Error fetching case details:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateConversation(e: React.FormEvent) {
    e.preventDefault();
    if (!convTitle.trim() || !caseId || !workspaceId) return;

    setSubmittingConv(true);
    try {
      await createConversation(workspaceId, {
        case_id: caseId,
        title: convTitle,
        summary: convSummary.trim() || undefined,
      });
      setConvTitle('');
      setConvSummary('');
      setIsAddingConv(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create conversation:', err);
    } finally {
      setSubmittingConv(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-zinc-500">A carregar detalhes do Case...</div>;
  }

  if (!currentCase) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-zinc-400">Case não encontrado.</p>
        <Link href="/cases" className="text-emerald-400 hover:underline text-sm font-medium">
          ← Voltar à lista de Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/cases" className="text-xs text-zinc-400 hover:text-white transition-colors">
          ← Voltar a Cases
        </Link>
      </div>

      {/* Case Summary Box */}
      <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-white">{currentCase.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-400">
              {client ? (
                <span>
                  Cliente:{' '}
                  <Link href={`/clients/${client.id}`} className="text-emerald-400 hover:underline font-medium">
                    {client.name}
                  </Link>
                </span>
              ) : (
                <span className="italic">Caso Interno / Sem Cliente</span>
              )}
              <span>•</span>
              <span>
                Prioridade: <strong className="capitalize text-zinc-300">{currentCase.priority}</strong>
              </span>
              <span>•</span>
              <span>
                Estado: <strong className="capitalize text-zinc-300">{currentCase.status}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full capitalize font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50">
              {currentCase.status}
            </span>
          </div>
        </div>

        {currentCase.description && (
          <p className="text-sm text-zinc-300 pt-2 border-t border-zinc-800/80">
            {currentCase.description}
          </p>
        )}

        {currentCase.tags && currentCase.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {currentCase.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/40">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Case Conversations Section */}
      <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Conversas deste Case</h2>
            <p className="text-xs text-zinc-400">
              Sessões de diálogo focadas (ex: Análise de pedido, Desenho pedagógico, Proposta comercial).
            </p>
          </div>
          <button
            onClick={() => setIsAddingConv(!isAddingConv)}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold transition-colors"
          >
            {isAddingConv ? 'Cancelar' : '+ Nova Conversa'}
          </button>
        </div>

        {/* Add Conversation Form */}
        {isAddingConv && (
          <form onSubmit={handleCreateConversation} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300">Criar Conversa no Case</h3>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Título da Conversa *</label>
              <input
                type="text"
                required
                placeholder="ex: Análise do pedido, Desenho da solução, Negociação..."
                value={convTitle}
                onChange={(e) => setConvTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Resumo / Objetivo (Opcional)</label>
              <input
                type="text"
                placeholder="Objetivo específico desta sessão de conversa..."
                value={convSummary}
                onChange={(e) => setConvSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingConv(false)}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingConv || !convTitle.trim() || !workspaceId}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {submittingConv ? 'A criar...' : 'Criar Conversa'}
              </button>
            </div>
          </form>
        )}

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-zinc-800 rounded-lg space-y-2">
            <p className="text-xs text-zinc-400">Ainda não existem conversas associadas a este Case.</p>
            <button
              onClick={() => setIsAddingConv(true)}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              Criar a primeira conversa
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/conversations/${conv.id}`}
                className="py-3 flex items-center justify-between hover:bg-zinc-800/30 px-3 rounded-lg transition-colors block"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-white hover:text-emerald-400 transition-colors">
                    {conv.title}
                  </p>
                  {conv.summary && (
                    <p className="text-xs text-zinc-400">{conv.summary}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
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
