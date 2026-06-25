# Configurador de muebles — SoluPark (Golden Line)

Configurador web estático de estaciones de trabajo modulares (serie Golden Line GLG6000).
El cliente arma su pared, ve medidas/peso/volumen/contenedor en vivo y pide cotización por WhatsApp.
Un solo archivo, sin backend.

## Archivos
- `index.html` — la aplicación (esto es todo el configurador).
- `CNAME` — dominio propio para GitHub Pages: `configurador.solupark.uy`.
- `.nojekyll` — evita que GitHub Pages procese el sitio con Jekyll (servir tal cual).

## Deploy en GitHub Pages
1. Crear un repositorio público (ej. `configurador-muebles`).
2. "Add file" → "Upload files" → subir estos tres archivos a la raíz del repo.
3. Settings → Pages → Source: rama `main`, carpeta `/ (root)` → Save.
4. En ~1 min queda online. Con el CNAME, en `https://configurador.solupark.uy`.

## Dominio (DNS)
Crear un registro **CNAME** en el DNS de solupark.uy:
`configurador`  →  `<tu-usuario>.github.io`
(Si preferís otro subdominio, cambiá la única línea del archivo `CNAME`.)

## Actualizar
Reemplazar `index.html` en el repo. GitHub Pages redeploya solo en segundos.

## Integración
Linkear `https://configurador.solupark.uy` desde la categoría Muebles de solupark.uy
(botón "Armá tu estación"). Cierre de cotización por WhatsApp al 092 877 444.
