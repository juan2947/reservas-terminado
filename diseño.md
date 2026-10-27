# Diseño — Reserva de espacios académicos

## 1. Arquitectura básica
```
Navegador (public/) → Ruta (routes) → [Middleware auth] → Controlador (controllers) → Datos (data) → Respuesta JSON
```
La ruta recibe la petición; el middleware comprueba la sesión; el controlador valida y aplica las reglas; el módulo de datos lee o modifica la memoria; el controlador responde en JSON.

## 2. Estructura de carpetas
```
/Reserva_Espacios_Academicos
├── index.js                  Servidor Express (arranque y conexión de rutas)
├── package.json
├── .stackblitzrc             Configuración para StackBlitz
├── src
│   ├── routes
│   │   ├── reservas.js
│   │   ├── espacios.js
│   │   └── usuarios.js
│   ├── controllers
│   │   ├── reservasController.js
│   │   ├── espaciosController.js
│   │   └── usuariosController.js
│   ├── middleware
│   │   └── auth.js           autenticar / soloDirectivo
│   ├── data
│   │   ├── reservas.js
│   │   ├── espacios.js
│   │   └── usuarios.js
│   └── utils
│       └── validaciones.js   fechas, horas y cruces
├── public                    Interfaz web (index.html, styles.css, app.js)
├── tests                     Pruebas automáticas (node --test)
├── requisitos.md · planeacion.md · diseño.md · pruebas.md · README.md
├── GUIA_STACKBLITZ.md
└── GUIA_EXPLICATIVA_DEL_PROYECTO.md
```

## 3. Modelo de datos
### Espacio
| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| id | Número | Sí | Identificador único. |
| nombre | Texto | Sí | Nombre del espacio (mín. 3 caracteres, no repetido). |
| ubicacion | Texto | Sí | Lugar donde se encuentra. |
| capacidad | Número | Sí | Máximo de personas (entero ≥ 1). |

### Reserva
| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| id | Número | Sí | Identificador único. |
| espacio | Número | Sí | ID del espacio reservado. |
| solicitante | Texto | Sí | Persona que reserva (se toma de la sesión). |
| fecha | Texto AAAA-MM-DD | Sí | Fecha de la reserva (no puede ser pasada). |
| horaInicio | Texto HH:MM | Sí | Hora de inicio (24 h). |
| horaFin | Texto HH:MM | Sí | Hora de fin, posterior a la de inicio. |
| estado | Texto | Sí | `activa`, `cancelada` o `finalizada`. |
| motivo | Texto | No | Hasta 300 caracteres. |
| usuarioId / perfilSolicitante | Número / Texto | Auto | Dueño de la reserva y su perfil. |
| creadaEn / modificadaEn / canceladaEn | Fecha ISO | Auto | Trazabilidad. |

### Usuario (extensión)
id, nombre, correo (único), rol (`alumno`, `docente`, `directivo`), salt y hash de contraseña (nunca se devuelven).

## 4. Rutas de la API
| Método | Ruta | Función | Acceso |
| --- | --- | --- | --- |
| GET | /reservas | Lista reservas (filtros: espacio, solicitante, estado, fecha) | Sesión |
| GET | /reservas/:id | Consulta una reserva | Dueño o directivo |
| POST | /reservas | Crea una reserva | Sesión |
| PUT | /reservas/:id | Edita una reserva activa y futura | Dueño o directivo |
| DELETE | /reservas/:id | Cancela una reserva (queda en el historial) | Dueño o directivo |
| GET | /reservas/disponibilidad?espacio=&fecha= | Disponibilidad de un espacio en una fecha | Sesión |
| GET | /reservas/espacio/:espacioId | Reservas de un espacio | Sesión |
| GET | /reservas/solicitante/:solicitante | Reservas de un solicitante | Sesión |
| GET | /espacios, /espacios/:id | Consulta espacios | Sesión |
| POST, PUT | /espacios, /espacios/:id | Crea o edita espacios | Directivo |
| POST | /usuarios/registro, /usuarios/login | Alta e inicio de sesión | Público |
| POST | /usuarios/logout · GET /usuarios/perfil | Cerrar sesión · ver perfil | Sesión |
| GET | /usuarios | Lista de perfiles | Directivo |
| GET | /api/estado | Comprobar que el servidor responde | Público |

Las rutas específicas (`/disponibilidad`, `/espacio/…`, `/solicitante/…`) se declaran antes de `/:id` para que no se confundan con un ID.

## 5. Regla de negocio principal: evitar cruces
Hay conflicto si: **mismo espacio + misma fecha + horaInicioNueva < horaFinExistente + horaFinNueva > horaInicioExistente** (solo se comparan reservas `activa`).

| Reserva existente | Nueva reserva | Resultado |
| --- | --- | --- |
| 08:00–10:00 | 10:00–12:00 | Permitida |
| 08:00–10:00 | 09:00–11:00 | Rechazada (409) |
| 08:00–10:00 | 08:30–09:30 | Rechazada (409) |
| 08:00–10:00 | 07:00–08:00 | Permitida |
| 08:00–10:00 | 10:00–11:00 | Permitida |

Estos cinco casos están automatizados en `tests/cruces.test.js`.

## 6. Permisos por perfil
| Acción | Alumno | Docente | Directivo |
| --- | :---: | :---: | :---: |
| Registrarse / iniciar sesión | ✔ | ✔ | ✔ (cuenta de prueba) |
| Consultar disponibilidad y espacios | ✔ | ✔ | ✔ |
| Crear reserva | ✔ | ✔ | ✔ |
| Ver, editar y cancelar sus reservas | ✔ | ✔ | ✔ |
| Ver, editar y cancelar reservas ajenas | ✘ | ✘ | ✔ |
| Crear / editar espacios | ✘ | ✘ | ✔ |
| Listar perfiles registrados | ✘ | ✘ | ✔ |

## 7. Interfaz
Una sola página (`public/index.html`) con pantalla de acceso (iniciar sesión / crear cuenta) y panel con menú lateral: Inicio, Nueva reserva, Reservas, Disponibilidad, y para directivos Espacios y Perfiles. Paleta azul institucional `#1E4FA3`, verde menta `#2BA37F`; estados con color (verde activa, rojo cancelada). Diseño adaptable a pantallas pequeñas.
