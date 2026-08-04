# Rutas de Inspección V13.46

## Incluye
- Diseño corporativo aprobado, separado visualmente de MiZona.
- `bootstrap` para cargar datos operativos sin descargar 17 mil ubicaciones de golpe.
- `placesPage` para cargar ubicaciones en bloques de hasta 1,000.
- Acceso Google + código de seis dígitos en el Apps Script incluido.
- Mapas, botones y navegación resistentes a errores parciales.

## Actualización obligatoria de Apps Script
1. Copia `apps-script.gs` completo en `Code.gs`.
2. Guarda y ejecuta `initializeDatabase`.
3. No vuelvas a ejecutar la configuración Google si ya está guardada; si cambió el proyecto, ejecuta tu función auxiliar `configurarGoogleAhora`.
4. Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar.
5. Conserva la misma URL `/exec` en `config.js`.

## Publicación web
- Conserva tu `config.js` actual; este ZIP no lo reemplaza.
- Sube los demás archivos a Vercel/GitHub.
- Abre `rutas.mizona.pe` en incógnito o usa Ctrl+F5.
- En Mapa general pulsa **Recargar mapa**.

## Encabezados obligatorios de Subestaciones
`id | feeder | substation | address | lat | lon`

Ejemplo: `CH12|21041A | CH12 | 21041A | dirección o URL | -12.123 | -76.987`
