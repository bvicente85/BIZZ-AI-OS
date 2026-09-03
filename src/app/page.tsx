'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getClients, getCases, getConversations, getDocuments } from '@/lib/services/api';
import { Client, Case, Conversation, DocumentRecord } from '@/types/database';
import { useAuth } from '@/lib/context/AuthContext';

export default function Dashboard() {
  const { user, workspaceId, workspaceName, loading: authLoading } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);

    try {
      const [clsRes, cssRes, cvsRes, docsRes] = await Promise.allSettled([
        getClients(workspaceId),
        getCases(workspaceId),
        getConversations(undefined, workspaceId),
        getDocuments(workspaceId),
      ]);

      if (clsRes.status === 'fulfilled') {
        setClients(clsRes.value);
      } else {
        console.error('Error fetching clients for dashboard:', clsRes.reason);
      }

      if (cssRes.status === 'fulfilled') {
        setCases(cssRes.value);
      } else {
        console.error('Error fetching cases for dashboard:', cssRes.reason);
      }

      if (cvsRes.status === 'fulfilled') {
        setConversations(cvsRes.value);
      } else {
        console.error('Error fetching conversations for dashboard:', cvsRes.reason);
      }

      if (docsRes.status === 'fulfilled') {
        setDocuments(docsRes.value);
      } else {
        console.error('Error fetching documents for dashboard:', docsRes.reason);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!authLoading) {
      if (workspaceId) {
        loadData();
      } else if (!user) {
        setLoading(false);
      }
    }
  }, [workspaceId, authLoading, user, loadData]);

  if (authLoading || (loading && workspaceId && clients.length === 0 && cases.length === 0 && conversations.length === 0)) {
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
            Gestão protegida por RLS de Documentos, Clientes, Contactos, Cases e Conversas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/documents"
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold transition-colors"
          >
            + Intake Documento
          </Link>
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
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/documents"
          className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors block"
        >
          <p className="text-xs uppercase font-medium tracking-wider text-zinc-500">Documentos</p>
          <p className="text-3xl font-bold text-white mt-1">
            {loading && documents.length === 0 ? '-' : documents.length}
          </p>
          <p className="text-xs text-zinc-400 mt-2">Conhecimento extraído</p>
        </Link>

        <Link
          href="/clients"
          className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors block"
        >
          <p className="text-xs uppercase font-medium tracking-wider text-zinc-500">Clientes</p>
          <p className="text-3xl font-bold text-white mt-1">
            {loading && clients.length === 0 ? '-' : clients.length}
          </p>
          <p className="text-xs text-zinc-400 mt-2">Empresas registadas</p>
        </Link>

        <Link
          href="/cases"
          className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors block"
        >
          <p className="text-xs uppercase font-medium tracking-wider text-zinc-500">Cases</p>
          <p className="text-3xl font-bold text-white mt-1">
            {loading && cases.length === 0 ? '-' : cases.length}
          </p>
          <p className="text-xs text-zinc-400 mt-2">Processos ativos</p>
        </Link>

        <Link
          href="/conversations"
          className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors block"
        >
          <p className="text-xs uppercase font-medium tracking-wider text-zinc-500">Conversas</p>
          <p className="text-3xl font-bold text-white mt-1">
            {loading && conversations.length === 0 ? '-' : conversations.length}
          </p>
          <p className="text-xs text-zinc-400 mt-2">Sessões de diálogo</p>
        </Link>
      </div>

      {/* Recent Documents and Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Documentos Recentes</h2>
            <Link href="/documents" className="text-xs text-zinc-400 hover:text-white">
              Ver todos →
            </Link>
          </div>

          {loading && documents.length === 0 ? (
            <p className="text-xs text-zinc-500">A carregar documentos...</p>
          ) : documents.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg">
              <p className="text-xs text-zinc-500">Nenhum documento introduzido ainda.</p>
              <Link
                href="/documents"
                className="mt-2 inline-block text-xs font-medium text-emerald-400 hover:underline"
              >
                Introduzir primeiro documento ou PDF
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {documents.slice(0, 5).map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="py-3 flex items-center justify-between hover:bg-zinc-800/30 px-2 rounded-lg transition-colors block"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-zinc-200">{doc.title}</p>
                    <p className="text-xs text-zinc-500">
                      {doc.source_type === 'pdf' ? '📄 PDF' : '📝 Texto manual'} • {doc.source_metadata?.charCount || doc.raw_text.length} chars
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    {doc.processing_status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Cases */}
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Casos Recentes</h2>
            <Link href="/cases" className="text-xs text-zinc-400 hover:text-white">
              Ver todos →
            </Link>
          </div>

          {loading && cases.length === 0 ? (
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
      </div>
    </div>
  );
}
