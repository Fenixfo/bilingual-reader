import { useRef, type ChangeEvent } from "react";
import { TranslatableText } from "../../../components/reader/TranslatableText";
import { useEpubReader } from "./useEpubReader";

export function EpubReader() {
  const {
    title,
    chapters,
    chapterIndex,
    chapterText,
    isRestoring,
    isLoadingBook,
    isLoadingChapter,
    error,
    hasBook,
    loadFile,
    goToChapter,
    next,
    prev,
    reset,
  } = useEpubReader();

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
    event.target.value = "";
  }

  if (isRestoring) return null;

  if (!hasBook) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <label
          htmlFor="epub-file"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Archivo EPUB
        </label>
        <p className="mt-1 text-sm text-neutral-500">
          Elegí un archivo .epub de tu dispositivo.
        </p>

        <input
          ref={fileInputRef}
          id="epub-file"
          type="file"
          accept=".epub,application/epub+zip"
          onChange={handleFileChange}
          disabled={isLoadingBook}
          className="mt-4 block w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-700 disabled:cursor-wait dark:text-neutral-300 dark:file:bg-neutral-100 dark:file:text-neutral-900 dark:hover:file:bg-neutral-300"
        />

        {isLoadingBook && (
          <p className="mt-3 text-sm text-neutral-500">Abriendo EPUB...</p>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={reset}
          className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          ← Cambiar de libro
        </button>
        <span className="truncate text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={prev}
          disabled={chapterIndex <= 0 || isLoadingChapter}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          ← Anterior
        </button>

        <select
          value={chapterIndex}
          onChange={(event) => goToChapter(Number(event.target.value))}
          disabled={isLoadingChapter}
          className="flex-1 truncate rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        >
          {chapters.map((chapter, index) => (
            <option key={chapter.href} value={index}>
              {chapter.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={next}
          disabled={chapterIndex >= chapters.length - 1 || isLoadingChapter}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Siguiente →
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-lg text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
        {isLoadingChapter ? (
          <p className="text-sm text-neutral-400">Cargando capítulo...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <TranslatableText text={chapterText} />
        )}
      </div>
    </div>
  );
}
