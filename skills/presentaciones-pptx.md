---
name: presentaciones-pptx
description: >-
  Genera un PowerPoint nativo y editable (.pptx) con los resultados de campañas, con el
  mismo diseño que el deck HTML. Usar SOLO cuando el usuario pida explícitamente
  PowerPoint, .pptx, "editable", "para que lo toquen ellos" o "para meterlo en otro deck".
  Para todo lo demás, el entregable sigue siendo el deck HTML del skill
  presentaciones-html.
---

# PRESENTACIONES PPTX

## 0. CUÁNDO USAR ESTE SKILL Y CUÁNDO NO

El entregable por defecto de este bot **sigue siendo el deck HTML**. Este skill
es la excepción, no el sustituto.

| El usuario pide | Entrega |
|---|---|
| "una presentación", "un deck", "slides", "algo para enseñar" | **HTML** (skill presentaciones-html) |
| "un PDF" | HTML + la línea de Ctrl/Cmd+P |
| **"un PowerPoint", ".pptx", "editable", "para que lo toquen ellos", "para meterlo en el deck de la reunión"** | **PPTX** (este skill) |
| "las dos cosas" | Genera el HTML y el PPTX del MISMO spec, y entrega los dos archivos |

Si dudas, pregunta UNA vez: "¿lo quieres como deck HTML o como PowerPoint
editable?". No generes los dos por si acaso.

**Por qué importa la diferencia.** El HTML se presenta y se convierte a PDF con
un atajo; el PPTX existe para que alguien edite una cifra o se lleve una slide a
otra presentación. Son usos distintos, no formatos intercambiables.

---

## 1. CÓMO FUNCIONA

No conviertas el HTML. Los dos formatos salen del MISMO sitio: un **deck spec**
en JSON que describe el deck sin decir cómo se dibuja.

```
        deck spec (JSON)
              |
   +----------+----------+
   |                     |
  HTML                  PPTX
(presentaciones-html)  (este skill)
```

El proceso, en orden:

1. Consulta los datos en el conocimiento, como en cualquier reporte.
2. Construye el **deck spec** (apartado 2).
3. Escribe `render_pptx.py` en el code interpreter, tal cual está en el
   apartado 4. **No lo reescribas ni lo resumas**: cópialo entero.
4. Escribe el spec a `spec.json`, ejecuta el renderer y entrega el `.pptx`.

El renderer no necesita red, ni navegador, ni LibreOffice. Solo `python-pptx`,
que ya está disponible.

---

## 2. EL DECK SPEC

```json
{
  "meta": {
    "tema": "oscuro",
    "sin_cifras_economicas": false,
    "foto_artista": "/mnt/data/artista.jpg",
    "logo_path": "/mnt/data/logo.png"
  },
  "slides": [ ... ]
}
```

### `meta`

| campo | valores | qué hace |
|---|---|---|
| `tema` | `"oscuro"` (por defecto) · `"claro"` | mismos tokens que el skill HTML |
| `sin_cifras_economicas` | `true` / `false` | **modo dirección**: ver abajo |
| `foto_artista` | ruta local | solo portada, solo si el deck es de UN artista |
| `logo_path` | ruta local | logo en todas las slides |

**`sin_cifras_economicas: true`** — el renderer **elimina** toda métrica marcada
`"money": true` y la columna entera en las tablas. No la tacha ni la deja en
blanco: la quita. Lo hace el código, no tú, así que no depende de que te
acuerdes de omitirla. Lo que queda es eficiencia relativa: posición contra el
benchmark, semáforo y distancia porcentual.

### Los nueve arquetipos

Máximo 9 slides, y **no repitas el mismo dos veces seguidas** (el renderer avisa
si lo haces). Todos aceptan `kicker`, `titulo` y `plataforma`; `plataforma`
tiñe la barra de acento y vale `google` · `meta` · `tiktok` · `spotify` ·
`adstudio`.

