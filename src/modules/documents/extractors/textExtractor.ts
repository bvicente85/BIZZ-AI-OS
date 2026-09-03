import { ExtractionResult } from '../types';

export function extractManualText(content: string): ExtractionResult {
  if (!content || !content.trim()) {
    return {
      success: false,
      raw_text: '',
      metadata: {},
      error: 'O conteúdo de texto fornecido está vazio.',
    };
  }

  const raw_text = content.trim();
  const charCount = raw_text.length;
  const wordCount = raw_text.split(/\s+/).filter(Boolean).length;

  return {
    success: true,
    raw_text,
    metadata: {
      charCount,
      wordCount,
      extractedAt: new Date().toISOString(),
    },
  };
}
