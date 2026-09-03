import { supabase, isSupabaseConfigured, DEFAULT_WORKSPACE_ID } from '../supabase';
import { Client, Contact, Case, Conversation, Message } from '@/types/database';

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

export async function getClients(): Promise<Client[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  return getLocal<Client[]>('clients', []);
}

export async function getClientById(id: string): Promise<Client | null> {
  if (isSupabaseConfigured() && supabase) {
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

export async function createClient(payload: {
  name: string;
  industry?: string;
  notes?: string;
  status?: Client['status'];
}): Promise<Client> {
  const newClient: Client = {
    id: generateId('c'),
    workspace_id: DEFAULT_WORKSPACE_ID,
    name: payload.name.trim(),
    industry: payload.industry?.trim() || null,
    notes: payload.notes?.trim() || null,
    status: payload.status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        workspace_id: DEFAULT_WORKSPACE_ID,
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

  const all = getLocal<Client[]>('clients', []);
  const updated = [newClient, ...all];
  setLocal('clients', updated);
  return newClient;
}

// ==========================================
// CONTACTS
// ==========================================

export async function getContactsByClient(clientId: string): Promise<Contact[]> {
  if (isSupabaseConfigured() && supabase) {
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

export async function createContact(payload: {
  client_id: string;
  name: string;
  role_position?: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<Contact> {
  const newContact: Contact = {
    id: generateId('ct'),
    workspace_id: DEFAULT_WORKSPACE_ID,
    client_id: payload.client_id,
    name: payload.name.trim(),
    role_position: payload.role_position?.trim() || null,
    email: payload.email?.trim() || null,
    phone: payload.phone?.trim() || null,
    notes: payload.notes?.trim() || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        workspace_id: DEFAULT_WORKSPACE_ID,
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

  const all = getLocal<Contact[]>('contacts', []);
  const updated = [newContact, ...all];
  setLocal('contacts', updated);
  return newContact;
}

// ==========================================
// CASES
// ==========================================

export async function getCases(): Promise<Case[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  return getLocal<Case[]>('cases', []);
}

export async function getCaseById(id: string): Promise<Case | null> {
  if (isSupabaseConfigured() && supabase) {
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

export async function createCase(payload: {
  title: string;
  description?: string;
  client_id?: string | null;
  contact_id?: string | null;
  status?: Case['status'];
  priority?: Case['priority'];
  tags?: string[];
}): Promise<Case> {
  const newCase: Case = {
    id: generateId('cs'),
    workspace_id: DEFAULT_WORKSPACE_ID,
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

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        workspace_id: DEFAULT_WORKSPACE_ID,
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

  const all = getLocal<Case[]>('cases', []);
  const updated = [newCase, ...all];
  setLocal('cases', updated);
  return newCase;
}

// ==========================================
// CONVERSATIONS
// ==========================================

export async function getConversations(caseId?: string | null): Promise<Conversation[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase.from('conversations').select('*');
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
  if (caseId === undefined) return all;
  if (caseId === null) return all.filter((c) => !c.case_id);
  return all.filter((c) => c.case_id === caseId);
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  if (isSupabaseConfigured() && supabase) {
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

export async function createConversation(payload: {
  title: string;
  case_id?: string | null;
  summary?: string;
}): Promise<Conversation> {
  const newConv: Conversation = {
    id: generateId('cv'),
    workspace_id: DEFAULT_WORKSPACE_ID,
    case_id: payload.case_id || null,
    title: payload.title.trim(),
    summary: payload.summary?.trim() || null,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        workspace_id: DEFAULT_WORKSPACE_ID,
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

  const all = getLocal<Conversation[]>('conversations', []);
  const updated = [newConv, ...all];
  setLocal('conversations', updated);
  return newConv;
}

// ==========================================
// MESSAGES
// ==========================================

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (isSupabaseConfigured() && supabase) {
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
  const newMsg: Message = {
    id: generateId('m'),
    conversation_id: payload.conversation_id,
    role: payload.role,
    agent_identifier: payload.agent_identifier || null,
    content: payload.content.trim(),
    metadata: payload.metadata || {},
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
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

  const all = getLocal<Message[]>('messages', []);
  const updated = [...all, newMsg];
  setLocal('messages', updated);
  return newMsg;
}
