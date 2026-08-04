# Rutas de Inspección V13.41 · Google estable

## Correcciones principales
- Inicio robusto: un error de Leaflet o rotación ya no bloquea toda la interfaz.
- El mapa se inicia después del acceso y solo cuando es necesario.
- Sincronización paginada de ubicaciones en bloques de 1,000 registros.
- Se eliminó la revalidación automática masiva en cada sincronización.
- Catálogo limitado visualmente a 300 resultados; todos los datos siguen guardados.
- Mapa general con renderizado Canvas y máximo de 2,500 puntos por vista.
- Las fotografías nuevas quedan privadas en Drive.
- Preparado para el subdominio `rutas.mizona.pe`.

## Actualización obligatoria de Apps Script
1. Sustituir Code.gs por `apps-script.gs`.
2. Ejecutar `initializeDatabase`.
3. Crear una nueva implementación como aplicación web.
4. Copiar la nueva URL `/exec` en `config.js`.

## Dominio
Se recomienda usar `rutas.mizona.pe`, sin reemplazar la web principal `mizona.pe`.
Configura en DNS un CNAME `rutas` hacia el proveedor donde publiques esta carpeta.

## Carga masiva
Importa los 17,245 registros directamente en la hoja `Subestaciones`. La web los descargará por bloques y no intentará dibujarlos todos simultáneamente.
