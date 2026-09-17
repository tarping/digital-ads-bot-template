# Digital Ads Bot

Un agente de Microsoft Copilot Studio que responde preguntas sobre campañas de
paid media en **Google Ads, Meta Ads, TikTok Ads, Spotify Marquee/Showcase y
Spotify Ad Studio**: reportes por artista, release, project manager, segmento,
período o plataforma, con benchmarks, rankings y presentaciones en HTML o
PowerPoint.

Este repo es una plantilla. Trae el prompt, los skills, las recetas del
pipeline de datos y los scripts de apoyo. Los datos y el tenant los pones tú.

## Cómo funciona

```
Google Sheets (una por plataforma)
   │  Power Automate, diario: Get rows → Select → borrar todo → crear todo
   ▼
Listas de SharePoint (una por plataforma)  ──►  Agente de Copilot Studio
                                                  ├─ prompt/prompt.md   (instrucciones)
                                                  ├─ skills/*.md        (reglas especializadas)
                                                  ├─ conocimiento: las 5 listas de campañas
                                                  └─ herramienta: catálogo de fotos de artista
```

El bot nunca lee Google Sheets en mitad de una conversación: lee listas de
SharePoint. Un flujo rehace cada lista desde su hoja todos los días.

## Qué hay en el repo

| Ruta | Qué es |
|---|---|
| `prompt/prompt.md` | El prompt completo del agente. Se pega en Copilot Studio |
| `skills/` | Los 7 skills que invoca el prompt (métricas, Spotify, rankings, resumen mensual, aprendizajes por artista, decks HTML, decks PPTX) |
| `flows/` | Los `Select` de Power Automate de cada plataforma, y el montaje completo de un flujo paso a paso (`artist-photos.md`) |
| `tools/check-prompt.py` | Comprueba que cada skill que nombra el prompt existe en `skills/` |
| `tools/marquee-export.gs` | Apps Script: convierte una hoja de Marquee/Showcase al formato CSV de la lista (añade `Mes`/`MesKey`, texto de búsqueda y resumen) |
| `tools/adstudio-benchmarks.gs` | Apps Script: benchmarks internos de Ad Studio (medianas por cohorte) |
| `tools/adstudio-export.gs` | Apps Script: hoja de Ad Studio → CSV, espejo del `Select` |
| `tools/adstudio-select-map.json`, `adstudio-create-item.json` | Map del `Select` y body del `Create item` de Ad Studio |
| `tools/artist-photos-refresh.gs` | Apps Script: refresco semanal de las fotos de artista desde la API de Spotify |
| `tools/spotify_artist_photos.py` | Versión local, a granel, de la misma búsqueda de fotos |

---

## Puesta en marcha

### 1. Requisitos

- Microsoft 365 con **Copilot Studio**, **Power Automate** y **SharePoint**
- Una cuenta de Google con una hoja por plataforma (exports de tus plataformas
  de anuncios o los informes que ya llevas)
- *(Opcional, para las fotos de portada)* una app de desarrollador de Spotify
  (client ID y secret)

### 2. Prepara las hojas de origen

