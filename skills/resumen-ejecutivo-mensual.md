---
name: resumen-ejecutivo-mensual
description: 'Resumen ejecutivo agregado de un mes o período completo de paid media, a nivel global, de segmento o de PM. Usar cuando el usuario pida una vista general de un período sin centrarse en un artista concreto: "¿cómo fue junio?", "resumen del mes", "wrap de mayo", "¿cómo va el mes?", "vista general del segmento Latino en junio", "¿cómo cerró el trimestre?", "resumen de las campañas de [PM] este mes".'
---
# Resumen Ejecutivo Mensual

## Cuándo aplica
El usuario pide una vista agregada de un período (mes, trimestre, "este mes") sin un artista/release como foco. Si nombra un artista concreto, usa el formato de reporte de artista, no este.

Dimensión del resumen según la pregunta:
- Sin filtro → global España (todas las plataformas, todos los segmentos).
- "del segmento X" → filtra por Segmento (Label en Marquee/Showcase, Segment en Ad Studio).
- "de [PM]" → filtra por PM.
- Si pide el mes en curso → indica "(mes en curso, datos parciales)" en la cabecera.

## Obligatorio antes de responder
Consulta las CINCO fuentes (Google, Meta, TikTok, Spotify Marquee/Showcase y Spotify Ad Studio) filtrando por el período. Si una fuente no tiene datos del período, inclúyela como "Sin datos en [plataforma]". Nunca omitas una fuente sin revisarla. En Ad Studio, filtra el período por MesKey (`2026-06`).

## Estructura de la respuesta

### 1. Veredicto del mes (una línea)
El titular ejecutivo: inversión total, dónde se concentró y la señal más relevante. Ejemplo: "Junio: €X invertidos, concentrados en Meta y Spotify; el segmento Latino lidera eficiencia."

### 2. Inversión y mix
| Plataforma | Inversión | % del total |
|---|---|---|
| 🟡 Google Ads | €X | X% |
| 🟦 Meta Ads | €X | X% |
| ⬛ TikTok Ads | €X | X% |
| 🟢 Spotify Marquee/Showcase | €X | X% |
| 🎧 Spotify Ad Studio | €X | X% |
| **TOTAL** | **€X** | 100% |

Marquee/Showcase y Ad Studio van en filas separadas, nunca fundidas en un "Spotify" único. Si el usuario pide el peso de Spotify en el mix, da la suma de las dos y desglósala.

Añade una línea de lectura del mix: dónde se concentró la inversión y si el mix cambió respecto al mes anterior (si hay datos).

### 3. Desglose por segmento (o por PM si el filtro es un segmento)
Tabla con: Segmento | Inversión | Nº campañas | Señal de eficiencia (la métrica dominante del segmento vs benchmark con 🟢🟡🟠).
No inventes agregados imposibles: si un segmento mezcla objetivos incompatibles, indica la métrica por separado o marca "mixto".

### 4. Destacados del mes
- **🏆 Top 3 campañas** por eficiencia vs benchmark (indica el criterio en cada una — no mezcles plataformas sin aclararlo).
- **⚠️ A revisar (SOLO si el usuario pide qué revisar):** campañas claramente por debajo de benchmark de forma relevante (spend significativo, no micro-campañas), con una línea de posible causa si es visible en los datos.
- **🟢 Spotify:** si hubo campañas Marquee/Showcase en el período, una línea con la mejor por tasa de intención. Si hubo Ad Studio, otra línea aparte con la de mayor volumen de escucha o mejor coste por stream, según el objetivo dominante.

### 5. Variación vs mes anterior (si hay datos del mes previo)
Inversión total, nº de campañas activas y la métrica de eficiencia dominante: 📈/📉 con % de variación. Si el mix de campañas cambió mucho entre meses, adviértelo — comparar meses con mixes distintos lleva a conclusiones erróneas. Si no hay mes anterior con datos, omite la sección sin mencionarla.

### 6. Lecturas y acciones (2-4 bullets)
Traducción a negocio, no repetición de cifras: qué está funcionando y dónde hay oportunidad (nurturing de campañas eficientes, revisar creatividades con fatiga, segmentos infrainvertidos con buen rendimiento). Cierra con una pregunta de seguimiento ("¿Quieres el detalle de alguna campaña o segmento?").

## Reglas de agregación
- Suma Spend/Gasto por plataforma y segmento directamente.
- Métricas de ratio (CPC, CTR, CostPerResult): recalcula desde los totales (Spend/Clicks agregados), nunca promedies porcentajes de filas.
- Meta: no sumes Results de ResultTypes distintos — repórtalos por tipo o usa solo inversión y clics para el agregado.
- Spotify Marquee/Showcase: agrega solo Gasto y Streams; las tasas (intención, conversión) se reportan por campaña, no agregadas.
- Spotify Ad Studio: agrega Gasto, Impressions, Alcance y Clics; agrupa las métricas de escucha solo entre campañas de ENGAGEMENT_ON_SPOTIFY. Para la columna de eficiencia usa CTR o coste por stream, que sí traen benchmark (`CTRBench`, `BenchCostoPerStreams`) y llevan 🟢🟡🟠; si la usas con CPC o CPM, deja el status en "—". Nunca sumes sus Streams con los de Marquee/Showcase.
- Micro-campañas (spend muy bajo): inclúyelas en los totales pero exclúyelas de rankings de eficiencia, indicándolo.
- Formato europeo siempre. Si un dato falta: "sin dato".

## Presentación del resumen
Si el usuario pide el resumen "en presentación/deck/slides", genera este mismo contenido siguiendo el skill presentaciones-html (estructura: portada del mes → inversión y mix → segmentos → destacados → lecturas).
