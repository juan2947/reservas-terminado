const espaciosData = require('../data/espacios');

function validarEspacio(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Envía los datos del espacio en formato JSON.' };
  }

  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const ubicacion = typeof body.ubicacion === 'string' ? body.ubicacion.trim() : '';
  const capacidad = Number(body.capacidad);

  if (nombre.length < 3) return { error: 'El nombre debe tener al menos 3 caracteres.' };
  if (ubicacion.length < 2) return { error: 'La ubicación es obligatoria.' };
  if (!Number.isInteger(capacidad) || capacidad < 1) return { error: 'La capacidad debe ser un número entero mayor que cero.' };

  return { datos: { nombre, ubicacion, capacidad } };
}

function listar(req, res) {
  return res.json(espaciosData.listarEspacios());
}

function obtenerPorId(req, res) {
  const espacio = espaciosData.buscarEspacio(req.params.id);
  if (!espacio) return res.status(404).json({ ok: false, error: 'No se encontró el espacio solicitado.' });
  return res.json(espacio);
}

function crear(req, res) {
  const validacion = validarEspacio(req.body);
  if (validacion.error) return res.status(400).json({ ok: false, error: validacion.error });

  const repetido = espaciosData.listarEspacios().some((item) => item.nombre.toLocaleLowerCase('es-CO') === validacion.datos.nombre.toLocaleLowerCase('es-CO'));
  if (repetido) return res.status(409).json({ ok: false, error: 'Ya existe un espacio con ese nombre.' });

  const espacio = espaciosData.crearEspacio(validacion.datos);
  return res.status(201).json({ ok: true, mensaje: 'Espacio creado correctamente.', espacio });
}

function editar(req, res) {
  const existente = espaciosData.buscarEspacio(req.params.id);
  if (!existente) return res.status(404).json({ ok: false, error: 'No se encontró el espacio solicitado.' });

  const validacion = validarEspacio({ ...existente, ...req.body });
  if (validacion.error) return res.status(400).json({ ok: false, error: validacion.error });

  const repetido = espaciosData.listarEspacios().some((item) => item.id !== existente.id && item.nombre.toLocaleLowerCase('es-CO') === validacion.datos.nombre.toLocaleLowerCase('es-CO'));
  if (repetido) return res.status(409).json({ ok: false, error: 'Ya existe otro espacio con ese nombre.' });

  const espacio = espaciosData.actualizarEspacio(existente.id, validacion.datos);
  return res.json({ ok: true, mensaje: 'Espacio actualizado correctamente.', espacio });
}

module.exports = { listar, obtenerPorId, crear, editar };
