# bilingual-reader — Lector Inmersivo

MVP de una app web de lectura asistida para aprender inglés: cargás
texto (EPUB, PDF con texto seleccionable, texto plano o una URL) y al
hacer clic en cualquier palabra aparece un tooltip con su traducción
al español. 100% cliente, sin backend ni APIs de pago (privacy-first).

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- `epubjs` — renderizado de EPUB
- `pdfjs-dist` — capa de texto de PDF
- `@mozilla/readability` — extracción de contenido principal desde URLs
- `@floating-ui/react` — posicionamiento del tooltip

## Arquitectura

```
src/
  components/
    reader/
      TranslatableText.tsx   Envuelve cada palabra de un texto en un botón clickeable
      WordTooltip.tsx         Tooltip flotante (floating-ui) con la traducción
  dictionary/
    types.ts                 Tipos del diccionario (DictionaryEntry, senses, etc.)
    lookup.ts                 Limpieza de palabra + lematización heurística + búsqueda
    indexedDbCache.ts         Cache offline del diccionario en IndexedDB
    useDictionary.ts          Hook: carga el diccionario (fetch + cache) y expone lookup()
  features/
    sources/
      text/                   Fuente: texto plano / editor libre
      epub/                   Fuente: EPUB (epubjs) — pendiente
      pdf/                    Fuente: PDF (pdfjs-dist) — pendiente
      web/                    Fuente: URL + readability — pendiente
  lib/
    tokenize.ts               Divide un texto en tokens de palabra / no-palabra
  App.tsx                     PoC: párrafo de ejemplo con traducción al clic
public/
  dictionaries/
    en-es.sample.json         Diccionario de muestra (formato lema -> entrada)
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
- [ ] Fuente EPUB (epubjs)
- [ ] Fuente PDF (pdfjs-dist)
- [ ] Fuente URL (readability + proxy CORS)
- [ ] Selección de frase (no solo palabra individual)
- [ ] Diccionario completo (más allá del sample)
