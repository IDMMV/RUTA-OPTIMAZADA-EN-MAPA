# Rutas de Inspección V13.3 – Revalidación automática

## Cambios
- Extrae coordenadas exactas de Google Maps priorizando `!3d/!4d`.
- Si no existen, interpreta coordenadas en grados/minutos/segundos del `/place/`.
- Usa coordenadas `@lat,lon` únicamente como señal de baja confianza y no reemplaza automáticamente el punto.
- Al sincronizar, revalida automáticamente el catálogo y corrige diferencias mayores a 8 metros cuando existe una fuente exacta.
- Botón manual **Revalidar coordenadas** en el catálogo.
- Guarda fuente, estado, fecha de validación y coordenada anterior en Google Sheets.

## Instalación
1. Reemplaza `index.html` en GitHub.
2. Reemplaza `Code.gs` por `apps-script.gs` en Google Apps Script.
3. Ejecuta `initializeDatabase`.
4. Publica una nueva versión de la aplicación web.
5. Si la URL `/exec` cambia, actualiza `config.js`.

## Importante
Los enlaces cortos de Google Maps que no contienen coordenadas no pueden revalidarse automáticamente desde el navegador. Se marcarán como **Revisión manual**.
