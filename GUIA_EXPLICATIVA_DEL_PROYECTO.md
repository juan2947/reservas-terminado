# Guía explicativa del código — Reserva de Espacios Académicos

Este documento explica para qué sirve cada archivo y cada bloque de código del proyecto, en lenguaje sencillo.

## 1. Idea general

La aplicación tiene dos partes que se comunican:

- **Backend (servidor):** Node.js + Express. Guarda los datos, valida las reglas y responde en JSON.
- **Frontend (navegador):** `public/` con HTML, CSS y JavaScript. Muestra pantallas y llama a la API con `fetch`.

Camino de una petición (arquitectura del documento del proyecto):

```
Navegador → Ruta → Middleware (¿hay sesión?) → Controlador (validaciones y reglas) → Datos (memoria) → JSON
```

## 2. Estructura de carpetas

| Carpeta o archivo | Para qué sirve |
| --- | --- |
| `index.js` | Arranca el servidor y conecta todo. |
| `src/routes/` | Define las direcciones (URL) de la API. |
| `src/controllers/` | Contiene la lógica: validar, decidir y responder. |
| `src/middleware/` | Filtros que se ejecutan antes del controlador (sesión y permisos). |
| `src/data/` | "Base de datos" en memoria: guardar y buscar. |
| `src/utils/` | Funciones auxiliares reutilizables (fechas, horas, cruces). |
| `public/` | La página web que ve el usuario. |
| `tests/` | Pruebas automáticas. |
| `package.json` / `.stackblitzrc` | Dependencias, scripts y configuración de StackBlitz. |

---

## 3. Backend

### 3.1 `index.js` — servidor principal

| Bloque | Qué hace |
| --- | --- |
| `require('express')` y `path` | Carga Express (el framework) y `path` (para armar rutas de carpetas). |
| `app.disable('x-powered-by')` | Oculta que el servidor usa Express (pequeña mejora de seguridad). |
| `express.json({ limit: '100kb' })` | Permite leer cuerpos JSON y rechaza los demasiado grandes. |
| `express.static('public')` | Entrega `index.html`, `styles.css` y `app.js` al navegador. |
| `app.use('/usuarios', …)` | Conecta registro, login y perfil. Estas rutas son públicas, salvo las que protegen por dentro. |
| `app.use('/reservas', autenticar, …)` y `/espacios` | Conectan la API principal **detrás** del middleware: sin sesión responden 401. |
| `GET /api/estado` | Ruta pública para comprobar que el servidor está vivo. |
| Manejador 404 | Si la ruta no existe, responde JSON con "Ruta no encontrada". |
| Manejador de errores | Si el JSON viene mal formado responde 400; cualquier otro fallo responde 500 sin mostrar detalles internos. |
| `app.listen(PORT, '0.0.0.0')` | Enciende el servidor en el puerto de `PORT` (lo da StackBlitz) o en el 3000. Solo se ejecuta si el archivo se lanza directamente. |
| `module.exports = app` | Permite que las pruebas importen la app sin encenderla. |

### 3.2 `src/routes/` — rutas

**`reservas.js`**

| Línea | Qué hace |
| --- | --- |
| `GET /disponibilidad`, `/espacio/:espacioId`, `/solicitante/:solicitante` | Rutas específicas. Van **antes** de `/:id`; si no, Express confundiría la palabra "disponibilidad" con un ID. |
| `GET /` y `GET /:id` | Listar todas y consultar una (RF2, RF3). |
| `POST /` | Crear reserva (RF1). |
| `PUT /:id` | Editar reserva (RF4). |
| `DELETE /:id` | Cancelar reserva (RF5). |

**`espacios.js`** — `GET` es para cualquier usuario con sesión; `POST` y `PUT` pasan primero por `soloDirectivo(...)`.

**`usuarios.js`** — `registro` y `login` sin protección; `logout`, `perfil` con `autenticar`; el listado completo con `autenticar` + `soloDirectivo`.

### 3.3 `src/middleware/auth.js` — sesión y permisos

| Función | Qué hace |
| --- | --- |
| `autenticar` | Lee el encabezado `Authorization: Bearer <token>`, busca la sesión y, si es válida, guarda el usuario en `req.user`. Si no, responde **401**. |
| `soloDirectivo(mensaje)` | Devuelve un filtro que deja pasar solo al perfil directivo; a los demás les responde **403** con el mensaje indicado. |

### 3.4 `src/controllers/reservasController.js` — lógica de reservas

