import { useState, type FormEvent, type KeyboardEvent } from "react";

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. I like to read a good book by the light of a candle, and I try not to cry when the story ends.`;

interface TextSourceInputProps {
  initialValue?: string;
  onSubmit: (text: string) => void;
}

/** Fuente: texto plano / editor libre. El usuario pega o escribe texto en inglés y lo confirma. */
export function TextSourceInput({ initialValue = "", onSubmit }: TextSourceInputProps) {
  const [value, setValue] = useState(initialValue);

  function submit() {
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  }

  function handleFormSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <label
        htmlFor="source-text"
        className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
      >
        Texto en inglés
      </label>
      <textarea
        id="source-text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pegá o escribí un texto en inglés..."
        rows={10}
        className="mt-2 w-full resize-y rounded-lg border border-neutral-300 bg-neutral-50 p-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setValue(SAMPLE_TEXT)}
          className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          Usar texto de ejemplo
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-neutral-400 sm:inline">
            Ctrl+Enter para cargar
          </span>
          <button
            type="submit"
            disabled={!value.trim()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Cargar texto
          </button>
        </div>
      </div>
    </form>
  );
}
