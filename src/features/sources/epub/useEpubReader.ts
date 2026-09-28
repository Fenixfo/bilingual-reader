import { useCallback, useEffect, useRef, useState } from "react";
import { getChapterText, loadEpub, type EpubChapter, type LoadedEpub } from "./epub";
import type { Book } from "epubjs";
import {
  clearFileState,
  loadFileState,
  saveFilePosition,
  saveFileState,
} from "../../../lib/readerState";

export interface UseEpubReaderResult {
  title: string | null;
  chapters: EpubChapter[];
  chapterIndex: number;
  chapterText: string;
  isRestoring: boolean;
  isLoadingBook: boolean;
  isLoadingChapter: boolean;
  error: string | null;
  hasBook: boolean;
  loadFile: (file: File) => void;
  goToChapter: (index: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

export function useEpubReader(): UseEpubReaderResult {
  const [title, setTitle] = useState<string | null>(null);
  const [chapters, setChapters] = useState<EpubChapter[]>([]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [chapterText, setChapterText] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookRef = useRef<Book | null>(null);
  const requestIdRef = useRef(0);

  const loadChapterAt = useCallback(
    async (book: Book, chapterList: EpubChapter[], index: number) => {
      const chapter = chapterList[index];
      if (!chapter) return;

      const requestId = ++requestIdRef.current;
      setIsLoadingChapter(true);
      setError(null);

      try {
        const text = await getChapterText(book, chapter.href);
        if (requestIdRef.current !== requestId) return; // hubo un pedido más nuevo
        setChapterText(text);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el capítulo",
        );
      } finally {
        if (requestIdRef.current === requestId) setIsLoadingChapter(false);
      }
    },
    [],
  );

  const openBook = useCallback(
    (file: File, startChapter: number) => {
      setIsLoadingBook(true);
      setError(null);

      loadEpub(file)
        .then((loaded: LoadedEpub) => {
          bookRef.current?.destroy();
          bookRef.current = loaded.book;
          setTitle(loaded.title);
          setChapters(loaded.chapters);
          setIsLoadingBook(false);

          if (loaded.chapters.length === 0) {
            setError("El EPUB no tiene capítulos legibles.");
            return;
          }
          const index = Math.min(Math.max(startChapter, 0), loaded.chapters.length - 1);
          setChapterIndex(index);
          void loadChapterAt(loaded.book, loaded.chapters, index);
        })
        .catch((err: unknown) => {
          setIsLoadingBook(false);
          setError(
            err instanceof Error ? err.message : "No se pudo abrir el EPUB",
          );
        });
    },
    [loadChapterAt],
  );

  useEffect(() => {
    let cancelled = false;
    loadFileState("epub").then((saved) => {
      if (cancelled) return;
      setIsRestoring(false);
      if (!saved) return;
      const file = new File([saved.file], saved.fileName);
      openBook(file, saved.position);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr al montar
  }, []);

  const loadFile = useCallback(
    (file: File) => {
      void saveFileState("epub", { file, fileName: file.name, position: 0 });
      openBook(file, 0);
    },
    [openBook],
  );

  const goToChapter = useCallback(
    (index: number) => {
      if (!bookRef.current || index < 0 || index >= chapters.length) return;
      setChapterIndex(index);
      void loadChapterAt(bookRef.current, chapters, index);
      void saveFilePosition("epub", index);
    },
    [chapters, loadChapterAt],
  );

  const next = useCallback(
    () => goToChapter(chapterIndex + 1),
    [chapterIndex, goToChapter],
  );
  const prev = useCallback(
    () => goToChapter(chapterIndex - 1),
    [chapterIndex, goToChapter],
  );

  const reset = useCallback(() => {
    bookRef.current?.destroy();
    bookRef.current = null;
    setTitle(null);
    setChapters([]);
    setChapterIndex(0);
    setChapterText("");
    setError(null);
    void clearFileState("epub");
  }, []);

  return {
    title,
    chapters,
    chapterIndex,
    chapterText,
    isRestoring,
    isLoadingBook,
    isLoadingChapter,
    error,
    // Derivado de `title` (estado), no de bookRef, para no leer un ref durante el render.
    hasBook: title !== null,
    loadFile,
    goToChapter,
    next,
    prev,
    reset,
  };
}
