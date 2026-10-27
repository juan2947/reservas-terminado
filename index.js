const express = require('express');
const path = require('path');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const { autenticar } = require('./src/middleware/auth');

// Usuarios: registro y login son públicos; el resto se protege dentro de la ruta.
app.use('/usuarios', require('./src/routes/usuarios'));

// API principal del Caso 2: exige sesión iniciada.
app.use('/reservas', autenticar, require('./src/routes/reservas'));
app.use('/espacios', autenticar, require('./src/routes/espacios'));

app.get('/api/estado', (req, res) => {
  res.json({
    ok: true,
    aplicacion: 'Reserva de espacios académicos',
    almacenamiento: 'memoria',
    mensaje: 'Los datos se reinician al reiniciar el servidor.'
  });
});

// Respuesta JSON para rutas que no existen.
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Ruta no encontrada.',
    ruta: req.originalUrl
  });
});

// Manejo de JSON mal formado y otros errores inesperados.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      ok: false,
      error: 'El cuerpo de la solicitud contiene JSON inválido.'
    });
  }

  console.error(err);
  return res.status(500).json({
    ok: false,
    error: 'Ocurrió un error interno en el servidor.'
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Reserva de espacios activa en el puerto ${PORT}`);
  });
}

module.exports = app;
