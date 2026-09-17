---
name: spotify-marquee-showcase
description: Interpretación y análisis en profundidad de campañas de Spotify Marquee y Showcase, basado en la metodología oficial de Spotify for Artists. Usar cuando el usuario pregunte por Marquee, Showcase, oyentes convertidos, tasa de intención, saves, playlist adds o audiencias de Spotify, o cuando un reporte incluya datos de MarqueeShowcase_ads_data y haya que interpretarlos o compararlos con sus medianas. NO cubre Spotify Ad Studio (SpotifyAdStudio_ads_data), que es la otra fuente de Spotify y se lee con las reglas de su sección del prompt.
---
# Spotify Marquee/Showcase — Interpretación

## Alcance: esto NO es Ad Studio
Este skill cubre `MarqueeShowcase_ads_data` y solo esa lista. Spotify aporta dos
fuentes distintas y la otra, `SpotifyAdStudio_ads_data`, es publicidad de audio,
vídeo y display: no tiene oyentes convertidos, ni tasa de intención, ni saves, ni
playlist adds, ni medianas contra las que comparar. Nada de lo que sigue se le
aplica.

Si la consulta dice "Spotify" a secas, cubre las dos: aplica este skill a la
parte de Marquee/Showcase y lee Ad Studio con las reglas de su sección del
prompt, en tablas separadas. Sus `Streams` no se suman ni se comparan con los de
aquí: la atribución es distinta y el coste por stream vive en otro orden de
magnitud.

## Qué es cada formato
- **Marquee:** recomendación patrocinada a pantalla completa al abrir la app móvil de Spotify. Flight máximo de 10 días.
- **Showcase:** banner móvil en la parte superior de Home. Flight máximo de 14 días. Puede promocionar tanto novedades como catálogo.

Ambos impactan a oyentes Premium y Free ya relevantes para el artista en el país seleccionado — el targeting lo hace Spotify sobre comportamiento real de escucha. Son herramientas de **profundidad** (activar y convertir audiencia existente), no de **amplitud**.

Consecuencia directa: NO se evalúan con lógica de display. CPC, CTR y CPM existen en los datos pero son métricas secundarias. Nunca compares Marquee/Showcase con Google/Meta/TikTok en esos términos.

## Mecánica de entrega (contexto para interpretar coste)
- Precio por clic (CPC): el presupuesto se consume al ritmo de los clics.
- La campaña corre hasta agotar presupuesto o alcanzar el flight máximo (10 días Marquee / 14 días Showcase).
- Spotify excluye en tiempo real a oyentes que ya han escuchado activamente el release en los últimos 21 días — el presupuesto no se gasta en audiencia ya activada.

## Ventana de atribución: 14 días
Todas las métricas miden el comportamiento del oyente durante los 14 días posteriores a ver el ad. Implicaciones:
- Las métricas no se consolidan hasta 14 días después del fin de la campaña. Si una campaña terminó hace menos de 14 días, indícalo: "(métricas aún no finalizadas, ventana de atribución en curso)".
- Streaming activo = el oyente busca intencionalmente la música (página de artista, álbum, playlists propias). El streaming programado (playlists editoriales/algorítmicas, radio) NO cuenta como conversión.

## Segmentos de audiencia (AudienceGroup)
- **Active audience:** ha escuchado activamente al artista en los últimos 28 días. Se divide en **Light** (1–2 veces), **Moderate** (muchas veces) y **Super listeners** (los más dedicados).
- **Previously active:** estuvo en la audiencia activa pero no escucha activamente desde hace más de 28 días.
- **Programmed:** solo ha escuchado por fuentes programadas (editoriales, algorítmicas, radio); sin escucha activa en 2+ años.
- **Potential:** no ha escuchado al artista en 2+ años.

**Objetivo por audiencia (marco oficial de Spotify):**
| Objetivo | Audiencia target | Señal de éxito |
|---|---|---|
| Growth | Programmed / Potential | New active listeners |
| Reactivación | Previously active | Reactivated listeners |
| Engagement | Active (light/moderate/super) | Amplified listeners |

Contextualiza SIEMPRE el rendimiento por audiencia: una tasa de conversión baja en Potential no es mala señal en sí — es la audiencia más fría. Compara cada campaña contra el objetivo de su audiencia, no contra un estándar único.

**Columnas de audience development en MarqueeShowcase_ads_data.csv:**
- TotalAmplified / AmplifiedListenersRate → oyentes ya activos que profundizaron (objetivo Engagement).
- TotalReactivated / ReactivatedListenersRate → previously active recuperados (objetivo Reactivación).
- NewActiveListenersRate + TotalProgramed / TotalPotential → nuevos oyentes activos desde audiencias frías (objetivo Growth).
- Light/Moderate/SuperListenersAfterConverting → a qué segmento de la audiencia activa llegaron los convertidos. Más peso en Moderate/Super = fandom más profundo.
- DeepenFanConnections, ReactivacionOyentes, AumentoAudiencia → agregados por objetivo; úsalos como titular y desglosa con las tasas.
- ListenersOtherReleases, StreamsPerListenerOtherReleases, Saves/PlaylistAddsOtherReleases → efecto halo sobre el catálogo del artista: convertidos que exploraron otros releases. Un halo alto indica que la campaña activó fandom del artista, no solo del track.

## El funnel de métricas
Alcance → Clics → Oyentes Convertidos → Acciones de intención (saves, playlist adds)

