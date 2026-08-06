# Rutas de Inspección V13.66

Correcciones finales sobre V13.65:

- El Mapa general ya no se destruye y crea repetidamente durante la sincronización.
- Se eliminan capas base duplicadas que provocaban pantalla gris, mosaicos incompletos y lentitud.
- Se usa OpenStreetMap con subdominios y cambio automático a CARTO si el servidor principal falla.
- Se reajusta el tamaño del mapa al abrir la pestaña y al recargar.
- Iniciar recorrido recupera la ruta desde el borrador local si una sincronización dejó `state.route` vacío.
- Si existe una lista de puntos con coordenadas, reconstruye una ruta iniciable sin borrar el trazado visible.
- El GPS tiene respaldo en el punto de partida o la primera parada.

Mantener los valores reales de `SCRIPT_URL` y `GOOGLE_CLIENT_ID` en `config.js` al publicar.