```json
{"tipo": "portada",   "kicker": "Informe de campaña", "titulo": "Artista Ejemplo\nSingle Ejemplo",
 "pie": "Spotify Ad Studio · Junio–Agosto 2026", "plataforma": "adstudio"}

{"tipo": "veredicto", "texto": "Máx. 28 palabras. Su fuerza está en el vacío.",
 "plataforma": "adstudio"}

{"tipo": "inversion", "titulo": "Inversión por plataforma",
 "items": [{"label": "Meta", "valor": 8400, "plataforma": "meta"}]}

{"tipo": "kpis", "titulo": "Resultados",
 "metricas": [{"label": "Streams", "valor": 250000, "formato": "volumen"},
              {"label": "CTR", "valor": 0.0045, "formato": "porcentaje",
               "benchmark": 0.0055, "mejor": "alto"},
              {"label": "Inversión", "valor": 2000, "formato": "importe",
               "money": true}]}

{"tipo": "barras", "titulo": "CTR por formato", "formato": "porcentaje",
 "benchmark": 0.0055, "mejor": "alto",
 "series": [{"label": "Video", "valor": 0.03}]}

{"tipo": "tabla", "titulo": "Campañas",
 "columnas": [{"label": "Campaña", "campo": "c"},
              {"label": "Inversión", "campo": "g", "formato": "importe", "money": true},
              {"label": "CTR", "campo": "ctr", "formato": "porcentaje",
               "benchmark": 0.0055, "mejor": "alto"}],
 "filas": [{"c": "Single Ejemplo", "g": 2000, "ctr": 0.0045}]}

{"tipo": "funnel", "titulo": "Embudo de conversión",
 "etapas": [{"label": "Alcance", "valor": 800000, "formato": "volumen"},
            {"label": "Clics", "valor": 15000, "formato": "volumen"}]}

{"tipo": "anomalias", "titulo": "A revisar",
 "items": [{"nivel": "bad", "texto": "Una línea, máximo tres ítems."}]}

{"tipo": "cierre", "titulo": "Qué funcionó",
 "puntos": ["Qué funcionó, con el dato.",
            "Si quieres arrancar otra fase, habla con el equipo de Digital Ads."]}
```

**`anomalias` va SOLO si el usuario pide que el deck incluya qué revisar.** Por
defecto el spec no lleva esa slide.

Límites que el renderer aplica solo: `kpis` máx. 4 métricas · `tabla` máx. 8
filas y 6 columnas (y escribe "y N campañas más" con el resto) · `anomalias`
máx. 3 ítems · `cierre` máx. 3 puntos. No los fuerces: si no cabe, divide en dos
slides.

`nivel` en anomalías: `ok` · `warn` · `bad` · `crit`.

### Formatos de número

| `formato` | entra | sale |
|---|---|---|
| `volumen` | 1234567 | `1.234.567` |
| `importe` | 1234.56 | `€1.234,56` |
| `coste` | 0.022 | `€0,022` (3 decimales por debajo de €0,10; si no, 2) |
| `porcentaje` | 0.0252 | `2,52%` |
| `ratio` | 1.797229 | `1,80` |

**Los porcentajes entran SIEMPRE en decimal**, igual que en las listas de
SharePoint: `0.004121` es 0,41%. Si le pasas `0.41` creyendo que son "0,41%",
saldrá 41%.

### Benchmark y semáforo

`benchmark` + `mejor` activan el color y el delta:

- `"mejor": "alto"` → CTR, streams, tasa de conversión: más es mejor.
- `"mejor": "bajo"` → CPC, coste por stream, coste por lead: menos es mejor.

**Empate = verde.** Cumplir el benchmark es cumplirlo.

**Sin benchmark, sin semáforo.** Si la métrica no tiene referencia en el dato,
no pongas `benchmark`: el renderer la muestra sin color. Nunca inventes una, ni
uses el propio valor de la fila como su referencia — si el dato trae un
benchmark idéntico al valor, omítelo del spec; si la slide de anomalías va
(solo cuando la piden), menciónalo ahí.

### Un valor ausente NO es cero

`null` sale como **"sin dato"**. Un 0 sale como 0. Un alcance que no llegó no es
un alcance de cero, y la diferencia cambia cualquier media.

---

## 3. LOGO Y FOTO DE ARTISTA

El logo va en TODAS las slides, como en el deck HTML. `python-pptx` no descarga
URLs y el code interpreter no tiene red, así que hay que escribir el PNG a disco
primero:

```python
import base64, pathlib
LOGO_OSCURO_B64 = "<<< PEGAR AQUÍ EL BASE64 DEL PNG DEL LOGO PARA FONDO OSCURO >>>"
LOGO_CLARO_B64  = "<<< PEGAR AQUÍ EL BASE64 DEL PNG DEL LOGO PARA FONDO CLARO >>>"

b64 = LOGO_OSCURO_B64 if spec["meta"].get("tema","oscuro") == "oscuro" else LOGO_CLARO_B64
pathlib.Path("/mnt/data/logo.png").write_bytes(base64.b64decode(b64))
spec["meta"]["logo_path"] = "/mnt/data/logo.png"
```

**Tema oscuro → logo CLARO. Tema claro → logo OSCURO.** Un logo claro sobre
fondo claro desaparece.

La foto del artista, si la hay, se descarga igual y va solo en la portada, solo
si el deck trata de un único artista, y nunca si `review_flag = collab`.

**Si falta el logo o la foto, el renderer sigue y la slide queda limpia** — sin
marco vacío, sin placeholder, sin texto alternativo. No lo expliques en la
respuesta: un deck sin foto es un deck correcto.

---

## 4. EL RENDERER

Escríbelo tal cual a `render_pptx.py`. **Cópialo entero y sin cambios.** Si
modificas los tokens aquí y no en el skill de HTML, el mismo deck se verá
distinto en cada formato y se nota a la primera.

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Convierte un deck spec en un PPTX nativo y editable.

