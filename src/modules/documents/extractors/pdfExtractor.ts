import { extractText } from 'unpdf';
import { ExtractionResult } from '../types';

export async function extractPdfText(
  data: ArrayBuffer | Uint8Array,
  filename?: string
): Promise<ExtractionResult> {
  try {
    const uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data);
    const fileSizeBytes = uint8Array.byteLength;

    // Extract text using unpdf
    const result = await extractText(uint8Array, { mergePages: false });

    const totalPages = result.totalPages || 0;
    const pages = Array.isArray(result.text) ? result.text : [result.text];

    // Clean and join pages
    const rawPagesText = pages
      .map((pageText, idx) => {
        const trimmed = (pageText || '').trim();
        return trimmed ? `--- [Página ${idx + 1}] ---\n${trimmed}` : '';
      })
      .filter(Boolean)
      .join('\n\n');

    const totalText = pages.join(' ').trim();

    if (!totalText || totalText.length < 5) {
      return {
        success: false,
        raw_text: '',
        metadata: {
          pageCount: totalPages,
          fileSizeBytes,
          extractedAt: new Date().toISOString(),
        },
        error:
          'O ficheiro não contém texto extraível. Este documento parece ser um scan ou uma imagem. OCR ainda não está disponível.',
      };
    }

    const charCount = totalText.length;
    const wordCount = totalText.split(/\s+/).filter(Boolean).length;

    return {
      success: true,
      raw_text: rawPagesText || totalText,
      metadata: {
        pageCount: totalPages,
        fileSizeBytes,
        charCount,
        wordCount,
        originalExtension: filename ? filename.split('.').pop() : 'pdf',
        extractedAt: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    console.error('PDF extraction failed:', err);
    return {
      success: false,
      raw_text: '',
      metadata: {},
      error:
        err instanceof Error
          ? `Falha ao processar o ficheiro PDF: ${err.message}`
          : 'Falha ao processar o ficheiro PDF.',
    };
  }
}
