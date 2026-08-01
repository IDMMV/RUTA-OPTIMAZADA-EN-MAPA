RUTAS DE INSPECCIÓN — VERSIÓN GOOGLE DRIVE

Esta versión no usa Google Maps ni Supabase.
El mapa usa OpenStreetMap, la búsqueda usa Nominatim y las rutas usan OSRM.
Los datos se guardan en una carpeta privada de Google Drive llamada “Rutas de Inspección”.

INSTALACIÓN EN GOOGLE APPS SCRIPT

1. Entra a https://script.google.com con la cuenta de Google donde deseas guardar las rutas.
2. Crea un proyecto nuevo y llámalo “Rutas de Inspección”.
3. Reemplaza el contenido de Code.gs con el archivo Code.gs incluido.
4. Crea tres archivos HTML con estos nombres exactos:
   - Index
   - Styles
   - Script
5. Copia el contenido de Index.html, Styles.html y Script.html en sus respectivos archivos.
6. En Configuración del proyecto, activa “Mostrar el archivo de manifiesto appsscript.json”.
7. Reemplaza el manifiesto por el appsscript.json incluido.
8. Presiona Implementar > Nueva implementación > Aplicación web.
9. Ejecutar como: Yo.
10. Quién tiene acceso: Solo yo, o cualquier usuario con cuenta de Google según tu necesidad.
11. Autoriza el acceso solicitado a Google Drive.
12. Abre la URL de la aplicación web y agrégala a la pantalla de inicio del celular si deseas.

FUNCIONAMIENTO
- Cada cambio se guarda primero en el navegador y luego se sincroniza automáticamente con Drive.
- “Guardar ahora” fuerza la sincronización.
- “Recargar desde Drive” recupera la última copia almacenada.
- El botón “Abrir formulario de inspección” abre el Microsoft Forms configurado.
- No se almacenan fotografías.

ARCHIVOS DE DRIVE
La aplicación crea:
Rutas de Inspección/datos-rutas-inspeccion.json

IMPORTANTE
Los servicios públicos Nominatim y OSRM son adecuados para uso personal moderado. Los tiempos no incluyen tráfico en tiempo real.
