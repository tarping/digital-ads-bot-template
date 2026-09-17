# Hoja de montaje · lista `artist_photos_data` + flujo semanal

Mismo modelo que los flujos de Meta y TikTok: **borrar todo y volver a crear**.
La hoja es la fuente de verdad; la lista es una copia que se rehace entera cada
lunes. Así entran los artistas nuevos, las fotos cambiadas y desaparecen los
borrados, sin lógica de upsert.

```
1. Recurrence          (lunes 07:00 — el Apps Script refresca la hoja a las 05:00)
2. Sheet_Artistas      (Google Sheets · Get rows)
3. Select_Artistas     (Data Operation · Select)          ✅ montado
4. SP_Existentes       (SharePoint · Get items)
5. Borrar_Todos        (Apply to each → Delete item)
6. Crear_Todos         (Apply to each → Create item)       — después de 5, no dentro
```

---

## 0 · Crear la lista

*SharePoint → Nuevo → Lista → **Desde CSV*** → un CSV exportado de tu hoja `artists`.
Nombre: `artist_photos_data`.

El CSV sale de la hoja con las mismas fórmulas que el Select de abajo, así que
las filas importadas y las que cree el flujo son idénticas.

Después de importar, revisa los tipos:

| Columna | Tiene que ser |
|---|---|
| `Title` | Una línea de texto (recibe `artist_name`, la clave) |
| `KnowledgeTitle`, `spotify_artist`, `review_flag`, `spotify_artist_id`, `image_hash`, `spotify_url`, `image_url` | Una línea de texto |
| `SearchText`, `KnowledgeSummary` | **Varias líneas de texto (sin formato)** |
| `last_checked` | **Una línea de texto** — si la importación la tipa como Fecha, cámbiala: el conector de Sheets la entrega como texto `aaaa-mm-dd` |

Ahora caben en una línea (máx. 98 y 196 caracteres), pero `SearchText` y
`KnowledgeSummary` van a varias líneas igual que en las demás listas: el límite
de 255 corta a media frase sin avisar.

Fuera del CSV a propósito: `photo` (fórmula `=IMAGE`, llega vacía) y
`__PowerAppsId__` (interna de Power Platform).

---

## 1 · Recurrence

| Campo | Valor |
|---|---|
| Repeat every | `1` `Week` |
| On these days | `Monday` |
| Time zone | `(UTC+01:00) Brussels, Copenhagen, Madrid, Paris` |
| At these hours / minutes | `7` / `0` |

## 2 · Sheet_Artistas

*Google Sheets → **Get rows**.*

| Campo | Valor |
|---|---|
| File | `Spotify Artist Photos` |
| Worksheet | `artists` — la **pestaña**, no el fichero |
| Top Count | vacío — **nunca** 5 para probar: la lista se rehace con lo que traiga |
| Settings → Pagination | `On`, `5000` |

## 3 · Select_Artistas

*Data Operation → **Select**.*

| Campo | Valor |
|---|---|
| From | `body('Sheet_Artistas')?['value']` |
| Map | modo **clave / valor** (las dos columnas). **No** cambies a modo texto: el diseñador nuevo lo rechaza, rompe el Select |

Cada valor por el **editor de expresiones**:

| Clave | Valor |
|---|---|
| `Title` | `trim(item()?['artist_name'])` |
| `KnowledgeTitle` | `concat('Foto de artista - ', trim(item()?['artist_name']))` |
| `SearchText` | `toLower(concat(trim(item()?['artist_name']), ' ', trim(item()?['spotify_artist']), ' foto artista artist photo spotify'))` |
| `KnowledgeSummary` | `concat('Foto de Spotify de ', trim(item()?['artist_name']), ' (en Spotify: ', trim(item()?['spotify_artist']), '). image_url: ', item()?['image_url'], '. review_flag: ', if(empty(item()?['review_flag']), 'ninguno', item()?['review_flag']), '.')` |
| `spotify_artist` | `item()?['spotify_artist']` |
| `review_flag` | `item()?['review_flag']` |
| `spotify_artist_id` | `item()?['spotify_artist_id']` |
| `image_hash` | `item()?['image_hash']` |
| `spotify_url` | `item()?['spotify_url']` |
| `image_url` | `item()?['image_url']` |
| `last_checked` | `item()?['last_checked']` |

