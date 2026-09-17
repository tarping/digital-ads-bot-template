---
name: presentaciones-html
description: >-
  Genera presentaciones HTML autocontenidas (slides 16:9 navegables con teclado,
  exportables a PDF) a partir de datos reales de campañas. Usar cuando el usuario pida una
  presentación, deck, slides, PPT, "algo para presentar", "para enseñar al
  label/equipo/artista", un resumen visual o un one-pager de resultados. El resultado es
  UN archivo HTML completo que el usuario guarda y abre en el navegador. Si piden
  expresamente un PowerPoint editable, ese caso lo cubre el skill presentaciones-pptx, no
  este.
---
# Presentaciones HTML de Resultados

## Qué produce este skill
UN único archivo HTML autocontenido (CSS y JS inline, sin dependencias salvo Google Fonts) que funciona como presentación al abrirlo en cualquier navegador, y que además se imprime a PDF correctamente (una slide por página).

## Antes de generar — confirma 2 cosas (solo si no están claras)
1. **Alcance:** ¿qué artista/release/PM/segmento/período/plataformas debe cubrir?
2. **Modo:** ¿deck para **presentar en vivo** (poca densidad, tipografía grande) o para **enviar y leer** (más denso, slides autoexplicativas)? Por defecto: enviar y leer.
Si el usuario ya dio el contexto, NO preguntes: genera directamente.

## Regla de oro: SOLO DATOS REALES
Todos los números salen del conocimiento consultado en este turno. Nunca inventes cifras, tendencias ni benchmarks. Si falta un dato, la slide muestra "sin dato". Formato europeo siempre: 1.234.567 | €2.500,00 | 2,56%.

---

# 1. BASE TÉCNICA OBLIGATORIA

Copia esta base tal cual en cada deck. No la reinventes.

```css
/* BASE = documento imprimible. Sin JS (conversores a PDF, vistas previas del
   visor de SharePoint/Teams) se ven TODAS las slides apiladas, una por página.
   El modo presentación lo activa la clase .js — ver el bloque JS de abajo. */
html,body{margin:0;background:#000}
.deck-stage{width:1920px;background:var(--bg)}
.slide{position:relative;width:1920px;height:1080px;overflow:hidden;background:var(--bg)}

/* Sin JS en pantalla estrecha (Quick Look del iPhone): que cada slide quepa de
   ancho. `zoom` sí afecta a la maqueta, a diferencia de `transform:scale`, así
   que la altura del documento se ajusta sola. */
@media screen and (max-width:1200px){
  .deck-stage{zoom:calc(100vw / 1920)}
}

/* MODO PRESENTACIÓN (solo con JS) */
.js,.js body{width:100%;height:100%;overflow:hidden}
.js .deck-viewport{position:fixed;inset:0;overflow:hidden;background:#000}
.js .deck-stage{position:absolute;left:0;top:0;height:1080px;
  overflow:hidden;transform-origin:0 0}
.js .slide{position:absolute;inset:0;visibility:hidden;opacity:0;
  pointer-events:none;transition:opacity .45s ease,visibility .45s ease}
.js .slide.active{visibility:visible;opacity:1;pointer-events:auto;z-index:1}

/* Revelado escalonado: delay explícito por elemento, NO nth-child */
.js .reveal{opacity:0;transform:translateY(28px);
  transition:opacity .6s cubic-bezier(.2,.7,.2,1),transform .6s cubic-bezier(.2,.7,.2,1);
  transition-delay:var(--d,0s)}
.js .slide.active .reveal{opacity:1;transform:none}

/* IMPRESIÓN / PDF — una slide por página. OBLIGATORIO. */
/* Sin @page el navegador imprime en Letter/A4 VERTICAL y encaja las slides
   apaisadas dentro: 612x792 pt en vez de 1440x810. Comprobado. */
@page{size:1920px 1080px;margin:0}
@media print{
  html,body,.js,.js body{width:1920px;height:auto;overflow:visible;background:#fff}
  .js .deck-viewport{position:static;overflow:visible}
  .js .deck-stage{position:static;width:auto;height:auto;transform:none!important}
  .js .slide{position:relative;visibility:visible!important;opacity:1!important}
  .slide{width:1920px;height:1080px;break-after:page;page-break-after:always}
  .slide:last-child{break-after:auto}
  .reveal{opacity:1!important;transform:none!important}
  #counter,#hint{display:none!important}
  /* sin esto el PDF pierde los fondos oscuros y el 85/15 sale en blanco */
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition-duration:.01ms!important}}
```

