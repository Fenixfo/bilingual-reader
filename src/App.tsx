import { useState } from "react";
import { TranslatableText } from "./components/reader/TranslatableText";
import { TextSourceInput } from "./features/sources/text/TextSourceInput";

function App() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"input" | "reading">("input");

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Lector Inmersivo
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Pegá un texto en inglés y hacé clic en cualquier palabra para ver
          su traducción.
        </p>

        <div className="mt-6">
          {mode === "input" ? (
            <TextSourceInput
              initialValue={text}
              onSubmit={(value) => {
                setText(value);
                setMode("reading");
              }}
            />
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setMode("input")}
                className="mb-3 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                ← Editar texto
              </button>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 text-lg text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
                <TranslatableText text={text} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
