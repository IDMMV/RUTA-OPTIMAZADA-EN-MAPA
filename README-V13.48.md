# Rutas de Inspección V13.48

## Corrección crítica
- Se agregó la función `setSync`, ausente en V13.47.
- La ausencia de esa función detenía la sincronización antes de consultar Apps Script.
- El botón **Recargar mapa** ahora espera la carga paginada y actualiza el estado visible.
- El inicio automático usa explícitamente la función de sincronización vigente.
- Se mantiene `bootstrap` + `placesPage` para cargar ubicaciones por bloques de 1,000.

## Actualización
1. Reemplaza los archivos web en GitHub/Vercel.
2. Conserva en `config.js` tu URL `/exec` y el Client ID de **Rutas MiZona Web**.
3. No necesitas cambiar Apps Script si ya instalaste V13.47.
4. Fuerza actualización con Ctrl+F5 o abre en incógnito.