## LOGO EN TODAS LAS SLIDES

**Obligatorio: el logo va en TODAS las slides, sin excepción.** Elige la URL
según el tema del deck — es lo único que cambia entre las dos:

| Tema del deck | URL | Logo |
|---|---|---|
| **Oscuro** (por defecto) | `{{LOGO_URL_FONDO_OSCURO}}` | claro |
| **Claro** (para enviar/imprimir) | `{{LOGO_URL_FONDO_CLARO}}` | oscuro |

```css
.deck-logo{position:absolute;right:56px;bottom:44px;width:77px;height:72px;z-index:5;
  background:url({{LOGO_URL_FONDO_OSCURO}}) no-repeat center/contain}
```

Y dentro de **cada** `.slide`, como último hijo:

```html
<div class="deck-logo" aria-hidden="true"></div>
```

Copia la URL tal cual, entera. No la acortes, no la sustituyas por un `base64`
que te inventes, y no intentes reproducir la imagen de memoria.

**Equivocarse de variante se nota:** un logo claro sobre fondo claro desaparece.
Si cambias el deck de tema
oscuro a claro o al revés, cambia también la URL.

**La esquina inferior derecha es del logo.** Si una slide ya tiene ahí una
etiqueta o un pie, muévelo a la inferior izquierda. Nunca superpongas nada
encima. En la portada puede ir más grande, con `style="width:154px;height:144px"`.
Nunca en gris, ni con opacidad, ni recortado: es una marca.

**Límite conocido:** la imagen se carga por red. En el navegador y al exportar a
PDF desde el navegador se ve; en un deck abierto sin conexión, no. Si algún deck
tiene que sobrevivir sin red, incrusta tú el PNG en base64 al entregarlo — pero
no lo hagas por defecto.

---

Estas dos líneas van en el `<head>`. **Las dos son obligatorias.** Sin el
`viewport`, el móvil asume una página de 980px, `innerWidth` miente y la escala
sale mal. El `script` va antes de pintar nada (al final del `<body>` se ve un
parpadeo con las slides apiladas):

```html
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<script>document.documentElement.classList.add('js')</script>
```

Y este bloque en CSS, para el móvil en vertical — un 16:9 en portrait se queda
al 20% y no se lee:

```css
#rotate{display:none}
@media (orientation:portrait) and (max-width:900px){
  .js #rotate{display:flex;position:fixed;inset:0;z-index:99;background:#000;
    color:#fff;align-items:center;justify-content:center;text-align:center;
    padding:2rem;font:500 1.1rem/1.5 system-ui,sans-serif}
}
```

```html
<div id="rotate">Gira el teléfono para ver la presentación</div>
```

El resto, al final del `<body>`:

```js
function fit(){
  const st=document.querySelector('.deck-stage');
  const k=Math.min(innerWidth/1920,innerHeight/1080);
  st.style.transform=`translate(${(innerWidth-1920*k)/2}px,${(innerHeight-1080*k)/2}px) scale(${k})`;
}
fit();                                  // OBLIGATORIO: sin esto el móvil nunca escala
addEventListener('resize',fit);
addEventListener('orientationchange',()=>setTimeout(fit,100));

// Swipe. Sin esto, en el móvil solo se puede avanzar tocando.
let x0=null;
addEventListener('touchstart',e=>{x0=e.changedTouches[0].clientX},{passive:true});
addEventListener('touchend',e=>{
  if(x0===null)return;
  const dx=e.changedTouches[0].clientX-x0;
  if(Math.abs(dx)>50){dx<0?next():prev()}   // next/prev = las funciones de navegación del deck
  x0=null;
},{passive:true});
```

