const express = require('express');
const controller = require('../controllers/espaciosController');
const { soloDirectivo } = require('../middleware/auth');

const router = express.Router();

// Todos los usuarios con sesión pueden consultar espacios (autenticar se aplica en index.js).
router.get('/', controller.listar);
router.get('/:id', controller.obtenerPorId);

// Solo el directivo crea o edita espacios.
const soloGestores = soloDirectivo('Solo los directivos pueden crear o editar espacios.');
router.post('/', soloGestores, controller.crear);
router.put('/:id', soloGestores, controller.editar);

module.exports = router;
