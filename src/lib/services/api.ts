import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Client, Contact, Case, Conversation, Message } from '@/types/database';

// Memory/local storage prefix (used ONLY when Supabase is unconfigured in development)
const STORAGE_PREFIX = 'bizz_ai_os_';

const getLocal = <T>(key: string, defaultVal: T): T => {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocal = <T>(key: string, val: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('Local storage error', e);
  }
};

const generateId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
};

// ==========================================
// CLIENTS
// ==========================================

export async function getClients(workspaceId?: string | null): Promise<Client[]> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    let query = supabase.from('clients').select('*');
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  const all = getLocal<Client[]>('clients', []);
  if (workspaceId) return all.filter((c) => c.workspace_id === workspaceId);
  return all;
}

export async function getClientById(id: string): Promise<Client | null> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }
  const all = getLocal<Client[]>('clients', []);
  return all.find((c) => c.id === id) || null;
}

export async function createClient(
  workspaceId: string,
  payload: {
    name: string;
    industry?: string;
    notes?: string;
    status?: Client['status'];
  }
): Promise<Client> {
  if (!workspaceId) throw new Error('Workspace ID é obrigatório para criar um cliente');

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('clients')
      .insert({
        workspace_id: workspaceId,
        name: payload.name.trim(),
        industry: payload.industry?.trim() || null,
        notes: payload.notes?.trim() || null,
        status: payload.status || 'active',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const newClient: Client = {
    id: generateId('c'),
    workspace_id: workspaceId,
    name: payload.name.trim(),
    industry: payload.industry?.trim() || null,
    notes: payload.notes?.trim() || null,
    status: payload.status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const all = getLocal<Client[]>('clients', []);
  const updated = [newClient, ...all];
  setLocal('clients', updated);
  return newClient;
}

// ==========================================
// CONTACTS
// ==========================================

export async function getContactsByClient(clientId: string): Promise<Contact[]> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  const all = getLocal<Contact[]>('contacts', []);
  return all.filter((c) => c.client_id === clientId);
}

export async function createContact(
  workspaceId: string,
  payload: {
    client_id: string;
    name: string;
    role_position?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }
): Promise<Contact> {
  if (!workspaceId) throw new Error('Workspace ID é obrigatório para criar um contacto');

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        workspace_id: workspaceId,
        client_id: payload.client_id,
        name: payload.name.trim(),
        role_position: payload.role_position?.trim() || null,
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        notes: payload.notes?.trim() || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const newContact: Contact = {
    id: generateId('ct'),
    workspace_id: workspaceId,
    client_id: payload.client_id,
    name: payload.name.trim(),
    role_position: payload.role_position?.trim() || null,
    email: payload.email?.trim() || null,
    phone: payload.phone?.trim() || null,
    notes: payload.notes?.trim() || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const all = getLocal<Contact[]>('contacts', []);
  const updated = [newContact, ...all];
  setLocal('contacts', updated);
  return newContact;
}

// ==========================================
// CASES
// ==========================================

export async function getCases(workspaceId?: string | null): Promise<Case[]> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    let query = supabase.from('cases').select('*');
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  const all = getLocal<Case[]>('cases', []);
  if (workspaceId) return all.filter((c) => c.workspace_id === workspaceId);
  return all;
}

export async function getCaseById(id: string): Promise<Case | null> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }
  const all = getLocal<Case[]>('cases', []);
  return all.find((c) => c.id === id) || null;
}

export async function createCase(
  workspaceId: string,
  payload: {
    title: string;
    description?: string;
    client_id?: string | null;
    contact_id?: string | null;
    status?: Case['status'];
    priority?: Case['priority'];
    tags?: string[];
  }
): Promise<Case> {
  if (!workspaceId) throw new Error('Workspace ID é obrigatório para criar um Case');

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('cases')
      .insert({
        workspace_id: workspaceId,
        client_id: payload.client_id || null,
        contact_id: payload.contact_id || null,
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        status: payload.status || 'active',
        priority: payload.priority || 'medium',
        tags: payload.tags || [],
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const newCase: Case = {
    id: generateId('cs'),
    workspace_id: workspaceId,
    client_id: payload.client_id || null,
    contact_id: payload.contact_id || null,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    status: payload.status || 'active',
    priority: payload.priority || 'medium',
    tags: payload.tags || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const all = getLocal<Case[]>('cases', []);
  const updated = [newCase, ...all];
  setLocal('cases', updated);
  return newCase;
}

// ==========================================
// CONVERSATIONS
// ==========================================

export async function getConversations(
  caseId?: string | null,
  workspaceId?: string | null
): Promise<Conversation[]> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    let query = supabase.from('conversations').select('*');
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    if (caseId !== undefined) {
      if (caseId === null) {
        query = query.is('case_id', null);
      } else {
        query = query.eq('case_id', caseId);
      }
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  const all = getLocal<Conversation[]>('conversations', []);
  let filtered = all;
  if (workspaceId) filtered = filtered.filter((c) => c.workspace_id === workspaceId);
  if (caseId === undefined) return filtered;
  if (caseId === null) return filtered.filter((c) => !c.case_id);
  return filtered.filter((c) => c.case_id === caseId);
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }
  const all = getLocal<Conversation[]>('conversations', []);
  return all.find((c) => c.id === id) || null;
}

export async function createConversation(
  workspaceId: string,
  payload: {
    title: string;
    case_id?: string | null;
    summary?: string;
  }
): Promise<Conversation> {
  if (!workspaceId) throw new Error('Workspace ID é obrigatório para criar uma conversa');

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        workspace_id: workspaceId,
        case_id: payload.case_id || null,
        title: payload.title.trim(),
        summary: payload.summary?.trim() || null,
        status: 'active',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const newConv: Conversation = {
    id: generateId('cv'),
    workspace_id: workspaceId,
    case_id: payload.case_id || null,
    title: payload.title.trim(),
    summary: payload.summary?.trim() || null,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const all = getLocal<Conversation[]>('conversations', []);
  const updated = [newConv, ...all];
  setLocal('conversations', updated);
  return newConv;
}

// ==========================================
// MESSAGES
// ==========================================

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }
  const all = getLocal<Message[]>('messages', []);
  return all.filter((m) => m.conversation_id === conversationId);
}

export async function createMessage(payload: {
  conversation_id: string;
  role: Message['role'];
  content: string;
  agent_identifier?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<Message> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: payload.conversation_id,
        role: payload.role,
        agent_identifier: payload.agent_identifier || null,
        content: payload.content.trim(),
        metadata: payload.metadata || {},
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const newMsg: Message = {
    id: generateId('m'),
    conversation_id: payload.conversation_id,
    role: payload.role,
    agent_identifier: payload.agent_identifier || null,
    content: payload.content.trim(),
    metadata: payload.metadata || {},
    created_at: new Date().toISOString(),
  };

  const all = getLocal<Message[]>('messages', []);
  const updated = [...all, newMsg];
  setLocal('messages', updated);
  return newMsg;
}
