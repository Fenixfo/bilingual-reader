import { useState, type MouseEvent } from "react";
import { useDictionary } from "../../dictionary/useDictionary";
import type { DictionaryLookupResult } from "../../dictionary/types";
import { tokenize } from "../../lib/tokenize";
import { WordTooltip } from "./WordTooltip";

interface TranslatableTextProps {
  text: string;
  className?: string;
}

/**
 * Renderiza un texto envolviendo cada palabra en un botón clickeable
 * que, al presionarse, busca la traducción en el diccionario local y
 * la muestra en un tooltip flotante anclado a la palabra.
 */
export function TranslatableText({ text, className }: TranslatableTextProps) {
  const { lookup, isLoading, error } = useDictionary();
  const [activeEl, setActiveEl] = useState<HTMLElement | null>(null);
  const [result, setResult] = useState<DictionaryLookupResult | null>(null);

  const tokens = tokenize(text);

  function handleWordClick(event: MouseEvent<HTMLButtonElement>, word: string) {
    const el = event.currentTarget;
    if (activeEl === el) {
      handleClose();
      return;
    }
    setActiveEl(el);
    setResult(lookup(word));
  }

  function handleClose() {
    setActiveEl(null);
    setResult(null);
  }

  return (
    <div className={className}>
      {error && (
        <p className="mb-2 text-sm text-red-500">
          Error cargando diccionario: {error}
        </p>
      )}

      <p className="leading-relaxed whitespace-pre-wrap">
        {tokens.map((token, i) =>
          token.isWord ? (
            <button
              key={i}
              type="button"
              onClick={(event) => handleWordClick(event, token.text)}
              disabled={isLoading}
              className="rounded px-0.5 transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-wait dark:hover:bg-amber-900/40"
            >
              {token.text}
            </button>
          ) : (
            <span key={i}>{token.text}</span>
          ),
        )}
      </p>

      <WordTooltip referenceEl={activeEl} result={result} onClose={handleClose} />
    </div>
  );
}
