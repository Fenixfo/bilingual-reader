import Epub, { type Book, type NavItem } from "epubjs";
import { extractReadableText } from "../../../lib/extractReadableText";

export interface EpubChapter {
  href: string;
  label: string;
}

export interface LoadedEpub {
  book: Book;
  title: string;
  chapters: EpubChapter[];
}

/**
 * Subconjunto de la API de `Section` de epubjs que usamos. epubjs no
 * exporta el tipo `Section` desde su entrypoint público, así que
 * declaramos localmente lo que necesitamos en vez de importar sus
 * rutas internas.
 */
interface EpubJsSection {
  href: string;
  linear: boolean;
  document?: Document;
  load(request: (url: string) => Promise<unknown>): Promise<unknown>;
  unload(): void;
}

function normalizeHref(href: string): string {
  return href.split("#")[0];
}

function collectTocLabels(items: NavItem[], map: Map<string, string>): void {
  for (const item of items) {
    if (item.href && item.label) {
      map.set(normalizeHref(item.href), item.label.trim());
    }
    if (item.subitems?.length) {
      collectTocLabels(item.subitems, map);
    }
  }
}

/** Abre un archivo .epub y arma la lista de capítulos (spine + títulos del TOC). */
export async function loadEpub(file: File): Promise<LoadedEpub> {
  const buffer = await file.arrayBuffer();
  const book = Epub(buffer);
  await book.ready;

  const [metadata, navigation] = await Promise.all([
    book.loaded.metadata,
    book.loaded.navigation,
  ]);

  const tocLabels = new Map<string, string>();
  collectTocLabels(navigation.toc, tocLabels);

  const chapters: EpubChapter[] = [];
  book.spine.each((section: EpubJsSection) => {
    if (!section.linear) return;
    const label =
      tocLabels.get(normalizeHref(section.href)) ??
      `Capítulo ${chapters.length + 1}`;
    chapters.push({ href: section.href, label });
  });

  const title = metadata.title?.trim() || file.name.replace(/\.epub$/i, "");

  return { book, title, chapters };
}

/** Carga un capítulo (sección del spine) y devuelve su texto como párrafos planos. */
export async function getChapterText(
  book: Book,
  href: string,
): Promise<string> {
  const section = book.spine.get(href) as unknown as EpubJsSection | null;
  if (!section) {
    throw new Error(`No se encontró el capítulo: ${href}`);
  }

  await section.load(book.load.bind(book) as (url: string) => Promise<unknown>);
  const text = extractReadableText(section.document);
  section.unload();

  return text;
}
