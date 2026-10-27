// Tabla de casos de la sección 4.4 del documento del proyecto (regla para evitar cruces).
const test = require('node:test');
const assert = require('node:assert/strict');
const { hayCruceHorario } = require('../src/utils/validaciones');

const existente = [{ id: 1, espacio: 1, fecha: '2030-01-10', horaInicio: '08:00', horaFin: '10:00', estado: 'activa' }];
const casos = [
  ['10:00', '12:00', false],
  ['09:00', '11:00', true],
  ['08:30', '09:30', true],
  ['07:00', '08:00', false],
  ['10:00', '11:00', false]
];

for (const [horaInicio, horaFin, rechazada] of casos) {
  test(`08:00–10:00 frente a ${horaInicio}–${horaFin}: ${rechazada ? 'rechazada' : 'permitida'}`, () => {
    const nueva = { espacio: 1, fecha: '2030-01-10', horaInicio, horaFin };
    assert.equal(Boolean(hayCruceHorario(nueva, existente)), rechazada);
  });
}
