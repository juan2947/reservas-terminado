const test = require('node:test');
const assert = require('node:assert/strict');
const {
  esFechaISOValida,
  esHoraValida,
  hayCruceHorario
} = require('../src/utils/validaciones');

test('acepta fechas reales en formato AAAA-MM-DD', () => {
  assert.equal(esFechaISOValida('2026-10-19'), true);
  assert.equal(esFechaISOValida('2026-02-30'), false);
  assert.equal(esFechaISOValida('19-10-2026'), false);
});

test('valida horas en formato de 24 horas', () => {
  assert.equal(esHoraValida('08:00'), true);
  assert.equal(esHoraValida('23:59'), true);
  assert.equal(esHoraValida('25:10'), false);
  assert.equal(esHoraValida('8:00'), false);
});

test('detecta cruces y permite reservas consecutivas', () => {
  const existentes = [{ id: 1, espacio: 2, fecha: '2026-12-01', horaInicio: '08:00', horaFin: '10:00', estado: 'activa' }];
  const cruzada = { espacio: 2, fecha: '2026-12-01', horaInicio: '09:00', horaFin: '11:00' };
  const consecutiva = { espacio: 2, fecha: '2026-12-01', horaInicio: '10:00', horaFin: '12:00' };
  const otroEspacio = { espacio: 3, fecha: '2026-12-01', horaInicio: '09:00', horaFin: '11:00' };

  assert.equal(hayCruceHorario(cruzada, existentes)?.id, 1);
  assert.equal(hayCruceHorario(consecutiva, existentes), null);
  assert.equal(hayCruceHorario(otroEspacio, existentes), null);
  assert.equal(hayCruceHorario(cruzada, [{ ...existentes[0], estado: 'cancelada' }]), null);
});

test('al editar, ignora la misma reserva al comparar horarios', () => {
  const existentes = [{ id: 7, espacio: 2, fecha: '2026-12-01', horaInicio: '08:00', horaFin: '10:00', estado: 'activa' }];
  const misma = { espacio: 2, fecha: '2026-12-01', horaInicio: '09:00', horaFin: '11:00' };
  assert.equal(hayCruceHorario(misma, existentes, 7), null);
});
