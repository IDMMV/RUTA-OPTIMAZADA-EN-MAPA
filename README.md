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
