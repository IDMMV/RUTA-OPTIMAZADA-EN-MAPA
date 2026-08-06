# V13.67 — mapa móvil y navegación Atrás

- Corrige el mapa general para dibujar desde el catálogo guardado aunque falle la sincronización.
- Evita destruir y reconstruir el mapa repetidamente.
- Recupera la ruta desde el borrador local para iniciar recorrido.
- En móvil usa menú lateral desplegable y ancho real de aplicación.
- La flecha Atrás cierra primero popup, pantalla completa o recorrido; después vuelve a Mi ruta, sin salir inmediatamente de la aplicación.
- Conserva los valores reales de `SCRIPT_URL` y `GOOGLE_CLIENT_ID` en `config.js` antes de publicar.
