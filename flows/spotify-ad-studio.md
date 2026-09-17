# Spotify Ad Studio · Select

Acción Select del flujo de Power Automate. Lista destino:
`SpotifyAdStudio_ads_data`. Resto del flujo: el patrón de
[`README.md`](../README.md#4-monta-los-flujos-de-power-automate) (Get items → Delete item → Create item).

- **Map del Select:** [`tools/adstudio-select-map.json`](../tools/adstudio-select-map.json)
- **Body del Create item:** [`tools/adstudio-create-item.json`](../tools/adstudio-create-item.json)
- **Export manual a CSV** (primera carga de la lista): [`tools/adstudio-export.gs`](../tools/adstudio-export.gs)
- **Benchmarks internos:** [`tools/adstudio-benchmarks.gs`](../tools/adstudio-benchmarks.gs)

## Dos cosas del Select que conviene saber

- **`coalesce(…, 'no aplica')` nunca dice "no aplica"** en `KnowledgeSummary`:
  una celda vacía de Sheets llega como `''`, no como `null`, y `coalesce` solo
  salta `null`. Inofensivo, porque el prompt lee `CostoPerStreams` de la
  columna estructurada, no del resumen.
- **`float()` sin `replace(',', '.')`**: si la hoja formatea un número con coma
  decimal o símbolo de moneda, el run se cae en esa fila.