No convierte el HTML: vuelve a dibujar desde el mismo spec con python-pptx, así
que cada barra, cifra y celda es un objeto real de PowerPoint que se puede
editar. Sin imágenes de diapositiva.

    python3 render_pptx.py spec.json salida.pptx

Solo necesita python-pptx. Sin navegador, sin LibreOffice, sin red. Funciona tal
cual en el code interpreter de Copilot Studio (Python 3.12, pptx disponible).

El sistema de diseño replica el apartado 2 de presentaciones-html.md. Si ese
fichero cambia, cambia TEMAS / TIPO aquí o el mismo deck se verá distinto en cada
formato.
"""
import json
import sys

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Emu, Pt

# --------------------------------------------------------------------------
#  CANVAS
#
#  El lienzo del skill es 1920x1080 px. Un PPTX 16:9 mide 13,333 x 7,5 in.
#  1 px = 6350 EMU exactos, y 1 px = 0,5 pt. Así que todas las medidas de abajo
#  van en los MISMOS px que el CSS y se convierten aquí. Mantenlo así: en cuanto
#  empiezas a escribir pulgadas, los dos renderers se desalinean.
# --------------------------------------------------------------------------
ANCHO_PX, ALTO_PX = 1920, 1080
EMU_POR_PX = 6350


def PX(n):
    return Emu(int(round(n * EMU_POR_PX)))


def PT(px):
    """Escala tipográfica: título de 82px -> 41pt. Nunca por debajo de 22px (11pt), apartado 2."""
    return Pt(max(px * 0.5, 11))


def hex_a_rgb(h):
    h = h.lstrip('#')
    return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


# --------------------------------------------------------------------------
#  TOKENS  (apartado 2 de presentaciones-html.md, literal)
# --------------------------------------------------------------------------
TEMAS = {
    'oscuro': {'bg': '#0B0B0D', 'surface': '#131317', 'line': '#24242B',
               'ink': '#FFFFFF', 'dim': '#8E8E99'},
    'claro':  {'bg': '#FAF8F5', 'surface': '#FFFFFF', 'line': '#E2DED8',
               'ink': '#111113', 'dim': '#6B6B75'},
}

PLATAFORMA = {
    'google': '#FBBC04', 'meta': '#4B8DF8', 'tiktok': '#EE1D52',
    'spotify': '#1DB954', 'adstudio': '#19E68C',
}

ESTADO = {'ok': '#22C55E', 'warn': '#EAB308', 'bad': '#F97316', 'crit': '#EF4444'}

# El skill define cuatro colores de estado, pero su leyenda nombra tres chips:
# "en línea o mejor / ligeramente peor / revisar". Estos umbrales son del
# renderer, no del skill: ajústalos aquí si quieres otra sensibilidad.
# crit queda reservado para el arquetipo de anomalías.
UMBRAL_WARN = 0.15   # hasta un 15% peor que el benchmark -> amarillo
UMBRAL_BAD = 0.40    # más allá -> naranja

LEYENDA = ('la línea vertical marca el benchmark  ·  '
           'verde en línea o mejor  ·  amarillo ligeramente peor  ·  naranja revisar')

# El apartado 2 prohíbe Inter, Roboto, Arial y las fuentes de sistema. Elige UNA
# de las permitidas y mantenla en todo el deck.
# OJO: PowerPoint sustituye cualquier fuente que quien abre no tenga instalada.
# Si los destinatarios no tienen Archivo, instálala o cambia a una familia que
# sí tengan -- de la lista permitida, nunca Arial.
FUENTE = 'Archivo'

# Escala tipográfica, en px de CSS (apartado 2)
TIPO = {'kicker': 26, 'titulo': 82, 'heroe': 120, 'heroe_xl': 200,
        'tabla': 30, 'leyenda': 26, 'cuerpo': 32, 'veredicto': 60}

MARGEN = 120          # px
LOGO_W, LOGO_H = 77, 72
LOGO_R, LOGO_B = 56, 44


# --------------------------------------------------------------------------
#  NÚMEROS  (apartado 6 -- precisión fija por tipo de métrica)
# --------------------------------------------------------------------------
def _miles(n):
    return '{:,}'.format(n).replace(',', '.')


def _dec(v, n):
    return ('%.*f' % (n, v)).replace('.', ',')


# El apartado 6 del skill dice "3 decimales solo por debajo de €0,01" pero pone
# €0,022 como ejemplo del caso de 3 decimales -- 0,022 no está por debajo de
# 0,01, así que regla y ejemplo no cuadran. €0,10 cumple los dos (€0,21 -> 2,
# €0,022 -> 3) y es lo que pide el dato: un coste por stream de 0,056 con el
# umbral en €0,01 se redondearía a €0,06 y perdería el dígito que importa.
UMBRAL_3_DEC = 0.10


def formatea(valor, formato):
    """Un valor ausente NO es cero. Sale como 'sin dato'."""
    if valor is None or valor == '':
        return 'sin dato'
    try:
        v = float(valor)
    except (TypeError, ValueError):
        return str(valor)

    if formato == 'volumen':                       # 1.234.567
        return _miles(int(round(v)))
    if formato == 'importe':                       # €1.234,56
        entero, resto = divmod(abs(v), 1)
        s = _miles(int(entero)) + ',' + ('%.2f' % resto)[2:]
        return ('-' if v < 0 else '') + '€' + s
    if formato == 'coste':                         # €0,21 · €0,022
        return '€' + _dec(v, 3 if abs(v) < UMBRAL_3_DEC else 2)
    if formato == 'porcentaje':                    # entra decimal -> 2,52%
        return _dec(v * 100, 2) + '%'
    if formato == 'ratio':                         # 1,80
        return _dec(v, 2)
    return str(valor)


def evalua(valor, benchmark, mejor='alto'):
    """(color, texto del delta) contra el benchmark.

    Empate = verde. Cumplir el benchmark es cumplirlo; pintarlo de rojo castiga
    a una campaña que hizo justo lo que se le pedía.

    Sin valor o sin benchmark no hay comparación: sin color, sin texto. Nunca se
    inventa un cero para poder comparar algo.
    """
    if valor is None or valor == '' or benchmark in (None, '', 0):
        return None, ''
    try:
        v, b = float(valor), float(benchmark)
    except (TypeError, ValueError):
        return None, ''

    rel = (v - b) / abs(b)
    if mejor == 'bajo':
        rel = -rel

    if rel >= 0:
        clave = 'ok'
    elif abs(rel) <= UMBRAL_WARN:
        clave = 'warn'
    elif abs(rel) <= UMBRAL_BAD:
        clave = 'bad'
    else:
        clave = 'bad'

    flecha = '▲' if rel >= 0 else '▼'
    # RGBColor, no un hex: va directo a font.color.rgb en la tabla, que no
    # acepta otra cosa.
    return hex_a_rgb(ESTADO[clave]), '%s %s%%' % (flecha, _dec(abs(rel) * 100, 1))


# --------------------------------------------------------------------------
#  PRIMITIVES
# --------------------------------------------------------------------------
class Lienzo(object):
    def __init__(self, slide, tema):
        self.s = slide
        self.t = tema

    def color(self, nombre_o_hex):
        if nombre_o_hex in self.t:
            return hex_a_rgb(self.t[nombre_o_hex])
        if nombre_o_hex in PLATAFORMA:
            return hex_a_rgb(PLATAFORMA[nombre_o_hex])
        if nombre_o_hex in ESTADO:
            return hex_a_rgb(ESTADO[nombre_o_hex])
        return hex_a_rgb(nombre_o_hex)

    def rect(self, x, y, w, h, color, forma=MSO_SHAPE.RECTANGLE):
        sh = self.s.shapes.add_shape(forma, PX(x), PX(y), PX(w), PX(h))
        sh.fill.solid()
        sh.fill.fore_color.rgb = color if isinstance(color, RGBColor) else self.color(color)
        sh.line.fill.background()
        sh.shadow.inherit = False
        return sh

    def texto(self, x, y, w, h, contenido, px=32, color='ink', negrita=False,
              alineacion=PP_ALIGN.LEFT, interlineado=1.15, espaciado=None,
              mayusculas=False):
        caja = self.s.shapes.add_textbox(PX(x), PX(y), PX(w), PX(h))
        tf = caja.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        tf.vertical_anchor = MSO_ANCHOR.TOP
        p = tf.paragraphs[0]
        p.alignment = alineacion
        p.line_spacing = interlineado
        r = p.add_run()
        r.text = str(contenido).upper() if mayusculas else str(contenido)
        f = r.font
        f.size = PT(px)
        f.bold = negrita
        f.name = FUENTE
        f.color.rgb = color if isinstance(color, RGBColor) else self.color(color)
        if espaciado:
            # letter-spacing: .28em en el kicker
            from pptx.oxml.ns import qn
            f._rPr.set(qn('w:spacing'), str(int(espaciado)))
        return caja

    def kicker(self, x, y, w, contenido):
        return self.texto(x, y, w, 40, contenido, px=TIPO['kicker'], color='dim',
                          mayusculas=True, negrita=True)

    def barra_acento(self, x, y, color, ancho=160, alto=8):
        return self.rect(x, y, ancho, alto, color)


def fondo(slide, tema):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = hex_a_rgb(tema['bg'])


def logo(lienzo, meta, grande=False):
    """La esquina inferior derecha es del logo. Apartado 1 del skill.

    python-pptx no descarga URLs y el code interpreter no tiene red, así que el
    spec tiene que llevar una ruta local. Si no la hay, la slide sigue siendo
    válida -- sin placeholder ni marco vacío (la regla de degradación
    obligatoria de la foto de artista también vale aquí).
    """
    ruta = meta.get('logo_path')
    if not ruta:
        return
    w, h = (LOGO_W * 2, LOGO_H * 2) if grande else (LOGO_W, LOGO_H)
    try:
        lienzo.s.shapes.add_picture(
            ruta, PX(ANCHO_PX - LOGO_R - w), PX(ALTO_PX - LOGO_B - h), PX(w), PX(h))
    except Exception:
        pass


def cabecera(lienzo, spec, meta):
    """Kicker + título de 82px + barra de acento. Todo alineado a la izquierda (apartado 8)."""
    y = MARGEN
    if spec.get('kicker'):
        lienzo.kicker(MARGEN, y, 1400, spec['kicker'])
        y += 52
    lienzo.texto(MARGEN, y, ANCHO_PX - MARGEN * 2, 120, spec.get('titulo', ''),
                 px=TIPO['titulo'], negrita=True, interlineado=1.0)
    color = spec.get('plataforma', 'spotify')
    lienzo.barra_acento(MARGEN, y + 130, color)
    return y + 200


def leyenda(lienzo, texto_=LEYENDA):
    lienzo.texto(MARGEN, ALTO_PX - 96, 1500, 40, texto_,
                 px=TIPO['leyenda'], color='dim')


# --------------------------------------------------------------------------
#  ARQUETIPOS  (apartado 3)
# --------------------------------------------------------------------------
def a_portada(prs, spec, meta, tema):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    fondo(s, tema)
    c = Lienzo(s, tema)

    foto = meta.get('foto_artista')
    ancho_texto = ANCHO_PX - MARGEN * 2
    if foto:
        # Tercio derecho, a sangre. Si no carga, la portada sigue siendo
        # válida -- nunca un marco vacío reservado.
        fw = int(ANCHO_PX * 0.36)
        try:
            s.shapes.add_picture(foto, PX(ANCHO_PX - fw), 0, PX(fw), PX(ALTO_PX))
            ancho_texto = ANCHO_PX - fw - MARGEN * 2
        except Exception:
            pass

    if spec.get('kicker'):
        c.kicker(MARGEN, 360, ancho_texto, spec['kicker'])
    c.barra_acento(MARGEN, 430, spec.get('plataforma', 'spotify'), ancho=200, alto=10)
    c.texto(MARGEN, 470, ancho_texto, 420, spec.get('titulo', ''),
            px=TIPO['heroe_xl'] * 0.8, negrita=True, interlineado=0.95)
    if spec.get('pie'):
        c.texto(MARGEN, ALTO_PX - 200, ancho_texto, 60, spec['pie'],
                px=TIPO['leyenda'], color='dim')
    logo(c, meta, grande=True)
    return s


def a_veredicto(prs, spec, meta, tema):
    """Solo la frase de veredicto. Su fuerza está en el vacío."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    fondo(s, tema)
    c = Lienzo(s, tema)
    c.barra_acento(MARGEN, 300, spec.get('plataforma', 'spotify'), ancho=200, alto=10)
    c.texto(MARGEN, 360, ANCHO_PX - MARGEN * 2 - 200, 500,
            spec.get('texto', ''), px=TIPO['veredicto'], negrita=True,
            interlineado=1.2)
    logo(c, meta)
    return s


