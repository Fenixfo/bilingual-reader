import { idbGet, idbSet } from "../lib/idb";
import type { DictionaryData } from "./types";

/** Lee un diccionario cacheado por clave (p. ej. "en-es"). `null` si no existe o IndexedDB no está disponible. */
export function getCachedDictionary(key: string): Promise<DictionaryData | null> {
  return idbGet<DictionaryData>("dictionaries", key);
}

/** Guarda un diccionario en IndexedDB para uso offline en próximas visitas. */
export function setCachedDictionary(key: string, data: DictionaryData): Promise<void> {
  return idbSet("dictionaries", key, data);
}
