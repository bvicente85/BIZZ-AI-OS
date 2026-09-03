'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { getDocuments, getClients, getCases, createDocument } from '@/lib/services/api';
import { DocumentRecord, Client, Case, DocumentSourceType } from '@/types/database';
import { processAndPrepareDocument } from '@/modules/documents/services/documentService';

export default function DocumentsPage() {
  const { workspaceId, loading: authLoading } = useAuth();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  // Intake Mode & Form State
  const [sourceType, setSourceType] = useState<DocumentSourceType>('manual_text');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [manualText, setManualText] = useState('');

  // PDF File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter state
  const [filterSource, setFilterSource] = useState<string>('all');

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [docs, cls, css] = await Promise.all([
        getDocuments(workspaceId),
        getClients(workspaceId),
        getCases(workspaceId),
      ]);
      setDocuments(docs);
      setClients(cls);
      setCases(css);
    } catch (err) {
      console.error('Error loading documents page data:', err);
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

  // Handle File Selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Apenas são aceites ficheiros no formato PDF (.pdf).');
        setSelectedFile(null);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError('O ficheiro excede o tamanho máximo de 15 MB.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      if (!title.trim()) {
        // Auto-fill title from clean filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  }

  // Handle Submit (Manual Text or PDF)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) return;

    if (!title.trim()) {
      setError('Por favor indique um título para o documento.');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (sourceType === 'manual_text') {
        if (!manualText.trim()) {
          setError('Por favor insira o conteúdo do texto.');
          setProcessing(false);
          return;
        }

        // Process manual text through the ingestion pipeline
        const result = await processAndPrepareDocument({
          workspace_id: workspaceId,
          title: title.trim(),
          source_type: 'manual_text',
          client_id: clientId || null,
          case_id: caseId || null,
          raw_text: manualText,
        });

        if (!result.success || !result.document) {
          setError(result.error || 'Falha ao processar o texto.');
          setProcessing(false);
          return;
        }

        // Persist structured document
        await createDocument(workspaceId, result.document);

        // Reset form
        setTitle('');
        setManualText('');
        setClientId('');
        setCaseId('');
        setSuccessMsg('Documento de texto processado e guardado com sucesso!');
        await loadData();
      } else if (sourceType === 'pdf') {
        if (!selectedFile) {
          setError('Por favor selecione um ficheiro PDF para carregar.');
          setProcessing(false);
          return;
        }

        // Send PDF temporarily to extraction API (in-memory extraction)
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await fetch('/api/documents/extract', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(
            data.error ||
              'Falha ao extrair texto do PDF. O documento pode ser uma imagem/scan sem camada de texto.'
          );
          setProcessing(false);
          return;
        }

        // Prepare document through normalizer
        const result = await processAndPrepareDocument({
          workspace_id: workspaceId,
          title: title.trim(),
          source_type: 'pdf',
          client_id: clientId || null,
          case_id: caseId || null,
          raw_text: data.raw_text,
          filename: selectedFile.name,
          mime_type: selectedFile.type || 'application/pdf',
          file_size_bytes: selectedFile.size,
          metadata: data.metadata,
        });

        if (!result.success || !result.document) {
          setError(result.error || 'Falha ao normalizar o conteúdo do PDF.');
          setProcessing(false);
          return;
        }

        // Persist structured document
        await createDocument(workspaceId, result.document);

        // Reset form
        setTitle('');
        setSelectedFile(null);
        setClientId('');
        setCaseId('');
        setSuccessMsg('PDF extraído, normalizado para Markdown e guardado com sucesso!');
        await loadData();
      }
    } catch (err: unknown) {
      console.error('Document submission error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar documento.');
    } finally {
      setProcessing(false);
    }
  }

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    if (filterSource === 'all') return true;
    return doc.source_type === filterSource;
  });

  const getClientName = (cid: string | null) => {
    if (!cid) return null;
    return clients.find((c) => c.id === cid)?.name || null;
  };

  const getCaseTitle = (csId: string | null) => {
    if (!csId) return null;
    return cases.find((c) => c.id === csId)?.title || null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Document Intake & Extraction
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Documentos e Conhecimento</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Introduza informação por texto manual ou PDF. O sistema extrai e normaliza o conteúdo para Markdown estruturado (sem armazenar ficheiros binários).
        </p>
      </div>

      {/* Intake Card */}
      <div className="p-6 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <h2 className="text-base font-semibold text-white">Novo Documento</h2>

          {/* Mode Selector Tabs */}
          <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setSourceType('manual_text');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                sourceType === 'manual_text'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📝 Texto Manual
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceType('pdf');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                sourceType === 'pdf'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📄 Upload PDF (Efémero)
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/70 border border-red-800/80 text-red-300 text-xs leading-relaxed flex items-start gap-2">
            <span className="text-sm font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs leading-relaxed flex items-start gap-2">
            <span className="text-sm font-bold">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Associations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Título do Documento *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Proposta Formação ERSE 2026..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Cliente Associado (Opcional)
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500"
              >
                <option value="">-- Sem Cliente (Conhecimento Geral) --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Case Associado (Opcional)
              </label>
              <select
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-500"
              >
                <option value="">-- Sem Case --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode 1: Manual Text Input */}
          {sourceType === 'manual_text' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">
                  Conteúdo de Texto *
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {manualText.length} caracteres • {manualText.split(/\s+/).filter(Boolean).length} palavras
                </span>
              </div>
              <textarea
                rows={7}
                required
                placeholder="Cole aqui o texto, notas de reunião, especificações ou propostas..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          )}

          {/* Mode 2: PDF Upload Input */}
          {sourceType === 'pdf' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Ficheiro PDF (máx. 15 MB) *
              </label>
              <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl p-6 text-center bg-zinc-950/60 transition-colors">
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer block space-y-2">
                  <div className="text-3xl">📄</div>
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-semibold text-emerald-400">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Clique para alterar
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-zinc-300">
                        Clique para selecionar um PDF ou arraste para aqui
                      </p>
                      <p className="text-xs text-zinc-500">
                        O texto será extraído em memória e o ficheiro original será descartado.
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={
                processing ||
                !title.trim() ||
                (sourceType === 'manual_text' && !manualText.trim()) ||
                (sourceType === 'pdf' && !selectedFile)
              }
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold tracking-wide disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              {processing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>A extrair e normalizar conteúdo...</span>
                </>
              ) : (
                <span>Processar e Guardar Documento</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Documents List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Documentos Processados</h2>
            <p className="text-xs text-zinc-400">
              Conhecimento extraído no workspace atual ({filteredDocs.length} documentos).
            </p>
          </div>

          {/* Source Type Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterSource('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterSource === 'all' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({documents.length})
            </button>
            <button
              onClick={() => setFilterSource('manual_text')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterSource === 'manual_text' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              📝 Texto ({documents.filter((d) => d.source_type === 'manual_text').length})
            </button>
            <button
              onClick={() => setFilterSource('pdf')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterSource === 'pdf' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              📄 PDF ({documents.filter((d) => d.source_type === 'pdf').length})
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">A carregar documentos...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-zinc-400 text-sm">Nenhum documento encontrado neste workspace.</p>
              <p className="text-xs text-zinc-600">
                Utilize o formulário acima para colar texto ou carregar um PDF.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {filteredDocs.map((doc) => {
                const clientName = getClientName(doc.client_id);
                const caseTitle = getCaseTitle(doc.case_id);

                return (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors block"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white text-base hover:text-emerald-400 transition-colors">
                          {doc.title}
                        </span>

                        {doc.source_type === 'pdf' ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-950/70 text-blue-300 border border-blue-800/60 font-medium">
                            📄 PDF {doc.source_metadata?.pageCount ? `(${doc.source_metadata.pageCount} pág.)` : ''}
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 font-medium">
                            📝 Texto Manual
                          </span>
                        )}

                        {clientName && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            Cliente: {clientName}
                          </span>
                        )}

                        {caseTitle && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            Case: {caseTitle}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        {doc.original_filename && (
                          <span>Ficheiro: <strong className="text-zinc-300">{doc.original_filename}</strong></span>
                        )}
                        <span>•</span>
                        <span>
                          {doc.source_metadata?.charCount || doc.raw_text.length} caracteres
                        </span>
                        <span>•</span>
                        <span>
                          {doc.source_metadata?.wordCount || doc.raw_text.split(/\s+/).length} palavras
                        </span>
                        <span>•</span>
                        <span className="text-zinc-500">
                          {new Date(doc.created_at).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${
                          doc.processing_status === 'completed'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                            : doc.processing_status === 'failed'
                            ? 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                            : 'bg-amber-950/70 text-amber-400 border border-amber-800/60'
                        }`}
                      >
                        {doc.processing_status}
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
    </div>
  );
}
