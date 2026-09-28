export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "determiner"
  | "other";

export interface DictionarySense {
  pos: PartOfSpeech;
  /** Traducción literal directa. */
  translation: string;
  /** Acepciones secundarias, sinónimos o matices de la traducción principal. */
  alternateTranslations?: string[];
  /** Definición breve o nota de uso, opcional. */
  gloss?: string;
}

export interface DictionaryEntry {
  /** Forma canónica (lema) de la palabra, en minúsculas. */
  lemma: string;
  senses: DictionarySense[];
}

/** Diccionario serializado: lema -> entrada. Este es el formato del JSON en /public/dictionaries. */
export type DictionaryData = Record<string, DictionaryEntry>;

export interface DictionaryLookupResult {
  /** Palabra tal como fue clickeada/seleccionada por el usuario. */
  raw: string;
  /** Palabra normalizada (sin puntuación, minúscula) usada para buscar. */
  cleaned: string;
  /** Lema bajo el cual se encontró la entrada (puede diferir de `cleaned`, p. ej. "running" -> "run"). */
  matchedLemma: string | null;
  entry: DictionaryEntry | null;
}
