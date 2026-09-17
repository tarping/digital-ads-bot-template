---
name: rankings-comparativas
description: Rankings, tops y comparativas entre artistas, releases, segmentos o PMs. Usar cuando el usuario pida "mejor/peor", "top", "ranking", "compara X con Y", "¿quién gastó más?", "¿qué segmento rinde mejor?" o cualquier ordenación de múltiples entidades.
---
# Rankings y Comparativas

## Reglas generales
- Tabla markdown SIEMPRE, ordenada de mejor a peor según el criterio.
- Indica SIEMPRE el criterio de ordenación de forma explícita (inversión, CPC, CTR, tasa de intención, coste por resultado...).
- Emojis 🥇🥈🥉 estrictamente para el Top 3, nunca más allá.
- Nunca mezcles plataformas en un mismo ranking sin normalizar: un CTR de TikTok no es comparable con un CTR de Google.

## Elección del criterio según la pregunta
- "Mejor campaña" sin más contexto → pregunta si se refiere a eficiencia (coste) o a volumen (resultados), salvo que el contexto lo deje claro.
- "Quién gastó más" / "mayor inversión" → ordenar por Spend/Gasto.
- "Más eficiente" → CPC, CPM, CostPerResult o Coste/Stream según plataforma y objetivo (menor = mejor).
- "Mejor engagement" → CTR (Google/TikTok/Ad Studio), CostPerResult de engagement (Meta), TasaIntencion/SaveRate (Marquee/Showcase).
- Comparativa de segmentos o PMs → agrega por esa dimensión e incluye nº de campañas para dar contexto de volumen.

## Comparaciones justas
- Compara siempre dentro del mismo objetivo de campaña cuando sea posible: una campaña de Awareness contra una de Conversión no es una comparación válida en CPC.
- Si los volúmenes de inversión son muy dispares, adviértelo: las métricas de campañas pequeñas son menos estables.
- Incluye el benchmark de cada fila cuando exista, para que el ranking muestre no solo el orden sino la distancia a la referencia.
- Spotify Ad Studio solo tiene benchmark de CTR y de coste por stream. Si el ranking se ordena por esas, la columna "vs Bench" funciona con normalidad; si se ordena por CPC o CPM, va en "—" para sus filas, nunca con 🟢🟡🟠.
- En Ad Studio, ordena solo dentro del mismo DeliveryGoal: una campaña de AWARENESS y una de LEAD_GEN no compiten por el mismo criterio.

## Formato de tabla tipo
| # | Artista/Release | Inversión | [Métrica criterio] | vs Bench |
|---|---|---|---|---|
| 🥇 | X | €X | X | 🟢 |
| 🥈 | X | €X | X | 🟡 |
| 🥉 | X | €X | X | 🟢 |
| 4 | X | €X | X | 🟠 |

## Cierre
Tras la tabla, 1–2 líneas de lectura: qué explica el orden (segmento, objetivo, formato) y si hay algún patrón accionable. Termina con una pregunta de seguimiento.
