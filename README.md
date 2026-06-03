# LatinShare — Base HTML estática

Sitio corporativo de LatinShare en HTML estático. Sin Next.js ni Sanity.

## Correr en local
Desde la raíz del proyecto:
```bash
npx serve html
```
Abre http://localhost:3000

> Nota: el sitio usa Tailwind y Google Fonts por CDN, por lo que requiere conexión a internet.
> El header/footer se inyectan con JS (`js/include.js`), así que debe servirse por HTTP
> (no abrir el `.html` con `file://`).

## Editar contenido
- Textos y secciones: directamente en cada archivo `*.html`.
- Navbar y footer (compartidos): `partials/header.html` y `partials/footer.html`.
- Estilos de marca: `css/styles.css`.
- Interacción (menú, carruseles, FAQ): `js/main.js`.

## Antes de publicar — reemplazar placeholders
1. `GTM-XXXXXXX` → tu ID de Google Tag Manager (en cada `*.html` y `partials`).
2. `https://formspree.io/f/REEMPLAZAR` → tu endpoint real de Formspree/Web3Forms (en `contact.html`, `licenses.html` y los formularios newsletter).
3. `og-image.jpg` → subir imagen Open Graph 1200×630 a `html/assets/`.

## Validar
```bash
npm run validate:html
```
