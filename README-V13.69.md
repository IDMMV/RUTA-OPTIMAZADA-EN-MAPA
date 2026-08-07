# Rutas de Inspección V13.69

Correcciones JavaScript verificadas:

1. Se añadió `visibleNavButtons()` antes de `applySavedTabOrder()` para evitar el error `visibleNavButtons is not defined` en la carga y en el modal Ordenar pestañas.
2. Se expuso `activeViewId` mediante `window.activeViewId = activeViewId` para que los bloques posteriores y el evento `pageshow` puedan reutilizarla sin lanzar `activeViewId is not defined`.
3. Se actualizó la versión y el caché del Service Worker a V13.69.

La configuración real de Apps Script y Google Client ID debe conservarse en `config.js`.
