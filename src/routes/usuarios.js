const express = require('express');
const controller = require('../controllers/usuariosController');
const { autenticar, soloDirectivo } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas: no requieren sesión.
router.post('/registro', controller.registro);
router.post('/login', controller.login);

// Rutas protegidas.
router.post('/logout', autenticar, controller.logout);
router.get('/perfil', autenticar, controller.perfil);
router.get('/', autenticar, soloDirectivo('Solo los directivos pueden consultar todos los perfiles.'), controller.listar);

module.exports = router;
