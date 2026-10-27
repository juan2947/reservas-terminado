# Reserva de Espacios Académicos

Aplicación web del Caso 2 de Programación Aplicada. Permite reservar salas de estudio y laboratorios y **evita que dos reservas se crucen** en el mismo espacio y fecha. Incluye registro e inicio de sesión con perfiles de alumno, docente y directivo.

## Tecnología
- Node.js + Express (servidor y API JSON).
- HTML, CSS y JavaScript puro (interfaz en `public/`).
- Datos en arreglos de JavaScript en memoria (sin base de datos).
- Pruebas con el ejecutor nativo de Node (`node --test`), sin dependencias extra.

## Cuenta de demostración
| Perfil | Correo | Contraseña |
| --- | --- | --- |
| Directivo | `directivo@institucion.edu` | `Admin123!` |

Alumnos y docentes crean su cuenta desde **Crear cuenta**. Nadie puede registrarse como directivo.

## Ejecutar
```bash
npm install
npm start      # http://localhost:3000
npm test       # 14 pruebas automáticas
```
En StackBlitz consulta **GUIA_STACKBLITZ.md** (paso a paso). El servidor usa `process.env.PORT` si existe y, si no, el puerto 3000.

## Rutas principales
Todas devuelven JSON y, salvo las públicas, exigen `Authorization: Bearer <token>`.

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/usuarios/registro`, `/usuarios/login` | Públicas. Devuelven `token`. |
| POST | `/usuarios/logout` · GET `/usuarios/perfil` | Cerrar sesión · perfil actual. |
| GET | `/usuarios` | Lista de perfiles (solo directivo). |
| GET | `/reservas` | Lista (filtros `espacio`, `solicitante`, `estado`, `fecha`). |
| GET | `/reservas/:id` | Consulta una reserva. |
| POST | `/reservas` | Crea una reserva (409 si hay cruce). |
| PUT | `/reservas/:id` | Edita una reserva activa y futura. |
| DELETE | `/reservas/:id` | Cancela (queda en el historial). |
| GET | `/reservas/disponibilidad?espacio=1&fecha=AAAA-MM-DD` | Reservas activas del espacio ese día. |
| GET | `/reservas/espacio/:espacioId` | Reservas de un espacio. |
| GET | `/reservas/solicitante/:solicitante` | Reservas de un solicitante. |
| GET/POST/PUT | `/espacios`, `/espacios/:id` | Consultar (todos) · crear/editar (directivo). |
| GET | `/api/estado` | Comprueba que el servidor responde (pública). |

## Ejemplo: crear una reserva
```json
POST /reservas
{ "espacio": 1, "fecha": "2026-12-01", "horaInicio": "08:00", "horaFin": "10:00", "motivo": "Trabajo grupal" }
```
El solicitante se toma de la sesión. Si hay cruce, la respuesta es HTTP `409` con el horario en conflicto.

## Documentos del proyecto
`requisitos.md` · `planeacion.md` · `diseño.md` · `pruebas.md` · `GUIA_STACKBLITZ.md` · `GUIA_EXPLICATIVA_DEL_PROYECTO.md`

## Límites
- Los datos (reservas, cuentas y sesiones) se pierden al reiniciar el servidor; es una decisión del alcance académico.
- Antes de un uso real: base de datos, cambiar la contraseña del directivo, HTTPS y límite de intentos de login.
