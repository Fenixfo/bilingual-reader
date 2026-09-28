import { Readability } from "@mozilla/readability";
import { extractReadableText } from "../../../lib/extractReadableText";

/**
 * corsproxy.io (mencionado originalmente en la spec) ahora exige API key
 * de pago (devuelve 401 sin ella). allorigins.win/raw es un proxy CORS
 * gratuito y sin registro que cumple el mismo rol: reenvía la página con
 * headers CORS abiertos para poder fetchearla desde el navegador.
 */
const CORS_PROXY_URL = "https://api.allorigins.win/raw?url=";

export interface LoadedArticle {
  title: string;
  text: string;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Ingresá una URL.");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Descarga una URL (vía proxy CORS), extrae el artículo principal con Readability y devuelve su texto plano. */
export async function loadArticleFromUrl(rawUrl: string): Promise<LoadedArticle> {
  const url = normalizeUrl(rawUrl);

  const response = await fetch(CORS_PROXY_URL + encodeURIComponent(url));
  if (!response.ok) {
    throw new Error(`No se pudo obtener la página (HTTP ${response.status}).`);
  }
  const html = await response.text();

  const pageDoc = new DOMParser().parseFromString(html, "text/html");
  const article = new Readability(pageDoc).parse();

  if (!article?.content) {
    throw new Error(
      "No se pudo extraer el contenido principal de esta página.",
    );
  }

  const contentDoc = new DOMParser().parseFromString(article.content, "text/html");
  const text = extractReadableText(contentDoc);

  if (!text) {
    throw new Error("La página no tiene contenido de texto legible.");
  }

  return { title: article.title?.trim() || url, text };
}
