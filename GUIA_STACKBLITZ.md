# Cómo subir y ejecutar el proyecto en StackBlitz (paso a paso)

StackBlitz ejecuta Node.js dentro del navegador, así que no instalas nada en tu computador. Este proyecto ya incluye `package.json`, `.stackblitzrc` y el script `npm start`.

> Importante: StackBlitz **no acepta el .zip directamente**. Primero hay que descomprimirlo.

## Antes de empezar
1. Descomprime `Reserva_Espacios_Academicos.zip` en tu computador.
2. Verifica que dentro de la carpeta veas `index.js`, `package.json`, `src/` y `public/`.
3. Si existe una carpeta `node_modules`, **no la subas** (StackBlitz la crea sola).
4. Recomendado: usa **Google Chrome** o **Edge**. Safari y Brave pueden bloquear la vista previa.

## Opción A — Arrastrar los archivos (la más rápida)
1. Entra a **https://stackblitz.com** e inicia sesión (con GitHub o correo). Sin cuenta puedes probar, pero no podrás guardar el proyecto.
2. Pulsa **Create new project** (o **New project**) y elige la plantilla **Node.js**.
3. En el explorador de archivos (columna izquierda) borra los archivos de ejemplo que trae la plantilla (por ejemplo `index.js` y `package.json`).
4. Abre la carpeta del proyecto en tu computador, selecciona **todo su contenido** (`index.js`, `package.json`, `.stackblitzrc`, `src`, `public`, `tests`, los `.md`…) y **arrástralo** al explorador de archivos de StackBlitz. Si pregunta si reemplazar archivos, responde que sí.
5. Comprueba que en el explorador queden `src/` y `public/` como carpetas, no archivos sueltos.
6. StackBlitz instala Express y arranca solo. Si no lo hace, abre la **Terminal** (parte inferior) y escribe:
   ```bash
   npm install
   npm start
   ```
7. Debe aparecer `Reserva de espacios activa en el puerto ...` y se abre la **vista previa** a la derecha.
8. Para verla mejor, pulsa **Open in New Tab** (abrir en pestaña nueva).

## Opción B — Mediante GitHub (también lo pide el proyecto)
El documento del proyecto exige que el código esté en GitHub, así que esta ruta sirve para ambos fines.
1. Crea un repositorio en **github.com** (por ejemplo `reserva-espacios-academicos`).
2. Pulsa **Add file → Upload files**, arrastra el contenido de la carpeta (sin `node_modules`) y haz **Commit changes**.
3. En el navegador abre:
   ```
   https://stackblitz.com/github/TU_USUARIO/reserva-espacios-academicos
   ```
   (cambia `TU_USUARIO` y el nombre del repositorio por los tuyos).
4. StackBlitz importa el repositorio, instala las dependencias y lo ejecuta.

## Probar que funciona
1. En la vista previa debe verse la pantalla **Reserva de espacios académicos** con las pestañas *Iniciar sesión* y *Crear cuenta*.
2. Entra con `directivo@institucion.edu` y la contraseña `Admin123!`.
3. Crea una reserva y luego otra que se cruce de horario: debe mostrarse un error de conflicto.
4. En la terminal puedes ejecutar `npm test` (en otra terminal si el servidor está corriendo) y deben aparecer **14 pruebas aprobadas**.

## Guardar y compartir
- Con la sesión iniciada, StackBlitz guarda los cambios en tu cuenta (botón **Save** / **Fork** si es necesario).
- Para compartir, copia la URL de la barra del navegador, o usa el botón **Share**.
- Para entregar solo la aplicación funcionando, copia la URL de la vista previa en nueva pestaña.

## Problemas frecuentes
| Problema | Solución |
| --- | --- |
| `Cannot find module 'express'` | Ejecuta `npm install` en la terminal. |
| La vista previa sale en blanco o no carga | Pulsa **Open in New Tab**; prueba en Chrome o Edge; desactiva el bloqueo de cookies de terceros para stackblitz.com. |
| `Cannot GET /` | Faltó la carpeta `public/` o quedó con otro nombre. Revisa el paso 5. |
| El puerto está ocupado | Detén el proceso con `Ctrl + C` y ejecuta `npm start` de nuevo. |
| Desaparecieron mis reservas y cuentas | Es normal: los datos están en memoria y se reinician con el servidor. |
| Plantilla con otro `package.json` | Reemplázalo por el de este proyecto (debe tener `"start": "node index.js"`). |
| No me deja iniciar sesión tras reiniciar | Las cuentas de alumno/docente se borran al reiniciar; vuelve a crearlas. El directivo de prueba siempre existe. |
