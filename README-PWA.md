# Rutas de Inspección V13.7 PWA

## Archivos nuevos
- `manifest.webmanifest`
- `service-worker.js`
- `icons/icon-192.png`
- `icons/icon-512.png`
- `icons/icon-maskable-512.png`
- `icons/apple-touch-icon.png`

## Publicación
Sube todos los archivos y la carpeta `icons` a la raíz de GitHub Pages.

## Instalación en Android
1. Abre la web publicada con Chrome.
2. Pulsa `Instalar app` dentro de la web.
3. Confirma la instalación.

Si el botón no aparece, usa el menú de Chrome `⋮` y elige `Instalar aplicación` o `Añadir a pantalla principal`.

## Importante
GitHub Pages usa HTTPS, requisito para instalar una PWA y usar geolocalización. El service worker usa red primero para `index.html` y `config.js` para reducir el riesgo de conservar versiones antiguas.