`fit()` se llama **inmediatamente**, no solo en `resize`. En escritorio el primer
`resize` llega pronto y disimula el fallo; en un móvil no llega nunca, y el
escenario se queda a 1920×1080 dentro de una pantalla de 390px — el usuario ve
la esquina superior izquierda de la primera slide y cree que el deck está roto.

**Invariantes:**
- Lienzo fijo 1920×1080 escalado entero. NUNCA reflow responsivo: puede haber bandas negras, pero la composición no cambia.
- Cambio de slide con `.active` usando `visibility`+`opacity`+`pointer-events`. Nunca `display:none`.
- Navegación: ← → , clic, Espacio, **swipe** en táctil; **F** pantalla completa; contador "03 / 09" discreto.
- Cero librerías. Gráficos con divs + CSS.
- El delay de entrada se pone con `style="--d:.12s"` en cada `.reveal`. Nunca con `:nth-child`, porque cualquier elemento sin `.reveal` desordena la cuenta.
- **El deck se sostiene sin JavaScript.** Todo lo que oculta o posiciona slides va bajo `.js`. Un conversor a PDF o una vista previa que no ejecuta JS debe mostrar el deck entero, apilado y paginado — nunca una página en blanco.
- Para la entrega y el guardado, sigue el apartado 11. No improvises otras instrucciones.

---

# 2. DIRECCIÓN DE ARTE — ESTILO DE LA CASA

Este bot hace reporting recurrente: la consistencia vale más que la variedad. Usa SIEMPRE este sistema, con dos variantes.

**Tema oscuro (por defecto, para presentar):**
```css
--bg:#0B0B0D; --surface:#131317; --line:#24242B;
--ink:#FFFFFF; --dim:#8E8E99;
```
**Tema claro (si piden "para enviar/imprimir"):**
```css
--bg:#FAF8F5; --surface:#FFFFFF; --line:#E2DED8;
--ink:#111113; --dim:#6B6B75;
```

**Constantes en ambos temas:**
```css
--google:#FBBC04; --meta:#4B8DF8; --tiktok:#EE1D52; --spotify:#1DB954; --adstudio:#19E68C;
--ok:#22C55E; --warn:#EAB308; --bad:#F97316; --crit:#EF4444;
```

**Tipografía** — una display con carácter + la misma en pesos bajos. Elige UNA pareja y mantenla en todo el deck:
`Archivo` + `Archivo Narrow` · `Sora` · `Instrument Sans` · `Bricolage Grotesque` · `Manrope`.
Nunca Inter, Roboto, Arial ni fuentes de sistema. Cifras siempre con `font-variant-numeric:tabular-nums`.

**Escala tipográfica (lienzo 1920×1080):**
kicker 26px MAYÚSCULAS `letter-spacing:.28em` · título de slide 82px · cifra héroe 120-200px · cuerpo de tabla 28-32px · leyenda/lectura 26-28px. **Nada por debajo de 22px.**

**Color: regla 85/15.** El 85% de cada slide es neutro. El color de plataforma aparece solo en: la barra o punto de acento de la slide, el relleno de las barras de datos, y los chips de estado. Nunca como fondo saturado ni relleno de tarjetas.

**Fondo:** plano o con UNA textura discreta (rejilla de líneas a 3% de opacidad, o grano). **Prohibidos los gradientes radiales de color difuso** ("resplandores" rojos/azules al 10%): son el tic visual más reconocible de una IA.

---

# 3. ESTRUCTURA DEL DECK

Máximo **9 slides**. Elige entre estos arquetipos y **no repitas el mismo dos veces seguidas**:

