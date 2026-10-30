const { GoogleGenAI } = require('@google/genai');

// Catálogo único de partidos (fuente de verdad oficial)
const partidosData = require('../data/partidos.json');

// Helper para verificar si un campo fue realmente especificado (no vacío y no "sin completar")
function esCampoEspecificado(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s !== '' && !s.includes('sin completar') && !s.includes('--');
}

// Funciones auxiliares de coincidencia flexible para búsqueda manual y asistida
function coincideZona(pZona, fZona) {
  if (!esCampoEspecificado(fZona)) return true;
  const f = fZona.toLowerCase().trim();
  const p = (pZona || '').toLowerCase().trim();
  if (p === f) return true;
  if (f.includes('palermo') && p.includes('palermo')) return true;
  if (f.includes('caballito') && p.includes('caballito')) return true;
  if (f.includes('belgrano') && p.includes('belgrano')) return true;
  return p.includes(f) || f.includes(p);
}

// Mapa de zonas linderas (+5 km) en CABA
const ZONAS_CERCANAS = {
  'palermo': ['palermo', 'belgrano', 'caballito', 'almagro', 'recoleta', 'chacarita', 'nuñez'],
  'caballito': ['caballito', 'almagro', 'palermo', 'flores', 'villa crespo', 'parque chacabuco'],
  'belgrano': ['belgrano', 'nuñez', 'nunez', 'palermo', 'colegiales', 'saavedra']
};

function coincideZonaAmpliada(pZona, fZona) {
  if (!esCampoEspecificado(fZona)) return true;
  const f = fZona.toLowerCase().trim();
  const p = (pZona || '').toLowerCase().trim();
  for (const key of Object.keys(ZONAS_CERCANAS)) {
    if (f.includes(key)) {
      const cercanas = ZONAS_CERCANAS[key];
      if (cercanas.some(z => p.includes(z))) return true;
    }
  }
  return coincideZona(pZona, fZona);
}

function coincideNivel(pNivel, fNivel) {
  if (!esCampoEspecificado(fNivel)) return true;
  const f = fNivel.toLowerCase().trim();
  const p = (pNivel || '').toLowerCase().trim();
  if (p === f) return true;
  if (f.includes('intermedio') && p.includes('intermedio')) return true;
  if (f.includes('avanzado') && p.includes('avanzado')) return true;
  if ((f.includes('inicial') || f.includes('recreativo')) && (p.includes('inicial') || p.includes('recreativo'))) return true;
  return p.includes(f) || f.includes(p);
}

