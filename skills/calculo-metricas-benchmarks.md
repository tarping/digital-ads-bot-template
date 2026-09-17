---
name: calculo-metricas-benchmarks
description: Reglas de cálculo de métricas y aplicación de benchmarks por plataforma (Google Ads, Meta Ads, Spotify Marquee/Showcase, Spotify Ad Studio, TikTok Ads). Usar SIEMPRE que la respuesta incluya cualquier métrica calculada o agregada (CPC, CTR, CPM, coste por resultado, coste por stream, tasas) o cualquier comparación contra benchmark, tanto en reportes completos como en preguntas puntuales ("¿cuál es el CPC de X?").
---
# Cálculo de Métricas y Benchmarks

## Google Ads
- Suma Spend, Impressions, Clicks, VideoViews de las filas filtradas.
- CPC = Spend / Clicks
- CTR = usa CTRCalc (multiplica ×100 si viene en decimal).
- Benchmark: mediana de CPCBench y CTRBench de las filas incluidas.

## Meta Ads
- Suma Spend, Impressions, Reach, LinkClicks, PostEngagement.
- CPC = Spend / LinkClicks
- CTR = (LinkClicks / Impressions) × 100
- Results: suma SOLO si todas las filas comparten el mismo ResultType. Si hay varios ResultTypes, repórtalos por separado, nunca mezclados.
- CostPerResult = Spend / Results (por ResultType).
- Campañas de Awareness: la métrica de eficiencia es CPM = (Spend / Reach) × 1000.

## Spotify Marquee/Showcase
- La métrica CLAVE es TasaIntencion (% de oyentes convertidos que guardaron el track o lo añadieron a playlist). Es la señal de fandom.
- Cada fila trae PerformanceClassification (Excelente > Bueno > Promedio > Por debajo del promedio > Pobre) ya calculada: úsala como base si es coherente con las métricas; si no, manda la fila. AdResultSummary es una frase fija por nivel: no la cites. Las Median* son por AdType + AudienceGroup + Label (segmento).
- No apliques lógica de CPC/CTR de display: Marquee/Showcase se evalúa por streams, conversión e intención.
- Metodología completa en spotify_methodology.

## Spotify Ad Studio
Es publicidad dentro de Spotify (audio, vídeo, display), NO Marquee/Showcase. No le apliques nada de la sección anterior: aquí no hay intención, ni saves, ni oyentes convertidos.

- Ojo con los nombres: la inversión es `Gasto`, el alcance `Alcance`, los clics `Clics`; las métricas de escucha van en inglés (`Streams`, `Listeners`, `NewListeners`, `VideoViews`, `CompletionRate`).
- Suma Gasto, Impressions, Alcance, Clics, Streams, Listeners, NewListeners, VideoViews.
- **Coste/Stream ya viene en la fila (`CostoPerStreams`): no lo recalcules.** Vacío = la campaña no medía streams.
- **CPC y CPM no vienen: calcúlalos.** CPC = Gasto / Clics · CPM = (Gasto / Impressions) × 1.000.
- **Frequency tampoco viene: calcúlala** como Impressions / Alcance, igual que en Meta y TikTok.
- CTR, CTRBench y CompletionRate vienen en DECIMAL, como Marquee/Showcase (0,00947 = 0,947%; 0,7294 = 72,94%; 1,0 = 100%). Multiplícalos ×100 al mostrarlos. Cuidado: en TikTok el CTR ya viene en % — misma etiqueta, escala distinta. CTR y CTRBench comparten escala: convierte los dos o ninguno.
- **Benchmarks: solo `CTRBench` y `BenchCostoPerStreams`.** Esas dos métricas llevan semáforo normal. **CPC y CPM no tienen referencia** en esta plataforma: van sin status, y no se les traslada el benchmark de otra métrica.
- Son referencias INTERNAS (mediana de campañas comparables de la casa por mercado, segmento, formato y objetivo), no estándares de industria. Llámalas "la referencia". El mercado sale del sufijo del Release ("Release Ejemplo MX"); sin sufijo, España. Nunca compares una campaña de otro mercado con las españolas: el coste por stream cambia tanto entre mercados que la lectura no sale floja, sale falsa.
- Bench vacío = no había campañas comparables suficientes: métrica sin status y "(sin referencia suficiente todavía)". No lo sustituyas por la media de lo que hayas recuperado.
- Agrega SOLO dentro del mismo DeliveryGoal. Sumar una campaña de AWARENESS con una de LEAD_GEN no produce un número interpretable.
- **Los ceros no entran en los cálculos.** Streams, Listeners, NewListeners, VideoViews y CompletionRate valen 0 cuando no aplican al formato o al objetivo. No los promedies, no los sumes al total y no los leas como mal rendimiento: son "no aplica".
- El coste por stream de Ad Studio varía varios órdenes de magnitud según el FORMATO y el MERCADO. No lo juzgues contra ninguna cifra de memoria — para eso está `BenchCostoPerStreams`, ya calculado entre campañas del mismo mercado, formato y objetivo. Y nunca lo compares con el de Marquee/Showcase ni sumes los streams de las dos.

## TikTok Ads
- Suma Spend, Impressions, Clicks, Reach, VideoWatched6s, SoundClicks, Conversions.
- CTR ya viene en escala % (1,24 = 1,24%). No lo multipliques.
- CPC, CPM y CostPerConversion en euros.
- Benchmarks: CTRBench, CPCBench, CPMBench ya calculados por segmento y objetivo — usa la mediana de las filas incluidas.

## Casos límite (todas las plataformas)
- División entre cero (0 clics, 0 results): reporta la métrica como "n/a", nunca como 0 ni infinito.
- Benchmark vacío: muestra la métrica sin status y añade "(sin benchmark disponible)".
- Spend > 0 con Impressions = 0 (o viceversa): muestra los dos valores tal cual; señálalo como posible anomalía de datos solo si el usuario pide qué revisar.

## Benchmarks (tono equilibrado, no alarmista)
Los benchmarks son referencias internas, no objetivos contractuales.
- 🟢 en línea con la referencia o mejor
- 🟡 ligeramente peor (~hasta 25% de desvío)
- 🟠 bastante peor (merece revisión)
- Evita 🔴 salvo desvíos extremos y sostenidos.

**Dirección de cada métrica:**
- Google: CPC ≤ CPCBench 🟢 | CTR ≥ CTRBench 🟢
- Meta: CostPerResult ≤ BenchCostPerResult 🟢
- Spotify Marquee/Showcase (vs columnas Median): CostoPerStreams ≤ Median 🟢 (más barato mejor) | TasaIntencion, TasaConversion, SaveRate, PlaylistAddRate ≥ Median 🟢
- Spotify Ad Studio: CostoPerStreams ≤ BenchCostoPerStreams 🟢 (más barato mejor) | CTR ≥ CTRBench 🟢. Ninguna otra métrica de Ad Studio lleva status.
- TikTok: CPC ≤ CPCBench 🟢 | CPM ≤ CPMBench 🟢 | CTR ≥ CTRBench 🟢

**Cómo expresar desvíos:** descriptivo, no dramático. "Por encima de la referencia (€0,026 vs €0,01)", nunca "+161% 🚨". Añade contexto cuando exista: un CPC alto en un público pequeño o un objetivo de conversión puede ser perfectamente normal.