1. **Portada** — título enorme (150-200px) a la izquierda, kicker arriba, barra de acento, fecha y alcance abajo. Única slide que puede centrarse. Lleva foto del artista solo en los casos de FOTO DE ARTISTA EN LA PORTADA (más abajo); sin foto es una portada igual de válida.
2. **Veredicto** — SOLO la frase de veredicto a 56-64px, alineada izquierda, máx. 28 palabras. Sin tarjetas, sin cifras sueltas. Su fuerza está en el vacío.
3. **Inversión por plataforma** — barras horizontales ordenadas de mayor a menor, cada una del color de su plataforma, importe al final de la barra, TOTAL destacado aparte. (Preferible a 4 tarjetas: comunica proporción, no solo cifras.)
4. **KPIs** — 3 o 4 cifras héroe con etiqueta pequeña debajo y delta vs benchmark. Nada más.
5. **Detalle de plataforma** — layout asimétrico: izquierda 2-3 métricas grandes; derecha tabla compacta o barras vs benchmark. Barra de acento del color de la plataforma.
6. **Tabla / ranking** — filas separadas por líneas de 1px, sin zebra, cabecera en estilo kicker. Máx. 8 filas.
7. **Funnel Spotify** — Alcance → Clics → Oyentes convertidos → Saves/Playlist adds, con la tasa entre etapas. Es el funnel de Marquee/Showcase: Ad Studio no tiene oyentes convertidos ni intención, así que va en su propia slide de detalle (`--adstudio`), con entrega, coste y —si el objetivo era escucha— streams y oyentes. En la slide de inversión, Marquee/Showcase y Ad Studio son dos barras, nunca una sola de "Spotify".
8. **A revisar / anomalías** — SOLO si el usuario pide que el deck incluya qué revisar. Por defecto no va. Máx. 3 ítems, una línea cada uno, precedidos de un cuadrado de color.
9. **Cierre** — qué funcionó mejor (una línea) + derivación al equipo de digital ads. Pequeño, con aire.

**Reparto por tipo de reporte:** artista/release → portada, veredicto, inversión, una de detalle por plataforma con datos, benchmark, cierre. PM/segmento → portada, veredicto, inversión, tabla de cartera, mejor campaña, cierre. Período → portada, veredicto, inversión + variación, tabla top, cierre. La slide de a revisar/anomalías se añade solo si la piden, antes del cierre.

Si una plataforma no tiene datos, NO le dediques slide: menciónalo en la de inversión.

---

## FOTO DE ARTISTA EN LA PORTADA

Fuente: la herramienta “Spotify Artists Photos” (SharePoint, Get items sobre la lista `artist_photos_data`). Llámala solo aquí, al montar la portada de un deck de un único artista.

La foto va **solo en la portada**, y **solo si el deck trata de UN ÚNICO artista**. Ninguna slide interior lleva foto.

| Tipo de reporte | Portada |
|---|---|
| Artista | con foto |
| Release (un solo artista) | con foto |
| PM · Segmento · Período · Plataforma · Rankings | sin foto |

**Búsqueda:**
1. Busca en `Title` (el nombre del artista) ignorando mayúsculas y acentos ("artista ejemplo" = "Artista Ejemplo"). Si no aparece, prueba `spotify_artist`. Si no devuelve fila, no insistas: portada sin foto.
2. Si `review_flag` = `collab` → **sin foto**: esa fila representa a varios artistas y la imagen es solo de uno.
3. Si hay coincidencia, usa `image_url` tal cual en un `<img>`, sin modificar la URL.

**Si no hay foto** — no está en el catálogo, es `collab`, el deck no es de un solo artista, **o la herramienta falla o viene limitada**: monta la portada con el layout de texto normal. Es una portada válida, no un error.

**Si la herramienta da error o límite de peticiones:** reintenta UNA vez. Si vuelve a fallar, portada de texto y sigue. **No lo cuentes.** En la respuesta no aparece la palabra herramienta, ni "saturada", ni "límite", ni "reintento en un rato", ni ninguna otra explicación de por qué no hay foto: al lector le da igual y convierte un deck correcto en un deck que parece roto. Tampoco ofrezcas reintentar la foto como siguiente paso.

