import { Readability } from "@mozilla/readability";
import { extractReadableText } from "../../../lib/extractReadableText";

/**
 * corsproxy.io (mencionado originalmente en la spec) ahora exige API key
 * de pago (devuelve 401 sin ella, verificado). allorigins.win/raw es un
 * proxy CORS gratuito y sin registro que cumple el mismo rol, pero es un
 * servicio hobby con caídas frecuentes (verificado: timeouts incluso con
 * páginas chicas). Por eso queda solo como fallback — ver loadArticleFromUrl.
 */
const CORS_PROXY_URL = "https://api.allorigins.win/raw?url=";

/**
 * r.jina.ai (Jina AI Reader) descarga la página y devuelve directamente su
 * contenido principal en Markdown limpio (sin necesidad de proxy + parseo
 * HTML + Readability aparte). Gratuito sin API key para uso moderado. En
 * las pruebas fue mucho más rápido y confiable que los proxies CORS
 * genéricos, así que es el método primario.
 */
const JINA_READER_URL = "https://r.jina.ai/";

const FETCH_TIMEOUT_MS = 15000;

export interface LoadedArticle {
  title: string;
  text: string;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Ingresá una URL.");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Convierte el Markdown que devuelve Jina Reader en párrafos de texto plano. */
function markdownToPlainText(markdown: string): string {
  const cleaned = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // imágenes
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [texto](url) -> texto
    .replace(/^#{1,6}\s+/gm, "") // encabezados
    .replace(/^[-*+]\s+/gm, "") // viñetas
    .replace(/^\d+\.\s+/gm, "") // listas numeradas
    .replace(/^-{3,}\s*$/gm, "") // separadores
    .replace(/[|]/g, " ") // tablas
    .replace(/[*_`]/g, ""); // énfasis / código inline

  return cleaned
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

async function loadViaJinaReader(url: string): Promise<LoadedArticle> {
  const response = await fetchWithTimeout(JINA_READER_URL + url, FETCH_TIMEOUT_MS);
  if (!response.ok) {
    throw new Error(`Jina Reader respondió HTTP ${response.status}`);
  }
  const raw = await response.text();

  const title = raw.match(/^Title:\s*(.*)$/m)?.[1]?.trim() ?? "";
  const bodyStart = raw.indexOf("Markdown Content:");
  const body = bodyStart >= 0 ? raw.slice(bodyStart + "Markdown Content:".length) : raw;
  const text = markdownToPlainText(body);

  if (!text) throw new Error("Jina Reader devolvió contenido vacío");
  return { title: title || url, text };
}

async function loadViaCorsProxy(url: string): Promise<LoadedArticle> {
  const response = await fetchWithTimeout(
    CORS_PROXY_URL + encodeURIComponent(url),
    FETCH_TIMEOUT_MS,
  );
  if (!response.ok) {
    throw new Error(`Proxy CORS respondió HTTP ${response.status}`);
  }
  const html = await response.text();

  const pageDoc = new DOMParser().parseFromString(html, "text/html");
  const article = new Readability(pageDoc).parse();
  if (!article?.content) {
    throw new Error("No se pudo extraer el contenido principal de esta página.");
  }

  const contentDoc = new DOMParser().parseFromString(article.content, "text/html");
  const text = extractReadableText(contentDoc);
  if (!text) throw new Error("La página no tiene contenido de texto legible.");

  return { title: article.title?.trim() || url, text };
}

/**
 * Descarga y extrae el contenido principal de una URL. Prueba primero
 * Jina Reader (rápido y confiable en las pruebas); si falla o tarda más
 * de FETCH_TIMEOUT_MS, cae automáticamente al proxy CORS + Readability.
 * Ambos son servicios gratuitos de terceros sin SLA, así que ninguno
 * está garantizado — de ahí la redundancia.
 */
export async function loadArticleFromUrl(rawUrl: string): Promise<LoadedArticle> {
  const url = normalizeUrl(rawUrl);

  try {
    return await loadViaJinaReader(url);
  } catch {
    try {
      return await loadViaCorsProxy(url);
    } catch {
      throw new Error(
        "No se pudo cargar el artículo: los dos servicios de lectura probados fallaron. Probá de nuevo en un momento.",
      );
    }
  }
}
