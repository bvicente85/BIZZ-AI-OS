import { DocumentIntakePayload, DocumentRecord } from '../types';
import { processIntakeExtraction } from '../ingestion/intakeManager';
import { validateExtractedText } from '../validators/documentValidator';
import { convertToMarkdown } from '../normalizers/textToMarkdown';

export async function processAndPrepareDocument(
  payload: DocumentIntakePayload,
  fileBuffer?: ArrayBuffer | Uint8Array
): Promise<{
  success: boolean;
  document?: Omit<DocumentRecord, 'id' | 'created_at' | 'updated_at'>;
  error?: string;
}> {
  // 1. Extração
  const extraction = await processIntakeExtraction(payload, fileBuffer);
  if (!extraction.success) {
    return {
      success: false,
      error: extraction.error || 'Falha na extração de conteúdo.',
    };
  }

  // 2. Validação do texto extraído
  const textValidation = validateExtractedText(extraction.raw_text);
  if (!textValidation.isValid) {
    return {
      success: false,
      error: textValidation.error || 'Texto extraído inválido.',
    };
  }

  // 3. Normalização e Geração de Markdown
  const normalization = await convertToMarkdown(extraction.raw_text, payload.title);

  // 4. Consolidação de Metadados
  const consolidatedMetadata = {
    ...payload.metadata,
    ...extraction.metadata,
    charCount: normalization.char_count,
    wordCount: normalization.word_count,
    processedAt: new Date().toISOString(),
  };

  return {
    success: true,
    document: {
      workspace_id: payload.workspace_id,
      client_id: payload.client_id || null,
      case_id: payload.case_id || null,
      title: payload.title.trim(),
      source_type: payload.source_type,
      original_filename: payload.filename || null,
      mime_type: payload.mime_type || null,
      source_metadata: consolidatedMetadata,
      content_hash: normalization.content_hash,
      raw_text: extraction.raw_text,
      markdown_content: normalization.markdown_content,
      processing_status: 'completed',
      processing_error: null,
    },
  };
}
