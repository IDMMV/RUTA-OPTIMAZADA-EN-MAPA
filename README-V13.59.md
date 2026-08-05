# Rutas de Inspección V13.59

Corrección del optimizador de rutas:
- No queda bloqueado esperando indefinidamente al servidor externo.
- Usa las coordenadas ya cargadas desde Mapa general.
- Solicita GPS solo si no existe un punto de partida válido.
- Incluye optimización local automática cuando OSRM no responde.
- Corrige el formato de geometría del trazado local.
- Muestra progreso y errores específicos.
