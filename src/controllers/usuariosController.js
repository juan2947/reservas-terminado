const usuariosData = require('../data/usuarios');

// El perfil "directivo" no se puede elegir al registrarse.
const ROLES_PERMITIDOS = ['alumno', 'docente'];

function registro(req, res) {
  const { nombre, correo, password, rol } = req.body || {};
  if (typeof nombre !== 'string' || nombre.trim().length < 3) {
    return res.status(400).json({ ok: false, error: 'Escribe tu nombre completo (mínimo 3 caracteres).' });
  }
  if (typeof correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ ok: false, error: 'Escribe un correo válido.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' });
  }
  if (!ROLES_PERMITIDOS.includes(rol)) {
    return res.status(400).json({ ok: false, error: 'Selecciona el perfil alumno o docente.' });
  }
  if (usuariosData.buscarPorCorreo(correo)) {
    return res.status(409).json({ ok: false, error: 'Ya existe una cuenta con ese correo.' });
  }

  const usuario = usuariosData.crearUsuario({ nombre, correo, password, rol });
  const token = usuariosData.crearSesion(usuario);
  return res.status(201).json({
    ok: true,
    token,
    usuario: usuariosData.vistaPublica(usuario),
    mensaje: 'Cuenta creada correctamente.'
  });
}

function login(req, res) {
  const { correo, password } = req.body || {};
  const usuario = usuariosData.buscarPorCorreo(correo);
  if (!usuariosData.verificarPassword(usuario, String(password || ''))) {
    return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.' });
  }
  return res.json({
    ok: true,
    token: usuariosData.crearSesion(usuario),
    usuario: usuariosData.vistaPublica(usuario),
    mensaje: 'Inicio de sesión correcto.'
  });
}

function logout(req, res) {
  usuariosData.cerrarSesion(req.sessionToken);
  return res.json({ ok: true, mensaje: 'Sesión cerrada.' });
}

function perfil(req, res) {
  return res.json(req.user);
}

function listar(req, res) {
  return res.json(usuariosData.listarUsuarios());
}

module.exports = { registro, login, logout, perfil, listar };