## 4 · SP_Existentes

*SharePoint → **Get items*** (plural).

| Campo | Valor |
|---|---|
| List Name | `artist_photos_data` |
| Top Count | `5000` |
| Settings → Pagination | `On`, `5000` |

Sin paginación trae 100 y el resto se queda: la lista crece en duplicados cada
semana.

## 5 · Borrar_Todos

*Control → **Apply to each*** → dentro, *SharePoint → **Delete item***.

| Campo | Valor |
|---|---|
| Select an output | `body('SP_Existentes')?['value']` |
| Settings → Concurrency | `On`, `20` |
| Delete item · List Name | `artist_photos_data` |
| Delete item · Id | `items('Borrar_Todos')?['ID']` |

## 6 · Crear_Todos

*Control → **Apply to each*** → dentro, *SharePoint → **Create item***.
**Después** de `Borrar_Todos` (en la vista de código, `runAfter` =
`Borrar_Todos: Succeeded`).

| Campo | Valor |
|---|---|
| Select an output | `body('Select_Artistas')` |
| Settings → Concurrency | `On`, `20` |
| Create item · List Name | `artist_photos_data` |

Mapeo, todo por el editor de expresiones:

| Campo | Expresión |
|---|---|
| `Title` | `items('Crear_Todos')?['Title']` |
| `KnowledgeTitle` | `items('Crear_Todos')?['KnowledgeTitle']` |
| `SearchText` | `items('Crear_Todos')?['SearchText']` |
| `KnowledgeSummary` | `items('Crear_Todos')?['KnowledgeSummary']` |
| `spotify_artist` | `items('Crear_Todos')?['spotify_artist']` |
| `review_flag` | `items('Crear_Todos')?['review_flag']` |
| `spotify_artist_id` | `items('Crear_Todos')?['spotify_artist_id']` |
| `image_hash` | `items('Crear_Todos')?['image_hash']` |
| `spotify_url` | `items('Crear_Todos')?['spotify_url']` |
| `image_url` | `items('Crear_Todos')?['image_url']` |
| `last_checked` | `items('Crear_Todos')?['last_checked']` |

Sin guardianes `empty → null`: todas las columnas son texto.

---

## Probar

1. **Sin** `Top Count` en ningún paso (con 5 en Get rows, la lista acabaría con
   5 filas). Test → Manually.
2. Recuento de la lista = filas de la hoja (N). Ni una más: si hay más,
   `SP_Existentes` no pagina.
3. Añade en la hoja `artist_name` = `TEST-1`. Ejecuta: N+1, y `TEST-1` está.
4. Borra `TEST-1` de la hoja. Ejecuta: N, y `TEST-1` ya no está.

## Por qué no hay Condition antes de borrar

Solo protegería de un Get rows que **funciona y devuelve 0 filas** (alguien
vacía la pestaña). Si Get rows **falla** — pestaña renombrada, conexión
caducada — el flujo se para ahí y la lista queda intacta. En el caso que sí
cubriría, lo que se pierde es la foto de portada hasta el siguiente run, y el
prompt ya trata un deck sin foto como correcto. Los flujos de Meta y TikTok
tampoco la llevan. Si algún día una lista de **campañas** se rehace así, ahí sí:
una lista vacía es "no hay datos" en las respuestas.

## Precio del modelo

Durante el run (1-2 min, lunes 07:00) la lista está vacía o a medias. A esa hora
nadie monta decks. Los `ID` de SharePoint cambian cada semana: nada debe
guardarlos, se busca siempre por `Title`.
