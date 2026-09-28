import type { DictionaryData } from "./types";

const DB_NAME = "bilingual-reader";
const STORE_NAME = "dictionaries";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Lee un diccionario cacheado por clave (p. ej. "en-es"). `null` si no existe o IndexedDB no está disponible. */
export async function getCachedDictionary(
  key: string,
): Promise<DictionaryData | null> {
  if (typeof indexedDB === "undefined") return null;

  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/** Guarda un diccionario en IndexedDB para uso offline en próximas visitas. */
export async function setCachedDictionary(
  key: string,
  data: DictionaryData,
): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Cache best-effort: si falla, la app sigue funcionando solo en memoria.
  }
}
