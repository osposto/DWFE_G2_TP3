require('dotenv').config();
const express = require('express');
const path = require('path');
const agenteBuscarHandler = require('./api/agente-buscar.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint de catálogo de partidos (Búsqueda manual)
app.get('/api/partidos', (req, res) => {
  try {
    const partidos = require('./data/partidos.json');
    res.json({ ok: true, total: partidos.length, partidos });
  } catch (err) {
    res.json({ ok: true, total: 0, partidos: [] });
  }
});

// Endpoint del Agente Inteligente (Reglas R1 y R2 + Gemini 3.8 Flash)
app.post('/api/agente-buscar', agenteBuscarHandler);

// Fallback para SPA en desarrollo local (compatible con Express 5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// En desarrollo local, iniciar servidor en el puerto configurado
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor FUL Y VALE APP activo en http://localhost:${PORT}`);
  });
}

module.exports = app;
