# Rutas de Inspección V11 — Catálogo de Subestaciones

## Correcciones principales
- Cada optimización reemplaza el trazo anterior; no acumula rutas.
- La línea verde del tramo activo usa una capa independiente y queda visible durante el recorrido.
- Botón **Buscar** para localizar una subestación guardada por nombre o código.
- Sincronización compatible con GitHub Pages mediante POST `no-cors` + lectura JSONP.
- Google Apps Script crea automáticamente una hoja de cálculo en Drive con:
  `ID | Subestación | Nombre/Dirección | Latitud | Longitud | Actualizado`.

## Publicar la web
Sube a la raíz del repositorio:
- `index.html`
- `404.html`
- `manifest.webmanifest`
- `service-worker.js`

## Configurar Google Apps Script
1. Abre https://script.google.com y crea un proyecto.
2. Copia todo el contenido de `apps-script-subestaciones.gs` en `Code.gs`.
3. Implementar → Nueva implementación → Aplicación web.
4. Ejecutar como: **Yo**.
5. Acceso: **Cualquier persona**.
6. Copia la URL terminada en `/exec`.
7. En la web: Configuración → pega la URL → Guardar URL → Sincronizar ahora.

La hoja se creará en Drive dentro de la carpeta **Rutas de Inspección**.
Desde Google Sheets puedes descargarla como Excel: Archivo → Descargar → Microsoft Excel (.xlsx).
