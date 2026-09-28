import { useEffect, useState } from "react";
import { getCachedDictionary, setCachedDictionary } from "./indexedDbCache";
import { lookupWord } from "./lookup";
import type { DictionaryData, DictionaryLookupResult } from "./types";

const DICTIONARY_KEY = "en-es";
const DICTIONARY_URL = `${import.meta.env.BASE_URL}dictionaries/en-es.json`;

/**
 * Compartido entre todas las instancias de useDictionary. El diccionario
 * pesa varios MB, así que se descarga una sola vez por sesión: cambiar
 * de tab (Texto/EPUB/PDF/URL) monta una instancia nueva de
 * TranslatableText cada vez, y todas deben reusar la misma carga en vez
 * de volver a pedirla por red.
 */
let sharedData: DictionaryData = {};
let sharedPromise: Promise<void> | null = null;

function loadDictionaryOnce(onCacheHit: () => void): Promise<void> {
  if (sharedPromise) return sharedPromise;

  sharedPromise = (async () => {
    const cached = await getCachedDictionary(DICTIONARY_KEY);
    if (cached) {
      sharedData = cached;
      onCacheHit();
    }

    const response = await fetch(DICTIONARY_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const fresh = (await response.json()) as DictionaryData;
    sharedData = fresh;
    void setCachedDictionary(DICTIONARY_KEY, fresh);
  })();

  return sharedPromise;
}

export interface UseDictionaryResult {
  isLoading: boolean;
  error: string | null;
  lookup: (raw: string) => DictionaryLookupResult;
}

/**
 * Expone el diccionario inglés->español (cargado una vez por sesión,
 * con cache en IndexedDB para offline) y una función de búsqueda
 * síncrona respaldada por un objeto en memoria compartido.
 */
export function useDictionary(): UseDictionaryResult {
  const [isLoading, setIsLoading] = useState(
    () => Object.keys(sharedData).length === 0,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadDictionaryOnce(() => {
      if (!cancelled) setIsLoading(false);
    })
      .then(() => {
        if (!cancelled) setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (Object.keys(sharedData).length === 0) {
          setError(
            err instanceof Error ? err.message : "No se pudo cargar el diccionario",
          );
        }
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoading,
    error,
    lookup: (raw: string) => lookupWord(sharedData, raw),
  };
}