Necesitas una pestaña de Google Sheets por plataforma. Los nombres de columna
están en [Listas de SharePoint](#listas-de-sharepoint). Algunas columnas son
etiquetas internas que rellenas tú en cada fila:

- `Artist`, `Release`: qué promociona la campaña
- `Objectivo`: objetivo interno
- `Segmento` (`Label` en Marquee, `Segment` en Ad Studio): cómo divides tu
  equipo o tu catálogo
- `PM`: project manager
- `Mes`: mes de la campaña

Reglas que evitan fallos silenciosos:

- La cabecera va en la **fila 1**, sin celdas sueltas ni columnas vacías en
  medio.
- **Nombres de columna sin espacios ni símbolos** siempre que puedas.
  SharePoint convierte un espacio en `_x0020_`, y una columna como
  `(Calc) Cost per Result` no se mapea.
- El punto como separador decimal. Las fechas en ISO (`aaaa-mm-dd`).

Para Marquee/Showcase, instala `tools/marquee-export.gs` en la hoja
(Extensiones → Apps Script). Construye `Mes`, `MesKey`, `SearchText` y
`KnowledgeSummary` por ti. Para Ad Studio, instala
`tools/adstudio-benchmarks.gs` y ejecuta *Ad Studio → Recalcular benchmarks*
desde el menú: rellena `CTR Bench` y `Bench Cost per Streams`.

### 3. Crea las listas de SharePoint

Crea una lista por plataforma, por ejemplo importando un primer CSV
(*Nuevo → Lista → Desde CSV*). Después revisa los tipos de columna:

- **Las métricas tienen que ser columnas de Número.** Si son texto, el bot
  compara cadenas, y `"9" > "10"`.
- **`SearchText` y `KnowledgeSummary` tienen que ser "Varias líneas de
  texto".** Una línea de texto corta a 255 caracteres sin avisar.

### 4. Monta los flujos de Power Automate

Un flujo por lista, todos con el mismo patrón:

1. **Recurrence**: diaria (semanal para las fotos).
2. **Google Sheets → Get rows**: File y Worksheet fijos. Worksheet es la
   **pestaña**, no el nombre del fichero. Un nombre de pestaña equivocado
   devuelve vacío sin dar error. Paginación activada.
3. **Data Operation → Select** (`Select_<Plataforma>`): pega el map de
   `flows/<plataforma>.md`. Normaliza cada fila y construye `KnowledgeTitle`,
   `SearchText` y `KnowledgeSummary`.
4. **SharePoint → Get items**: Top Count `5000`, paginación activada (`5000`).
5. **Apply to each** sobre `body('Get_items')?['value']` → **Delete item**,
   Id = `items('…')?['ID']`.
6. **Apply to each** sobre `body('Select_…')` → **Create item**, cada campo
   = `items('…')?['<Columna>']`. Este bucle va **después** del 5, no dentro.

Cada run borra todo y crea todo, sin upsert. La hoja es la fuente de verdad.

`flows/artist-photos.md` recorre el montaje completo, campo a campo. Úsalo
como referencia para los demás.

Trampas ya pagadas:

- En el diseñador nuevo, el map del Select en modo texto da "Map must be
  object". Usa el modo clave / valor y mete cada valor por el editor de
  expresiones **fx**, sin la `@`.
- `Get items` devuelve un objeto (`body('X')?['value']`). `Select` devuelve el
  array directamente (`body('Select_X')`). Nunca `string(body(...))`.
- Las expresiones referencian las acciones **por nombre**. Si renombras una
  acción, actualiza las expresiones que la usan.
- En las condiciones, la expresión por **fx** y el `0` como número.
- Un run en verde no prueba nada. Después de cada cambio, cuenta las filas de
  la lista contra las de la hoja.

### 5. Crea el agente en Copilot Studio

1. **Nuevo agente** → pega `prompt/prompt.md` en las instrucciones.
2. **Sustituye los marcadores** del prompt:

   | Marcador | Ejemplo |
   |---|---|
   | `{{EMPRESA}}` | el nombre de tu empresa o sello |
   | `{{FECHA_INICIO_DATOS}}` | `enero de 2026` |
   | `{{LISTA_DE_PMS}}`, `{{APELLIDO_M}}`, `{{APELLIDO_Z}}` | tus project managers y cómo distinguir a los que comparten nombre |
   | `{{LISTA_DE_SEGMENTOS}}` (y la sección `SEGMENTOS`) | tus segmentos |
   | `{{CUENTA_TIKTOK_PRESUPUESTO}}`, `{{CUENTA_TIKTOK_CREDITOS}}` | los nombres de tus cuentas de TikTok (presupuesto real frente a créditos) |
   | `{{INVERSION_MIN}}`, `{{INVERSION_MAX}}` | rango de inversión típico por campaña, como comprobación de sanidad |

   `grep -rn "{{" prompt skills` los lista todos.
3. **Conocimiento** → añade las cinco listas de SharePoint. Pega una
   descripción en cada una (ver
   [Descripciones del conocimiento](#descripciones-del-conocimiento)). El
   orquestador usa esas descripciones para decidir en qué lista buscar.
4. **Skills** → sube cada fichero de `skills/`. El `name:` de la cabecera de
   cada fichero tiene que coincidir con el nombre que usa el prompt. Ejecuta
   antes `python3 tools/check-prompt.py`. Un nombre de skill que no coincide no
   da ningún error: el bot simplemente nunca usa ese skill.
5. **Code interpreter** → actívalo. Los skills de presentaciones lo usan para
   escribir los `.zip`/`.pptx`.
6. **Logo** → aloja dos PNG (para fondo oscuro y para fondo claro) y pon sus
   URLs en `skills/presentaciones-html.md` (`{{LOGO_URL_FONDO_OSCURO}}`,
   `{{LOGO_URL_FONDO_CLARO}}`). Para el PPTX, pega el base64 de cada PNG en
   `skills/presentaciones-pptx.md`.

### 6. (Opcional) Fotos de artista en la portada

1. Crea una hoja de Google con una pestaña `artists` y estas columnas: `photo`,
   `artist_name`, `spotify_artist`, `review_flag`, `spotify_artist_id`,
   `image_hash`, `spotify_url`, `image_url`, `last_checked`.
2. Pega `tools/artist-photos-refresh.gs` en su Apps Script. Añade
   `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` como propiedades del script y
   ejecuta `installWeeklyTrigger()`.
3. Para añadir un artista, rellena solo `artist_name`. El script completa el
   resto en su siguiente ejecución y marca con `CHECK` las coincidencias
   dudosas. Pon `review_flag = collab` en las filas que representan a varios
   artistas.
4. Monta el flujo semanal a la lista `artist_photos_data` con
   `flows/artist-photos.md`.
5. En Copilot Studio, añade una **herramienta**: SharePoint → *Get items* sobre
   `artist_photos_data`, con **Top Count `500`**. Sin él, *Get items* devuelve
   100 filas, y los artistas que queden fuera parecen no tener foto.

Descripción de la herramienta:

```
Devuelve el catálogo de fotos de artista: una fila por artista, con Title (el
nombre del artista), spotify_artist (la grafía de Spotify), review_flag e
image_url. Llámala ÚNICAMENTE al montar una presentación de un solo artista,
para obtener la URL de su foto de portada. No contiene campañas, inversión,
métricas ni fechas. Busca por Title ignorando mayúsculas y acentos; si no
aparece, prueba spotify_artist. Si review_flag es "collab", no uses la foto.
```

### 7. Prueba

Pregúntale al bot:

- `Artista X`: reporte del artista en las cinco plataformas
- `¿cómo fue junio?`: resumen del período
- `top 5 campañas de Meta por coste por resultado`: ranking
- `hazme una presentación de Artista X`: deck HTML (un `.zip`)

Antes de fiarte de los números, compara unas cuantas cifras a mano contra la
hoja.

---

## Referencia

### Listas de SharePoint

**`google_ads_data`**: Platform, KnowledgeTitle, SearchText, KnowledgeSummary,
Artist, Release, Objectivo, Segmento, PM, Mes, CampaignID, CampaignType,
EffectiveStatus, Spend, Impressions, Clicks, CTR, CPC, VideoViews, ViewRate,
AvgCPV, CTRCalc, CPCBench, CTRBench

**`meta_ads_data`**: Platform, KnowledgeTitle, SearchText, KnowledgeSummary,
Artist, Release, Objectivo, Segmento, PM, Mes, CampaignID, Objective, Status,
EffectiveStatus, Impressions, Reach, Spend, LinkClicks, Results, ResultType,
CostPerResult, PostEngagement, CalcCostPerResult, BenchCostPerResult,
PercentBench

**`tiktok_ads_data`**: Platform, KnowledgeTitle, SearchText, KnowledgeSummary,
CampaignID, Account, Status, ProjectNumber, Artist, Release, Objectivo,
Segmento, PM, Mes, CampaignName, Spend, Impressions, Clicks, CTR, CPC, CPM,
Reach, VideoWatched6s, SoundClicks, Conversions, CostPerConversion, CTRBench,
CPCBench, CPMBench

**`SpotifyAdStudio_ads_data`**: Platform, KnowledgeTitle, SearchText,
KnowledgeSummary, Artist, Release, ProjectNumber, PM, Segment, Objective,
DeliveryGoal, Status, CampaignName, CampaignId, Inicio, Fin, Mes, MesKey,
Gasto, Impressions, Alcance, Clics, CTR, CTRBench, Streams, CostoPerStreams,
BenchCostoPerStreams, Listeners, NewListeners, VideoViews, CompletionRate,
DatePulled

**`MarqueeShowcase_ads_data`**: las columnas de salida de
`tools/marquee-export.gs` (Label, PM, Artist, Product, AdType, AudienceGroup,
Gasto, Inicio, Fin, Mes, MesKey, Location, Streams, CostoPerStreams,
OyentesConvertidos, TasaConversion, TasaIntencion, SaveRate, PlaylistAddRate,
los benchmarks `Median*`, PerformanceClassification, …)

**`artist_photos_data`**: Title (= artist_name), KnowledgeTitle, SearchText,
KnowledgeSummary, spotify_artist, review_flag, spotify_artist_id, image_hash,
spotify_url, image_url, last_checked

Ojo con la escala de las tasas. El prompt le dice al bot cómo leer cada una:

- El CTR de TikTok viene en porcentaje (`1.24` = 1,24%).
- Las tasas de Marquee/Showcase y de Ad Studio vienen en decimal
  (`0.0124` = 1,24%). El `Select` de Ad Studio convierte de porcentaje a
  decimal.

### Descripciones del conocimiento

Pega una descripción en cada fuente de conocimiento de Copilot Studio, con el
nombre de tu empresa.

**Google Ads**
```
Lista estructurada con datos de campañas de Google Ads de {{EMPRESA}}. Cada fila representa una campaña o línea de campaña e incluye artista, release, objetivo, segmento, PM, mes, tipo de campaña, estado, inversión, impresiones, clics, CPC, visualizaciones de vídeo, CTR calculado y benchmarks de CPC/CTR. Usar para consultas de resultados, inversión, rendimiento, campañas activas/finalizadas, comparativas y benchmarks. Para CTR en Google Ads usar siempre CTRCalc. Traducir estados activos como “activa” y PAUSED/ENDED/ARCHIVED como “finalizada”. Nunca decir “pausada”.
```

**Meta Ads**
```
Lista estructurada con datos de campañas de Meta Ads de {{EMPRESA}}. Cada fila representa una campaña o línea de campaña e incluye artista, release, objetivo interno, objetivo de Meta, segmento, PM, mes, Campaign ID, estado, inversión, impresiones, alcance, link clicks, resultados, tipo de resultado, coste por resultado, coste por resultado calculado, post engagement, benchmark de coste por resultado y diferencia vs benchmark. Usar para resultados, inversión, rendimiento, campañas activas/finalizadas, comparativas y benchmarks. Priorizar Results, CalcCostPerResult, CostPerResult, Spend, LinkClicks, Reach, Impressions y PercentBench según objetivo.
```

**TikTok Ads**
```
Lista estructurada con datos de campañas de TikTok Ads de {{EMPRESA}}. Cada fila representa una campaña o línea de campaña e incluye cuenta, estado, número de proyecto, artista, release, objetivo, segmento, PM, mes, nombre de campaña, inversión, impresiones, clics, CTR, CPC, CPM, alcance, visualizaciones de 6 segundos, clics en sonido, conversiones, coste por conversión y benchmarks de CTR, CPC y CPM. Usar para rendimiento, inversión, comparativas por cuenta, mes, segmento o PM. Si no se especifica cuenta, revisar todas las cuentas disponibles.
```

**Spotify Marquee/Showcase**
```
Lista estructurada con datos de campañas Spotify Marquee/Showcase de {{EMPRESA}}. Cada fila representa una campaña e incluye label, PM, artista, producto, tipo de anuncio, grupo de audiencia, gasto, fechas, país, streams, coste por stream, alcance, clics, oyentes convertidos, tasa de conversión, streams por oyente, tasa de intención, playlist adds, saves, benchmarks medianos, clasificación de rendimiento y resumen de resultado. Usar para análisis de rendimiento, inversión, streams, conversión, intención, saves, playlist adds y fandom. No comparar directamente con social/display en CPC o CTR salvo petición expresa.
```

**Spotify Ad Studio**
```
Lista estructurada con datos de campañas de Spotify Ad Studio (audio, vídeo y display dentro de Spotify) de {{EMPRESA}}. Cada fila es una campaña con artista, release, PM, segmento, formato (Objective), objetivo real (DeliveryGoal), estado, fechas, inversión (Gasto), impresiones, alcance, clics, CTR, streams, coste por stream, oyentes, oyentes nuevos, vídeo y benchmarks de CTR y coste por stream. No es Marquee/Showcase: no mezclar sus streams ni compararlos.
```

## Adaptarlo

- **Otras plataformas u otras columnas**: un cambio de columna toca tres sitios
  a la vez: el `Select` del flujo, la sección de la lista en `prompt.md` y cada
  skill que nombre la columna (`grep -rn <Columna> prompt skills`). Si uno se
  queda atrás, el bot recibe instrucciones contradictorias y nada avisa.
- **Los datos de campaña, fuera de git.** El `.gitignore` bloquea `.csv` y
  `.xlsx`.
- Después de editar el prompt o un skill, ejecuta
  `python3 tools/check-prompt.py` antes de pegarlo en Copilot Studio.
