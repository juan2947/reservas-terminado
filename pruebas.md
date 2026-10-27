# Pruebas — Reserva de espacios académicos

## Pruebas automáticas
Ejecuta `npm test`. Resultado esperado: **14 pruebas aprobadas**, que cubren validación de fechas y horas, los cinco casos de cruce del documento, el flujo completo de la API (registro, login, permisos 401/403, crear, cruce 409, editar, cancelar, disponibilidad) y el cierre de sesión.

## Pruebas manuales en la interfaz
Antes: `npm install` y `npm start` (en StackBlitz se hace solo).

| # | Paso | Resultado esperado |
| --- | --- | --- |
| 1 | Entra con `directivo@institucion.edu` / `Admin123!` | Se abre el panel con las opciones Espacios y Perfiles. |
| 2 | Cierra sesión y usa **Crear cuenta** como alumno | Entra directo al panel; no ve Espacios ni Perfiles. |
| 3 | **Nueva reserva**: espacio 1, fecha futura, 08:00–10:00 | Mensaje de éxito; aparece en **Reservas** como *Activa*. |
| 4 | Crea otra en el mismo espacio y fecha, 09:00–11:00 | Error de conflicto (HTTP 409) indicando el horario ocupado. |
| 5 | Crea otra de 10:00–12:00 | Se permite (empieza cuando termina la anterior). |
| 6 | Intenta hora fin 13:00 con hora inicio 14:00 | Error de validación. |
| 7 | **Disponibilidad**: espacio 1 y la fecha usada | Lista las reservas activas de ese día. |
| 8 | Edita una reserva futura | Los cambios se reflejan. |
| 9 | Cancela una reserva | Queda como *Cancelada* y sigue en el historial. |
| 10 | Entra con otra cuenta de alumno | No ve las reservas de la primera cuenta. |
| 11 | Como directivo, abre **Reservas** | Ve las de todos; puede editar o cancelar cualquiera. |
| 12 | **Reservas → Exportar CSV** | Se descarga el listado. |
| 13 | Reinicia el servidor | Se borran reservas y cuentas (datos en memoria). |

## Pruebas de la API (ejemplos con token)
1. `POST /usuarios/login` con el directivo → devuelve `token`.
2. `GET /reservas` con `Authorization: Bearer <token>` → 200. Sin token → 401.
3. `POST /reservas` con `{"espacio":1,"fecha":"AAAA-MM-DD","horaInicio":"08:00","horaFin":"10:00"}` → 201.

## Registro de resultados
Marca solo lo que hayas ejecutado realmente en tu entorno.
