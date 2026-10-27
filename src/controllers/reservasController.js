const espaciosData = require('../data/espacios');
const reservasData = require('../data/reservas');
const {
  fechaActualBogota,
  horaActualBogota,
  esFechaISOValida,
  validarDatosReserva,
  hayCruceHorario,
  reservaEsFutura
} = require('../utils/validaciones');

function actualizarEstadosFinalizados() {
  const hoy = fechaActualBogota();
  const hora = horaActualBogota();
  reservasData.listarReservas().forEach((reserva) => {
    if (reserva.estado === 'activa') {
      const yaPaso = reserva.fecha < hoy || (reserva.fecha === hoy && reserva.horaFin <= hora);
      if (yaPaso) reserva.estado = 'finalizada';
    }
  });
}

function listar(req, res) {
  actualizarEstadosFinalizados();
  let resultado = [...reservasData.listarReservas()];
  if (req.user && req.user.rol !== 'directivo') resultado = resultado.filter(r => r.usuarioId === req.user.id);
  const { espacio, espacioId, solicitante, estado, fecha } = req.query;
  const filtroEspacio = espacio ?? espacioId;

  if (filtroEspacio) resultado = resultado.filter((r) => r.espacio === Number(filtroEspacio));
  if (solicitante) {
    const termino = String(solicitante).toLocaleLowerCase('es-CO');
    resultado = resultado.filter((r) => r.solicitante.toLocaleLowerCase('es-CO').includes(termino));
  }
  if (estado) resultado = resultado.filter((r) => r.estado === estado);
  if (fecha) resultado = resultado.filter((r) => r.fecha === fecha);

  resultado.sort((a, b) => `${a.fecha}T${a.horaInicio}`.localeCompare(`${b.fecha}T${b.horaInicio}`));
  return res.json(resultado);
}

function obtenerPorId(req, res) {
  actualizarEstadosFinalizados();
  const reserva = reservasData.buscarReserva(req.params.id);
  if (!reserva) return res.status(404).json({ ok: false, error: 'No se encontró la reserva solicitada.' });
  if (req.user && req.user.rol !== 'directivo' && reserva.usuarioId !== req.user.id) return res.status(403).json({ ok: false, error: 'Solo puedes consultar tus propias reservas.' });
  return res.json(reserva);
}

function crear(req, res) {
  actualizarEstadosFinalizados();
  // El solicitante sale de la sesión: un alumno/docente no puede reservar a nombre de otra persona.
  // Solo el directivo puede indicar otro nombre (si no lo envía, se usa el suyo).
  const cuerpo = { ...(req.body || {}) };
  if (req.user && (req.user.rol !== 'directivo' || !cuerpo.solicitante)) cuerpo.solicitante = req.user.nombre;

  const validacion = validarDatosReserva(cuerpo, espaciosData.listarEspacios());
  if (validacion.error) return res.status(400).json({ ok: false, error: validacion.error });

  const conflicto = hayCruceHorario(validacion.datos, reservasData.listarReservas());
  if (conflicto) {
    return res.status(409).json({
      ok: false,
      error: `El espacio ya está reservado de ${conflicto.horaInicio} a ${conflicto.horaFin} en esa fecha. Elige otro horario u otro espacio.`,
      conflicto
    });
  }

  const datosReserva = req.user ? { ...validacion.datos, usuarioId: req.user.id, perfilSolicitante: req.user.rol } : validacion.datos;
  const reserva = reservasData.crearReserva(datosReserva);
  return res.status(201).json({ ok: true, mensaje: 'Reserva creada correctamente.', reserva });
}

