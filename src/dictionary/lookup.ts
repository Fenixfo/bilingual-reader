import type { DictionaryData, DictionaryLookupResult } from "./types";

/**
 * Limpia una palabra "cruda" tomada del texto: quita puntuación/espacios
 * envolventes y la pasa a minúsculas. No toca apóstrofos internos
 * (don't, world's) porque son parte de la palabra en inglés.
 */
export function cleanWord(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^[^a-z']+|[^a-z']+$/gi, "");
}

/**
 * Genera candidatos de lema para una palabra limpia, de más a menos
 * específico, aplicando reglas heurísticas simples de inflexión en
 * inglés (no es un lematizador lingüístico completo, alcanza para MVP).
 */
export function lemmaCandidates(word: string): string[] {
  const candidates = new Set<string>([word]);

  // Plurales / tercera persona: cries -> cry, boxes -> box, cats -> cat
  if (word.endsWith("ies") && word.length > 3) {
    candidates.add(`${word.slice(0, -3)}y`);
  }
  if (/(?:s|x|z|ch|sh)es$/.test(word)) {
    candidates.add(word.slice(0, -2));
  }
  if (word.endsWith("s") && !word.endsWith("ss")) {
    candidates.add(word.slice(0, -1));
  }

  // Gerundios: running -> run / running -> rune (se prueban ambos)
  if (word.endsWith("ing") && word.length > 4) {
    const stem = word.slice(0, -3);
    candidates.add(stem);
    candidates.add(`${stem}e`);
    if (/(.)\1$/.test(stem)) {
      // consonante duplicada: running -> run
      candidates.add(stem.slice(0, -1));
    }
  }

  // Pasado/participio regular: liked -> like, stopped -> stop, tried -> try
  if (word.endsWith("ied") && word.length > 3) {
    candidates.add(`${word.slice(0, -3)}y`);
  }
  if (word.endsWith("ed") && word.length > 3) {
    const stem = word.slice(0, -2);
    candidates.add(stem);
    candidates.add(`${stem}e`);
    if (/(.)\1$/.test(stem)) {
      candidates.add(stem.slice(0, -1));
    }
  }

  // Comparativo/superlativo: bigger -> big, biggest -> big, nicer -> nice
  if (word.endsWith("est") && word.length > 4) {
    candidates.add(word.slice(0, -3));
    candidates.add(`${word.slice(0, -3)}e`);
  }
  if (word.endsWith("er") && word.length > 3) {
    candidates.add(word.slice(0, -2));
    candidates.add(`${word.slice(0, -2)}e`);
  }

  return Array.from(candidates);
}

/**
 * Busca una palabra en el diccionario, intentando primero la forma
 * exacta y luego los candidatos de lema generados heurísticamente.
 */
export function lookupWord(
  dictionary: DictionaryData,
  raw: string,
): DictionaryLookupResult {
  const cleaned = cleanWord(raw);

  if (!cleaned) {
    return { raw, cleaned, matchedLemma: null, entry: null };
  }

  for (const candidate of lemmaCandidates(cleaned)) {
    const entry = dictionary[candidate];
    if (entry) {
      return { raw, cleaned, matchedLemma: candidate, entry };
    }
  }

  return { raw, cleaned, matchedLemma: null, entry: null };
}
