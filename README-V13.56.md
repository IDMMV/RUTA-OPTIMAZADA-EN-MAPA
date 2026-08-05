# Rutas de Inspección V13.56

Correcciones funcionales:
- Catálogo de Subestaciones integrado al Mapa general; pestaña independiente retirada.
- Buscador general normalizado y operativo por alimentador, subestación, dirección, técnico o ID.
- Sincronización en segundo plano sin simular carga cuando ya existen datos guardados.
- Historial con botón de actualización y fallback bootstrapLite/bootstrap.
- Optimización usa primero las coordenadas existentes del catálogo antes de geocodificar.
- Botón Cambiar estado reforzado en las ventanas del mapa.
- Caché persistente conservada tras actualizar la aplicación.

Publicar reemplazando todos los archivos y limpiar la versión anterior del Service Worker una sola vez.
