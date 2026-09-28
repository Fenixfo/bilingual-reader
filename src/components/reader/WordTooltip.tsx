import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  type ReferenceType,
} from "@floating-ui/react";
import { useEffect } from "react";
import type { DictionaryLookupResult } from "../../dictionary/types";

interface WordTooltipProps {
  /** Elemento (o elemento virtual, p. ej. el rect de una selección de texto) usado como ancla de posicionamiento. */
  referenceEl: ReferenceType | null;
  /** Uno o más resultados: una palabra clickeada, o cada palabra de una frase seleccionada. */
  results: DictionaryLookupResult[];
  onClose: () => void;
}

function WordEntry({ result }: { result: DictionaryLookupResult }) {
  return (
    <div>
      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
        {result.cleaned}
        {result.matchedLemma && result.matchedLemma !== result.cleaned && (
          <span className="ml-1 text-sm font-normal text-neutral-400">
            → {result.matchedLemma}
          </span>
        )}
      </p>

      {result.entry ? (
        <ul className="mt-1.5 space-y-1.5">
          {result.entry.senses.map((sense, i) => (
            <li key={i} className="text-sm">
              <span className="mr-1.5 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                {sense.pos}
              </span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                {sense.translation}
              </span>
              {sense.alternateTranslations && sense.alternateTranslations.length > 0 && (
                <span className="text-neutral-500">
                  {" "}
                  · {sense.alternateTranslations.join(", ")}
                </span>
              )}
              {sense.gloss && <p className="text-xs text-neutral-400">{sense.gloss}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-sm text-neutral-400">
          Sin traducción en el diccionario local.
        </p>
      )}
    </div>
  );
}

export function WordTooltip({ referenceEl, results, onClose }: WordTooltipProps) {
  const open = referenceEl !== null && results.length > 0;

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (nextOpen) => {
      if (!nextOpen) onClose();
    },
    placement: "top",
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  // setPositionReference (a diferencia de la opción `elements.reference`)
  // acepta tanto un Element como un VirtualElement (el rect de una
  // selección de texto), así que la seteamos imperativamente.
  useEffect(() => {
    refs.setPositionReference(referenceEl);
  }, [referenceEl, refs]);

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  if (!open) return null;

  return (
    <FloatingPortal>
      <div
        // eslint-disable-next-line react-hooks/refs -- refs.setFloating is a ref callback, not a .current read
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        className="z-50 max-h-80 w-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      >
        {results.length > 1 && (
          <p className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">
            Frase seleccionada
          </p>
        )}
        <div className="space-y-3">
          {results.map((result, i) => (
            <div
              key={i}
              className={
                i > 0 ? "border-t border-neutral-100 pt-3 dark:border-neutral-800" : ""
              }
            >
              <WordEntry result={result} />
            </div>
          ))}
        </div>
      </div>
    </FloatingPortal>
  );
}
