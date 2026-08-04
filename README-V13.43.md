# Rutas de Inspección V13.43

## Novedad principal

Se incorporó acceso con cuenta de Google más verificación por código de 6 dígitos.

Flujo:

1. El usuario pulsa **Continuar con Google**.
2. Google valida su cuenta.
3. Apps Script verifica el token de Google.
4. El sistema comprueba que el correo exista en la hoja **Usuarios**.
5. Se envía un código de 6 dígitos al correo registrado.
6. El usuario ingresa el código y se crea la sesión.

## Configuración obligatoria

### 1. Google Cloud Console

Crear un OAuth Client ID tipo **Web application** y registrar el origen autorizado:

```text
https://rutas.mizona.pe
```

y, mientras pruebas, también el dominio temporal si corresponde.

### 2. config.js

Colocar el Client ID:

```js
GOOGLE_CLIENT_ID: 'TU_CLIENT_ID.apps.googleusercontent.com'
```

### 3. Apps Script

Reemplazar `Code.gs` por `apps-script.gs`, ejecutar:

```text
initializeDatabase
```

Luego ejecutar una vez:

```text
setGoogleLoginConfig('TU_CLIENT_ID.apps.googleusercontent.com','gmail.com')
```

Para permitir varios dominios:

```text
setGoogleLoginConfig('TU_CLIENT_ID.apps.googleusercontent.com','gmail.com,luzdelsur.com.pe')
```

Si no deseas restringir por dominio y prefieres aceptar solo correos registrados en Usuarios:

```text
setGoogleLoginConfig('TU_CLIENT_ID.apps.googleusercontent.com','')
```

## Usuarios

Cada usuario debe tener un correo registrado en la columna `email`. Si el correo no existe en Usuarios, aunque Google lo valide, no podrá entrar.

## Acceso temporal

Se conserva el ingreso por usuario y contraseña para emergencia administrativa.
