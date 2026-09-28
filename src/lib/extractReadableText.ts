const BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th";

/**
 * Extrae texto legible de un documento/elemento HTML como párrafos
 * planos (uno por bloque de nivel párrafo), colapsando espacios
 * internos. Usado por las fuentes EPUB, PDF-a-HTML no aplica, y Web
 * (contenido ya reducido por Readability).
 */
export function extractReadableText(root: Document | Element | undefined): string {
  const container = root instanceof Document ? root.body : root;
  if (!container) return "";

  const blocks = Array.from(container.querySelectorAll(BLOCK_SELECTOR));
  const paragraphs = (blocks.length > 0 ? blocks : [container])
    .map((el) => el.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean);

  return paragraphs.join("\n\n");
}
