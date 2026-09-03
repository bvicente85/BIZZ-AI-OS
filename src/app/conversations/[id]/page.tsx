'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getConversationById, getCaseById, getMessages, createMessage } from '@/lib/services/api';
import { Conversation, Case, Message, MessageRole } from '@/types/database';

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params?.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [parentCase, setParentCase] = useState<Case | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Message form state
  const [role, setRole] = useState<MessageRole>('user');
  const [agentIdentifier, setAgentIdentifier] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!conversationId) return;
    try {
      const conv = await getConversationById(conversationId);
      setConversation(conv);
      if (conv?.case_id) {
        const c = await getCaseById(conv.case_id);
        setParentCase(c);
      }
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
    } catch (err) {
      console.error('Error fetching conversation details:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !conversationId) return;

    setSubmitting(true);
    try {
      await createMessage({
        conversation_id: conversationId,
        role,
        content,
        agent_identifier: role === 'specialist' ? agentIdentifier.trim() || 'comercial' : undefined,
      });
      setContent('');
      await loadData();
    } catch (err) {
      console.error('Failed to create message:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-zinc-500">A carregar conversa...</div>;
  }

  if (!conversation) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-zinc-400">Conversa não encontrada.</p>
        <Link href="/" className="text-emerald-400 hover:underline text-sm font-medium">
          ← Voltar ao Dashboard
        </Link>
      </div>
    );
  }

  const getRoleBadge = (msg: Message) => {
    switch (msg.role) {
      case 'user':
        return (
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            Utilizador
          </span>
        );
      case 'chief_of_staff':
        return (
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
            Chief of Staff
          </span>
        );
      case 'specialist':
        return (
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800">
            Especialista: {msg.agent_identifier || 'Geral'}
          </span>
        );
      case 'system':
        return (
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
            Sistema
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        {parentCase ? (
          <Link href={`/cases/${parentCase.id}`} className="text-xs text-zinc-400 hover:text-white transition-colors">
            ← Voltar ao Case ({parentCase.title})
          </Link>
        ) : (
          <Link href="/conversations" className="text-xs text-zinc-400 hover:text-white transition-colors">
            ← Voltar a Conversas Gerais
          </Link>
        )}
      </div>

      {/* Conversation Info Header */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">{conversation.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            {parentCase ? (
              <span>
                Case associado: <strong className="text-zinc-300">{parentCase.title}</strong>
              </span>
            ) : (
              <span className="text-zinc-400 italic">Conversa Geral com Chief of Staff</span>
            )}
            {conversation.summary && <span>• {conversation.summary}</span>}
          </div>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full capitalize font-medium bg-zinc-800 text-zinc-400 self-start sm:self-auto border border-zinc-700/50">
          {conversation.status}
        </span>
      </div>

      {/* Messages Thread */}
      <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-6 min-h-[300px]">
        {messages.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            Ainda não existem mensagens nesta conversa. Introduz uma mensagem abaixo para validar a persistência.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-xl border ${
                  msg.role === 'user'
                    ? 'bg-zinc-900/90 border-zinc-700 ml-auto max-w-[85%]'
                    : msg.role === 'chief_of_staff'
                    ? 'bg-purple-950/20 border-purple-900/40 mr-auto max-w-[85%]'
                    : msg.role === 'specialist'
                    ? 'bg-sky-950/20 border-sky-900/40 mr-auto max-w-[85%]'
                    : 'bg-amber-950/20 border-amber-900/40 mr-auto max-w-[85%]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  {getRoleBadge(msg)}
                  <span className="text-[10px] text-zinc-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message Input Form (Persistência Estrutural) */}
        <div className="pt-4 border-t border-zinc-800">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400 font-medium">Perfil do Emissor:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as MessageRole)}
                  className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-zinc-500"
                >
                  <option value="user">Utilizador</option>
                  <option value="chief_of_staff">Chief of Staff</option>
                  <option value="specialist">Especialista</option>
                  <option value="system">Sistema</option>
                </select>
              </div>

              {role === 'specialist' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400 font-medium">Especialidade:</label>
                  <input
                    type="text"
                    placeholder="ex: comercial, pedagogico, financeiro..."
                    value={agentIdentifier}
                    onChange={(e) => setAgentIdentifier(e.target.value)}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-zinc-500"
                  />
                </div>
              )}
            </div>

            <div>
              <textarea
                rows={3}
                required
                placeholder="Escreve o conteúdo da mensagem..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-[11px] text-zinc-500">
                ⚡ <strong>Sprint 1A:</strong> Persistência puramente relacional das mensagens (sem execução de LLM/IA).
              </p>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {submitting ? 'A guardar...' : 'Guardar Mensagem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