| Función | Qué hace |
| --- | --- |
| `actualizarEstadosFinalizados` | Antes de cada consulta, marca como `finalizada` las reservas activas cuya fecha y hora ya pasaron (hora de Bogotá). |
| `listar` | Devuelve las reservas ordenadas por fecha y hora. El directivo ve todas; los demás solo las suyas. Aplica filtros `espacio`, `solicitante`, `estado` y `fecha`. |
| `obtenerPorId` | Devuelve una reserva (404 si no existe, 403 si es de otra persona). |
| `crear` | 1) toma el solicitante de la sesión, 2) valida los datos (400), 3) busca cruces (409), 4) guarda y responde 201. |
| `editar` | Solo permite editar reservas **activas y futuras** del propio usuario (o cualquiera si es directivo). Vuelve a validar y a revisar cruces ignorando la misma reserva. |
| `cancelar` | Cambia el estado a `cancelada` sin borrar el registro (queda el historial). |
| `listarPorEspacio` / `listarPorSolicitante` | Implementan RF8 y RF9. |
| `consultarDisponibilidad` | Recibe `espacio` y `fecha` y devuelve las reservas **activas** de ese día y si el espacio está libre (RF7). |

### 3.5 `src/controllers/espaciosController.js`

| Función | Qué hace |
| --- | --- |
| `validarEspacio` | Exige nombre (≥ 3 caracteres), ubicación y capacidad entera mayor que cero. |
| `listar` / `obtenerPorId` | Consultan espacios. |
| `crear` / `editar` | Validan, impiden nombres repetidos (409) y guardan. Solo los alcanza el directivo. |

### 3.6 `src/controllers/usuariosController.js`

| Función | Qué hace |
| --- | --- |
| `ROLES_PERMITIDOS` | Solo `alumno` y `docente`: nadie puede registrarse como directivo. |
| `registro` | Valida nombre, correo, contraseña (≥ 8 caracteres) y perfil; evita correos repetidos (409); crea la cuenta e inicia sesión. |
| `login` | Verifica correo y contraseña y entrega un token; el mismo mensaje sirve para "correo malo" y "clave mala" para no dar pistas. |
| `logout` | Elimina el token de la sesión. |
| `perfil` / `listar` | Devuelven el usuario actual / todos los usuarios (solo directivo). |

### 3.7 `src/utils/validaciones.js` — reglas reutilizables

| Función | Qué hace |
| --- | --- |
| `fechaActualBogota` / `horaActualBogota` | Dan la fecha y hora de Colombia sin depender de la zona horaria del servidor. |
| `esFechaISOValida` | Comprueba formato `AAAA-MM-DD` y que la fecha exista (rechaza 2026-02-30). |
| `esHoraValida` | Comprueba formato `HH:MM` de 24 horas. |
| `validarDatosReserva` | Verifica espacio existente, solicitante, fecha no pasada, horas válidas, fin posterior al inicio, hora de inicio no pasada si es hoy y motivo ≤ 300 caracteres (RF10). Devuelve el error o los datos limpios. |
| `hayCruceHorario` | **Regla principal (RF6):** misma espacio + misma fecha + `inicioNuevo < finExistente` y `finNuevo > inicioExistente`. Ignora reservas no activas y, al editar, la propia reserva. |
| `reservaEsFutura` | Dice si una reserva aún no ha empezado (para permitir editar o cancelar). |

### 3.8 `src/data/` — datos en memoria

| Archivo | Qué contiene |
| --- | --- |
| `espacios.js` | Arreglo con 3 espacios iniciales y funciones `listarEspacios`, `buscarEspacio`, `crearEspacio`, `actualizarEspacio`. |
| `reservas.js` | Arreglo vacío y funciones `crearReserva` (asigna ID, estado `activa` y fechas), `actualizarReserva`, `cancelarReserva`, `buscarReserva`, `listarReservas`. |
| `usuarios.js` | Cuentas y sesiones. Contraseña guardada con **PBKDF2 + sal aleatoria** (nunca en texto visible); token de 64 caracteres aleatorios con **vigencia de 8 horas**; `vistaPublica` oculta hash y sal; crea el directivo de prueba al iniciar. |

Los datos se pierden al reiniciar el servidor; así lo pide el alcance (datos en memoria).

---

## 4. Frontend (`public/`)

### 4.1 `index.html`

| Bloque | Qué hace |
| --- | --- |
| `#auth-screen` | Pantalla de acceso con formularios de *iniciar sesión* y *crear cuenta*. |
| `.sidebar` / `.main-nav` | Menú lateral. Los botones con `data-admin-only` solo los ve el directivo. |
| `#view-dashboard` | Resumen: contadores y próximas reservas. |
| `#view-form` | Formulario de nueva reserva / edición. |
| `#view-reservas` | Filtros, tabla de reservas y botón de exportar CSV. |
| `#view-disponibilidad` | Consulta de disponibilidad por espacio y fecha. |
| `#view-espacios` | Lista y formulario de espacios (directivo). |
| `#view-perfiles` | Cuentas registradas (directivo). |
| `<dialog id="reservation-dialog">` | Ventana emergente con el detalle de una reserva. |