**Degradación obligatoria.** El deck se exporta a PDF con Ctrl/Cmd+P y puede abrirse sin red o con `i.scdn.co` bloqueado. La portada debe verse intencionada aunque la imagen no cargue: nada de marcos vacíos reservados, bordes, fondos de placeholder ni texto alternativo visible. El titular manda; la foto acompaña.

- NUNCA sustituyas por la foto de otro artista, aunque el nombre se parezca.
- NUNCA generes ni busques una imagen fuera de este catálogo.
- Una cara equivocada en una portada de cliente es peor que una portada sin cara.

---

# 4. REGLAS DE DATA-VIZ (críticas)

**El ancho de una barra SIEMPRE es proporcional al valor que representa, sobre el máximo de la serie.**
`width = valor / max(serie) * 100%`. Nunca escales por "ratio contra benchmark" ni por rendimiento: si una campaña con CTR 0,41% tiene la barra más larga que otra con 0,80%, el gráfico miente.

**El benchmark se dibuja como marca de referencia sobre la barra, no como segunda barra:**
```html
<div class="track"><div class="fill" style="width:52%"></div><i class="bench" style="left:31%"></i></div>
```
```css
.track{position:relative;height:38px;background:rgba(255,255,255,.06);border-radius:19px}
.fill{height:100%;border-radius:19px}
.bench{position:absolute;top:-6px;bottom:-6px;width:3px;background:var(--ink);opacity:.75}
```
Y explica la marca en una leyenda: "la línea vertical marca el benchmark".

**Una sola métrica por gráfico.** Si necesitas comparar CTR y CPC, son dos slides o dos bloques separados — nunca dos escalas en el mismo eje.

**Prohibido:** tartas, donuts, 3D, dobles ejes, gridlines marcadas, barras verticales para rankings.

**Leyenda obligatoria** cuando uses chips de color: una línea discreta al pie con el significado (🟢 en línea o mejor · 🟡 ligeramente peor · 🟠 revisar). Un color sin leyenda no comunica.

---

# 5. REGLAS DE TABLA

- **Una celda = un dato.** Prohibidas las celdas compuestas tipo `0,80·1,56` o `€0,07·0,05`. Si necesitas valor y benchmark, son **dos columnas**: "CTR" y "Bench", con el chip de estado en su propia columna estrecha.
- Cabecera en estilo kicker (mayúsculas, pequeña, gris). Números alineados a la derecha con `tabular-nums`. Primera columna en negrita.
- Máx. **8 filas visibles**. Si hay más, muestra las 8 de mayor inversión y añade una línea "y N campañas más con inversión menor de €X" — o parte en dos slides.
- Máx. **6 columnas**. Si necesitas más, la tabla es en realidad dos slides.
- Nunca reduzcas la tipografía por debajo de 26px para que quepa: quita columnas o filas.

---

# 6. PRECISIÓN NUMÉRICA (coherencia)

Fija la precisión por tipo de métrica y respétala en todo el deck:
- Importes de inversión: 2 decimales — €1.234,56
- CPC / coste por resultado / coste por stream: 2 decimales; 3 solo si el valor es menor que €0,01 — €0,21 · €0,022
- Porcentajes: 2 decimales — 2,52%
- Volúmenes (impresiones, clics, streams): sin decimales, con punto de miles — 1.234.567

Nunca mezcles €0,0123 con €750,00 en la misma columna: redondea a la precisión de la columna.

---

# 7. DENSIDAD

**Presentar en vivo:** máx. 3 métricas por slide, sin tablas largas, máx. 25 palabras de texto corrido. Más slides si hace falta.
**Enviar y leer:** tablas y grids permitidos (máx. 8 filas), cada slide autoexplicativa con su línea de "Lectura:" al pie.

Prohibido en ambos: scroll dentro de slides, texto que se sale del lienzo, solapes, más de 4 bloques de información en una slide. Si no cabe, divide.

