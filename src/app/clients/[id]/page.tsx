'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getClientById, getContactsByClient, createContact, getCases } from '@/lib/services/api';
import { Client, Contact, Case } from '@/types/database';
import { useAuth } from '@/lib/context/AuthContext';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params?.id as string;
  const { workspaceId } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [clientCases, setClientCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  // Contact form state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [rolePosition, setRolePosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  const loadData = useCallback(async () => {
    if (!clientId) return;
    try {
      const [c, cts, allCases] = await Promise.all([
        getClientById(clientId),
        getContactsByClient(clientId),
        getCases(workspaceId),
      ]);
      setClient(c);
      setContacts(cts);
      setClientCases(allCases.filter((item) => item.client_id === clientId));
    } catch (err) {
      console.error('Error fetching client details:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactName.trim() || !clientId || !workspaceId) return;

    setSubmittingContact(true);
    try {
      await createContact(workspaceId, {
        client_id: clientId,
        name: contactName,
        role_position: rolePosition.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setContactName('');
      setRolePosition('');
      setEmail('');
      setPhone('');
      setNotes('');
      setIsAddingContact(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create contact:', err);
    } finally {
      setSubmittingContact(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-zinc-500">A carregar detalhes do cliente...</div>;
  }

  if (!client) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-zinc-400">Cliente não encontrado.</p>
        <Link href="/clients" className="text-emerald-400 hover:underline text-sm font-medium">
          ← Voltar à lista de clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/clients" className="text-xs text-zinc-400 hover:text-white transition-colors">
          ← Voltar a Clientes
        </Link>
        <Link
          href={`/cases?client_id=${client.id}`}
          className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
        >
          + Criar Case para este Cliente
        </Link>
      </div>

      {/* Client Summary Box */}
      <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">{client.name}</h1>
            {client.industry && (
              <p className="text-sm text-zinc-400">Setor: {client.industry}</p>
            )}
          </div>
          <span className="text-xs px-3 py-1 rounded-full capitalize font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
            {client.status}
          </span>
        </div>
        {client.notes && (
          <p className="text-sm text-zinc-300 pt-2 border-t border-zinc-800/80">
            {client.notes}
          </p>
        )}
      </div>

      {/* Grid: Contacts and Associated Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contacts Section */}
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Contactos (Pessoas)</h2>
              <p className="text-xs text-zinc-500">Interlocutores nesta organização</p>
            </div>
            <button
              onClick={() => setIsAddingContact(!isAddingContact)}
              className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
            >
              {isAddingContact ? 'Cancelar' : '+ Contacto'}
            </button>
          </div>

          {/* Add Contact Form */}
          {isAddingContact && (
            <form onSubmit={handleCreateContact} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-300">Novo Contacto</h3>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Dr. António Ferreira"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Cargo / Função</label>
                <input
                  type="text"
                  placeholder="ex: Diretor de RH, Gestor de Formação..."
                  value={rolePosition}
                  onChange={(e) => setRolePosition(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="email@empresa.pt"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="+351 9..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingContact || !contactName.trim() || !workspaceId}
                  className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {submittingContact ? 'A guardar...' : 'Guardar Contacto'}
                </button>
              </div>
            </form>
          )}

          {/* Contacts List */}
          {contacts.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500">
              Nenhum contacto adicionado ainda.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {contacts.map((ct) => (
                <div key={ct.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{ct.name}</span>
                    {ct.role_position && (
                      <span className="text-xs text-zinc-400">{ct.role_position}</span>
                    )}
                  </div>
                  {(ct.email || ct.phone) && (
                    <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
                      {ct.email && <span>✉ {ct.email}</span>}
                      {ct.phone && <span>☎ {ct.phone}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Associated Cases Section */}
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Cases do Cliente</h2>
              <p className="text-xs text-zinc-500">Processos associados a esta organização</p>
            </div>
          </div>

          {clientCases.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500">
              Ainda não existem Cases para este cliente.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {clientCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="py-2.5 flex items-center justify-between hover:bg-zinc-800/30 px-2 rounded-lg transition-colors block"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{c.title}</p>
                    <p className="text-xs text-zinc-500">Prioridade: {c.priority}</p>
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
