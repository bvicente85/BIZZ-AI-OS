'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getCases, getClients, createCase } from '@/lib/services/api';
import { Case, Client, CaseStatus, CasePriority } from '@/types/database';
import { useAuth } from '@/lib/context/AuthContext';

function CasesContent() {
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('client_id');
  const { workspaceId, loading: authLoading } = useAuth();

  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(Boolean(preselectedClientId));

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState<string>(preselectedClientId || '');
  const [status, setStatus] = useState<CaseStatus>('active');
  const [priority, setPriority] = useState<CasePriority>('medium');
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [allCases, allClients] = await Promise.all([
        getCases(workspaceId),
        getClients(workspaceId),
      ]);
      setCases(allCases);
      setClients(allClients);
    } catch (err) {
      console.error('Error fetching cases data:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [workspaceId, authLoading, loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !workspaceId) return;

    setSubmitting(true);
    setError(null);
    try {
      const tags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await createCase(workspaceId, {
        title,
        description: description.trim() || undefined,
        client_id: clientId || null,
        status,
        priority,
        tags,
      });

      setTitle('');
      setDescription('');
      setClientId('');
      setStatus('active');
      setPriority('medium');
      setTagInput('');
      setIsCreating(false);
      await loadData();
    } catch (err: unknown) {
      console.error('Failed to create case:', err);
      setError(err instanceof Error ? err.message : 'Falha ao criar Case');
    } finally {
      setSubmitting(false);
    }
  }

  const getClientName = (cid: string | null) => {
    if (!cid) return null;
    const cl = clients.find((c) => c.id === cid);
    return cl ? cl.name : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Cases (Processos)</h1>
          <p className="text-sm text-zinc-400">
            A entidade central do BIZZ-AI-OS: projetos, oportunidades comerciais e processos.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-sm font-medium transition-colors"
        >
          {isCreating ? 'Cancelar' : '+ Novo Case'}
        </button>
      </div>

      {/* Creation Modal / Form */}
      {isCreating && (
        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h2 className="text-base font-semibold text-white">Criar Novo Case</h2>
          {error && (
            <div className="p-3 rounded-md bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Título do Case *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Formação à medida ERSE, Concurso Público 2026..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Cliente Associado (Opcional)
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
                >
                  <option value="">-- Sem Cliente (Caso Interno / Exploratório) --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CaseStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
                >
                  <option value="draft">Rascunho (Draft)</option>
                  <option value="active">Ativo (Active)</option>
                  <option value="on_hold">Em Espera (On Hold)</option>
                  <option value="completed">Concluído (Completed)</option>
                  <option value="archived">Arquivado (Archived)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CasePriority)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
                >
                  <option value="low">Baixa (Low)</option>
                  <option value="medium">Média (Medium)</option>
                  <option value="high">Alta (High)</option>
                  <option value="urgent">Urgente (Urgent)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Descrição do Case
              </label>
              <textarea
                rows={2}
                placeholder="Contexto da oportunidade, requisitos ou objetivos..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="formacao, proposta, 2026..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
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
                disabled={submitting || !title.trim() || !workspaceId}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {submitting ? 'A criar...' : 'Criar Case'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cases List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-500">A carregar cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-zinc-400 text-sm">Nenhum Case criado neste workspace.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              Criar o primeiro Case
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {cases.map((c) => {
              const clientName = getClientName(c.client_id);
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors block"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white text-base hover:text-emerald-400 transition-colors">
                        {c.title}
                      </span>
                      {clientName ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 font-medium border border-zinc-700">
                          {clientName}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800/50 text-zinc-400 italic">
                          Caso Interno
                        </span>
                      )}
                    </div>
                    {c.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{c.description}</p>
                    )}
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.tags.map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${
                        c.priority === 'urgent'
                          ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                          : c.priority === 'high'
                          ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {c.priority}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full capitalize font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                      {c.status}
                    </span>
                    <span className="text-zinc-500 text-xs">Abrir →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">A carregar...</div>}>
      <CasesContent />
    </Suspense>
  );
}
