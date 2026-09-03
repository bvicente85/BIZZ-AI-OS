import { normalizeText } from './normalizeText';
import { NormalizationResult } from '../types';

/**
 * Calcula hash determinístico SHA-256 do conteúdo.
 */
export async function computeContentHash(content: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback simples para ambientes sem Web Crypto
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

/**
 * Converte texto limpo numa representação Markdown estruturada e conservadora.
 * Preserva títulos, listas e blocos de código sem inventar conteúdo.
 */
export async function convertToMarkdown(
  rawText: string,
  title?: string
): Promise<NormalizationResult> {
  const normalized = normalizeText(rawText);

  // Padronizar marcadores de lista não standard (ex: •, ⁃, ◦, ▪ para -)
  let markdown = normalized
    .replace(/^[\t ]*[•⁃◦▪][\t ]+/gm, '- ')
    .replace(/^[\t ]*(\d+)[)\]][\t ]+/gm, '$1. ');

  // Se o título foi fornecido e o texto não começa já com um Heading Markdown (#),
  // adicionar o título como H1 para boa legibilidade
  if (title && !markdown.startsWith('#')) {
    markdown = `# ${title.trim()}\n\n${markdown}`;
  }

  const content_hash = await computeContentHash(markdown);
  const char_count = markdown.length;
  const word_count = markdown.split(/\s+/).filter(Boolean).length;

  return {
    normalized_text: normalized,
    markdown_content: markdown,
    content_hash,
    char_count,
    word_count,
  };
}
