const test = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../src/controllers/reservasController');
const { fechaActualBogota } = require('../src/utils/validaciones');

function fechaFutura(dias) {
  const [anio, mes, dia] = fechaActualBogota().split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}-${String(fecha.getUTCDate()).padStart(2, '0')}`;
}

function llamarControlador(controlador, req) {
  const res = {
    statusCode: 200,
    body: null,
    status(codigo) { this.statusCode = codigo; return this; },
    json(cuerpo) { this.body = cuerpo; return this; }
  };
  controlador(req, res);
  return res;
}

test('flujo de reservas: crear, rechazar cruces, editar, consultar y cancelar', () => {
  const fecha = fechaFutura(3);
  const datos = {
    espacio: 1,
    solicitante: 'Ana Pérez',
    fecha,
    horaInicio: '08:00',
    horaFin: '10:00',
    motivo: 'Trabajo grupal'
  };

  let respuesta = llamarControlador(controller.crear, { body: datos });
  assert.equal(respuesta.statusCode, 201);
  assert.equal(respuesta.body.reserva.estado, 'activa');
  const idPrimera = respuesta.body.reserva.id;

  respuesta = llamarControlador(controller.crear, { body: { ...datos, solicitante: 'Luis Mora', horaInicio: '09:00', horaFin: '11:00' } });
  assert.equal(respuesta.statusCode, 409, 'rechaza intervalos que se cruzan');

  respuesta = llamarControlador(controller.crear, { body: { ...datos, solicitante: 'Luis Mora', horaInicio: '10:00', horaFin: '12:00' } });
  assert.equal(respuesta.statusCode, 201, 'permite horarios consecutivos');

  respuesta = llamarControlador(controller.editar, { params: { id: String(idPrimera) }, body: { ...datos, horaInicio: '07:00', horaFin: '08:00' } });
  assert.equal(respuesta.statusCode, 200, 'la edición ignora la propia reserva al validar cruces');

  respuesta = llamarControlador(controller.consultarDisponibilidad, { query: { espacio: '1', fecha } });
  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body.totalReservasActivas, 2);

  respuesta = llamarControlador(controller.cancelar, { params: { id: String(idPrimera) } });
  assert.equal(respuesta.statusCode, 200);
  assert.equal(respuesta.body.reserva.estado, 'cancelada');

  respuesta = llamarControlador(controller.crear, { body: { ...datos, solicitante: 'María Sol', horaInicio: '07:30', horaFin: '08:30' } });
  assert.equal(respuesta.statusCode, 201, 'la reserva cancelada ya no bloquea su antiguo horario');

  respuesta = llamarControlador(controller.listar, { query: {} });
  assert.equal(respuesta.body.length, 3, 'la cancelada se conserva en el listado');
});