function coincideHorario(pHorario, fHorario) {
  if (!esCampoEspecificado(fHorario)) return true;
  const f = fHorario.toLowerCase().trim();
  const p = (pHorario || '').toLowerCase().trim();
  if (p === f) return true;
  if (f.startsWith('19') && p.startsWith('19')) return true;
  if (f.startsWith('21') && p.startsWith('21')) return true;
  if (f.includes('sábado') && p.includes('sábado')) return true;
  return p.includes(f) || f.includes(p);
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
      apiKey = '',
      radioAmpliado = false
    } = body;

    const partidos = partidosData || [];

    // 1. EVALUAR REGLA R2: Búsqueda asistida desactivada (modo manual)
    if (!asistidaActiva) {
      const filtrosAplicados = [];
      if (esCampoEspecificado(zona)) filtrosAplicados.push(`Zona: "${zona}"`);
      if (esCampoEspecificado(nivel)) filtrosAplicados.push(`Nivel: "${nivel}"`);
      if (esCampoEspecificado(horario)) filtrosAplicados.push(`Horario: "${horario}"`);

      // Filtrar la base de datos considerando ÚNICAMENTE los campos especificados (que NO sean "Sin completar")
      const partidosFiltrados = partidos.filter(p => {
        let cumple = true;
        if (esCampoEspecificado(zona)) {
          cumple = cumple && coincideZona(p.zona, zona);
        }
        if (esCampoEspecificado(nivel)) {
          cumple = cumple && coincideNivel(p.nivel, nivel);
        }
        if (esCampoEspecificado(horario)) {
          cumple = cumple && coincideHorario(p.horario, horario);
        }
        return cumple;
      });

      const detalleFiltros = filtrosAplicados.length > 0
        ? `campos especificados (${filtrosAplicados.join(', ')})`
        : 'sin filtros específicos (catálogo completo)';

      return res.status(200).json({
        ok: true,
        regla: 'R2',
        estado: 'manual',
        titulo: 'Búsqueda Manual (Regla R2)',
        razonamiento_agente: `Búsqueda asistida desactivada. Se realizó una consulta manual directa sobre la base de datos extrayendo únicamente los registros que coinciden con los ${detalleFiltros}. Los campos no especificados o en "-- Sin completar --" fueron omitidos del filtro.`,
        mensaje_usuario: partidosFiltrados.length > 0
          ? `Se encontraron ${partidosFiltrados.length} partido(s) que coinciden con los campos especificados.`
          : `No se encontraron partidos en el catálogo que coincidan con la combinación manual de filtros seleccionada.`,
        criterios_especificados: filtrosAplicados,
        partidos: partidosFiltrados,
        modo_ia: false
      });
    }

    // 2. BÚSQUEDA ASISTIDA (Regla R1 ampliada con Nivel Propone)
    const filtrosActivos = [];
    if (esCampoEspecificado(zona)) filtrosActivos.push(`Zona: "${zona}"`);
    if (esCampoEspecificado(nivel)) filtrosActivos.push(`Nivel: "${nivel}"`);
    if (esCampoEspecificado(horario)) filtrosActivos.push(`Horario: "${horario}"`);

    // Filtrar por los campos provistos (usando zona ampliada si el usuario aceptó la propuesta del nivel Propone)
    const coincidencias = partidos.filter(p => {
      let cumple = true;
      if (esCampoEspecificado(zona)) {
        cumple = cumple && (radioAmpliado ? coincideZonaAmpliada(p.zona, zona) : coincideZona(p.zona, zona));
      }
      if (esCampoEspecificado(nivel)) cumple = cumple && coincideNivel(p.nivel, nivel);
      if (esCampoEspecificado(horario)) cumple = cumple && coincideHorario(p.horario, horario);
      return cumple;
    });

    const camposOmitidos = [];
    if (!esCampoEspecificado(zona)) camposOmitidos.push('zona geográfica');
    if (!esCampoEspecificado(nivel)) camposOmitidos.push('nivel deportivo');
    if (!esCampoEspecificado(horario)) camposOmitidos.push('franja horaria');

    const activeApiKey = (apiKey && apiKey.trim()) || process.env.GEMINI_API_KEY;

    let avisoFalloGemini = null;

    // 3. SI HAY API KEY, USAR GEMINI 3.8 FLASH
    if (activeApiKey && activeApiKey.trim() !== '') {
      try {
        const aiClient = new GoogleGenAI({ apiKey: activeApiKey.trim() });
        
        const systemPrompt = `
Eres el agente inteligente de emparejamiento de "FUL Y VALE APP", una startup deportiva desarrollada en el marco del IFTS 29 y articulada con el IFTS 16.
Tu función es aplicar con precisión y criterio las reglas del negocio:
- Regla R1: Si el usuario realiza una búsqueda asistida, evalúa los partidos compatibles con los criterios provistos. Muestra las coincidencias si existen y, si no existen, informa que no encontró resultados.
- Nivel Propone institucional (Flexibilidad y Proactividad):
  * Si el usuario dejó campos en "Sin completar" (${camposOmitidos.length > 0 ? camposOmitidos.join(', ') : 'ninguno, completó los 3'}), no lo bloquees: busca con los campos provistos y asiste proactivamente recomendando opciones o sugiriendo qué tener en cuenta para las dimensiones no especificadas.
  * Si no existen coincidencias, no te limites a un mensaje pasivo. Propón proactivamente: 1) ampliar la tolerancia de búsqueda a +5 km indicando clubes cercanos sugeridos, o 2) activar un "Vigilante Inteligente de Vacantes" para avisarle en tiempo real si alguien se da de baja.

Datos de la consulta del jugador:
- Zona solicitada: ${esCampoEspecificado(zona) ? zona : 'Sin especificar (abierto a cualquier zona)'}
- Nivel de juego: ${esCampoEspecificado(nivel) ? nivel : 'Sin especificar (abierto a cualquier nivel)'}
- Horario solicitado: ${esCampoEspecificado(horario) ? horario : 'Sin especificar (abierto a cualquier horario)'}
- Comentario adicional del jugador: ${mensajeUsuario || 'Ninguno'}
- Coincidencias halladas en el catálogo interno para los criterios provistos: ${coincidencias.length} partido(s).
${coincidencias.length > 0 ? `Partidos hallados: ${JSON.stringify(coincidencias)}` : 'No hay partidos exactos para esa combinación.'}
Catálogo completo de referencia: ${JSON.stringify(partidos)}

Responde SIEMPRE en formato JSON válido con la siguiente estructura:
{
  "titulo": "Título conciso y motivador de la respuesta",
  "razonamiento_agente": "Explicación paso a paso de cómo el agente analizó los filtros, qué criterios aplicó y cómo asistió en los campos no especificados",
  "mensaje_para_usuario": "Mensaje personalizado y claro dirigido al jugador con tono deportivo y profesional",
  "propuesta_proactiva": "Propuesta de valor si no hubo coincidencias (o sugerencia adicional orientadora sobre campos no definidos)",
  "partidos_destacados": ["lista de nombres de clubes o IDs recomendados"]
}
`;

        const aiPromise = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: 'Ejecuta el análisis agéntico para este jugador y devuelve únicamente el objeto JSON especificado.',
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingBudget: 0 // Desactiva tiempo de pensamiento extendido para respuesta rápida
            }
          }
        });

        // Timeout preventivo de 6 segundos para no quedar colgado ante saturación temporal de Google
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('TIMEOUT_DEMANDA_GEMINI')), 6000);
        });

        const response = await Promise.race([aiPromise, timeoutPromise]);
        clearTimeout(timeoutId);

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
          titulo: aiParsed.titulo || (coincidencias.length > 0 ? (radioAmpliado ? '¡Coincidencias con Radio Ampliado (+5 km)!' : '¡Coincidencias Halladas!') : 'Sin Resultados Exactos'),
          razonamiento_agente: aiParsed.razonamiento_agente || 'Análisis agéntico ejecutado con Gemini 3.8 Flash.',
          mensaje_usuario: aiParsed.mensaje_para_usuario || '',
          propuesta_proactiva: aiParsed.propuesta_proactiva || (coincidencias.length === 0 ? '¿Deseas ampliar el radio de búsqueda a +5 km hacia zonas linderas o activar el «Vigilante Inteligente de Vacantes»?' : ''),
          puede_ampliar_radio: coincidencias.length === 0 && !radioAmpliado,
          puede_activar_vigilante: coincidencias.length === 0,
          criterio_ampliado: radioAmpliado,
          partidos: coincidencias,
          modo_ia: true,
          modelo: 'Gemini 3.8 Flash'
        });

      } catch (geminiError) {
        console.warn('Fallo o demora en llamada a Gemini API, pasando a resolución determinista:', geminiError.message);
        if (geminiError.message.includes('503') || geminiError.message.includes('high demand')) {
          avisoFalloGemini = 'Google reportó alta demanda temporal en sus servidores (503). El agente activó la resolución local de respaldo de inmediato sin demoras.';
        } else if (geminiError.message.includes('TIMEOUT')) {
          avisoFalloGemini = 'La respuesta de Google demoró más de 6 segundos. El agente activó la resolución local de respaldo para no hacerte esperar.';
        } else {
          avisoFalloGemini = 'Servicio de IA temporalmente inaccesible. Se aplicó la resolución agéntica determinista de respaldo.';
        }
      }
    }

    // 4. RESOLUCIÓN DETERMINISTA (sin API Key o fallback)
    if (coincidencias.length > 0) {
      const detalle = filtrosActivos.length > 0
        ? `los criterios especificados (${filtrosActivos.join(', ')})`
        : 'el catálogo general abierto';
      const avisoOmitidos = camposOmitidos.length > 0
        ? ` Al no restringir por ${camposOmitidos.join(' ni ')}, el agente te ofrece opciones variadas para que elijas libremente.`
        : '';

      const tituloDeterm = radioAmpliado
        ? '¡Coincidencias Halladas con Radio Ampliado (+5 km)!'
        : '¡Coincidencias Encontradas! (Búsqueda Asistida R1)';

      const razonamientoDeterm = radioAmpliado
        ? `El usuario confirmó expresamente la propuesta del nivel Propone de ampliar el radio a +5 km. El agente exploró zonas linderas y halló ${coincidencias.length} partido(s) compatible(s) con su nivel de juego.`
        : `El agente asistido evaluó ${detalle}. Encontró ${coincidencias.length} partido(s) compatible(s) con vacantes libres.${avisoOmitidos}`;

      return res.status(200).json({
        ok: true,
        regla: 'R1',
        estado: 'exito',
        titulo: tituloDeterm,
        razonamiento_agente: razonamientoDeterm,
        mensaje_usuario: radioAmpliado
          ? `¡Excelente! Al ampliar el radio a +5 km encontramos partidos en clubes cercanos compatibles con lo que buscabas.`
          : `¡Genial! Hemos encontrado partidos para vos con los filtros seleccionados.${avisoOmitidos}`,
        propuesta_proactiva: radioAmpliado
          ? 'Criterio ampliado aplicado exitosamente con tu confirmación.'
          : (camposOmitidos.length > 0 ? `★ Nivel Propone: Puedes afinar seleccionando ${camposOmitidos.join(' o ')} cuando desees acotar más la búsqueda.` : 'Podés solicitar tu vacante directamente.'),
        criterio_ampliado: radioAmpliado,
        partidos: coincidencias,
        modo_ia: false,
        aviso_config: avisoFalloGemini || (!activeApiKey ? 'Para habilitar explicaciones generativas en vivo, configura GEMINI_API_KEY en Vercel o en tu archivo .env.' : null)
      });
    } else {
      return res.status(200).json({
        ok: true,
        regla: 'R1',
        estado: 'sin_resultados',
        titulo: 'Sin Coincidencias Inmediatas (Regla R1 · Nivel Propone)',
        razonamiento_agente: `El agente verificó el catálogo y constató cero partidos compatibles para la combinación de filtros seleccionada (${filtrosActivos.join(', ')}). Aplica la consecuencia formal de R1 informando la ausencia de resultados.`,
        mensaje_usuario: `No encontramos partidos con esos criterios exactos en este momento.`,
        propuesta_proactiva: `¿Deseas ampliar el radio de búsqueda a +5 km (incluyendo zonas linderas) o activar el «Vigilante Inteligente de Vacantes» para que te notifiquemos de inmediato si un jugador libera su cupo?`,
        puede_ampliar_radio: true,
        puede_activar_vigilante: true,
        partidos: [],
        modo_ia: false,
        aviso_config: avisoFalloGemini || (!activeApiKey ? 'Para habilitar explicaciones generativas en vivo, configura GEMINI_API_KEY en Vercel o en tu archivo .env.' : null)
      });
    }

  } catch (error) {
    console.error('Error interno en handler api/agente-buscar:', error);
    return res.status(500).json({ ok: false, error: 'Error interno en el servicio del agente' });
  }
};

