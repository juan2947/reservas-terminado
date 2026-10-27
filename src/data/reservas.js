// La lista comienza vacía y vive únicamente mientras el servidor está encendido.
const reservas = [];
let siguienteId = 1;

function listarReservas() {
  return reservas;
}

function buscarReserva(id) {
  return reservas.find((reserva) => reserva.id === Number(id));
}

function crearReserva(datos) {
  const nueva = {
    id: siguienteId++,
    ...datos,
    usuarioId: datos.usuarioId ?? null,
    perfilSolicitante: datos.perfilSolicitante ?? null,
    estado: 'activa',
    creadaEn: new Date().toISOString(),
    canceladaEn: null,
    modificadaEn: null
  };
  reservas.push(nueva);
  return nueva;
}

function actualizarReserva(id, datos) {
  const reserva = buscarReserva(id);
  if (!reserva) return null;
  Object.assign(reserva, datos, { modificadaEn: new Date().toISOString() });
  return reserva;
}

function cancelarReserva(id) {
  const reserva = buscarReserva(id);
  if (!reserva) return null;
  reserva.estado = 'cancelada';
  reserva.canceladaEn = new Date().toISOString();
  return reserva;
}

module.exports = {
  listarReservas,
  buscarReserva,
  crearReserva,
  actualizarReserva,
  cancelarReserva
};
