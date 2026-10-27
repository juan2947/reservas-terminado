const express = require('express');
const controller = require('../controllers/reservasController');

const router = express.Router();

// Las rutas específicas van antes de /:id para evitar confundir "disponibilidad" con un ID.
router.get('/disponibilidad', controller.consultarDisponibilidad);
router.get('/espacio/:espacioId', controller.listarPorEspacio);
router.get('/solicitante/:solicitante', controller.listarPorSolicitante);
router.get('/', controller.listar);
router.get('/:id', controller.obtenerPorId);
router.post('/', controller.crear);
router.put('/:id', controller.editar);
router.delete('/:id', controller.cancelar);

module.exports = router;
