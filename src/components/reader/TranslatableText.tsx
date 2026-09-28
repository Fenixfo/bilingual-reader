import { useRef, useState, type MouseEvent } from "react";
import type { ReferenceType } from "@floating-ui/react";
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
 * la muestra en un tooltip flotante anclado a la palabra. También
 * detecta la selección de una frase (arrastrar el mouse sobre varias
 * palabras) y muestra la traducción de cada palabra de la frase en el
 * mismo tooltip, anclado al rectángulo de la selección.
 */
export function TranslatableText({ text, className }: TranslatableTextProps) {
  const { lookup, isLoading, error } = useDictionary();
  const [activeRef, setActiveRef] = useState<ReferenceType | null>(null);
  const [results, setResults] = useState<DictionaryLookupResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const tokens = tokenize(text);

  function handleClose() {
    setActiveRef(null);
    setResults([]);
  }

  function handleWordClick(event: MouseEvent<HTMLButtonElement>, word: string) {
    const el = event.currentTarget;
    if (activeRef === el) {
      handleClose();
      return;
    }
    setActiveRef(el);
    setResults([lookup(word)]);
  }

  function handleMouseUp() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!containerRef.current?.contains(range.commonAncestorContainer)) return;

    const words = tokenize(selection.toString())
      .filter((token) => token.isWord)
      .map((token) => token.text);
    if (words.length < 2) return; // una sola palabra ya la maneja el botón

    const rect = range.getBoundingClientRect();
    setActiveRef({ getBoundingClientRect: () => rect });
    setResults(words.map((word) => lookup(word)));
    selection.removeAllRanges();
  }

  return (
    <div className={className} ref={containerRef} onMouseUp={handleMouseUp}>
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

      <WordTooltip referenceEl={activeRef} results={results} onClose={handleClose} />
    </div>
  );
}
