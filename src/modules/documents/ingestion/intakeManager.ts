import { DocumentIntakePayload, ExtractionResult } from '../types';
import { extractManualText } from '../extractors/textExtractor';
import { extractPdfText } from '../extractors/pdfExtractor';
import { validateDocumentIntake } from '../validators/documentValidator';

export async function processIntakeExtraction(
  payload: DocumentIntakePayload,
  fileBuffer?: ArrayBuffer | Uint8Array
): Promise<ExtractionResult> {
  const validation = validateDocumentIntake(payload);
  if (!validation.isValid) {
    return {
      success: false,
      raw_text: '',
      metadata: {},
      error: validation.error,
    };
  }

  if (payload.source_type === 'manual_text') {
    return extractManualText(payload.raw_text || '');
  }

  if (payload.source_type === 'pdf') {
    if (!fileBuffer) {
      return {
        success: false,
        raw_text: '',
        metadata: {},
        error: 'Buffer do ficheiro PDF não foi fornecido para extração.',
      };
    }
    return extractPdfText(fileBuffer, payload.filename);
  }

  return {
    success: false,
    raw_text: '',
    metadata: {},
    error: `Tipo de origem não suportado: ${payload.source_type}`,
  };
}
