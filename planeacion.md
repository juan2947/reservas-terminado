# Planeación ágil — Scrum simplificado

## Roles (rotan entre los integrantes)
| Rol | Responsabilidad |
| --- | --- |
| Product Owner | Vela por que lo construido responda a los requisitos y prioriza el trabajo. |
| Scrum Master | Organiza las reuniones cortas y mantiene el tablero. |
| Developer(s) | Desarrollan las funcionalidades y participan en los demás roles. |

## Product Backlog
| ID | Historia de usuario | Prioridad | Estado |
| --- | --- | --- | --- |
| HU01 | Como usuario, quiero crear una reserva para apartar un espacio académico. | Alta | Hecha |
| HU02 | Como usuario, quiero consultar las reservas existentes. | Alta | Hecha |
| HU03 | Como usuario, quiero consultar una reserva por su ID. | Media | Hecha |
| HU04 | Como usuario, quiero editar una reserva. | Alta | Hecha |
| HU05 | Como usuario, quiero cancelar una reserva. | Alta | Hecha |
| HU06 | Como usuario, quiero consultar la disponibilidad de un espacio en una fecha. | Alta | Hecha |
| HU07 | Como sistema, quiero detectar cruces de horario. | Muy alta | Hecha |
| HU08 | Como usuario, quiero filtrar reservas por espacio. | Media | Hecha |
| HU09 | Como usuario, quiero filtrar reservas por solicitante. | Media | Hecha |
| HU10 | Como persona de la institución, quiero registrarme e iniciar sesión (extensión). | Alta | Hecha |

## Criterios de aceptación principales
| Historia | Criterio |
| --- | --- |
| HU01 | Con datos requeridos y sin conflicto, la reserva se crea (HTTP 201). |
| HU02 | La API devuelve las reservas registradas. |
| HU04 | Una reserva activa y futura se modifica sin generar información inconsistente. |
| HU05 | Una reserva existente puede cancelarse. |
| HU06 | La consulta indica las reservas existentes del espacio y fecha pedidos. |
| HU07 | Una reserva que se cruce se rechaza con HTTP 409 y un mensaje claro. |

## Sprints
| Sprint | Objetivo | Actividades |
| --- | --- | --- |
| 1 — Semana 2 | Funcionalidades base | GET listar/consultar y POST crear; estructura inicial y datos en memoria. |
| 2 — Semana 3 | Funcionalidades restantes | PUT, DELETE, validación de cruces, disponibilidad y filtros. |
| 3 — Semana 4 | Cierre | Ajustes, pruebas, documentación y despliegue. |

## Tablero Kanban
Columnas: **Por hacer · En progreso · Hecho.** Una historia pasa a *Hecho* solo si el código funciona, está subido a GitHub y otro integrante lo probó manualmente.

## Check-in y revisión
Al iniciar cada sesión: ¿qué hice?, ¿qué voy a hacer?, ¿tengo algún bloqueo? Al final de cada sprint se revisan las historias realmente terminadas y se ajusta el backlog.
