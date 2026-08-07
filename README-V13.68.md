# Rutas de Inspección V13.68

Corrección real sobre V13.67:
- Mapa general con una sola instancia Leaflet estable.
- Recuperación del catálogo desde memoria, localStorage e IndexedDB.
- Máximo 450 puntos sin filtro y 900 con filtro para evitar bloqueos.
- Mapa base alternativo automático cuando OpenStreetMap falla.
- Inicio de recorrido recuperando la ruta guardada o los puntos actuales.
- Inicio sin forzar pantalla completa.
- Botón Atrás de Android cierra popup, navegación o vista antes de salir.
- Botón móvil “Salir del mapa”.

Conservar SCRIPT_URL y GOOGLE_CLIENT_ID reales en config.js.