- **OyentesConvertidos:** oyentes que escucharon activamente el release tras ver el ad (dentro de la ventana de 14 días).
- **TasaConversion:** convertidos / alcance. ¿El mensaje activa la escucha?
- **TasaIntencion (métrica CLAVE):** % de convertidos que guardaron un track (save) o lo añadieron a una playlist propia. Es el indicador adelantado de streaming futuro.
- **StreamsPerListener:** streams activos medios por convertido. Profundidad de escucha.
- **SaveRate / PlaylistAddRate:** desglose de la intención. Save = añadir a 'liked songs'; playlist add = moverlo a una playlist propia.
- **CostoPerStreams:** eficiencia de coste (menor = mejor).

## Por qué la intención importa (datos oficiales de Spotify Fan Study)
- Saves y playlist adds correlacionan con un aumento de ~2,5x en el streaming del artista 6 meses después.
- Tras guardar un track, un usuario suele escuchar al artista 3x más que antes.
- El 60% del merch comprado desde perfiles de Spotify viene de oyentes que han playlisteado al artista.
Usa estos datos para traducir un intent rate alto a impacto de negocio, no solo como cifra.

## Jerarquía de lectura
1. **TasaIntencion** — ¿generó fandom?
2. **TasaConversion** — ¿activó la escucha? (leída contra su AudienceGroup)
3. **CostoPerStreams** — ¿a qué coste?
4. StreamsPerListener, SaveRate, PlaylistAddRate — matices.
5. CPC/CTR/CPMReach — solo si el usuario los pide explícitamente.

## Comparación contra medianas
Cada fila trae sus referencias: MedianCostPerStreams, MedianIntentRate, MedianConversionRate, MedianSaveRate, MedianPlaylistAddRate. Son la mediana de las campañas del **mismo AdType, AudienceGroup y Label** (segmento): preséntalas así ("la mediana de los Showcase de Grow + Reactivate de Latino"), nunca como una cifra general de Spotify.
- CostoPerStreams ≤ Median 🟢 (más barato mejor)
- TasaIntencion, TasaConversion, SaveRate, PlaylistAddRate ≥ Median 🟢
- Ligeramente peor (~hasta 25%) 🟡 | bastante peor 🟠

**Comparaciones entre releases:** los números absolutos (streams por oyente, saves, playlist adds) varían mucho según si el release es novedad o catálogo, y si es single, EP o álbum. Al comparar campañas de tipos distintos, usa SIEMPRE porcentajes (tasas), nunca absolutos.

## PerformanceClassification y AdResultSummary
`PerformanceClassification` es la nota global, en cinco niveles: **Excelente > Bueno > Promedio > Por debajo del promedio > Pobre**. Resume cuántos de los cinco KPIs con mediana van en línea o mejor (Excelente ≈ 4-5 de 5; Pobre ≈ 0-1). Úsala como base del veredicto, para la columna "Lectura" en tablas de cartera y para ordenar "las mejores/peores" de Marquee/Showcase cuando no piden una métrica concreta. Si contradice claramente las métricas de la fila, manda la fila: reporta las métricas y no repitas la nota (explicar la contradicción solo si piden qué revisar).

`AdResultSummary` es una frase fija por nivel ("Pobre: Resultados deficientes en comparación con campañas similares anteriores."): **no la cites**. La lectura sale de las métricas.

## Interpretaciones tipo
- TasaConversion alta + TasaIntencion baja → el ad activa escucha pero el contenido no retiene: señal de contenido/momento, no de media buying.
- TasaConversion baja + TasaIntencion alta → convierte poco pero muy cualificado: audiencia pequeña y fiel; valorar formatos de amplitud como complemento.
- CostoPerStreams alto con audiencia pequeña, segmento frío (Potential/Programmed) o país caro → puede ser normal, no lo marques como fallo sin contexto.
- Streams altos con TasaIntencion en mediana o por debajo → volumen sin fandom: bien para campañas de streaming, insuficiente si el objetivo era fidelizar.
- Buen rendimiento en Previously active → reactivación funcionando: audiencia recuperada para el ciclo del release.

## Dimensiones de análisis
- **AdType (Marquee vs Showcase) y Type:** compara rendimiento por formato cuando el artista tenga ambos. Recuerda que Showcase admite catálogo.
- **Location:** por defecto España; filtra por país si lo mencionan.
- **Segmento:** es la columna `Label` (Local, Latino, Anglo, Streaming).
- **Tipo de producto:** `TipoProducto` (Single, Album, EP…). Entre tipos distintos, compara tasas, nunca absolutos.
- **Fechas:** `Inicio`/`Fin` en ISO `aaaa-mm-dd` (`2026-02-05` = 5 de febrero de 2026). Para filtrar por período, `MesKey` (`2025-10`); para mostrar, `Mes` ("Octubre 2025"), calculado desde `Inicio`. Escribe siempre el mes con letra en la respuesta ("del 5 al 11 de febrero de 2026"), nunca en cifras. Verifica si la ventana de atribución sigue abierta.

## Formato de salida
Usa la tabla estándar de la sección Spotify del reporte de artista (Valor | Mediana | Status) y cierra con la Clasificación. En análisis profundos, añade una línea de lectura por cada nivel del funnel y el objetivo de audiencia (growth / reactivación / engagement) al que respondía la campaña.
