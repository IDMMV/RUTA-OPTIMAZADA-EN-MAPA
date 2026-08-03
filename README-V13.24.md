# V13.24 — Reparación de acceso administrador

1. Pegue `apps-script.gs` en `Code.gs`.
2. Ejecute `initializeDatabase`.
3. Si admin/1234 todavía falla, ejecute una vez `resetAdminAccess`.
4. Publique una nueva versión de la aplicación web.
5. Si cambia la URL `/exec`, actualice `config.js`.

La reparación no borra subestaciones, rutas, historial ni usuarios.
