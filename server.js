require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Cargar catálogo de partidos de básquet
const PARTIDOS_FILE = path.join(__dirname, 'data', 'partidos.json');
function getPartidos() {
  try {
    const raw = fs.readFileSync(PARTIDOS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer partidos.json:', err);
    return [];
  }
}

// Endpoint de catálogo de partidos (Búsqueda manual)
app.get('/api/partidos', (req, res) => {
  const partidos = getPartidos();
  res.json({ ok: true, total: partidos.length, partidos });
});

// Endpoint del Agente Inteligente (Reglas R1 y R2 + Gemini 3.8 Flash)
app.post('/api/agente-buscar', async (req, res) => {
  try {
    const {
      asistidaActiva = true,
      zona = '',
      horario = '',
      nivel = '',
      mensajeUsuario = '',
      apiKey = ''
    } = req.body;

    const partidos = getPartidos();

    // 1. EVALUAR REGLA R2: Si el usuario desactiva la búsqueda asistida
    if (!asistidaActiva) {
      return res.json({
        ok: true,
        regla: 'R2',
        estado: 'manual',
        titulo: 'Modo Manual Activo (Regla R2)',
        razonamiento_agente: 'El usuario desactivó la búsqueda asistida. En cumplimiento estricto de la regla R2, el agente de software suspende cualquier recomendación automática en segundo plano y mantiene accesible la totalidad del catálogo para filtrado tradicional sin intervención algorítmica.',
        partidos: partidos,
        modo_ia: false
      });
    }

    // 2. EVALUAR CAMPOS OBLIGATORIOS PARA R1
    if (!zona.trim() || !horario.trim() || !nivel.trim()) {
      const faltantes = [];
      if (!zona.trim()) faltantes.push('Zona geográfica');
      if (!nivel.trim()) faltantes.push('Nivel de juego');
      if (!horario.trim()) faltantes.push('Franja horaria');

      return res.json({
        ok: true,
        regla: 'Condición Incompleta',
        estado: 'incompleto',
        titulo: 'Parámetros Incompletos',
        razonamiento_agente: `Para activar la búsqueda asistida (R1) es requisito completar zona, horario y nivel. Actualmente falta: ${faltantes.join(', ')}.`,
        partidos: [],
        modo_ia: false
      });
    }

    // 3. BUSCAR COINCIDENCIAS EN BASE DE DATOS
    const coincidencias = partidos.filter(p => {
      const matchZona = p.zona.toLowerCase().includes(zona.toLowerCase().split(' ')[0]);
      const matchNivel = p.nivel.toLowerCase().includes(nivel.toLowerCase().split(' ')[0]);
      const matchHorario = p.horario.toLowerCase().includes(horario.toLowerCase().slice(0, 5));
      return matchZona && matchNivel && matchHorario;
    });

    const activeApiKey = (apiKey && apiKey.trim()) || process.env.GEMINI_API_KEY;

    // 4. SI HAY API KEY, USAR GEMINI 3.8 FLASH
    if (activeApiKey && activeApiKey.trim() !== '') {
      try {
        const aiClient = new GoogleGenAI({ apiKey: activeApiKey.trim() });
        
        const systemPrompt = `
Eres el agente inteligente de emparejamiento de "FUL Y VALE APP", una startup deportiva desarrollada en el marco del IFTS 29 y articulada con el IFTS 16.
Tu función es aplicar con precisión las reglas lógicas:
- Regla R1: Si el usuario completó zona, horario y nivel, buscar partidos compatibles; mostrar coincidencias si existen y, si no existen, informar que no encontró resultados.
- Nivel Propone institucional: Si no existen coincidencias, no te limites a un mensaje pasivo. Propón proactivamente: 1) ampliar la tolerancia de búsqueda a +5 km indicando clubes cercanos sugeridos, o 2) activar un "Vigilante Inteligente de Vacantes" para avisarle en tiempo real si alguien se da de baja.

Datos de la consulta del jugador:
- Zona solicitada: ${zona}
- Nivel de juego: ${nivel}
- Horario solicitado: ${horario}
- Comentario adicional: ${mensajeUsuario || 'Ninguno'}
- Coincidencias exactas halladas en el catálogo interno: ${coincidencias.length} partido(s).
${coincidencias.length > 0 ? `Partidos hallados: ${JSON.stringify(coincidencias)}` : 'No hay partidos exactos.'}
Catálogo completo de referencia: ${JSON.stringify(partidos)}

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "titulo": "Título conciso y motivador de la respuesta",
  "razonamiento_agente": "Explicación paso a paso de cómo el agente analizó los filtros y qué regla aplicó",
  "mensaje_para_usuario": "Mensaje personalizado y claro dirigido al jugador con tono deportivo y profesional",
  "propuesta_proactiva": "Propuesta de valor si no hubo coincidencias (o sugerencia adicional si hubo)",
  "partidos_destacados": ["lista de nombres de clubes o IDs recomendados"]
}
`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: 'Ejecuta el análisis agéntico para este jugador y devuelve únicamente el objeto JSON especificado.',
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text || '';
        let aiParsed = {};
        try {
          aiParsed = JSON.parse(rawText);
        } catch (parseErr) {
          aiParsed = {
            titulo: coincidencias.length > 0 ? 'Coincidencias Encontradas' : 'Sin coincidencias exactas',
            razonamiento_agente: rawText,
            mensaje_para_usuario: rawText,
            propuesta_proactiva: 'Revisión asistida completada.'
          };
        }

        return res.json({
          ok: true,
          regla: 'R1',
          estado: coincidencias.length > 0 ? 'exito' : 'sin_resultados',
          titulo: aiParsed.titulo || (coincidencias.length > 0 ? '¡Coincidencias Halladas!' : 'Sin Resultados Exactos'),
          razonamiento_agente: aiParsed.razonamiento_agente || 'Análisis agéntico ejecutado con Gemini 3.8 Flash.',
          mensaje_usuario: aiParsed.mensaje_para_usuario || '',
          propuesta_proactiva: aiParsed.propuesta_proactiva || '',
          partidos: coincidencias,
          modo_ia: true,
          modelo: 'Gemini 3.8 Flash'
        });

      } catch (geminiError) {
        console.warn('Fallo en Gemini API, pasando a resolución agéntica algorítmica:', geminiError.message);
        // Fallback a resolución algorítmica si falla la key
      }
    }

    // 5. RESOLUCIÓN AGÉNTICA ALGORÍTMICA (cuando no hay API key o hay fallback)
    if (coincidencias.length > 0) {
      return res.json({
        ok: true,
        regla: 'R1',
        estado: 'exito',
        titulo: '¡Coincidencias Encontradas! (Regla R1)',
        razonamiento_agente: `El agente procesó la tupla (${zona}, ${horario}, ${nivel}). Encontró ${coincidencias.length} partido(s) disponible(s) con vacantes libres y compatibilidad de nivel.`,
        mensaje_usuario: `¡Genial! Hemos encontrado partidos para vos en ${zona}. Cumplen con tu nivel ${nivel} en el horario de ${horario}.`,
        propuesta_proactiva: 'Podés solicitar tu vacante directamente.',
        partidos: coincidencias,
        modo_ia: false,
        aviso_config: !activeApiKey ? 'Para habilitar explicaciones generativas en vivo, configura GEMINI_API_KEY en tu archivo .env o en el campo de clave.' : null
      });
    } else {
      // Regla R1 sin resultados + Propuesta Nivel Propone
      return res.json({
        ok: true,
        regla: 'R1',
        estado: 'sin_resultados',
        titulo: 'Sin Coincidencias Inmediatas (Regla R1 · Nivel Propone)',
        razonamiento_agente: `El agente verificó el catálogo y constató cero partidos con coincidencia exacta para ${zona} en el horario de ${horario} con nivel ${nivel}. Aplica la consecuencia formal de R1 informando la ausencia de resultados.`,
        mensaje_usuario: `No encontramos partidos con esos criterios exactos en este momento.`,
        propuesta_proactiva: `★ Nivel Propone: ¿Deseas ampliar el radio de búsqueda a +5 km (incluyendo zonas linderas) o activar el «Vigilante Inteligente de Vacantes» para que te notifiquemos de inmediato si un jugador libera su cupo?`,
        partidos: [],
        modo_ia: false,
        aviso_config: !activeApiKey ? 'Para habilitar explicaciones generativas en vivo, configura GEMINI_API_KEY en tu archivo .env o en el campo de clave.' : null
      });
    }

  } catch (error) {
    console.error('Error en /api/agente-buscar:', error);
    res.status(500).json({ ok: false, error: 'Error interno en el servicio del agente' });
  }
});

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Exportar app para entorno Serverless de Vercel
module.exports = app;

// En desarrollo local, iniciar servidor en el puerto configurado
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor FUL Y VALE APP activo en http://localhost:${PORT}`);
  });
}
