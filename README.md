# Digital Ads Bot

A Microsoft Copilot Studio agent that answers questions about paid media
campaigns across **Google Ads, Meta Ads, TikTok Ads, Spotify Marquee/Showcase
and Spotify Ad Studio**: reports by artist, release, project manager, segment,
period or platform, with benchmarks, rankings and HTML/PowerPoint decks.

This repo is a template. It has the prompt, the skills, the data-pipeline
recipes and the helper scripts. You bring your own data and tenant.

> The prompt and skills are written in **Spanish**, and the bot answers in
> Spanish. To run it in another language, translate `prompt/` and `skills/`
> and keep the column names unchanged.

## How it works

```
Google Sheets (one per platform)
   │  Power Automate, daily: Get rows → Select → delete all → create all
   ▼
SharePoint lists (one per platform)  ──►  Copilot Studio agent
                                             ├─ prompt/prompt.md   (instructions)
                                             ├─ skills/*.md        (specialised rules)
                                             ├─ knowledge: the 5 campaign lists
                                             └─ tool: artist photo catalogue
```

The bot never reads Google Sheets during a conversation. It reads SharePoint
lists. A flow rebuilds each list from its sheet every day.

## What's in the repo

| Path | What it is |
|---|---|
| `prompt/prompt.md` | The full agent prompt. Paste it into Copilot Studio |
| `skills/` | 7 skills the prompt calls (metrics, Spotify, rankings, monthly summary, artist learnings, HTML decks, PPTX decks) |
| `flows/` | Power Automate `Select` maps for each platform, plus a full step-by-step build of one flow (`artist-photos.md`) |
| `tools/check-prompt.py` | Checks that every skill the prompt names exists in `skills/` |
| `tools/marquee-export.gs` | Apps Script: turns a Marquee/Showcase sheet into the list's CSV format (adds `Mes`/`MesKey`, search text, summary) |
| `tools/adstudio-benchmarks.gs` | Apps Script: internal Ad Studio benchmarks (cohort medians) |
| `tools/adstudio-export.gs` | Apps Script: Ad Studio sheet → CSV, mirroring the `Select` |
| `tools/adstudio-select-map.json`, `adstudio-create-item.json` | Ad Studio `Select` map and `Create item` body |
| `tools/artist-photos-refresh.gs` | Apps Script: weekly refresh of artist photos from the Spotify API |
| `tools/spotify_artist_photos.py` | Local bulk version of the same photo lookup |

---

## Setup

### 1. Prerequisites

- Microsoft 365 with **Copilot Studio**, **Power Automate** and **SharePoint**
- A Google account with one sheet per platform (exports from your ad
  platforms, or the reports you already keep)
- *(Optional, for cover photos)* a Spotify developer app (client ID and
  secret)

### 2. Prepare the source sheets