def a_inversion(prs, spec, meta, tema):
    """Barras horizontales, de mayor a menor, cada una del color de su plataforma."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    fondo(s, tema)
    c = Lienzo(s, tema)
    y = cabecera(c, spec, meta)

    if meta.get('sin_cifras_economicas'):
        c.texto(MARGEN, y + 40, 1500, 80,
                'Reparto de inversión no disponible en esta versión.',
                px=TIPO['cuerpo'], color='dim')
        logo(c, meta)
        return s

    items = [x for x in spec.get('items', []) if x.get('valor') is not None]
    items.sort(key=lambda x: float(x['valor']), reverse=True)
    if not items:
        logo(c, meta)
        return s

    maximo = max(float(x['valor']) for x in items) or 1.0
    x_et, w_et = MARGEN, 420
    x_bar = x_et + w_et
    w_pista = ANCHO_PX - MARGEN - x_bar - 420
    alto, paso = 56, 92

    for i, it in enumerate(items):
        yy = y + 30 + paso * i
        v = float(it['valor'])
        c.texto(x_et, yy + 10, w_et - 40, 50, it.get('label', ''),
                px=TIPO['tabla'], alineacion=PP_ALIGN.RIGHT)
        c.rect(x_bar, yy, w_pista, alto, 'line')
        c.rect(x_bar, yy, max(w_pista * (v / maximo), 2), alto,
               it.get('plataforma', 'spotify'))
        c.texto(x_bar + w_pista + 32, yy + 8, 380, 50,
                formatea(v, 'importe'), px=TIPO['tabla'], negrita=True)

    total = sum(float(x['valor']) for x in items)
    c.texto(MARGEN, ALTO_PX - 210, 900, 50, 'TOTAL', px=TIPO['kicker'],
            color='dim', mayusculas=True, negrita=True)
    c.texto(MARGEN, ALTO_PX - 170, 900, 90, formatea(total, 'importe'),
            px=TIPO['heroe'] * 0.55, negrita=True)
    logo(c, meta)
    return s


def a_kpis(prs, spec, meta, tema):
    """3 o 4 cifras héroe, etiqueta pequeña DEBAJO, delta vs benchmark. Nada más."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    fondo(s, tema)
    c = Lienzo(s, tema)
    y = cabecera(c, spec, meta)

    metricas = [m for m in spec.get('metricas', [])
                if not (meta.get('sin_cifras_economicas') and m.get('money'))]
    metricas = metricas[:4]
    if not metricas:
        logo(c, meta)
        return s

    n = len(metricas)
    hueco = 48
    ancho = (ANCHO_PX - MARGEN * 2 - hueco * (n - 1)) // n
    px_cifra = TIPO['heroe'] if n <= 3 else TIPO['heroe'] * 0.75

    for i, m in enumerate(metricas):
        x = MARGEN + (ancho + hueco) * i
        yy = y + 60
        # El NÚMERO es el protagonista; la etiqueta va pequeña, debajo.
        c.texto(x, yy, ancho, 200, formatea(m.get('valor'), m.get('formato', 'volumen')),
                px=px_cifra, negrita=True, interlineado=0.95)
        c.texto(x, yy + 190, ancho, 50, m.get('label', ''),
                px=TIPO['kicker'], color='dim', mayusculas=True, negrita=True)
        color, delta = evalua(m.get('valor'), m.get('benchmark'), m.get('mejor', 'alto'))
        if delta:
            c.texto(x, yy + 248, ancho, 46, delta + ' vs bench',
                    px=TIPO['leyenda'], color=color, negrita=True)
    logo(c, meta)
    return s


