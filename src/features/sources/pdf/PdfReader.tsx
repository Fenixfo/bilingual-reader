import type { ChangeEvent } from "react";
import { TranslatableText } from "../../../components/reader/TranslatableText";
import { usePdfReader } from "./usePdfReader";

export function PdfReader() {
  const {
    title,
    numPages,
    pageIndex,
    pageText,
    isRestoring,
    isLoadingDoc,
    isLoadingPage,
    error,
    hasDoc,
    loadFile,
    goToPage,
    next,
    prev,
    reset,
  } = usePdfReader();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
    event.target.value = "";
  }

  if (isRestoring) return null;

  if (!hasDoc) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <label
          htmlFor="pdf-file"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Archivo PDF
        </label>
        <p className="mt-1 text-sm text-neutral-500">
          Elegí un PDF con texto seleccionable (sin OCR por ahora).
        </p>

        <input
          id="pdf-file"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={isLoadingDoc}
          className="mt-4 block w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-700 disabled:cursor-wait dark:text-neutral-300 dark:file:bg-neutral-100 dark:file:text-neutral-900 dark:hover:file:bg-neutral-300"
        />

        {isLoadingDoc && (
          <p className="mt-3 text-sm text-neutral-500">Abriendo PDF...</p>
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
          ← Cambiar de PDF
        </button>
        <span className="truncate text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={prev}
          disabled={pageIndex <= 0 || isLoadingPage}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          ← Anterior
        </button>

        <select
          value={pageIndex}
          onChange={(event) => goToPage(Number(event.target.value))}
          disabled={isLoadingPage}
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        >
          {Array.from({ length: numPages }, (_, index) => (
            <option key={index} value={index}>
              Página {index + 1} de {numPages}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={next}
          disabled={pageIndex >= numPages - 1 || isLoadingPage}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Siguiente →
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-lg text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
        {isLoadingPage ? (
          <p className="text-sm text-neutral-400">Cargando página...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : pageText ? (
          <TranslatableText text={pageText} />
        ) : (
          <p className="text-sm text-neutral-400">
            Esta página no tiene texto seleccionable.
          </p>
        )}
      </div>
    </div>
  );
}
