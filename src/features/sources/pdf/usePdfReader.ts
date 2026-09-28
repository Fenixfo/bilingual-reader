import { useCallback, useEffect, useRef, useState } from "react";
import { getPageText, loadPdf, type LoadedPdf } from "./pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  clearFileState,
  loadFileState,
  saveFilePosition,
  saveFileState,
} from "../../../lib/readerState";

export interface UsePdfReaderResult {
  title: string | null;
  numPages: number;
  pageIndex: number;
  pageText: string;
  isRestoring: boolean;
  isLoadingDoc: boolean;
  isLoadingPage: boolean;
  error: string | null;
  hasDoc: boolean;
  loadFile: (file: File) => void;
  goToPage: (index: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

export function usePdfReader(): UsePdfReaderResult {
  const [title, setTitle] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageText, setPageText] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docRef = useRef<PDFDocumentProxy | null>(null);
  const requestIdRef = useRef(0);

  const loadPageAt = useCallback(async (doc: PDFDocumentProxy, index: number) => {
    const requestId = ++requestIdRef.current;
    setIsLoadingPage(true);
    setError(null);

    try {
      const text = await getPageText(doc, index + 1); // pdfjs pagina desde 1
      if (requestIdRef.current !== requestId) return;
      setPageText(text);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "No se pudo cargar la página");
    } finally {
      if (requestIdRef.current === requestId) setIsLoadingPage(false);
    }
  }, []);

  const openDoc = useCallback(
    (file: File, startPage: number) => {
      setIsLoadingDoc(true);
      setError(null);

      loadPdf(file)
        .then((loaded: LoadedPdf) => {
          void docRef.current?.loadingTask.destroy();
          docRef.current = loaded.doc;
          setTitle(loaded.title);
          setNumPages(loaded.numPages);
          setIsLoadingDoc(false);

          if (loaded.numPages === 0) {
            setError("El PDF no tiene páginas.");
            return;
          }
          const index = Math.min(Math.max(startPage, 0), loaded.numPages - 1);
          setPageIndex(index);
          void loadPageAt(loaded.doc, index);
        })
        .catch((err: unknown) => {
          setIsLoadingDoc(false);
          setError(err instanceof Error ? err.message : "No se pudo abrir el PDF");
        });
    },
    [loadPageAt],
  );

  useEffect(() => {
    let cancelled = false;
    loadFileState("pdf").then((saved) => {
      if (cancelled) return;
      setIsRestoring(false);
      if (!saved) return;
      const file = new File([saved.file], saved.fileName);
      openDoc(file, saved.position);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr al montar
  }, []);

  const loadFile = useCallback(
    (file: File) => {
      void saveFileState("pdf", { file, fileName: file.name, position: 0 });
      openDoc(file, 0);
    },
    [openDoc],
  );

  const goToPage = useCallback(
    (index: number) => {
      if (!docRef.current || index < 0 || index >= numPages) return;
      setPageIndex(index);
      void loadPageAt(docRef.current, index);
      void saveFilePosition("pdf", index);
    },
    [numPages, loadPageAt],
  );

  const next = useCallback(() => goToPage(pageIndex + 1), [pageIndex, goToPage]);
  const prev = useCallback(() => goToPage(pageIndex - 1), [pageIndex, goToPage]);

  const reset = useCallback(() => {
    void docRef.current?.loadingTask.destroy();
    docRef.current = null;
    setTitle(null);
    setNumPages(0);
    setPageIndex(0);
    setPageText("");
    setError(null);
    void clearFileState("pdf");
  }, []);

  return {
    title,
    numPages,
    pageIndex,
    pageText,
    isRestoring,
    isLoadingDoc,
    isLoadingPage,
    error,
    // Derivado de `title` (estado), no de docRef, para no leer un ref durante el render.
    hasDoc: title !== null,
    loadFile,
    goToPage,
    next,
    prev,
    reset,
  };
}
