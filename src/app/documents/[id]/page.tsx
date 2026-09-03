'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDocumentById, getClientById, getCaseById, deleteDocument } from '@/lib/services/api';
import { DocumentRecord, Client, Case } from '@/types/database';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.id as string;

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [associatedCase, setAssociatedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'markdown' | 'raw_text' | 'metadata'
  const [activeTab, setActiveTab] = useState<'markdown' | 'raw_text' | 'metadata'>('markdown');
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!documentId) return;
    try {
      const doc = await getDocumentById(documentId);
      setDocument(doc);
      if (doc?.client_id) {
        const cl = await getClientById(doc.client_id);
        setClient(cl);
      }
      if (doc?.case_id) {
        const cs = await getCaseById(doc.case_id);
        setAssociatedCase(cs);
      }
    } catch (err) {
      console.error('Error fetching document detail:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete() {
    if (!confirm('Tem a certeza que pretende apagar este documento?')) return;
    setDeleting(true);
    try {
      await deleteDocument(documentId);
      router.push('/documents');
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Falha ao apagar documento.');
      setDeleting(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-medium">A carregar documento...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-zinc-400">Documento não encontrado.</p>
        <Link href="/documents" className="text-emerald-400 hover:underline text-sm font-medium">
          ← Voltar à lista de documentos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/documents" className="text-xs text-zinc-400 hover:text-white transition-colors">
          ← Voltar a Documentos
        </Link>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/70 text-xs font-medium transition-colors cursor-pointer"
        >
          {deleting ? 'A apagar...' : '🗑️ Apagar Documento'}
        </button>
      </div>

      {/* Document Summary Box */}
      <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {document.title}
              </h1>
              {document.source_type === 'pdf' ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950/70 text-blue-300 border border-blue-800/60 font-medium">
                  📄 PDF Extraído
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 font-medium">
                  📝 Texto Manual
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
              {client && (
                <span>
                  Cliente:{' '}
                  <Link href={`/clients/${client.id}`} className="text-emerald-400 hover:underline font-medium">
                    {client.name}
                  </Link>
                </span>
              )}
              {associatedCase && (
                <span>
                  Case:{' '}
                  <Link href={`/cases/${associatedCase.id}`} className="text-emerald-400 hover:underline font-medium">
                    {associatedCase.title}
                  </Link>
                </span>
              )}
              {document.original_filename && (
                <span>
                  Ficheiro: <strong className="text-zinc-300 font-mono">{document.original_filename}</strong>
                </span>
              )}
              <span>•</span>
              <span className="text-zinc-500">
                Criado em{' '}
                {new Date(document.created_at).toLocaleDateString('pt-PT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full capitalize font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
              {document.processing_status}
            </span>
          </div>
        </div>

        {/* Quick Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/80 text-xs">
          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
            <p className="text-zinc-500 text-[10px] uppercase font-mono">Caracteres</p>
            <p className="text-base font-bold text-white mt-0.5">
              {document.source_metadata?.charCount || document.markdown_content.length}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
            <p className="text-zinc-500 text-[10px] uppercase font-mono">Palavras</p>
            <p className="text-base font-bold text-white mt-0.5">
              {document.source_metadata?.wordCount || document.markdown_content.split(/\s+/).length}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
            <p className="text-zinc-500 text-[10px] uppercase font-mono">Páginas</p>
            <p className="text-base font-bold text-white mt-0.5">
              {document.source_metadata?.pageCount || '1'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 truncate">
            <p className="text-zinc-500 text-[10px] uppercase font-mono">Hash SHA-256</p>
            <p className="text-xs font-mono text-zinc-300 mt-1 truncate" title={document.content_hash || ''}>
              {document.content_hash ? document.content_hash.slice(0, 12) + '...' : 'n/a'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'markdown'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Markdown Normalizado
          </button>
          <button
            onClick={() => setActiveTab('raw_text')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'raw_text'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Texto Extraído Bruto
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Metadados & Integridade
          </button>
        </div>

        {/* Copy Button */}
        <button
          onClick={() =>
            handleCopy(
              activeTab === 'markdown'
                ? document.markdown_content
                : activeTab === 'raw_text'
                ? document.raw_text
                : JSON.stringify(document.source_metadata, null, 2)
            )
          }
          className="px-3 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors cursor-pointer mb-1"
        >
          {copied ? '✓ Copiado!' : 'Copiar Conteúdo'}
        </button>
      </div>

      {/* Tab 1: Markdown Content */}
      {activeTab === 'markdown' && (
        <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Conteúdo estruturado pronto para a futura inteligência/Chief of Staff</span>
            <button
              onClick={() => setShowRawMarkdown(!showRawMarkdown)}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              {showRawMarkdown ? 'Ver Renderizado' : 'Ver Código Markdown'}
            </button>
          </div>

          {showRawMarkdown ? (
            <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {document.markdown_content}
            </pre>
          ) : (
            <div className="prose prose-invert max-w-none text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {document.markdown_content}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Raw Extracted Text */}
      {activeTab === 'raw_text' && (
        <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
          <p className="text-xs text-zinc-400">
            Texto exato extraído do documento original antes da normalização:
          </p>
          <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {document.raw_text}
          </pre>
        </div>
      )}

      {/* Tab 3: Metadata & Integrity */}
      {activeTab === 'metadata' && (
        <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Resumo Técnico do Documento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-500 block mb-1">ID Único (UUID)</span>
                <span className="font-mono text-zinc-200 break-all">{document.id}</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-500 block mb-1">Workspace ID</span>
                <span className="font-mono text-zinc-200 break-all">{document.workspace_id}</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-500 block mb-1">Tipo de Origem</span>
                <span className="font-mono text-zinc-200">{document.source_type}</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-500 block mb-1">MIME Type</span>
                <span className="font-mono text-zinc-200">{document.mime_type || 'text/plain'}</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 sm:col-span-2">
                <span className="text-zinc-500 block mb-1">Content Hash (SHA-256)</span>
                <span className="font-mono text-emerald-400 break-all">{document.content_hash}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Metadados de Extração (JSON)</h3>
            <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-xs overflow-x-auto">
              {JSON.stringify(document.source_metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