def a_barras(prs, spec, meta, tema):
    """ancho = valor / max(serie). NUNCA escalado por ratio contra benchmark."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    fondo(s, tema)
    c = Lienzo(s, tema)
    y = cabecera(c, spec, meta)

    serie = [x for x in spec.get('series', []) if x.get('valor') is not None]
    if not serie:
        c.texto(MARGEN, y + 40, 1400, 70, 'Sin datos para este corte.',
                px=TIPO['cuerpo'], color='dim')
        logo(c, meta)
        return s

    fmt = spec.get('formato', 'porcentaje')
    bench = spec.get('benchmark')
    mejor = spec.get('mejor', 'alto')
    maximo = max(float(x['valor']) for x in serie) or 1.0

    x_et, w_et = MARGEN, 480
    x_bar = x_et + w_et
    w_pista = ANCHO_PX - MARGEN - x_bar - 360
    alto, paso = 38, 86

    if bench is not None:
        bx = x_bar + w_pista * min(float(bench) / maximo, 1.0)
        c.rect(bx, y + 18, 3, paso * len(serie) - 20, 'ink')

    for i, it in enumerate(serie):
        yy = y + 30 + paso * i
        v = float(it['valor'])
        color, _ = evalua(v, bench, mejor)
        c.texto(x_et, yy - 4, w_et - 40, 50, it.get('label', ''),
                px=TIPO['tabla'], alineacion=PP_ALIGN.RIGHT)
        c.rect(x_bar, yy, w_pista, alto, 'line')
        c.rect(x_bar, yy, max(w_pista * (v / maximo), 2), alto,
               color or c.color(spec.get('plataforma', 'spotify')))
        c.texto(x_bar + w_pista + 28, yy - 4, 320, 50, formatea(v, fmt),
                px=TIPO['tabla'], negrita=True)

    leyenda(c)
    logo(c, meta)
    return s


def a_tabla(prs, spec, meta, tema):
    """Máx. 8 filas, máx. 6 columnas, un dato por celda (apartado 5)."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    fondo(s, tema)
    c = Lienzo(s, tema)
    y = cabecera(c, spec, meta)

    cols = [x for x in spec.get('columnas', [])
            if not (meta.get('sin_cifras_economicas') and x.get('money'))][:6]
    filas = spec.get('filas', [])
    resto = max(len(filas) - 8, 0)
    filas = filas[:8]
    if not cols or not filas:
        logo(c, meta)
        return s

    alto_fila = 62
    tabla = s.shapes.add_table(
        len(filas) + 1, len(cols), PX(MARGEN), PX(y + 20),
        PX(ANCHO_PX - MARGEN * 2), PX(alto_fila * (len(filas) + 1))).table
    tabla.first_row = False

    def pinta(celda, txt, px, color, negrita=False, derecha=False):
        celda.text = txt
        celda.margin_left = celda.margin_right = PX(16)
        celda.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = celda.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.RIGHT if derecha else PP_ALIGN.LEFT
        r = p.runs[0]
        r.font.size = PT(px)
        r.font.bold = negrita
        r.font.name = FUENTE
        r.font.color.rgb = color
        celda.fill.solid()
        celda.fill.fore_color.rgb = hex_a_rgb(tema['bg'])

    for j, col in enumerate(cols):
        pinta(tabla.cell(0, j), str(col.get('label', '')).upper(), TIPO['kicker'],
              hex_a_rgb(tema['dim']), negrita=True,
              derecha=bool(col.get('formato')))

    for i, fila in enumerate(filas, start=1):
        for j, col in enumerate(cols):
            v = fila.get(col.get('campo'))
            txt = formatea(v, col['formato']) if col.get('formato') else \
                ('sin dato' if v in (None, '') else str(v))
            color = hex_a_rgb(tema['ink'])
            if col.get('benchmark') is not None:
                cc, _ = evalua(v, col['benchmark'], col.get('mejor', 'alto'))
                color = cc or color
            pinta(tabla.cell(i, j), txt, TIPO['tabla'], color,
                  negrita=(j == 0), derecha=bool(col.get('formato')))

    if resto:
        c.texto(MARGEN, ALTO_PX - 150, 1500, 46,
                'y %d campañas más con inversión menor' % resto,
                px=TIPO['leyenda'], color='dim')
    logo(c, meta)
    return s


