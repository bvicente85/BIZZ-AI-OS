import { DocumentIntakePayload, ValidationResult } from '../types';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export function validateDocumentIntake(payload: DocumentIntakePayload): ValidationResult {
  if (!payload.workspace_id || !payload.workspace_id.trim()) {
    return {
      isValid: false,
      error: 'O identificador do Workspace é obrigatório.',
    };
  }

  if (!payload.title || !payload.title.trim()) {
    return {
      isValid: false,
      error: 'O título do documento é obrigatório.',
    };
  }

  if (!['manual_text', 'pdf'].includes(payload.source_type)) {
    return {
      isValid: false,
      error: `Tipo de origem inválido: ${payload.source_type}. Permitidos: manual_text, pdf.`,
    };
  }

  if (payload.file_size_bytes && payload.file_size_bytes > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `O ficheiro excede o tamanho máximo permitido de 15 MB (${(payload.file_size_bytes / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  if (payload.mime_type && payload.source_type === 'pdf') {
    if (!payload.mime_type.toLowerCase().includes('pdf')) {
      return {
        isValid: false,
        error: 'O ficheiro selecionado não é um documento PDF válido.',
      };
    }
  }

  return { isValid: true };
}

export function validateExtractedText(text: string): ValidationResult {
  if (!text || !text.trim()) {
    return {
      isValid: false,
      error: 'O conteúdo extraído está vazio.',
    };
  }

  if (text.trim().length < 5) {
    return {
      isValid: false,
      error: 'O conteúdo extraído é demasiado curto para constituir um documento válido.',
    };
  }

  return { isValid: true };
}
