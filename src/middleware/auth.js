// Middleware de autenticación y autorización.
// Se ejecuta ANTES de los controladores de las rutas protegidas.
const usuariosData = require('../data/usuarios');

// Lee el token "Bearer" del encabezado Authorization y carga el usuario en req.user.
function autenticar(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const usuario = usuariosData.usuarioPorToken(token);
  if (!usuario) {
    return res.status(401).json({ ok: false, error: 'Debes iniciar sesión para continuar.' });
  }
  req.user = usuariosData.vistaPublica(usuario);
  req.sessionToken = token;
  return next();
}

// Fábrica de middleware: deja pasar solo a usuarios con perfil "directivo".
function soloDirectivo(mensaje = 'Esta acción es solo para directivos.') {
  return (req, res, next) => {
    if (req.user && req.user.rol === 'directivo') return next();
    return res.status(403).json({ ok: false, error: mensaje });
  };
}

module.exports = { autenticar, soloDirectivo };