def a_funnel(prs, spec, meta, tema):
    """Alcance -> Clics -> Oyentes convertidos -> Saves, con la tasa entre etapas."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    fondo(s, tema)
    c = Lienzo(s, tema)
    y = cabecera(c, spec, meta)

    etapas = [e for e in spec.get('etapas', [])]
    if not etapas:
        logo(c, meta)
        return s

    n = len(etapas)
    hueco = 40
    ancho = (ANCHO_PX - MARGEN * 2 - hueco * (n - 1)) // n
    color = spec.get('plataforma', 'spotify')

    for i, e in enumerate(etapas):
        x = MARGEN + (ancho + hueco) * i
        yy = y + 70
        c.rect(x, yy, ancho, 8, color if i == 0 else 'line')
        c.texto(x, yy + 36, ancho, 140, formatea(e.get('valor'), e.get('formato', 'volumen')),
                px=TIPO['heroe'] * 0.62, negrita=True, interlineado=0.95)
        c.texto(x, yy + 170, ancho, 46, e.get('label', ''),
                px=TIPO['kicker'], color='dim', mayusculas=True, negrita=True)
        # tasa de conversión entre esta etapa y la anterior
        if i > 0:
            prev = etapas[i - 1].get('valor')
            v = e.get('valor')
            if prev not in (None, '', 0) and v not in (None, ''):
                tasa = float(v) / float(prev)
                c.texto(x - hueco - 10, yy + 60, hueco + 20, 46,
                        formatea(tasa, 'porcentaje'), px=TIPO['leyenda'],
                        color='dim', alineacion=PP_ALIGN.CENTER)
    logo(c, meta)
    return s


def a_anomalias(prs, spec, meta, tema):
    """Máx. 3 ítems, una línea cada uno, precedidos de un cuadrado de color."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    fondo(s, tema)
    c = Lienzo(s, tema)
    y = cabecera(c, spec, meta)

    for i, it in enumerate(spec.get('items', [])[:3]):
        yy = y + 60 + i * 130
        c.rect(MARGEN, yy + 12, 28, 28, it.get('nivel', 'warn'))
        c.texto(MARGEN + 56, yy, ANCHO_PX - MARGEN * 2 - 56, 100,
                it.get('texto', ''), px=TIPO['cuerpo'], interlineado=1.3)
    logo(c, meta)
    return s


