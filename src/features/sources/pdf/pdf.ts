import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface LoadedPdf {
  doc: PDFDocumentProxy;
  title: string;
  numPages: number;
}

/** Subconjunto de `TextItem` de pdfjs-dist que usamos (evita depender de su ruta interna de tipos). */
interface PdfTextItem {
  str: string;
  transform: number[];
  hasEOL: boolean;
}

function isTextItem(item: unknown): item is PdfTextItem {
  return typeof item === "object" && item !== null && "str" in item;
}

const standardFontDataUrl = `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`;

export async function loadPdf(file: File): Promise<LoadedPdf> {
  const buffer = await file.arrayBuffer();
  const doc = await getDocument({ data: buffer, standardFontDataUrl }).promise;

  let title = file.name.replace(/\.pdf$/i, "");
  try {
    const metadata = await doc.getMetadata();
    const info = metadata.info as { Title?: string } | undefined;
    if (info?.Title?.trim()) title = info.Title.trim();
  } catch {
    // Metadata opcional: si falla, seguimos con el nombre de archivo.
  }

  return { doc, title, numPages: doc.numPages };
}

interface PdfLine {
  text: string;
  y: number;
}

/** Agrupa los items de texto en líneas usando el flag `hasEOL` de pdfjs. */
function extractLines(items: unknown[]): PdfLine[] {
  const lines: PdfLine[] = [];
  let buffer = "";
  let lastY = 0;

  for (const item of items) {
    if (!isTextItem(item)) continue;
    buffer += item.str;
    lastY = item.transform[5] ?? lastY;

    if (item.hasEOL) {
      const text = buffer.replace(/\s+/g, " ").trim();
      if (text) lines.push({ text, y: lastY });
      buffer = "";
    }
  }

  const trailing = buffer.replace(/\s+/g, " ").trim();
  if (trailing) lines.push({ text: trailing, y: lastY });

  return lines;
}

/**
 * Une líneas en párrafos: un salto de línea con un espaciado vertical
 * notablemente mayor al "típico" de la página se interpreta como fin
 * de párrafo; el resto son solo wraps de línea y se unen con espacio.
 */
function linesToParagraphs(lines: PdfLine[]): string {
  if (lines.length === 0) return "";
  if (lines.length === 1) return lines[0].text;

  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    gaps.push(Math.abs(lines[i - 1].y - lines[i].y));
  }
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const typicalGap = sortedGaps[Math.floor(sortedGaps.length / 2)] || 1;

  let result = lines[0].text;
  for (let i = 1; i < lines.length; i++) {
    const isParagraphBreak = gaps[i - 1] > typicalGap * 1.6;
    result += (isParagraphBreak ? "\n\n" : " ") + lines[i].text;
  }
  return result;
}

export async function getPageText(
  doc: PDFDocumentProxy,
  pageNumber: number,
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  return linesToParagraphs(extractLines(content.items));
}
