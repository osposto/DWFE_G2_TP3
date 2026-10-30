const { GoogleGenAI } = require('@google/genai');

// Catálogo de partidos embebido y con respaldo de archivo
let partidosData = [];
try {
  partidosData = require('../data/partidos.json');
} catch (e) {
  partidosData = [
    {
      id: "PART-001",
      club: "Club Gimnasia y Esgrima de Buenos Aires (GEBA)",
      direccion: "Av. del Libertador 2050, Palermo",
      zona: "Palermo (CABA)",
      dia: "Martes",
      horario: "19:00 a 21:00 hs",
      nivel: "Intermedio",
      cupos_totales: 10,
      cupos_libres: 3,
      tipo: "Recreativo 5x5",
      arancel: 3500
    },
    {
      id: "PART-002",
      club: "Club Ferro Carril Oeste",
      direccion: "Federico García Lorca 350, Caballito",
      zona: "Caballito (CABA)",
      dia: "Jueves",
      horario: "21:00 a 23:00 hs",
      nivel: "Avanzado",
      cupos_totales: 10,
      cupos_libres: 2,
      tipo: "Competitivo 5x5",
      arancel: 4000
    },
    {
      id: "PART-003",
      club: "Club Harrods Gath & Chaves",
      direccion: "Virrey del Pino 1480, Belgrano",
      zona: "Belgrano (CABA)",
      dia: "Sábado",
      horario: "Sábados por la mañana",
      nivel: "Inicial / Recreativo",
      cupos_totales: 12,
      cupos_libres: 5,
      tipo: "Entrenamiento + 5x5",
      arancel: 3000
    },
    {
      id: "PART-004",
      club: "Club Náutico Hacoaj (Sede Almagro)",
      direccion: "Estado de Israel 4156, Almagro (cercano a Caballito)",
      zona: "Caballito (CABA)",
      dia: "Miércoles",
      horario: "19:00 a 21:00 hs",
      nivel: "Intermedio",
      cupos_totales: 10,
      cupos_libres: 1,
      tipo: "Recreativo 5x5",
      arancel: 3800
    },
    {
      id: "PART-005",
      club: "Club Ciudad de Buenos Aires",
      direccion: "Av. del Libertador 7501, Núñez (cercano a Belgrano)",
      zona: "Belgrano (CABA)",
      dia: "Lunes",
      horario: "21:00 a 23:00 hs",
      nivel: "Intermedio",
      cupos_totales: 10,
      cupos_libres: 4,
      tipo: "Amistoso 5x5",
      arancel: 3500
    }
  ];
}

module.exports = async function handler(req, res) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        body = {};
      }
    }
    body = body || {};

    const {
      asistidaActiva = true,
      zona = '',
      horario = '',
      nivel = '',
      mensajeUsuario = '',
      apiKey = ''
    } = body;

    const partidos = partidosData || [];

    // 1. EVALUAR REGLA R2: Búsqueda asistida desactivada (modo manual)
    if (!asistidaActiva) {
      return res.status(200).json({
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

      return res.status(200).json({
        ok: true,
        regla: 'Condición Incompleta',
        estado: 'incompleto',
        titulo: 'Parámetros Incompletos',
        razonamiento_agente: `Para activar la búsqueda asistida (R1) es requisito completar zona, horario y nivel. Actualmente falta: ${faltantes.join(', ')}.`,
        partidos: [],
        modo_ia: false
      });
    }

    // 3. BUSCAR COINCIDENCIAS EN EL CATÁLOGO
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

        return res.status(200).json({
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
        console.warn('Fallo en llamada a Gemini API, usando fallback:', geminiError.message);
      }
    }

    // 5. RESOLUCIÓN DETERMINISTA (sin API Key o fallback)
    if (coincidencias.length > 0) {
      return res.status(200).json({
        ok: true,
        regla: 'R1',
        estado: 'exito',
        titulo: '¡Coincidencias Encontradas! (Regla R1)',
        razonamiento_agente: `El agente procesó la tupla (${zona}, ${horario}, ${nivel}). Encontró ${coincidencias.length} partido(s) disponible(s) con vacantes libres y compatibilidad de nivel.`,
        mensaje_usuario: `¡Genial! Hemos encontrado partidos para vos en ${zona}. Cumplen con tu nivel ${nivel} en el horario de ${horario}.`,
        propuesta_proactiva: 'Podés solicitar tu vacante directamente.',
        partidos: coincidencias,
        modo_ia: false,
        aviso_config: !activeApiKey ? 'Para habilitar explicaciones generativas en vivo, configura GEMINI_API_KEY en Vercel o en tu archivo .env.' : null
      });
    } else {
      return res.status(200).json({
        ok: true,
        regla: 'R1',
        estado: 'sin_resultados',
        titulo: 'Sin Coincidencias Inmediatas (Regla R1 · Nivel Propone)',
        razonamiento_agente: `El agente verificó el catálogo y constató cero partidos con coincidencia exacta para ${zona} en el horario de ${horario} con nivel ${nivel}. Aplica la consecuencia formal de R1 informando la ausencia de resultados.`,
        mensaje_usuario: `No encontramos partidos con esos criterios exactos en este momento.`,
        propuesta_proactiva: `★ Nivel Propone: ¿Deseas ampliar el radio de búsqueda a +5 km (incluyendo zonas linderas) o activar el «Vigilante Inteligente de Vacantes» para que te notifiquemos de inmediato si un jugador libera su cupo?`,
        partidos: [],
        modo_ia: false,
        aviso_config: !activeApiKey ? 'Para habilitar explicaciones generativas en vivo, configura GEMINI_API_KEY en Vercel o en tu archivo .env.' : null
      });
    }

  } catch (error) {
    console.error('Error interno en handler api/agente-buscar:', error);
    return res.status(500).json({ ok: false, error: 'Error interno en el servicio del agente' });
  }
};

