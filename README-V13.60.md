# Rutas de Inspección V13.60

Correcciones principales:
- Administrador secundario reconocido correctamente para cambiar estados y registrar acciones.
- Permisos basados en rol normalizado, evitando que se trate al administrador como Consulta.
- Optimizador con coincidencia robusta de alimentador/subestación.
- Respaldo de optimización cuando el GPS no responde: usa la primera subestación como inicio.
- Se mantiene la carga persistente del mapa general y el filtro de subestaciones.

Importante: conserva en config.js tu SCRIPT_URL terminado en /exec y tu GOOGLE_CLIENT_ID real.
