# V13.39 — Reparación de acceso y base de usuarios

- Evita doble envío del formulario de ingreso.
- Agrega bloqueo contra múltiples intentos simultáneos.
- Optimiza Apps Script para abrir Google Sheets una sola vez por solicitud.
- Reordena la hoja Usuarios al esquema correcto sin perder registros.
- Agrega `repairUserDatabase()` para reparar la base existente.
- Mantiene `resetAdminAccess()` para recuperar admin / 1234.

## Instalación
1. Reemplaza Code.gs por apps-script.gs.
2. Ejecuta `repairUserDatabase()`.
3. Ejecuta `resetAdminAccess()`.
4. Publica una nueva implementación y actualiza la URL /exec si cambió.
5. Sube todos los archivos a GitHub.
