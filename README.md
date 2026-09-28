# bilingual-reader — Lector Inmersivo

MVP de una app web de lectura asistida para aprender inglés: cargás
texto (EPUB, PDF con texto seleccionable, texto plano o una URL) y al
hacer clic en cualquier palabra aparece un tooltip con su traducción
al español. 100% cliente, sin backend ni APIs de pago (privacy-first).

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- `epubjs` — parseo/navegación de EPUB (spine, TOC); el texto de cada
  capítulo se extrae y se renderiza con `TranslatableText` (no se usa
  el `Rendition` con iframes de epubjs, para reutilizar un único
  pipeline de click-to-translate en todas las fuentes)
- `pdfjs-dist` — capa de texto de PDF; se extrae el texto de cada
  página (agrupando líneas en párrafos por heurística de espaciado
  vertical) y se renderiza con `TranslatableText`, mismo enfoque que EPUB
- `@mozilla/readability` — extracción de contenido principal desde URLs,
  como **fallback**. El proxy CORS de la spec original (`corsproxy.io`)
  ahora exige API key de pago (401 sin ella, verificado); el fallback
  usa `api.allorigins.win/raw` en su lugar. El método **primario** es
  [Jina AI Reader](https://r.jina.ai/) (`https://r.jina.ai/<url>`),
  gratis sin key, que devuelve el contenido ya limpio en Markdown — en
  las pruebas fue mucho más rápido y confiable que los proxies CORS
  genéricos (que llegaron a fallar por completo, incluso con páginas
  chicas). Como ambos son servicios de terceros sin SLA, `loadArticleFromUrl`
  prueba Jina primero y si falla (o tarda más de 15s) cae al proxy +
  Readability antes de reportar error al usuario
- `@floating-ui/react` — posicionamiento del tooltip

## Arquitectura

```
src/
  components/
    reader/
      TranslatableText.tsx   Envuelve cada palabra en un botón clickeable; también detecta
                             selección de frase (mouseup con selección multi-palabra)
      WordTooltip.tsx         Tooltip flotante (floating-ui) con la traducción de una
                             palabra o de cada palabra de una frase seleccionada
  dictionary/
    types.ts                 Tipos del diccionario (DictionaryEntry, senses, etc.)
    lookup.ts                 Limpieza de palabra + lematización heurística + búsqueda
    indexedDbCache.ts         Cache offline del diccionario en IndexedDB
    useDictionary.ts          Hook: carga el diccionario (fetch + cache) y expone lookup()
  features/
    sources/
      text/
        TextSourceInput.tsx   Formulario: pegar/escribir texto en inglés
        TextReader.tsx         Orquesta input <-> lectura para la fuente de texto
      epub/
        epub.ts                 Abre el .epub (epubjs), arma lista de capítulos (spine + TOC),
                                 extrae el texto de cada capítulo como párrafos planos
        useEpubReader.ts         Hook: estado del libro/capítulo actual, navegación
        EpubReader.tsx           UI: file picker + selector de capítulo + TranslatableText
      pdf/
        pdf.ts                   Abre el .pdf (pdfjs-dist), extrae texto por página
                                 (líneas -> párrafos por heurística de espaciado)
        usePdfReader.ts          Hook: estado del documento/página actual, navegación
        PdfReader.tsx            UI: file picker + selector de página + TranslatableText
      web/
        web.ts                   Fetch vía proxy CORS -> Readability -> extractReadableText
        WebReader.tsx            UI: input de URL + TranslatableText
  lib/
    tokenize.ts               Divide un texto en tokens de palabra / no-palabra
    extractReadableText.ts    HTML -> párrafos planos (compartido por EPUB y Web)
  App.tsx                     Selector de fuente (tabs) + layout general
scripts/
  build-dictionary.mjs         Convierte el dataset StarDict de FreeDict a en-es.json
public/
  dictionaries/
    en-es.json                Diccionario EN->ES (~42.600 lemas, ver sección abajo)
    ATTRIBUTION.md             Atribución/licencia (CC BY-SA 3.0) de en-es.json
  pdfjs/
    standard_fonts/           Fuentes estándar de pdfjs-dist (evita warnings/métricas
                              incorrectas en PDFs sin fuentes embebidas)
```

## Diccionario local

Formato (`public/dictionaries/en-es.json`): un objeto donde cada clave
es el **lema** en inglés y el valor tiene sus acepciones (`pos`,
`translation`, `alternateTranslations`). Ver `src/dictionary/types.ts`.

La búsqueda (`src/dictionary/lookup.ts`) limpia la palabra clickeada
(minúsculas, sin puntuación) y, si no hay match exacto, prueba
variantes heurísticas simples (plural, gerundio, pasado regular,
comparativo/superlativo) antes de darse por vencida.

**Contenido**: ~42.600 lemas de una sola palabra, generados a partir
del dataset `eng-spa` de [FreeDict](https://freedict.org/) (formato
StarDict, ver `scripts/build-dictionary.mjs`). Licencia CC BY-SA 3.0 —
ver `public/dictionaries/ATTRIBUTION.md`. Decisiones de la conversión:

- Solo se conservan lemas de una palabra (sin espacios): el `lookup.ts`
  actual busca palabra por palabra, así que una entrada multi-palabra
  (idiom, `"kick the bucket"`) nunca sería alcanzable. FreeDict tiene
  64.258 entradas totales; ~16.500 son multi-palabra y se descartan.
- FreeDict organiza cada entrada en acepciones numeradas, cada una con
  su propia lista de traducciones. El script aplana todas las
  traducciones de un (palabra, parte del habla) en una sola `sense`
  (traducción principal + hasta 5 alternativas), en el orden que trae
  la fuente (primera acepción de Wiktionary primero). Se probó
  reordenar por longitud como heurística de "más común", pero eso
  hacía ganar términos de jerga/abreviados cortos (p. ej. "tío" antes
  que "gato" para *cat*) — un problema peor que el original, así que
  se revirtió. Sin datos reales de frecuencia de uso, algunas entradas
  van a mostrar como traducción principal una acepción poco común
  (p. ej. *cat* → "felino" antes que "gato").
- Para regenerar con una versión más nueva de FreeDict: descargar y
  extraer el `.tar.xz` de https://freedict.org/downloads/ (eng-spa) y
  correr `node scripts/build-dictionary.mjs <carpeta-extraída>
  public/dictionaries/en-es.json`.

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build de producción en dist/
npm run lint
```

## Despliegue

SPA estática pensada para GitHub Pages. `vite.config.ts` tiene
`base: '/bilingual-reader/'` (ajustar si cambia el nombre del repo).
Hay un workflow en `.github/workflows/deploy.yml` que hace build y
publica `dist/` en Pages en cada push a `main` (requiere habilitar
GitHub Pages con origen "GitHub Actions" en la configuración del repo).

## Herramientas del proyecto

- **21st.dev (Magic MCP)** — generación de componentes UI, MCP server
  configurado con scope local a este proyecto.
- **ECC** (`ecc@ecc`) — plugin de Claude Code con skills/agents/commands
  para el flujo de desarrollo.

## Estado

- [x] Estructura de carpetas
- [x] Diccionario local (formato + búsqueda con lematización básica)
- [x] PoC: texto clickeable con tooltip de traducción
- [x] Fuente de texto plano / editor libre
- [x] Fuente EPUB (epubjs): carga de archivo, capítulos vía TOC, texto extraído por capítulo
- [x] Fuente PDF (pdfjs-dist): carga de archivo, texto extraído por página
- [x] Fuente URL (Jina Reader primario, readability + proxy CORS como fallback)
- [x] Selección de frase: arrastrar el mouse sobre varias palabras muestra la
      traducción de cada una en el mismo tooltip, anclado al rect de la
      selección (vía `VirtualElement` de floating-ui). Solo mouse por ahora
      (selección táctil por long-press queda pendiente)
- [x] Diccionario completo: ~42.600 lemas desde el dataset FreeDict eng-spa
      (CC BY-SA 3.0), cargado una sola vez por sesión (compartido entre tabs)
