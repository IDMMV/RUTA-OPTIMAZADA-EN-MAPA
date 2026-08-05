# Rutas de Inspección V13.55 — versión corregida

## Correcciones principales
- Diseño móvil tipo aplicación con menú lateral desplegable.
- Catálogo persistente en IndexedDB y respaldo en localStorage.
- La actualización de la PWA ya no elimina el mapa ni las subestaciones guardadas.
- Sincronización con fallback: `placesPage` y, si falla, `places`.
- Nunca reemplaza un catálogo válido por una respuesta vacía.
- Buscador del mapa general funciona sobre el catálogo recuperado, incluso sin conexión.
- Service Worker actualizado y `config.js` incluido en la estrategia de actualización.
- Historial conserva datos en columnas, sin enlaces de navegación.

## Publicación
Sube todos los archivos. En Apps Script reemplaza el código por `apps-script.gs`, guarda y crea una nueva implementación `/exec`. Conserva en `config.js` la URL real del despliegue.