function editar(req, res) {
  actualizarEstadosFinalizados();
  const existente = reservasData.buscarReserva(req.params.id);
  if (!existente) return res.status(404).json({ ok: false, error: 'No se encontró la reserva solicitada.' });
  if (req.user && req.user.rol !== 'directivo' && existente.usuarioId !== req.user.id) return res.status(403).json({ ok: false, error: 'Solo puedes editar tus propias reservas.' });
  if (existente.estado !== 'activa' || !reservaEsFutura(existente)) {
    return res.status(409).json({ ok: false, error: 'Solo se pueden editar reservas activas y futuras.' });
  }

  const cuerpoEdicion = req.user && req.user.rol !== 'directivo' ? { ...req.body, solicitante: req.user.nombre } : { ...existente, ...req.body };
  const validacion = validarDatosReserva({ ...existente, ...cuerpoEdicion }, espaciosData.listarEspacios());
  if (validacion.error) return res.status(400).json({ ok: false, error: validacion.error });

  const conflicto = hayCruceHorario(validacion.datos, reservasData.listarReservas(), existente.id);
  if (conflicto) {
    return res.status(409).json({
      ok: false,
      error: `El nuevo horario se cruza con una reserva de ${conflicto.horaInicio} a ${conflicto.horaFin}.`,
      conflicto
    });
  }

  const actualizada = reservasData.actualizarReserva(existente.id, validacion.datos);
  return res.json({ ok: true, mensaje: 'Reserva actualizada correctamente.', reserva: actualizada });
}

function cancelar(req, res) {
  actualizarEstadosFinalizados();
  const existente = reservasData.buscarReserva(req.params.id);
  if (!existente) return res.status(404).json({ ok: false, error: 'No se encontró la reserva solicitada.' });
  if (req.user && req.user.rol !== 'directivo' && existente.usuarioId !== req.user.id) return res.status(403).json({ ok: false, error: 'Solo puedes cancelar tus propias reservas.' });
  if (existente.estado !== 'activa' || !reservaEsFutura(existente)) {
    return res.status(409).json({ ok: false, error: 'Solo se pueden cancelar reservas activas y futuras.' });
  }

  const cancelada = reservasData.cancelarReserva(existente.id);
  return res.json({ ok: true, mensaje: 'Reserva cancelada. Se conservó en el historial.', reserva: cancelada });
}

function listarPorEspacio(req, res) {
  actualizarEstadosFinalizados();
  const espacioId = Number(req.params.espacioId);
  if (!espaciosData.buscarEspacio(espacioId)) {
    return res.status(404).json({ ok: false, error: 'El espacio indicado no existe.' });
  }
  let resultado = reservasData.listarReservas().filter((r) => r.espacio === espacioId);
  if (req.user && req.user.rol !== 'directivo') resultado = resultado.filter(r => r.usuarioId === req.user.id);
  return res.json(resultado);
}

function listarPorSolicitante(req, res) {
  actualizarEstadosFinalizados();
  const termino = String(req.params.solicitante).toLocaleLowerCase('es-CO');
  let resultado = reservasData.listarReservas().filter((r) => r.solicitante.toLocaleLowerCase('es-CO').includes(termino));
  if (req.user && req.user.rol !== 'directivo') resultado = resultado.filter(r => r.usuarioId === req.user.id);
  return res.json(resultado);
}

function consultarDisponibilidad(req, res) {
  actualizarEstadosFinalizados();
  const espacioId = Number(req.query.espacio ?? req.query.espacioId);
  const { fecha } = req.query;
  if (!Number.isInteger(espacioId) || espacioId <= 0 || !fecha) {
    return res.status(400).json({ ok: false, error: 'Debes enviar los parámetros espacio y fecha.' });
  }
  const espacio = espaciosData.buscarEspacio(espacioId);
  if (!espacio) return res.status(404).json({ ok: false, error: 'El espacio indicado no existe.' });
  if (!esFechaISOValida(fecha)) return res.status(400).json({ ok: false, error: 'La fecha no es válida; usa AAAA-MM-DD.' });

  const reservas = reservasData.listarReservas()
    .filter((r) => r.espacio === espacioId && r.fecha === fecha && r.estado === 'activa')
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  return res.json({
    espacio,
    fecha,
    disponible: reservas.length === 0,
    totalReservasActivas: reservas.length,
    reservas: reservas.map(({ id, solicitante, horaInicio, horaFin, motivo, estado }) => ({
      id, solicitante, horaInicio, horaFin, motivo, estado
    }))
  });
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  editar,
  cancelar,
  listarPorEspacio,
  listarPorSolicitante,
  consultarDisponibilidad
};
