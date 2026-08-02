# Rutas de Inspección V12

## Incluye
- Alimentador + Subestación + Dirección/URL por punto.
- Catálogo compartido en Google Sheets.
- Buscador por alimentador, subestación o dirección.
- Historial tipo Excel y descarga XLSX/CSV.
- GPS continuo con vehículo, rumbo, precisión y recálculo.
- Ruta azul completa y tramo verde activo sin acumulación.
- Formulario habilitado al llegar (70 m y dos lecturas).
- Roles básicos: Administrador, Inspector y Consulta.
- Sincronización automática al abrir, volver a la pestaña y cada 60 segundos.

## Instalación de Apps Script
1. Cree un proyecto en script.google.com.
2. Pegue `apps-script.gs`.
3. Ejecute `initializeDatabase` y autorice Drive/Sheets.
4. Implemente como Aplicación web: ejecutar como Yo, acceso Cualquier persona.
5. Copie la URL terminada en `/exec`.
6. Péguela en `config.js` reemplazando `PEGA_AQUI_TU_URL_EXEC`.
7. Suba todos los archivos a la raíz de GitHub Pages.

## Nota
El formulario de Microsoft Forms se abre con parámetros añadidos a la URL. Para que aparezcan prellenados, los nombres de parámetros deben coincidir con un enlace prellenado real generado por Microsoft Forms.

## Corrección V12.1
- Acceso corregido: funciona con clic o tecla Enter.
- El modal de identificación ya no depende de la sincronización ni de la carga completa de librerías externas.
- Si el navegador bloquea el almacenamiento local, igualmente permite entrar durante la sesión.


## Novedades V12.2
- Importación masiva de Excel, XLS o CSV.
- Plantilla descargable con Alimentador, Subestación, Dirección / URL, Latitud y Longitud.
- Vista previa con validación de filas, duplicados y registros existentes.
- Botón Guardar ubicaciones independiente de Optimizar ruta.
- La importación actualiza una subestación existente usando Alimentador + Subestación como identificador.


## V12.3
- Rotación estable con Leaflet Rotate (dos dedos en móvil o botón ↻).
- Las tarjetas ya no muestran URLs largas; muestran coordenadas o dirección corta.
- Cada parada y popup incluye botón Abrir en Google Maps.
- Panel lateral más compacto, sin desplazamiento horizontal general.
- Mejor distribución móvil con mapa primero y tarjetas adaptadas.
