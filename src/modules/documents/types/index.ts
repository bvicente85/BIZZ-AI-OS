import {
  DocumentRecord,
  DocumentSourceType,
  DocumentProcessingStatus,
  DocumentMetadata,
} from '@/types/database';

export type {
  DocumentRecord,
  DocumentSourceType,
  DocumentProcessingStatus,
  DocumentMetadata,
};

export interface DocumentIntakePayload {
  workspace_id: string;
  title: string;
  source_type: DocumentSourceType;
  client_id?: string | null;
  case_id?: string | null;
  raw_text?: string;
  filename?: string;
  mime_type?: string;
  file_size_bytes?: number;
  metadata?: Partial<DocumentMetadata>;
}

export interface ExtractionResult {
  success: boolean;
  raw_text: string;
  metadata: DocumentMetadata;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface NormalizationResult {
  normalized_text: string;
  markdown_content: string;
  content_hash: string;
  char_count: number;
  word_count: number;
}
