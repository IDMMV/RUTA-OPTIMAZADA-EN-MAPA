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

## Versión V5
- Panel izquierdo con desplazamiento vertical independiente en computadora.
- Mapa fijo y siempre visible durante la edición de la ruta.
- Brújula ubicada en el centro superior del mapa.
- Botón de ubicación ubicado en la esquina superior derecha.


## V6
- Inicia el recorrido en pantalla completa.
- Botón superior para entrar/salir de pantalla completa.
- Panel de distancia, tiempo y parada compactado en la parte inferior del mapa.

## V7
La optimización usa una matriz de tiempos reales por carretera. Hasta 14 paradas calcula el orden óptimo exacto con inicio fijo y regreso opcional; para más paradas utiliza una mejora 2-opt.