---

# 8. LISTA NEGRA (lo que delata a una IA)

- Gradientes radiales de color difuso como "atmósfera". Fondos morados/violeta. Glassmorphism.
- **Emojis como iconos de plataforma o decoración dentro de las slides.** El color ya identifica la plataforma; el nombre en texto la nombra. Se permiten solo 🥇🥈🥉 en rankings y ▲▼ en deltas.
- Todo centrado. Por defecto TODO se alinea a la izquierda; centrar solo portada y cierre.
- Tarjetas redondeadas con borde y fondo translúcido repetidas en toda la slide.
- Muros de bullets, sub-bullets, o más de 4 ítems en una lista.
- Títulos de relleno ("Resultados", "Datos", "Como podemos ver…").
- El mismo layout repetido en todas las slides.
- Etiqueta grande y número pequeño: el NÚMERO es el protagonista.

---

# 9. ITERACIÓN

Cuando pidan cambios sobre un deck ya entregado ("fondo claro", "añade TikTok", "quita la slide 3", "actualiza con julio"):
- **Regenera SIEMPRE el archivo HTML COMPLETO.** Nunca fragmentos ni parches.
- **Conserva todo lo no mencionado:** mismos datos, slides y diseño. Cambia solo lo pedido.
- Si el cambio es visual o estructural, NO vuelvas a consultar el conocimiento: reutiliza los datos del deck. Si implica datos nuevos (otra plataforma, otro período), consúltalos antes.
- Si la petición es ambigua ("hazlo más visual"), aplica tu mejor interpretación y di en una línea qué cambiaste.
- Repite la línea de guardado: el archivo anterior queda obsoleto.

---

# 10. CHECKLIST ANTES DE ENTREGAR

- [ ] ¿Todas las cifras salen del conocimiento y van en formato europeo?
- [ ] ¿Máximo 9 slides, sin dos arquetipos iguales seguidos?
- [ ] ¿El ancho de cada barra es proporcional a su valor sobre el máximo de la serie?
- [ ] ¿Ninguna celda contiene dos datos juntos?
- [ ] ¿Los chips de color tienen leyenda?
- [ ] ¿Precisión numérica coherente por columna?
- [ ] ¿Ninguna slide supera 8 filas, 6 columnas o 4 bloques?
- [ ] ¿Cero emojis de plataforma y cero gradientes radiales de color?
- [ ] ¿Funciona con ← → y F, y escala en cualquier ventana?
- [ ] ¿El bloque `@media print` está incluido, **con `@page{size:1920px 1080px}` y `print-color-adjust:exact`**?
- [ ] ¿Está la línea `classList.add('js')` en el `<head>`, y todo lo que oculta slides bajo `.js`?
- [ ] ¿Está el `<meta name="viewport">`, se llama a `fit()` al cargar (no solo en `resize`), y hay swipe y aviso de girar el teléfono?
- [ ] ¿Lleva **todas** las slides el `<div class="deck-logo">`, con la URL que toca según el tema (logo claro en oscuro, oscuro en claro) y sin nada superpuesto en la esquina inferior derecha?
- [ ] Si la portada lleva foto: ¿es de un solo artista, no `collab`, y la slide se sostiene si la imagen no carga?
- [ ] ¿Va el **aviso de descarga** como última línea del mensaje de entrega?

# 11. ENTREGA

El entregable **por defecto** es un deck HTML, entregado **dentro de un `.zip`**.
El PDF sale de ese mismo HTML con Ctrl/Cmd+P, nunca como adjunto. Nunca prometas
.key.

**Excepción — PowerPoint.** Si el usuario pide expresamente un `.pptx`, "un
PowerPoint", algo "editable" o "para meterlo en otro deck", no entregues el HTML
con una disculpa: usa el skill **presentaciones-pptx**, que genera un PowerPoint
nativo y editable con este mismo sistema de diseño, desde el mismo deck spec.
Si no está claro cuál quiere, pregunta UNA vez — no generes los dos por si acaso.

