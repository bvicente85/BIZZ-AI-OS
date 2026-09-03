'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getClients, createClient } from '@/lib/services/api';
import { Client, ClientStatus } from '@/types/database';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ClientStatus>('active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadClients() {
    try {
      const data = await getClients();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await createClient({
        name,
        industry: industry.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      });
      setName('');
      setIndustry('');
      setNotes('');
      setStatus('active');
      setIsCreating(false);
      await loadClients();
    } catch (err: unknown) {
      console.error('Failed to create client:', err);
      setError(err instanceof Error ? err.message : 'Falha ao criar cliente');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Clientes</h1>
          <p className="text-sm text-zinc-400">
            Empresas, organizações e entidades parceiras do BIZZ-AI-OS.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-sm font-medium transition-colors"
        >
          {isCreating ? 'Cancelar' : '+ Novo Cliente'}
        </button>
      </div>

      {/* Creation Modal / Form */}
      {isCreating && (
        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h2 className="text-base font-semibold text-white">Registar Novo Cliente</h2>
          {error && (
            <div className="p-3 rounded-md bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Nome da Empresa / Organização *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: ERSE, Crédito Agrícola..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Setor / Indústria
                </label>
                <input
                  type="text"
                  placeholder="ex: Energia, Banca, Retalho..."
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
                >
                  <option value="active">Ativo (Active)</option>
                  <option value="prospect">Em Prospeção (Prospect)</option>
                  <option value="inactive">Inativo (Inactive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Notas Iniciais
                </label>
                <input
                  type="text"
                  placeholder="Observações contextuais breves..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
                />
              </div>
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
                disabled={submitting || !name.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {submitting ? 'A guardar...' : 'Criar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-500">A carregar clientes...</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-zinc-400 text-sm">Nenhum cliente registado ainda.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              Registar o primeiro cliente
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors block"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-base hover:text-emerald-400 transition-colors">
                      {client.name}
                    </span>
                    {client.industry && (
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {client.industry}
                      </span>
                    )}
                  </div>
                  {client.notes && (
                    <p className="text-xs text-zinc-400 line-clamp-1">{client.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${
                      client.status === 'active'
                        ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                        : client.status === 'prospect'
                        ? 'bg-blue-950/70 text-blue-400 border border-blue-800/60'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {client.status}
                  </span>
                  <span className="text-zinc-500 text-xs">Abrir →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
