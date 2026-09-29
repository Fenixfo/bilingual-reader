import { lazy, Suspense, useEffect, useState } from "react";
import { TextReader } from "./features/sources/text/TextReader";
import { Capacitor } from "@capacitor/core";
import { useTheme } from "./lib/useTheme";
import { loadActiveSource, saveActiveSource } from "./lib/readerState";

const EpubReader = lazy(() =>
  import("./features/sources/epub/EpubReader").then((m) => ({
    default: m.EpubReader,
  })),
);

const PdfReader = lazy(() =>
  import("./features/sources/pdf/PdfReader").then((m) => ({
    default: m.PdfReader,
  })),
);

const WebReader = lazy(() =>
  import("./features/sources/web/WebReader").then((m) => ({
    default: m.WebReader,
  })),
);

const APK_URL =
  "https://github.com/Fenixfo/bilingual-reader/raw/main/releases/lector-inmersivo-debug.apk";

type Source ="text" | "epub" | "pdf" | "web";

const SOURCES: { id: Source; label: string }[] = [
  { id: "text", label: "Texto" },
  { id: "epub", label: "EPUB" },
  { id: "pdf", label: "PDF" },
  { id: "web", label: "URL" },
];

function LazyFallback({ label }: { label: string }) {
  return <p className="text-sm text-neutral-400">Cargando lector de {label}...</p>;
}

function App() {
  const [source, setSource] = useState<Source>("text");
  const { theme, toggle } = useTheme();

  useEffect(() => {
    loadActiveSource().then((saved) => {
      if (saved) setSource(saved);
    });
  }, []);

  function selectSource(next: Source) {
    setSource(next);
    void saveActiveSource(next);
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Lector Inmersivo
          </h1>
          <button
            type="button"
            onClick={toggle}
            aria-label={
              theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
            }
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
          </button>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Cargá un texto en inglés y hacé clic en cualquier palabra para ver
          su traducción.
        </p>

        <div className="mt-5 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
          {SOURCES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectSource(item.id)}
              className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                source === item.id
                  ? "border-amber-500 text-neutral-900 dark:text-neutral-50"
                  : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {source === "text" && <TextReader />}
          {source === "epub" && (
            <Suspense fallback={<LazyFallback label="EPUB" />}>
              <EpubReader />
            </Suspense>
          )}
          {source === "pdf" && (
            <Suspense fallback={<LazyFallback label="PDF" />}>
              <PdfReader />
            </Suspense>
          )}
          {source === "web" && (
            <Suspense fallback={<LazyFallback label="URL" />}>
              <WebReader />
            </Suspense>
          )}
        </div>

        {!Capacitor.isNativePlatform() && (
          <footer className="mt-12 border-t border-neutral-200 pt-6 text-center dark:border-neutral-800">
            <a
              href={APK_URL}
              className="inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-amber-400"
            >
              📱 Descargar app para Android (APK)
            </a>
            <p className="mt-2 text-xs text-neutral-500">
              Al instalarla, Android pedirá permitir apps de orígenes
              desconocidos.
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
