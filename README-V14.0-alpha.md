# Rutas de Inspección V14.0.0-alpha

Primera versión de rendimiento de la rama V14 CORE.

## Cambios reales
- Se eliminaron cinco scripts de reparación de mapa/navegación que se superponían entre sí.
- Se incorporó `v14-core.js` como único controlador final del Mapa general.
- El Mapa general ya no crea miles de marcadores HTML. Usa `L.circleMarker` + Canvas.
- Sin filtros, solo renderiza los puntos del viewport actual (máximo 550).
- Con búsqueda/filtros, renderiza como máximo 1000 coincidencias, manteniendo el contador total.
- Se añadió índice espacial en memoria por cuadrícula para evitar recorrer todo el catálogo en cada movimiento del mapa.
- El mapa se crea una sola vez y no se destruye al cambiar de pestaña.
- Se redujo el uso de `invalidateSize()` en el flujo nuevo a una llamada controlada.
- La búsqueda numérica se limita al código de subestación, no a coordenadas.
- El botón `Ir` centra uno o varios resultados.
- Navegación móvil y botón Atrás se consolidan en el núcleo V14.

## Compatibilidad
Se conserva el backend, `config.js`, Apps Script, formularios, usuarios, historial y motor de ruta de la V13.69. Esta alpha está enfocada en eliminar el congelamiento del mapa antes de migrar los demás módulos.
