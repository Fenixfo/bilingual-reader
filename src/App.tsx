import { lazy, Suspense, useState } from "react";
import { TextReader } from "./features/sources/text/TextReader";

const EpubReader = lazy(() =>
  import("./features/sources/epub/EpubReader").then((m) => ({
    default: m.EpubReader,
  })),
);

type Source = "text" | "epub";

const SOURCES: { id: Source; label: string }[] = [
  { id: "text", label: "Texto" },
  { id: "epub", label: "EPUB" },
];

function App() {
  const [source, setSource] = useState<Source>("text");

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Lector Inmersivo
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Cargá un texto en inglés y hacé clic en cualquier palabra para ver
          su traducción.
        </p>

        <div className="mt-5 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
          {SOURCES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSource(item.id)}
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
          {source === "text" ? (
            <TextReader />
          ) : (
            <Suspense
              fallback={
                <p className="text-sm text-neutral-400">Cargando lector de EPUB...</p>
              }
            >
              <EpubReader />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
