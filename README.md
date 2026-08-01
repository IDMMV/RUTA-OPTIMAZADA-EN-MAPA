# Rutas de Inspección – navegación en tiempo real

Versión para GitHub Pages. Incluye optimización, botón Iniciar recorrido, seguimiento GPS con `watchPosition`, tramo activo, avance de parada 1 a la última, recálculo y simulación.

## Publicación
Sube todos los archivos a la raíz del repositorio y configura GitHub Pages desde `main / (root)`.

## Permisos
La ubicación requiere HTTPS y permiso del navegador. GitHub Pages ya usa HTTPS. Los mapas y rutas necesitan conexión.


## Navegación V2
- Línea azul: ruta completa optimizada.
- Línea verde: tramo activo desde la ubicación GPS hasta la parada actual.
- Botón Anterior para volver a una parada previa.
- Panel flotante en el mapa con distancia, tiempo e indicación.


## V3
- Punto GPS pulsante y clicable.
- Botón flotante para centrar la ubicación.
- Brújula norte/sur basada en orientación del dispositivo.
- Actualización de tramo cada 4 segundos o 20 metros.
