---
name: aprendizajes-artista
description: Resume qué ha funcionado históricamente en las campañas de paid media de un artista, cruzando todos sus releases y las cinco plataformas. Se activa con preguntas tipo "qué aprendemos de las campañas de X", "qué ha funcionado con X", "vamos a lanzar algo nuevo de X", "histórico de X" o "aprendizajes de X" para preparar una nueva fase o lanzamiento.
---
# Aprendizajes por artista

## Cuándo se activa
"¿Qué aprendemos de las campañas de [artista]?", "¿qué ha funcionado con [artista]?", "vamos a lanzar algo nuevo de [artista]", "histórico de [artista]", "aprendizajes de [artista]", "¿qué plataforma le funciona mejor a [artista]?". También cuando un PM prepara un lanzamiento y quiere contexto de campañas pasadas.

NO se activa para el estado actual de una campaña concreta (eso es el reporte estándar de artista/release del prompt).

## Regla de oro
Este skill mira HACIA ATRÁS: resume qué funcionó y qué no con datos reales. No planifica ni prescribe la siguiente fase: las decisiones de inversión son del equipo de digital ads. Solo datos reales; "sin dato" donde falte.

## Proceso
1. Busca TODAS las campañas del artista en las cinco fuentes (Google, Meta, TikTok, Spotify Marquee/Showcase y Spotify Ad Studio), todos los releases, lifetime. Usa las variantes de búsqueda habituales (alias, sin acentos, palabras parciales).
2. Ordena los releases cronológicamente (Mes en Google/Meta/TikTok; Inicio en Marquee/Showcase y en Ad Studio).
3. Evalúa cada campaña contra su benchmark (según calculo-metricas-benchmarks). En Ad Studio solo el CTR y el coste por stream tienen referencia: no cuelgues un aprendizaje de su CPC o su CPM, que no tienen contra qué medirse. Aplica el umbral de volumen: campañas con inversión menor de €200 no sustentan aprendizajes (o van marcadas "volumen bajo").
4. Busca PATRONES, no campañas sueltas. Un aprendizaje necesita repetirse o destacar con claridad:
   - Plataformas: ¿dónde bate el benchmark de forma consistente? ¿Dónde no?
   - Objetivos y formatos: ¿qué Objectivo/CampaignType/AdType rinde mejor para este artista?
   - Marquee/Showcase: ¿hay señales de fandom (TasaIntencion, SaveRate por encima de la mediana)? ¿Qué AudienceGroup convirtió mejor? ¿Hubo efecto halo sobre el catálogo (columnas OtherReleases)?
   - Evolución: ¿mejora o empeora release a release (coste por resultado, coste por stream, CTR)?
   - TikTok: ¿SoundClicks altos (interés por el sonido)? ¿Diferencias entre cuentas?
   - Ad Studio: ¿qué formato (audio, vídeo, display en feed) le rinde mejor? ¿La inversión en Spotify se reparte entre captación (Ad Studio) y profundidad (Marquee), o está toda en un lado?
5. Señala también lo que NO funcionó, en tono descriptivo (nunca alarmista).
6. Si el artista solo tiene un release o pocas campañas con volumen, dilo: "histórico limitado, aprendizajes orientativos".

## Formato de respuesta
1. Veredicto de UNA línea: el aprendizaje principal del histórico ("A [artista] le funciona especialmente bien [plataforma/formato]: [dato]").

2. Tabla de histórico por release, en orden cronológico:

| Release | Período | Inversión | Plataformas | Mejor señal |
|---|---|---:|---|---|

"Plataformas" = iconos de las plataformas con datos (🟡🟦⬛🟢🎧). "Mejor señal" = 3-6 palabras con el dato más fuerte de ese release.

3. Qué ha funcionado (máximo 4 bullets, cada uno con su dato):
- "[Patrón] — [evidencia con cifras y vs benchmark]"

4. Qué no ha funcionado o conviene vigilar (máximo 3 bullets, descriptivos, con su dato).

5. Si hay datos de Spotify: una línea sobre la audiencia ("las campañas de Marquee convierten sobre todo audiencia [Potential/Amplified/Reactivated], con intención [por encima/debajo] de la mediana").

6. Cierre: "Lo más consistente del histórico de [artista] es [X]. Para plantear la siguiente fase de inversión, habla con el equipo de digital ads."

7. Pregunta de seguimiento útil (ej.: "¿Quieres el detalle de algún release en concreto?").

## Reglas
- Un aprendizaje sin dato que lo sustente no se escribe.
- No mezcles releases en una misma fila ni promedies métricas entre plataformas.
- Si solo hay UNA campaña por plataforma, habla de "señal", no de "patrón".
- No propongas presupuestos, plataformas ni formatos para el futuro; describe el pasado y deriva al equipo de digital ads.
- Formato europeo de números SIEMPRE. Estados "activa"/"finalizada", nunca "pausada".
- Sin citas, archivos ni cálculos visibles.
- Si no hay datos del artista: "No encontré campañas de [X] en ninguna de las cinco fuentes. ¿Puede que el nombre esté escrito de otra forma?"

## Ejemplo de formato (datos ficticios — nunca citarlos como reales)

A Artista Ejemplo le funciona especialmente bien Spotify: intención por encima de la mediana en sus dos Marquees, mientras que en TikTok el CTR quedó por debajo de la referencia en ambos releases.

| Release | Período | Inversión | Plataformas | Mejor señal |
|---|---|---:|---|---|
| Single Uno | feb 2026 | €3.200,00 | 🟦⬛🟢 | intención 42% en Marquee |
| Single Dos | mayo 2026 | €4.100,00 | 🟦⬛🟢 | coste/resultado 🟢 en Meta |

Qué ha funcionado:
- Marquee convierte fandom de forma consistente — tasa de intención por encima de la mediana en los dos flights (42,0% y 39,5% vs 36,0%).
- Meta mejora release a release — el coste por resultado bajó de €0,24 a €0,19 (benchmark €0,24).

Qué conviene vigilar:
- TikTok por debajo de la referencia en ambos releases (CTR 0,48% y 0,51% vs 0,60%), con inversión relevante en los dos.

En Spotify, las campañas convierten sobre todo audiencia Potential, con intención por encima de la mediana: el artista capta oyentes nuevos que quieren volver.

Lo más consistente del histórico de Artista Ejemplo es el rendimiento de Marquee. Para plantear la siguiente fase de inversión, habla con el equipo de digital ads.

¿Quieres el detalle de algún release en concreto?
