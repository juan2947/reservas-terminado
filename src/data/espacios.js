// Datos temporales en memoria. No se utiliza una base de datos.
const espacios = [
  { id: 1, nombre: 'Sala de estudio 1', ubicacion: 'Bloque A', capacidad: 6 },
  { id: 2, nombre: 'Sala de estudio 3', ubicacion: 'Bloque B', capacidad: 8 },
  { id: 3, nombre: 'Laboratorio de sistemas', ubicacion: 'Bloque C', capacidad: 30 }
];

let siguienteId = 4;

function listarEspacios() {
  return espacios;
}

function buscarEspacio(id) {
  return espacios.find((espacio) => espacio.id === Number(id));
}

function crearEspacio(datos) {
  const nuevo = { id: siguienteId++, ...datos };
  espacios.push(nuevo);
  return nuevo;
}

function actualizarEspacio(id, datos) {
  const espacio = buscarEspacio(id);
  if (!espacio) return null;
  Object.assign(espacio, datos);
  return espacio;
}

module.exports = {
  listarEspacios,
  buscarEspacio,
  crearEspacio,
  actualizarEspacio
};
