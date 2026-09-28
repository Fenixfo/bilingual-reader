import { useEffect, useRef, useState } from "react";
import { getCachedDictionary, setCachedDictionary } from "./indexedDbCache";
import { lookupWord } from "./lookup";
import type { DictionaryData, DictionaryLookupResult } from "./types";

const DICTIONARY_KEY = "en-es";
const DICTIONARY_URL = `${import.meta.env.BASE_URL}dictionaries/en-es.sample.json`;

export interface UseDictionaryResult {
  isLoading: boolean;
  error: string | null;
  lookup: (raw: string) => DictionaryLookupResult;
}

/**
 * Carga el diccionario inglés->español una vez (con cache en IndexedDB
 * para offline) y expone una función de búsqueda síncrona respaldada
 * por un Map en memoria.
 */
export function useDictionary(): UseDictionaryResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<DictionaryData>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cached = await getCachedDictionary(DICTIONARY_KEY);
      if (cached && !cancelled) {
        dataRef.current = cached;
        setIsLoading(false);
      }

      try {
        const response = await fetch(DICTIONARY_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const fresh = (await response.json()) as DictionaryData;
        if (cancelled) return;
        dataRef.current = fresh;
        setIsLoading(false);
        void setCachedDictionary(DICTIONARY_KEY, fresh);
      } catch (err) {
        if (cancelled) return;
        if (!cached) {
          setError(
            err instanceof Error ? err.message : "No se pudo cargar el diccionario",
          );
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoading,
    error,
    lookup: (raw: string) => lookupWord(dataRef.current, raw),
  };
}
