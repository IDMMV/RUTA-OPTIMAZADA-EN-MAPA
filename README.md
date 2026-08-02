# Rutas de Inspección V10

Correcciones: seguimiento GPS continuo, botón de ubicación con lectura nueva, filtro de precisión, enlaces con coordenadas ampliados y marcadores arrastrables para ajustar puntos exactos.

## Últimos cambios
- Nuevo: sincronización opcional del catálogo de "ubicaciones guardadas" (subestaciones) entre varios dispositivos, usando Google Apps Script + Google Sheet como backend gratuito. Ver `apps-script-subestaciones.gs` y Configuración → "Sincronizar subestaciones (SE)" dentro de la app.
- El nombre de la subestación ahora aparece como etiqueta directamente sobre el punto en el mapa (antes solo se veía dentro del popup, y solo si el punto la tenía asignada).
- Se eliminó la tarjeta separada "Punto de partida": ahora se define solo con GPS automáticamente, con un botón compacto para actualizarlo o escribirlo manualmente si hace falta.
- Nuevo cuadro de "agregado rápido" (una dirección + su subestación) además del cuadro de texto masivo.
- Nuevo: catálogo de "ubicaciones guardadas". Cada vez que agregas un punto queda guardado en tu navegador; luego puedes buscarlo por nombre de subestación o dirección y agregarlo de nuevo sin volver a escribir la dirección ni geocodificar.
- "Continuar recorrido" ya no reinicia el GPS ni la pantalla completa cuando el recorrido ya está en marcha: solo reanuda si estaba pausado. Esto evitaba que se pidieran dos lecturas GPS en paralelo y se perdiera el seguimiento en tiempo real.
- "Optimizar ruta" reutiliza tu última ubicación si es reciente (menos de 12 s) y precisa (±40 m o mejor), en vez de forzar siempre una nueva búsqueda.
- Se descartan automáticamente rutas de OSRM con distancias irreales (por ejemplo, cientos de km entre dos puntos cercanos, causado por un punto fuera de la red vial); en ese caso se usa una estimación por distancia directa.
- La pantalla no se apaga durante el recorrido activo (Wake Lock), para que el GPS no se corte.
- La geocodificación de direcciones prioriza resultados dentro de Lima Metropolitana/Callao.
- Nuevo: cada ubicación puede asociarse a una subestación (formato `dirección | nombre de subestación` en el cuadro de texto, o el botón ⚡ en cada parada ya agregada). Se muestra en la lista de paradas, en el popup del mapa y en el panel de recorrido en tiempo real.

