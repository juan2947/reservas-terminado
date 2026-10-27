# Requisitos — Reserva de espacios académicos

## Objetivo
Desarrollar una aplicación web que permita gestionar reservas de espacios académicos (salas de estudio y laboratorios), consultar su disponibilidad y evitar la duplicidad de reservas cuando exista un cruce de horarios.

## Actores
- **Solicitante** (alumno o docente): registra y consulta sus reservas.
- **Administrador o gestor** (perfil *directivo*): supervisa todas las reservas y gestiona los espacios.
- **Sistema:** valida los datos y comprueba automáticamente los conflictos de horario.

## Entidades principales
| Entidad | Campos |
| --- | --- |
| Espacio | id, nombre, ubicacion, capacidad |
| Reserva | id, espacio, solicitante, fecha, horaInicio, horaFin, estado (+ motivo, usuarioId) |
| Usuario (extensión) | id, nombre, correo, rol, contraseña cifrada |

## Requisitos funcionales (del documento del proyecto)
| ID | Requisito |
| --- | --- |
| RF1 | Crear una nueva reserva. |
| RF2 | Listar las reservas existentes. |
| RF3 | Consultar una reserva específica por su ID. |
| RF4 | Editar una reserva existente. |
| RF5 | Cancelar una reserva (se conserva en el historial con estado `cancelada`). |
| RF6 | Validar que no exista otra reserva para el mismo espacio y fecha con horario que se cruce. |
| RF7 | Consultar la disponibilidad de un espacio en una fecha. |
| RF8 | Listar reservas por espacio. |
| RF9 | Listar reservas por solicitante. |
| RF10 | Validar campos obligatorios y coherencia de horarios. |

## Requisitos funcionales adicionales (extensión con usuarios)
| ID | Requisito |
| --- | --- |
| RF11 | Registrar cuentas de alumno o docente e iniciar / cerrar sesión. |
| RF12 | Un alumno o docente solo ve, edita y cancela **sus propias** reservas. |
| RF13 | El directivo ve y gestiona todas las reservas, crea y edita espacios y consulta los perfiles registrados. |

## Requisitos no funcionales
- **RNF1:** la API responde en formato JSON.
- **RNF2:** los campos obligatorios se validan antes de guardar.
- **RNF3:** la aplicación es accesible desde un navegador web.
- **RNF4:** se usan códigos HTTP adecuados (200, 201, 400, 401, 403, 404, 409, 500).
- **RNF5:** el código está organizado en rutas, controladores y archivos de datos (más `middleware` y `utils`).

## Alcance
Los datos se guardan en arreglos de JavaScript en memoria (sin base de datos) y se reinician al reiniciar el servidor. Es un prototipo académico: antes de uso real se requiere base de datos, cambiar la contraseña del directivo de prueba y usar HTTPS.
