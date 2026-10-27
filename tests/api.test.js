// Pruebas de integración: levantan el servidor en un puerto libre y llaman a la API real.
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');
const { fechaActualBogota } = require('../src/utils/validaciones');

let servidor;
let base;

function fechaFutura(dias) {
  const [a, m, d] = fechaActualBogota().split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

async function pedir(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const respuesta = await fetch(base + ruta, {
    method: metodo,
    headers: {
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  return { estado: respuesta.status, datos: await respuesta.json() };
}

test.before(() => new Promise((resolve) => {
  servidor = app.listen(0, () => {
    base = `http://127.0.0.1:${servidor.address().port}`;
    resolve();
  });
}));
test.after(() => new Promise((resolve) => servidor.close(resolve)));

test('las rutas protegidas exigen sesión (401)', async () => {
  assert.equal((await pedir('/reservas')).estado, 401);
  assert.equal((await pedir('/espacios')).estado, 401);
});

test('no se puede registrar un directivo ni usar contraseñas cortas', async () => {
  const base1 = { nombre: 'Persona Prueba', correo: 'x@u.edu', password: 'clave12345', rol: 'directivo' };
  assert.equal((await pedir('/usuarios/registro', { metodo: 'POST', cuerpo: base1 })).estado, 400);
  assert.equal((await pedir('/usuarios/registro', { metodo: 'POST', cuerpo: { ...base1, rol: 'alumno', password: '123' } })).estado, 400);
});

test('flujo completo con permisos por perfil', async () => {
  const fecha = fechaFutura(5);
  const reg = (nombre, correo, rol) => pedir('/usuarios/registro', { metodo: 'POST', cuerpo: { nombre, correo, password: 'clave12345', rol } });

  const ana = (await reg('Ana Pérez', 'ana@u.edu', 'alumno')).datos;
  const luis = (await reg('Luis Mora', 'luis@u.edu', 'docente')).datos;
  assert.ok(ana.token && luis.token);
  assert.equal((await reg('Otra Ana', 'ana@u.edu', 'alumno')).estado, 409, 'correo repetido');

  const login = await pedir('/usuarios/login', { metodo: 'POST', cuerpo: { correo: 'directivo@institucion.edu', password: 'Admin123!' } });
  assert.equal(login.estado, 200);
  const dir = login.datos.token;
  assert.equal((await pedir('/usuarios/login', { metodo: 'POST', cuerpo: { correo: 'ana@u.edu', password: 'mala' } })).estado, 401);

  const datos = { espacio: 1, fecha, horaInicio: '08:00', horaFin: '10:00', motivo: 'Estudio' };
  const creada = await pedir('/reservas', { metodo: 'POST', cuerpo: datos, token: ana.token });
  assert.equal(creada.estado, 201);
  assert.equal(creada.datos.reserva.solicitante, 'Ana Pérez', 'el solicitante sale de la sesión');
  const id = creada.datos.reserva.id;

  const cruce = await pedir('/reservas', { metodo: 'POST', cuerpo: { ...datos, horaInicio: '09:00', horaFin: '11:00' }, token: luis.token });
  assert.equal(cruce.estado, 409);
  assert.equal((await pedir('/reservas', { metodo: 'POST', cuerpo: { ...datos, horaInicio: '10:00', horaFin: '12:00' }, token: luis.token })).estado, 201);

  // Luis no puede ver ni tocar la reserva de Ana; el directivo sí.
  assert.equal((await pedir(`/reservas/${id}`, { token: luis.token })).estado, 403);
  assert.equal((await pedir(`/reservas/${id}`, { metodo: 'DELETE', token: luis.token })).estado, 403);
  const propias = await pedir('/reservas', { token: luis.token });
  assert.equal(propias.datos.length, 1);
  assert.equal((await pedir('/reservas', { token: dir })).datos.length, 2);

  const disp = await pedir(`/reservas/disponibilidad?espacio=1&fecha=${fecha}`, { token: luis.token });
  assert.equal(disp.datos.totalReservasActivas, 2);

  assert.equal((await pedir(`/reservas/${id}`, { metodo: 'PUT', cuerpo: { horaInicio: '07:00', horaFin: '08:00' }, token: ana.token })).estado, 200);
  assert.equal((await pedir(`/reservas/${id}`, { metodo: 'DELETE', token: ana.token })).datos.reserva.estado, 'cancelada');

  // Espacios y usuarios: solo directivo.
  assert.equal((await pedir('/espacios', { metodo: 'POST', cuerpo: { nombre: 'Aula nueva', ubicacion: 'Bloque D', capacidad: 20 }, token: ana.token })).estado, 403);
  assert.equal((await pedir('/espacios', { metodo: 'POST', cuerpo: { nombre: 'Aula nueva', ubicacion: 'Bloque D', capacidad: 20 }, token: dir })).estado, 201);
  assert.equal((await pedir('/usuarios', { token: ana.token })).estado, 403);
  assert.equal((await pedir('/usuarios', { token: dir })).estado, 200);

  assert.equal((await pedir('/usuarios/logout', { metodo: 'POST', token: ana.token })).estado, 200);
  assert.equal((await pedir('/reservas', { token: ana.token })).estado, 401, 'el token cerrado ya no sirve');
});

test('rechaza reservas con hora de inicio ya pasada el mismo día', async () => {
  const dir = (await pedir('/usuarios/login', { metodo: 'POST', cuerpo: { correo: 'directivo@institucion.edu', password: 'Admin123!' } })).datos.token;
  const r = await pedir('/reservas', { metodo: 'POST', cuerpo: { espacio: 1, fecha: fechaActualBogota(), horaInicio: '00:00', horaFin: '00:01' }, token: dir });
  assert.equal(r.estado, 400);
});
