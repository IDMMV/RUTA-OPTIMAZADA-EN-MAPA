# Rutas de Inspección V14.0-alpha2

Corrección específica del Mapa General.

- Se eliminan tres scripts tardíos que competían por crear/destruir el mismo mapa.
- `v1366-final-map-route-fix-script` queda como único propietario de la instancia Leaflet del Mapa General.
- Se eliminó `crossOrigin:true` de las capas base para evitar fallos de mosaicos en redes/navegadores restrictivos.
- `v14-performance.js` NO crea mapas: únicamente renderiza marcadores ligeros sobre el mapa ya existente.
- Sin filtros se dibujan como máximo 450 puntos visibles; con búsqueda, hasta 850 coincidencias.
- La búsqueda numérica consulta el código de subestación y no latitud/longitud.
- Service Worker actualizado a `ri-v14.0-alpha2`.
