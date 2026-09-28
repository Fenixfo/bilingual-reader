import { useEffect, useState, type FormEvent } from "react";
import { TranslatableText } from "../../../components/reader/TranslatableText";
import { clearWebState, loadWebState, saveWebState } from "../../../lib/readerState";
import { loadArticleFromUrl, type LoadedArticle } from "./web";

export function WebReader() {
  const [urlInput, setUrlInput] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<LoadedArticle | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadWebState().then((saved) => {
      if (cancelled) return;
      if (saved) {
        setUrlInput(saved.url);
        setArticle({ title: saved.title, text: saved.text });
      }
      setIsRestoring(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!urlInput.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await loadArticleFromUrl(urlInput);
      setArticle(result);
      void saveWebState({ url: urlInput.trim(), title: result.title, text: result.text });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar el artículo",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isRestoring) return null;

  if (!article) {
    return (
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <label
          htmlFor="source-url"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          URL del artículo
        </label>
        <p className="mt-1 text-sm text-neutral-500">
          Se descarga vía un proxy CORS público y se extrae el contenido
          principal (sin menús, anuncios ni footer).
        </p>

        <input
          id="source-url"
          type="url"
          inputMode="url"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="https://ejemplo.com/articulo"
          disabled={isLoading}
          className="mt-3 w-full rounded-lg border border-neutral-300 bg-neutral-50 p-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:cursor-wait dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            {isLoading ? "Cargando..." : "Cargar artículo"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </form>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setArticle(null);
          void clearWebState();
        }}
        className="mb-3 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        ← Cambiar URL
      </button>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-lg text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
        <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-50">
          {article.title}
        </h2>
        <TranslatableText text={article.text} />
      </div>
    </div>
  );
}
