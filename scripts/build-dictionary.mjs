#!/usr/bin/env node
/**
 * Convierte el dataset StarDict de FreeDict (eng-spa) a nuestro formato
 * JSON (public/dictionaries/en-es.json).
 *
 * Fuente: https://freedict.org/downloads/ ("English - Spanish", eng-spa).
 * Formato de origen: StarDict (.idx binario + .dict con definiciones en
 * un HTML simplificado). Licencia: CC BY-SA 3.0 (WikDict / Wiktionary
 * vía DBnary) — ver public/dictionaries/ATTRIBUTION.md.
 *
 * Uso:
 *   1. Descargar y extraer el .tar.xz de la versión deseada, de forma
 *      que quede una carpeta con eng-spa.idx (idx.gz descomprimido),
 *      eng-spa.dict y eng-spa.ifo.
 *   2. node scripts/build-dictionary.mjs <carpeta-extraida> public/dictionaries/en-es.json
 *
 * Simplificación deliberada: FreeDict organiza cada entrada en
 * acepciones numeradas (sense 1, sense 2, ...), cada una con su propia
 * lista de traducciones. Nuestro esquema (DictionarySense) es más
 * plano: una traducción principal + alternativas por parte del habla.
 * Este script aplana todas las traducciones de un (palabra, pos) en
 * una sola `sense`, sin intentar preservar los límites entre
 * acepciones — es una pérdida de granularidad aceptada a cambio de un
 * parser mucho más simple que no depende de ninguna librería de HTML.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [, , srcDir, outFile] = process.argv;
if (!srcDir || !outFile) {
  console.error(
    "Uso: node scripts/build-dictionary.mjs <carpeta-con-eng-spa.idx/.dict> <salida.json>",
  );
  process.exit(1);
}

const POS_MAP = {
  noun: "noun",
  verb: "verb",
  adjective: "adjective",
  adverb: "adverb",
  pronoun: "pronoun",
  preposition: "preposition",
  conjunction: "conjunction",
  interjection: "interjection",
  article: "determiner",
  determiner: "determiner",
  numeral: "determiner",
};

function mapPos(raw) {
  return POS_MAP[raw.trim().toLowerCase()] ?? "other";
}

function unescapeHtml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/** Solo lemas de una palabra (sin espacios): son los únicos que nuestro lookup.ts puede encontrar. */
function isSingleWord(word) {
  return /^[a-zA-Z][a-zA-Z'-]*$/.test(word);
}

function parseEntry(html) {
  const posMatch = html.match(/<font class="grammar"[^>]*>([^<]+)<\/font>/);
  if (!posMatch) return null;
  const pos = mapPos(unescapeHtml(posMatch[1]));

  // Divs "hoja" (sin tags anidados) son siempre traducciones en este dataset;
  // los divs que envuelven IPA/gramática/toda la entrada tienen hijos anidados
  // y no matchean este patrón no-greedy sin '<'.
  const translations = [];
  const seen = new Set();
  for (const m of html.matchAll(/<div>([^<>]+)<\/div>/g)) {
    const text = unescapeHtml(m[1]).trim();
    const key = text.toLowerCase();
    if (text && !seen.has(key)) {
      seen.add(key);
      translations.push(text);
    }
  }
  if (translations.length === 0) return null;

  // Se probó ordenar por longitud como aproximación a "más común", pero
  // eso hacía ganar términos de jerga/abreviados cortos (p. ej. "tío"
  // antes que "gato" para "cat"), un problema peor que el original.
  // Sin datos reales de frecuencia, el orden de Wiktionary/FreeDict
  // (primera acepción primero) es la opción más conservadora.
  const [translation, ...alternateTranslations] = translations.slice(0, 6);
  return {
    pos,
    translation,
    ...(alternateTranslations.length > 0 ? { alternateTranslations } : {}),
  };
}

console.log("Leyendo índice y definiciones...");
const idx = await readFile(path.join(srcDir, "eng-spa.idx"));
const dict = await readFile(path.join(srcDir, "eng-spa.dict"));

const dictionary = {};
let pos = 0;
let rawEntries = 0;
let skippedMultiWord = 0;
let skippedUnparsable = 0;

while (pos < idx.length) {
  const nul = idx.indexOf(0, pos);
  const word = idx.toString("utf8", pos, nul);
  const offset = idx.readUInt32BE(nul + 1);
  const size = idx.readUInt32BE(nul + 5);
  pos = nul + 9;
  rawEntries++;

  const lemma = word.toLowerCase();
  if (!isSingleWord(lemma)) {
    skippedMultiWord++;
    continue;
  }

  const html = dict.toString("utf8", offset, offset + size);
  const sense = parseEntry(html);
  if (!sense) {
    skippedUnparsable++;
    continue;
  }

  if (!dictionary[lemma]) {
    dictionary[lemma] = { lemma, senses: [] };
  }
  dictionary[lemma].senses.push(sense);
}

// Varias entradas idx del mismo (palabra, pos) -> senses idénticos duplicados.
let dedupedSenses = 0;
for (const entry of Object.values(dictionary)) {
  const seenSenses = new Set();
  entry.senses = entry.senses.filter((sense) => {
    const key = JSON.stringify(sense);
    if (seenSenses.has(key)) {
      dedupedSenses++;
      return false;
    }
    seenSenses.add(key);
    return true;
  });
}

const lemmaCount = Object.keys(dictionary).length;
console.log(`Sentidos duplicados eliminados: ${dedupedSenses}`);
console.log(`Entradas crudas en el índice: ${rawEntries}`);
console.log(`Descartadas (multi-palabra): ${skippedMultiWord}`);
console.log(`Descartadas (sin traducción parseable): ${skippedUnparsable}`);
console.log(`Lemas resultantes: ${lemmaCount}`);

await writeFile(outFile, JSON.stringify(dictionary));
console.log(`Escrito: ${outFile}`);
