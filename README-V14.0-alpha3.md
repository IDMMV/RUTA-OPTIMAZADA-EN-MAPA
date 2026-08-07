# Rutas de Inspección V14.0-alpha3

Esta versión incorpora el patrón de mapas de la versión React estable entregada por el usuario:

- una sola instancia Leaflet;
- Canvas (`preferCanvas` + `L.circleMarker`);
- índice espacial por cuadrícula;
- render solo de puntos dentro del viewport;
- máximo 1000 puntos renderizados;
- render con debounce solo en `moveend/zoomend`;
- `LayerGroup` persistente y reutilizable;
- búsqueda separada del render masivo;
- el motor V14 se carga al final del documento y es el último propietario de `renderGeneralMap`.

Además se eliminó el triple `invalidateSize()` al abrir Mapa General y el render legacy automático de `v1363-unified-map-engine` durante el arranque.
