// Usuarios y sesiones en memoria: prototipo académico, no producción.
// Se usa PBKDF2 (módulo crypto de Node) porque funciona igual en StackBlitz y en un servidor normal.
const crypto = require('crypto');

const ITERACIONES = 100000;
const LONGITUD_HASH = 64;
const ALGORITMO = 'sha512';
const DURACION_SESION_MS = 8 * 60 * 60 * 1000; // 8 horas

const usuarios = [];
const sesiones = new Map(); // token -> { usuarioId, expira }
let siguienteId = 1;

function calcularHash(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERACIONES, LONGITUD_HASH, ALGORITMO);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: calcularHash(password, salt).toString('hex') };
}

function crearUsuario({ nombre, correo, password, rol }) {
  const credenciales = hashPassword(password);
  const usuario = {
    id: siguienteId++,
    nombre: nombre.trim(),
    correo: correo.trim().toLowerCase(),
    rol,
    ...credenciales
  };
  usuarios.push(usuario);
  return usuario;
}

function buscarPorCorreo(correo) {
  const buscado = String(correo || '').trim().toLowerCase();
  return usuarios.find((u) => u.correo === buscado);
}

function verificarPassword(usuario, password) {
  if (!usuario) return false;
  const intento = calcularHash(password, usuario.salt);
  return crypto.timingSafeEqual(intento, Buffer.from(usuario.hash, 'hex'));
}

// Nunca se devuelven el hash ni la sal.
function vistaPublica(u) {
  return { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol };
}

function crearSesion(usuario) {
  const token = crypto.randomBytes(32).toString('hex');
  sesiones.set(token, { usuarioId: usuario.id, expira: Date.now() + DURACION_SESION_MS });
  return token;
}

function usuarioPorToken(token) {
  const sesion = sesiones.get(token);
  if (!sesion) return null;
  if (sesion.expira < Date.now()) {
    sesiones.delete(token);
    return null;
  }
  return usuarios.find((u) => u.id === sesion.usuarioId) || null;
}

function cerrarSesion(token) {
  sesiones.delete(token);
}

function listarUsuarios() {
  return usuarios.map(vistaPublica);
}

// Cuenta inicial de directivo para pruebas. Cambiar credenciales en cualquier despliegue real.
crearUsuario({
  nombre: 'Directivo de prueba',
  correo: 'juan2947@unioc.edu.co',
  password: 'camiloparra',
  rol: 'directivo'
});

module.exports = {
  crearUsuario,
  buscarPorCorreo,
  verificarPassword,
  vistaPublica,
  crearSesion,
  usuarioPorToken,
  cerrarSesion,
  listarUsuarios
};