You need one Google Sheet tab per platform. Column names are listed under
[SharePoint lists](#sharepoint-lists). A few columns are internal tags that
you fill in yourself on every row:

- `Artist`, `Release`: what the campaign promotes
- `Objectivo`: internal objective
- `Segmento` (`Label` in Marquee, `Segment` in Ad Studio): your team or roster
  split
- `PM`: project manager
- `Mes`: campaign month

Rules that avoid silent failures:

- The header goes in **row 1**, with no stray cells and no blank columns in
  between.
- Use **no spaces or symbols in column names** when you can. SharePoint turns
  a space into `_x0020_`, and a column like `(Calc) Cost per Result` won't map.
- Use a dot as the decimal separator. Dates in ISO format (`yyyy-mm-dd`).

For Marquee/Showcase, install `tools/marquee-export.gs` in the sheet
(Extensions → Apps Script). It builds `Mes`, `MesKey`, `SearchText` and
`KnowledgeSummary` for you. For Ad Studio, install `tools/adstudio-benchmarks.gs`
and run *Ad Studio → Recalcular benchmarks* from the menu. It fills `CTR Bench`
and `Bench Cost per Streams`.

### 3. Create the SharePoint lists

Create one list per platform, for example by importing a first CSV export
(*New → List → From CSV*). Then check the column types:

- **Metrics must be Number columns.** If they're text, the bot compares
  strings, and `"9" > "10"`.
- **`SearchText` and `KnowledgeSummary` must be "Multiple lines of text".**
  A single line of text cuts at 255 characters without warning.

### 4. Build the Power Automate flows

One flow per list, all with the same pattern:

1. **Recurrence**: daily (weekly for photos).
2. **Google Sheets → Get rows**: fixed File and Worksheet. The Worksheet is
   the **tab**, not the file name. A wrong tab name returns an empty result
   with no error. Pagination on.
3. **Data Operation → Select** (`Select_<Platform>`): paste the map from
   `flows/<platform>.md`. It normalises each row and builds `KnowledgeTitle`,
   `SearchText` and `KnowledgeSummary`.
4. **SharePoint → Get items**: Top Count `5000`, pagination on (`5000`).
5. **Apply to each** over `body('Get_items')?['value']` → **Delete item**,
   Id = `items('…')?['ID']`.
6. **Apply to each** over `body('Select_…')` → **Create item**, each field
   = `items('…')?['<Column>']`. Put this loop **after** loop 5, not inside it.

Each run deletes everything and creates everything, with no upsert. The sheet
is the source of truth.

`flows/artist-photos.md` walks through the full build, field by field. Use it
as the reference for the others.

Pitfalls already paid for:

- In the new designer, the Select map in text mode gives "Map must be object".
  Use key/value mode and enter each value through the **fx** expression editor,
  without the `@`.
- `Get items` returns an object (`body('X')?['value']`). `Select` returns the
  array itself (`body('Select_X')`). Never use `string(body(...))`.
- Expressions refer to actions **by name**. If you rename an action, update
  the expressions that use it.
- In conditions, enter the expression through **fx** and type `0` as a number.
- A green run proves nothing. After each change, count the list's rows against
  the sheet's rows.

### 5. Create the agent in Copilot Studio

1. **New agent** → paste `prompt/prompt.md` into the instructions.
2. **Replace the placeholders** in the prompt:

   | Placeholder | Example |
   |---|---|
   | `{{EMPRESA}}` | your company or label name |
   | `{{FECHA_INICIO_DATOS}}` | `enero de 2026` |
   | `{{LISTA_DE_PMS}}`, `{{APELLIDO_M}}`, `{{APELLIDO_Z}}` | your project managers and how to tell same-name PMs apart |
   | `{{LISTA_DE_SEGMENTOS}}` (and the `SEGMENTOS` section) | your segments |
   | `{{CUENTA_TIKTOK_PRESUPUESTO}}`, `{{CUENTA_TIKTOK_CREDITOS}}` | your TikTok account names (paid budget vs. credits) |
   | `{{INVERSION_MIN}}`, `{{INVERSION_MAX}}` | typical spend range per campaign, used as a sanity check |

   `grep -rn "{{" prompt skills` lists all of them.
3. **Knowledge** → add the five SharePoint lists. Paste a description into
   each one (see [Knowledge descriptions](#knowledge-descriptions)). The
   orchestrator uses these descriptions to decide which list to search.
4. **Skills** → upload each file in `skills/`. The `name:` in each file's
   front matter must match the name the prompt uses. Run
   `python3 tools/check-prompt.py` first. A skill name that doesn't match
   raises no error: the bot just never uses that skill.
5. **Code interpreter** → turn it on. The deck skills write `.zip`/`.pptx`
   files with it.
6. **Logo** → host two PNGs (for dark and light backgrounds) and put their
   URLs into `skills/presentaciones-html.md` (`{{LOGO_URL_FONDO_OSCURO}}`,
   `{{LOGO_URL_FONDO_CLARO}}`). For PPTX, paste the base64 of each PNG into
   `skills/presentaciones-pptx.md`.

### 6. (Optional) Artist cover photos

1. Create a Google Sheet with an `artists` tab and these columns: `photo`,
   `artist_name`, `spotify_artist`, `review_flag`, `spotify_artist_id`,
   `image_hash`, `spotify_url`, `image_url`, `last_checked`.
2. Paste `tools/artist-photos-refresh.gs` into its Apps Script. Add
   `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` as script properties, then
   run `installWeeklyTrigger()`.
3. To add an artist, fill in `artist_name` only. The script fills in the rest
   on its next run and marks uncertain matches with `CHECK`. Set
   `review_flag = collab` for rows that cover several artists.
4. Build the weekly flow to the `artist_photos_data` list with
   `flows/artist-photos.md`.
5. In Copilot Studio, add a **tool**: SharePoint → *Get items* on
   `artist_photos_data`, with **Top Count `500`**. Without it, *Get items*
   returns 100 rows, and artists beyond row 100 look like they have no photo.

Tool description:

```
Devuelve el catálogo de fotos de artista: una fila por artista, con Title (el
nombre del artista), spotify_artist (la grafía de Spotify), review_flag e
image_url. Llámala ÚNICAMENTE al montar una presentación de un solo artista,
para obtener la URL de su foto de portada. No contiene campañas, inversión,
métricas ni fechas. Busca por Title ignorando mayúsculas y acentos; si no
aparece, prueba spotify_artist. Si review_flag es "collab", no uses la foto.
```

### 7. Test

Ask the bot:

- `Artista X`: artist report across all five platforms
- `¿cómo fue junio?`: period summary
- `top 5 campañas de Meta por coste por resultado`: ranking
- `hazme una presentación de Artista X`: HTML deck (a `.zip`)

Compare a few figures against the sheet by hand before you trust the numbers.

---

## Reference

### SharePoint lists

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

**`MarqueeShowcase_ads_data`**: the output columns of
`tools/marquee-export.gs` (Label, PM, Artist, Product, AdType, AudienceGroup,
Gasto, Inicio, Fin, Mes, MesKey, Location, Streams, CostoPerStreams,
OyentesConvertidos, TasaConversion, TasaIntencion, SaveRate, PlaylistAddRate,
the `Median*` benchmarks, PerformanceClassification, …)

**`artist_photos_data`**: Title (= artist_name), KnowledgeTitle, SearchText,
KnowledgeSummary, spotify_artist, review_flag, spotify_artist_id, image_hash,
spotify_url, image_url, last_checked

Watch the rate scales. The prompt tells the bot how to read each one:

- TikTok CTR comes as a percentage (`1.24` = 1.24%).
- Marquee/Showcase and Ad Studio rates come as decimals (`0.0124` = 1.24%).
  The Ad Studio `Select` converts from percentage to decimal.

### Knowledge descriptions

Paste one description into each knowledge source in Copilot Studio, with your
company name filled in.

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

## Adapting it

- **Different platforms or columns**: a column change touches three places at
  once: the flow's `Select`, the list's section in `prompt.md`, and every skill
  that mentions the column (`grep -rn <Column> prompt skills`). If one of them
  falls behind, the bot gets contradictory instructions and nothing reports an
  error.
- **Keep campaign data out of git.** `.gitignore` blocks `.csv` and `.xlsx`.
- After you edit the prompt or a skill, run `python3 tools/check-prompt.py`
  before you paste it into Copilot Studio.
