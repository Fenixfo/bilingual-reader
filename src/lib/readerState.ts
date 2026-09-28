import { idbDelete, idbGet, idbSet } from "./idb";

const STORE = "readerState";

export type Source = "text" | "epub" | "pdf" | "web";

export interface TextState {
  text: string;
  mode: "input" | "reading";
}

export interface FileState {
  file: Blob;
  fileName: string;
  position: number;
}

export interface WebState {
  url: string;
  title: string;
  text: string;
}

/** Última fuente (tab) activa, para reabrir en la misma al volver. */
export function loadActiveSource(): Promise<Source | null> {
  return idbGet<Source>(STORE, "activeSource");
}
export function saveActiveSource(source: Source): Promise<void> {
  return idbSet(STORE, "activeSource", source);
}

export function loadTextState(): Promise<TextState | null> {
  return idbGet<TextState>(STORE, "text");
}
export function saveTextState(state: TextState): Promise<void> {
  return idbSet(STORE, "text", state);
}

export function loadFileState(source: "epub" | "pdf"): Promise<FileState | null> {
  return idbGet<FileState>(STORE, source);
}
export function saveFileState(source: "epub" | "pdf", state: FileState): Promise<void> {
  return idbSet(STORE, source, state);
}
/** Actualiza solo la posición (capítulo/página) sin re-escribir el archivo completo. */
export async function saveFilePosition(
  source: "epub" | "pdf",
  position: number,
): Promise<void> {
  const current = await loadFileState(source);
  if (!current) return;
  await idbSet(STORE, source, { ...current, position });
}
export function clearFileState(source: "epub" | "pdf"): Promise<void> {
  return idbDelete(STORE, source);
}

export function loadWebState(): Promise<WebState | null> {
  return idbGet<WebState>(STORE, "web");
}
export function saveWebState(state: WebState): Promise<void> {
  return idbSet(STORE, "web", state);
}
export function clearWebState(): Promise<void> {
  return idbDelete(STORE, "web");
}