def a_cierre(prs, spec, meta, tema):
    """Qué funcionó (una línea) + derivación al equipo de digital ads. Pequeño, con aire."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    fondo(s, tema)
    c = Lienzo(s, tema)
    c.barra_acento(MARGEN, 380, spec.get('plataforma', 'spotify'), ancho=200, alto=10)
    c.texto(MARGEN, 430, ANCHO_PX - MARGEN * 2 - 300, 140,
            spec.get('titulo', ''), px=TIPO['titulo'] * 0.75, negrita=True)
    y = 600
    for p in spec.get('puntos', [])[:3]:
        c.texto(MARGEN, y, ANCHO_PX - MARGEN * 2 - 300, 110, p,
                px=TIPO['cuerpo'], color='dim', interlineado=1.35)
        y += 120
    logo(c, meta)
    return s


ARQUETIPOS = {
    'portada': a_portada, 'veredicto': a_veredicto, 'inversion': a_inversion,
    'kpis': a_kpis, 'barras': a_barras, 'tabla': a_tabla, 'funnel': a_funnel,
    'anomalias': a_anomalias, 'cierre': a_cierre,
}


# --------------------------------------------------------------------------
def render(spec, salida):
    prs = Presentation()
    prs.slide_width = PX(ANCHO_PX)
    prs.slide_height = PX(ALTO_PX)

    meta = spec.get('meta', {})
    tema = TEMAS.get(meta.get('tema', 'oscuro'), TEMAS['oscuro'])

    slides = spec.get('slides', [])
    avisos = []
    if len(slides) > 9:
        avisos.append('%d slides: el skill fija un máximo de 9' % len(slides))

    previo = None
    for sl in slides:
        tipo = sl.get('tipo')
        fn = ARQUETIPOS.get(tipo)
        if fn is None:
            avisos.append('arquetipo desconocido, omitido: %r' % tipo)
            continue
        if tipo == previo and tipo not in ('tabla',):
            avisos.append('dos "%s" seguidos: el skill lo prohíbe' % tipo)
        fn(prs, sl, meta, tema)
        previo = tipo

    prs.save(salida)
    return len(prs.slides._sldIdLst), avisos


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return 1
    with open(sys.argv[1], encoding='utf-8') as fh:
        spec = json.load(fh)
    n, avisos = render(spec, sys.argv[2])
    print('%d slides -> %s' % (n, sys.argv[2]))
    for a in avisos:
        print('  aviso: %s' % a)
    return 0


if __name__ == '__main__':
    sys.exit(main())
```

---

## 5. GENERAR Y ENTREGAR

```python
import json, subprocess, pathlib

spec = { ... }   # el deck spec del apartado 2

pathlib.Path("/mnt/data/spec.json").write_text(
    json.dumps(spec, ensure_ascii=False), encoding="utf-8")

print(subprocess.run(
    ["python3", "/mnt/data/render_pptx.py",
     "/mnt/data/spec.json", "/mnt/data/deck-artista-ejemplo-junio.pptx"],
    capture_output=True, text=True).stdout)
```

El renderer imprime cuántas slides ha escrito y los avisos que haya (arquetipo
desconocido, dos iguales seguidos, más de 9 slides). **Léelos.** Si avisa de un
arquetipo desconocido, esa slide NO está en el archivo.

Nombre del archivo: `deck-<artista>-<mes>.pptx`, minúsculas, sin acentos ni
espacios, con guiones.

**Entrega el .pptx directamente, sin zip.** A diferencia del HTML, el navegador
no intenta abrir un .pptx, así que no hace falta envolverlo. Eso no lo libra del
fallo del enlace de descarga —ver el aviso al final de este apartado—, pero ese
fallo está en el enlace, no en el archivo, y el zip no lo arregla.

Debajo del enlace, UNA línea:

> Ábrelo en PowerPoint. Todo es editable: cada barra es una forma y cada cifra
> una caja de texto, no hay imágenes de diapositiva.

Si el deck lleva la fuente Archivo y quien lo abre no la tiene instalada,
PowerPoint la sustituye y la tipografía cambia. La maqueta aguanta —todo está
posicionado en cajas absolutas— pero un título largo puede pasar a dos líneas.
No lo menciones salvo que pregunten.

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

---

## 6. ITERACIÓN

Cuando pidan cambios sobre un PPTX ya entregado:

- **Regenera desde el spec**, no desde el archivo. Guarda el spec de cada deck
  que generes para poder volver a él.
- Conserva todo lo no mencionado: mismos datos, mismas slides, mismo diseño.
- Si el cambio es solo visual o de orden, NO vuelvas a consultar el
  conocimiento: reutiliza el spec. Si implica datos nuevos, consúltalos antes.
- Si piden "lo mismo pero sin cifras de inversión", es un solo cambio:
  `"sin_cifras_economicas": true` y volver a ejecutar. Nada más.

---

## 7. CHECKLIST ANTES DE ENTREGAR

- [ ] ¿Todas las cifras salen del conocimiento?
- [ ] ¿Los porcentajes van en decimal en el spec (0.0041, no 0.41)?
- [ ] ¿Los valores que no existen van como `null`, y no como 0?
- [ ] ¿Las métricas sin referencia en el dato van SIN `benchmark`?
- [ ] ¿Ningún `benchmark` es idéntico al valor de su propia fila?
- [ ] ¿Máximo 9 slides, sin dos arquetipos iguales seguidos?
- [ ] ¿`money: true` en TODO lo que sea inversión, CPC, CPM o coste por
      resultado, para que el modo dirección funcione?
- [ ] ¿El logo corresponde al tema (claro en oscuro, oscuro en claro)?
- [ ] ¿Has leído la salida del renderer y no hay avisos?
- [ ] ¿Va el **aviso de descarga** como última línea del mensaje de entrega?