El resto de este apartado es para el deck HTML.

**Vía única — escribe un zip con code interpreter.**

```python
import zipfile
html = """...el documento completo, de <!DOCTYPE html> a </html>..."""
with zipfile.ZipFile("deck-artista-ejemplo-junio.zip", "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("deck-artista-ejemplo-junio.html", html)
```

Nombre: `deck-<artista>-<mes>`, minúsculas, sin acentos ni espacios, con guiones.
Debajo del enlace, UNA línea:

> Descomprímelo y abre el `.html` en el navegador. Flechas para navegar, **F**
> pantalla completa, **Ctrl/Cmd+P → Guardar como PDF** para el PDF (una slide por
> página, orientación horizontal).

**Si te dicen que lo van a ver en el móvil**, añade una segunda línea: que abran
el deck en un ordenador, hagan **Ctrl/Cmd+P → Guardar como PDF** y repartan el
PDF. En iPhone no se puede abrir un `.html` local en Safari ni en Chrome — lo
quitó Apple — y la vista previa de Archivos no ejecuta JavaScript: se ve el deck
apilado y se lee, pero sin navegación. El PDF sí funciona nativamente en
cualquier teléfono. **El deck HTML es un entregable de escritorio; para móvil, el
PDF.**

No repitas el HTML en el chat: el archivo ya está. No expliques el código.

**Por qué el zip y no el `.html` suelto.** Probado y falla: la app intenta *abrir*
el `.html` en el navegador en vez de descargarlo, y en ese salto rompe la firma
de la URL de almacenamiento — el usuario acaba en una página de error XML
(`AuthenticationFailed`), no en el deck. Un zip no se puede renderizar, así que
se descarga siempre, y preserva el nombre y la extensión de lo que lleva dentro.
**No entregues nunca un `.html` suelto**, aunque parezca más cómodo.

**Solo sin code interpreter**, bloque de código etiquetado `html` con las
instrucciones **ANTES** del bloque, nunca debajo — si van debajo, el usuario ya
pulsó descargar y ya cree que el deck está roto:

> Aquí tienes el deck. **Se descarga como `.txt`; hay que renombrarlo a `.html`
> antes de abrirlo.** Es normal, el archivo está entero.
>
> **Windows** — ábrelo con el Bloc de notas › Archivo › Guardar como › en "Tipo"
> elige **Todos los archivos** › nómbralo `deck-<artista>-<mes>.html` › Guardar.
> (Así no necesitas ver las extensiones en el Explorador.)
>
> **Mac** — en Finder, renómbralo cambiando `.txt` por `.html` y confirma
> **"Usar .html"**.

**Nunca vuelvas a generar el deck porque la descarga falle.** No es un fallo del
HTML y regenerarlo no cambia nada.

## AVISO DE DESCARGA Y ENLACE — VAN SIEMPRE

El prompt manda (ENTREGA DE ARCHIVOS: AVISO DE DESCARGA). Resumen: el mensaje de
entrega TERMINA con el aviso destacado y, si tienes la URL https del archivo,
con esa URL en un bloque de código y cada "+" sustituido por "%2B":

> ⚠️ **¿El botón de descarga te da error?** Haz clic derecho en el botón →
> **Copiar la dirección del enlace** → pégala en la barra del navegador. El
> archivo está perfecto: es un fallo conocido del enlace de descarga, no del
> documento.

Enlace directo (cópialo y pégalo en la barra del navegador):

```
https://...la URL del archivo, con %2B en lugar de +...
```

En TODAS las entregas. No lo reformules, no lo pongas antes del enlace, no lo
omitas por brevedad. Una ruta sandbox:/ o /mnt/data/ no se escribe. **Nunca
regeneres el archivo por un fallo de descarga**: el archivo no tiene nada que
ver. El fallo es la firma del enlace: lleva un `+` que el navegador convierte en
espacio, y ocurre al azar en más o menos la mitad de los archivos.

