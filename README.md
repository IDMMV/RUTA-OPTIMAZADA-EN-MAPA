# Rutas de Inspección V13

## Novedades
- Catálogo con filtros por fecha, alimentador, subestación y técnico.
- Selección individual, múltiple y botón para añadir todos los resultados filtrados a la ruta.
- Nueva pestaña **Mapa general** con todas las subestaciones sincronizadas desde Google Sheets.
- Buscador y filtros sobre el mapa general.
- Cada marcador permite añadir la subestación a la ruta o abrirla en Google Maps.
- La base agrega los campos `technician`, `createdAt` y `updatedAt`.

## Actualización
1. Sube los archivos web a GitHub Pages.
2. Copia `apps-script.gs` en tu proyecto de Google Apps Script como `Code.gs`.
3. Ejecuta `initializeDatabase` una vez; el script agregará las columnas nuevas si la hoja ya existía.
4. Implementa una nueva versión como Aplicación web, ejecutando como tú y con acceso para cualquier persona.
5. Si la URL `/exec` cambió, actualiza `config.js`.

## URL automática
Esta versión ya incluye la URL `/exec` en `config.js`. Al abrir la web desde cualquier dispositivo, el campo Configuración se completa automáticamente y la sincronización comienza sin pegar la URL manualmente.
