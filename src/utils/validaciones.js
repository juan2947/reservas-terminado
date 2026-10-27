function obtenerPartesFechaBogota() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  return Object.fromEntries(partes.filter((parte) => parte.type !== 'literal').map((parte) => [parte.type, parte.value]));
}

function fechaActualBogota() {
  const p = obtenerPartesFechaBogota();
  return `${p.year}-${p.month}-${p.day}`;
}

function horaActualBogota() {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const valores = Object.fromEntries(p.filter((parte) => parte.type !== 'literal').map((parte) => [parte.type, parte.value]));
  return `${valores.hour}:${valores.minute}`;
}

function esFechaISOValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const comprobacion = new Date(Date.UTC(anio, mes - 1, dia));
  return comprobacion.getUTCFullYear() === anio
    && comprobacion.getUTCMonth() === mes - 1
    && comprobacion.getUTCDate() === dia;
}

function esHoraValida(hora) {
  return typeof hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

function validarDatosReserva(datos, espacios) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return { error: 'Envía los datos de la reserva en formato JSON.' };
  }

  const espacioId = Number(datos.espacio ?? datos.espacioId);
  if (!Number.isInteger(espacioId) || espacioId <= 0) {
    return { error: 'Debes seleccionar un espacio válido.' };
  }
  const espacio = espacios.find((item) => item.id === espacioId);
  if (!espacio) return { error: 'El espacio seleccionado no existe.' };

  const solicitante = typeof datos.solicitante === 'string' ? datos.solicitante.trim() : '';
  if (solicitante.length < 3) {
    return { error: 'El nombre del solicitante debe tener al menos 3 caracteres.' };
  }

  const fecha = datos.fecha;
  if (!esFechaISOValida(fecha)) {
    return { error: 'La fecha debe ser válida y usar el formato AAAA-MM-DD.' };
  }
  if (fecha < fechaActualBogota()) {
    return { error: 'No se permiten reservas en fechas pasadas.' };
  }

  const horaInicio = datos.horaInicio;
  const horaFin = datos.horaFin;
  if (!esHoraValida(horaInicio) || !esHoraValida(horaFin)) {
    return { error: 'Las horas deben usar el formato HH:MM de 24 horas.' };
  }
  if (horaFin <= horaInicio) {
    return { error: 'La hora de fin debe ser posterior a la hora de inicio.' };
  }
  if (fecha === fechaActualBogota() && horaInicio <= horaActualBogota()) {
    return { error: 'La hora de inicio ya pasó; elige una hora posterior a la actual.' };
  }

  const motivo = typeof datos.motivo === 'string' ? datos.motivo.trim() : '';
  if (motivo.length > 300) {
    return { error: 'El motivo no puede superar los 300 caracteres.' };
  }

  return {
    datos: {
      espacio: espacioId,
      solicitante,
      fecha,
      horaInicio,
      horaFin,
      motivo
    }
  };
}

function hayCruceHorario(nuevaReserva, reservas, idIgnorado = null) {
  return reservas.find((existente) => {
    if (existente.id === Number(idIgnorado)) return false;
    if (existente.estado !== 'activa') return false;
    if (existente.espacio !== Number(nuevaReserva.espacio)) return false;
    if (existente.fecha !== nuevaReserva.fecha) return false;

    // Dos reservas se cruzan si sus intervalos se superponen.
    return nuevaReserva.horaInicio < existente.horaFin
      && nuevaReserva.horaFin > existente.horaInicio;
  }) || null;
}

function reservaEsFutura(reserva) {
  const hoy = fechaActualBogota();
  if (reserva.fecha > hoy) return true;
  if (reserva.fecha < hoy) return false;
  return reserva.horaInicio > horaActualBogota();
}

module.exports = {
  fechaActualBogota,
  horaActualBogota,
  esFechaISOValida,
  esHoraValida,
  validarDatosReserva,
  hayCruceHorario,
  reservaEsFutura
};