### 4.2 `styles.css`

| Bloque | Qué hace |
| --- | --- |
| `:root { --blue … }` | Variables de color y radio, para cambiar el estilo en un solo lugar. |
| `.app-shell`, `.sidebar`, `.main-content` | Disposición de dos columnas: menú y contenido. |
| `.button`, `.panel`, formularios | Estilo común de botones, tarjetas y campos. |
| Insignias de estado | Verde (activa), rojo (cancelada), gris (finalizada). |
| `@media` | Adapta el diseño a pantallas pequeñas. |

### 4.3 `app.js`

| Bloque | Qué hace |
| --- | --- |
| `storage` | Guarda token y usuario en `localStorage` **con protección**: si el navegador lo bloquea (pasa a veces en el iframe de StackBlitz) la app sigue funcionando. |
| `state` | Objeto con el estado actual: espacios, reservas, vista, token y usuario. |
| `escapeHtml` | Evita que texto escrito por usuarios se interprete como código HTML. |
| `formatDate`, `formatDateTime`, `localDateString` | Dan formato a las fechas. |
| `api(url, options)` | Función central: añade el token a cada petición, llama a `fetch`, y convierte errores del servidor en mensajes. |
| `showToast`, `showFormMessage` | Avisos de éxito o error al usuario. |
| `loadBaseData`, `populateSpaceSelects` | Cargan los espacios y llenan las listas desplegables. |
| `switchView` | Cambia entre pantallas del menú. |
| `renderDashboard` | Pinta el resumen del inicio. |
| `loadReservationList`, `reservationRow` | Piden las reservas con los filtros y dibujan cada fila con sus acciones. |
| `resetReservationForm`, `startEditingReservation` | Preparan el formulario para crear o editar. |
| `openReservationDetail`, `cancelReservation` | Muestran el detalle y cancelan con confirmación. |
| `renderSpaces`, `editSpace`, `resetSpaceForm` | Gestión visual de espacios. |
| `consultAvailability` | Llama a `/reservas/disponibilidad` y muestra ocupación. |
| `exportReservationsCsv` | Genera y descarga un CSV con las reservas filtradas. |
| `registerEvents` | Conecta cada botón y formulario con su función. |
| `startApp` | Al abrir la página: conecta eventos, maneja login/registro/logout y, si ya había sesión, la restaura consultando `/usuarios/perfil`. |

---

## 5. Pruebas (`tests/`)

| Archivo | Qué prueba |
| --- | --- |
| `validaciones.test.js` | Fechas y horas válidas, cruces simples y edición ignorando la propia reserva. |
| `cruces.test.js` | Los 5 casos de la tabla de cruces del documento del proyecto. |
| `reservasController.test.js` | Flujo de reservas: crear, rechazar cruce, editar, disponibilidad y cancelar. |
| `api.test.js` | Prueba real contra el servidor: 401 sin sesión, registro y login, permisos 403, cruce 409, cierre de sesión. |

Se ejecutan con `npm test` (resultado esperado: 14 aprobadas).

## 6. Configuración

| Archivo | Para qué sirve |
| --- | --- |
| `package.json` | Nombre, scripts (`start`, `test`), versión mínima de Node y dependencia `express`. |
| `.stackblitzrc` | Le indica a StackBlitz que instale dependencias y ejecute `npm start` automáticamente. |
| `.gitignore` | Evita subir `node_modules` y archivos locales a GitHub. |

## 7. Qué se cambió respecto al ZIP original

1. **Autenticación sacada de `index.js`** a `middleware/auth.js` y `controllers/usuariosController.js`, para respetar la separación rutas / controladores / datos (RNF5).
2. **Contraseñas con PBKDF2** (más portable que `scrypt` en StackBlitz) y **sesiones que caducan a las 8 horas**.
3. **El solicitante se toma de la sesión** en la API: antes la API exigía enviarlo en el cuerpo de la petición, lo que permitía escribir otro nombre; ahora un alumno o docente no puede reservar a nombre de otra persona.
4. **Validación extra:** no se puede reservar con hora de inicio ya pasada el mismo día.
5. **`localStorage` protegido** para que no falle en la vista previa de StackBlitz.
6. **Configuración StackBlitz:** `.stackblitzrc`, `engines` y servidor escuchando en `0.0.0.0`.
7. **Documentos actualizados** (`README`, `requisitos`, `diseño`, `pruebas`) que decían que no había autenticación; nuevo `planeacion.md` con backlog, sprints y Kanban.
8. **Pruebas nuevas:** de 5 a 14 (cruces del documento y API completa).
