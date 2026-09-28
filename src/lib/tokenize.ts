export interface Token {
  text: string;
  /** Tokens clickeables (palabras reales); los separadores (espacios, puntuación) no lo son. */
  isWord: boolean;
}

const WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;

/**
 * Divide un texto en tokens de palabra y no-palabra, preservando el
 * texto original (espacios, saltos de línea, puntuación) para poder
 * renderizarlo 1:1 con cada palabra envuelta en un elemento clickeable.
 */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(WORD_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, start), isWord: false });
    }
    tokens.push({ text: match[0], isWord: true });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), isWord: false });
  }

  return tokens;
}
