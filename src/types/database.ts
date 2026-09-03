export type Workspace = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMemberRole = 'owner' | 'admin' | 'member';

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceMemberRole;
  created_at: string;
};

export type ClientStatus = 'active' | 'prospect' | 'inactive';

export type Client = {
  id: string;
  workspace_id: string;
  name: string;
  industry: string | null;
  notes: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  role_position: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CaseStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';

export type Case = {
  id: string;
  workspace_id: string;
  client_id: string | null;
  contact_id: string | null;
  title: string;
  description: string | null;
  status: CaseStatus;
  priority: CasePriority;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type ConversationStatus = 'active' | 'closed';

export type Conversation = {
  id: string;
  workspace_id: string;
  case_id: string | null;
  title: string;
  summary: string | null;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
};

export type MessageRole = 'user' | 'chief_of_staff' | 'specialist' | 'system';

export type Message = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  agent_identifier: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

// ==========================================
// DOCUMENTS (Sprint 1C-A)
// ==========================================

export type DocumentSourceType = 'manual_text' | 'pdf';
export type DocumentProcessingStatus = 'processing' | 'completed' | 'failed';

export interface DocumentMetadata {
  pageCount?: number;
  charCount?: number;
  wordCount?: number;
  fileSizeBytes?: number;
  extractedAt?: string;
  originalExtension?: string;
  [key: string]: unknown;
}

export interface DocumentRecord {
  id: string;
  workspace_id: string;
  client_id: string | null;
  case_id: string | null;
  title: string;
  source_type: DocumentSourceType;
  original_filename: string | null;
  mime_type: string | null;
  source_metadata: DocumentMetadata;
  content_hash: string | null;
  raw_text: string;
  markdown_content: string;
  processing_status: DocumentProcessingStatus;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
}
