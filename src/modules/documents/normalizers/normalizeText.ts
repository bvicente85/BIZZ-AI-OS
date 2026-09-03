/**
 * Normalização determinística e conservadora de texto.
 * Não altera a semântica, não resume e não reinterpreta.
 */
export function normalizeText(input: string): string {
  if (!input) return '';

  return (
    input
      // 1. Normalizar quebras de linha Windows/Mac para Unix standard (LF)
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')

      // 2. Remover caracteres de controlo indesejados (preservando tabs e newlines)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

      // 3. Normalizar espaços horizontais redundantes no fim das linhas
      .replace(/[ \t]+$/gm, '')

      // 4. Normalizar espaços múltiplos consecutivos no meio de linhas (preservando quebras)
      .replace(/[ \t]{2,}/g, ' ')

      // 5. Reduzir excesso de linhas vazias (máximo de 2 novas linhas = 1 linha em branco)
      .replace(/\n{3,}/g, '\n\n')

      // 6. Remover espaços nas extremidades do documento
      .trim()
  );
}
