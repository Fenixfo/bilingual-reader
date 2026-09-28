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
public/
  dictionaries/
    en-es.sample.json         Diccionario de muestra (formato lema -> entrada)
  pdfjs/
    standard_fonts/           Fuentes estándar de pdfjs-dist (evita warnings/métricas
                              incorrectas en PDFs sin fuentes embebidas)
```

## Diccionario local

Formato (`public/dictionaries/en-es.sample.json`): un objeto donde
cada clave es el **lema** en inglés y el valor tiene sus acepciones
(`pos`, `translation`, `alternateTranslations`, `gloss`). Ver
`src/dictionary/types.ts`.

La búsqueda (`src/dictionary/lookup.ts`) limpia la palabra clickeada
(minúsculas, sin puntuación) y, si no hay match exacto, prueba
variantes heurísticas simples (plural, gerundio, pasado regular,
comparativo/superlativo) antes de darse por vencida.

Es un dataset de muestra para la PoC — reemplazar/ampliar
`en-es.sample.json` (o añadir más archivos y cargarlos según el idioma)
es el siguiente paso para tener cobertura real.

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
- [ ] Diccionario completo (más allá del sample)
