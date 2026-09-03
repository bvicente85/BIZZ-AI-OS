'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getClients, getCases, getConversations } from '@/lib/services/api';
import { Client, Case, Conversation } from '@/types/database';
import { useAuth } from '@/lib/context/AuthContext';

export default function Dashboard() {
  const { user, workspaceId, workspaceName, loading: authLoading } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [cls, css, cvs] = await Promise.all([
        getClients(workspaceId),
        getCases(workspaceId),
        getConversations(undefined, workspaceId),
      ]);
      setClients(cls);
      setCases(css);
      setConversations(cvs);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      loadData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [workspaceId, authLoading, user, loadData]);

  if (authLoading || (loading && workspaceId)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-medium">A carregar ambiente de trabalho...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Sessão Ativa: {workspaceName || 'Default Workspace'}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">BIZZ-AI-OS Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gestão protegida por RLS de Clientes, Contactos, Cases, Conversas e Mensagens.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/cases"
            className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-sm font-medium transition-colors"
          >
            + Novo Case
          </Link>
          <Link
            href="/clients"
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium border border-zinc-700 transition-colors"
          >
            + Novo Cliente
          </Link>
          <Link
            href="/conversations"
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium border border-zinc-700 transition-colors"
          >
            + Conversa Geral
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/clients"
          className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors block"
        >
          <p className="text-xs uppercase font-medium tracking-wider text-zinc-500">Clientes</p>
          <p className="text-3xl font-bold text-white mt-1">
            {loading ? '-' : clients.length}
          </p>
          <p className="text-xs text-zinc-400 mt-2">Empresas e organizações registadas</p>
        </Link>

        <Link
          href="/cases"
          className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors block"
        >
          <p className="text-xs uppercase font-medium tracking-wider text-zinc-500">Cases Ativos</p>
          <p className="text-3xl font-bold text-white mt-1">
            {loading ? '-' : cases.length}
          </p>
          <p className="text-xs text-zinc-400 mt-2">Processos e oportunidades de trabalho</p>
        </Link>

        <Link
          href="/conversations"
          className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors block"
        >
          <p className="text-xs uppercase font-medium tracking-wider text-zinc-500">Conversas</p>
          <p className="text-3xl font-bold text-white mt-1">
            {loading ? '-' : conversations.length}
          </p>
          <p className="text-xs text-zinc-400 mt-2">Sessões em Cases e conversas gerais</p>
        </Link>
      </div>

      {/* Recent Cases and Conversations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cases */}
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Casos Recentes</h2>
            <Link href="/cases" className="text-xs text-zinc-400 hover:text-white">
              Ver todos →
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-zinc-500">A carregar casos...</p>
          ) : cases.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg">
              <p className="text-xs text-zinc-500">Ainda não existem Cases neste workspace.</p>
              <Link
                href="/cases"
                className="mt-2 inline-block text-xs font-medium text-emerald-400 hover:underline"
              >
                Criar o primeiro Case
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {cases.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="py-3 flex items-center justify-between hover:bg-zinc-800/30 px-2 rounded-lg transition-colors block"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{c.title}</p>
                    <p className="text-xs text-zinc-500">
                      {c.client_id ? 'Associado a Cliente' : 'Caso Interno'}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    {c.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Conversations */}
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Conversas Recentes</h2>
            <Link href="/conversations" className="text-xs text-zinc-400 hover:text-white">
              Ver todas →
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-zinc-500">A carregar conversas...</p>
          ) : conversations.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg">
              <p className="text-xs text-zinc-500">Ainda não existem Conversas criadas.</p>
              <Link
                href="/conversations"
                className="mt-2 inline-block text-xs font-medium text-emerald-400 hover:underline"
              >
                Criar conversa geral com Chief of Staff
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {conversations.slice(0, 5).map((cv) => (
                <Link
                  key={cv.id}
                  href={`/conversations/${cv.id}`}
                  className="py-3 flex items-center justify-between hover:bg-zinc-800/30 px-2 rounded-lg transition-colors block"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{cv.title}</p>
                    <p className="text-xs text-zinc-500">
                      {cv.case_id ? 'Vinculada a Case' : 'Conversa Geral'}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    {cv.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
