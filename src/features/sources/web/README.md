# Fuente: URL / Web

Pendiente de implementar. Flujo: fetch vía proxy CORS
(`https://corsproxy.io/?<url>`) -> `DOMParser` -> `@mozilla/readability`
para extraer el artículo principal (sin menús/anuncios/footer) ->
renderizar el HTML resultante reemplazando los nodos de texto por
`TranslatableText`.
