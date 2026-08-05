# Rutas de Inspección V13.64

Corrección crítica de rendimiento del mapa general.

- Ya no crea 17,245 marcadores HTML simultáneamente.
- Usa renderizado Canvas y un máximo de 900 puntos por vista.
- Solo dibuja el mapa general cuando su pestaña está visible.
- En vista normal prioriza los puntos dentro del área visible.
- La búsqueda sigue contando todos los resultados y centra el mapa al pulsar Buscar/Ir.
- Se redujeron repintados durante sincronización y escritura.
- Se conserva el catálogo completo en memoria/caché; el límite es solo visual.
