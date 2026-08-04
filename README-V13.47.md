# Rutas de Inspección V13.47

## Correcciones
- El registro de usuarios abre incluso si falla el mapa o la sincronización.
- El botón Actualizar del módulo Usuarios fuerza una sincronización y vuelve a renderizar el registro.
- Se agregó diagnóstico de conexión junto al estado de sincronización.
- Se incluye config.js para evitar que el despliegue quede sin conexión.
- Apps Script incorpora `action=health` para comprobar que la implementación responde.

## Antes de publicar
1. Conserva en `config.js` tu `SCRIPT_URL` terminada en `/exec` y tu `GOOGLE_CLIENT_ID`.
2. Reemplaza `Code.gs` por `apps-script.gs`.
3. Ejecuta `initializeDatabase`.
4. Crea una nueva versión de la implementación de Apps Script.
5. Publica todos los archivos en Vercel.
6. Cierra sesión y vuelve a entrar para generar un token válido.
