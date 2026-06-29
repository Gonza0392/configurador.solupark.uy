# Imágenes oficiales · Golden Line GLG6000

Cada PNG va acá con **naming exacto** (no usar espacios ni sufijos como ` - 2`):

| SKU         | Producto                  | Frontal mm (W×H) | **PNG (px, 2× retina)** | Aspect W:H |
|-------------|---------------------------|------------------|--------------------------|------------|
| GLG6001.png | Hanging wall cabinet LED  | 680 × 350        | **1360 × 700**           | 1.943      |
| GLG6002.png | 1-Door tall cabinet       | 600 × 2000       | **1200 × 4000**          | 0.300      |
| GLG6003.png | 2-Door base cabinet       | 680 × 910        | **1360 × 1820**          | 0.747      |
| GLG6004.png | 4-Drawer base cabinet     | 680 × 910        | **1360 × 1820**          | 0.747      |
| GLG6005.png | 5-Drawer base cabinet     | 680 × 910        | **1360 × 1820**          | 0.747      |
| GLG6006.png | Panel perforado + enchufe | 1052 × 605       | **2104 × 1210**          | 1.739      |
| GLG6007.png | Panel perforado SEAMLESS  | 1052 × 605       | **1808 × 1210**          | 1.494      |
| GLG6011.png | Base con cubo de basura   | 680 × 910        | **1360 × 1820**          | 0.747      |
| GLG6012.png | Cajonera móvil + wood top | 658 × 895        | **1316 × 1790**          | 0.735      |
| GLG6013.png | 2-Door tall cabinet       | 915 × 2000       | **1830 × 4000**          | 0.4575     |

`GLG6008` (conectores), `GLG6009` y `GLG6010` (working tops) **no necesitan PNG** — se dibujan en SVG.

## Requisitos críticos (sin esto se ven distorsionados)

1. **Aspect ratio exacto** al de la columna "Frontal mm". Resolución absoluta importa poco; el aspect importa todo.
2. **Silueta al borde del PNG** — sin padding/whitespace, sin sombra externa, sin reflejo, sin marca de agua. Recortar al bounding box justo del mueble.
3. **Patas/ruedas al borde inferior** (Y máx). El render apoya el módulo en `ground`; si hay padding inferior, "flota".
4. **Vista frontal pura** — proyección ortográfica, sin perspectiva 3D.
5. **Background transparente** (canal alpha PNG-32).

## Caso especial: GLG6007 (seamless)

El panel perforado es la única PNG que se renderiza como **pattern tileado** (se
repite horizontalmente sobre todo el ancho del panel). Para evitar que cada
junta entre tiles muestre una "doble línea metálica" del marco lateral, el
PNG debe ser **solo el interior perforado**, sin los marcos laterales del
módulo.

Workflow:
1. Si subís un GLG6007.png "crudo" del catálogo (con marcos visibles, típicamente
   2104×1210), ejecutá el script de procesamiento que recorta los ~148 px de
   marco a cada lado:
   ```bash
   node _process-png.cjs              # procesa todas las PNG (alpha + bbox + resize)
   # luego, recortar marcos del GLG6007 a mano si hace falta:
   node -e "require('sharp')('public/catalog/glg6000/GLG6007.png').extract({left:148,top:0,width:1808,height:1210}).toFile('public/catalog/glg6000/GLG6007_seamless.png').then(()=>console.log('ok'))"
   ```
2. El resultado debe ser 1808×1210 con perforaciones llegando a los bordes
   izq/der sin marco metálico visible.

El render usa este PNG con `preserveAspectRatio="none"` dentro de un `<pattern>`
de 1052×605 mm, lo que aplica un stretch horizontal de ~16% (despreciable
visualmente, elimina la costura).

## Fallback

Si una PNG falta, el render muestra un skeleton gris oscuro (`#2a2e36`) con el ancho del módulo etiquetado debajo. No rompe el preview.

Fuente original: Google Drive · "Muebles - SoluPark / Imagenes Modulos".
