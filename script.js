/**
 * FUL Y VALE APP — Script de Lógica Agéntica y Conexión con Gemini
 * TP3 IFTS 29 · Desarrollo de Sistemas Web Front End
 * Bloque S05-A · Sentencias R1 y R2 (Búsqueda Asistida o Manual)
 * Construcción 100% Agéntica
 */

document.addEventListener('DOMContentLoaded', () => {

  // ========================================================================
  // 1. CONSOLA DE INTERACCIÓN AGÉNTICA (Backend Node.js + Gemini 3.8 Flash)
  // ========================================================================
  const simAsistida = document.getElementById('sim-asistida');
  const simZona = document.getElementById('sim-zona');
  const simNivel = document.getElementById('sim-nivel');
  const simHorario = document.getElementById('sim-horario');
  const simMensajeAdicional = document.getElementById('sim-mensaje-adicional');
  const simApiKey = document.getElementById('sim-api-key');
  const btnEvaluar1 = document.getElementById('btn-evaluar-1');
  const outSim1 = document.getElementById('resultado-sim-1');

  const flowSvg = document.querySelector('.flow-svg');

  if (flowSvg) {
    const flowNodes = flowSvg.querySelectorAll('.svg-interactive-node');
    const flowLines = flowSvg.querySelectorAll('.svg-line[data-from][data-to]');

    function selectFlowNode(selectedNode) {
      const clearSelection = selectedNode.classList.contains('is-selected');
      const selectedId = selectedNode.dataset.node;

      flowSvg.classList.toggle('has-selection', !clearSelection);

      flowNodes.forEach(node => {
        const isSelected = !clearSelection && node === selectedNode;
        node.classList.toggle('is-selected', isSelected);
        node.setAttribute('aria-pressed', String(isSelected));
      });

      flowLines.forEach(line => {
        const isConnected = !clearSelection
          && (line.dataset.from === selectedId || line.dataset.to === selectedId);
        line.classList.toggle('is-selected', isConnected);
      });
    }

    flowNodes.forEach(node => {
      node.addEventListener('click', () => selectFlowNode(node));
      node.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectFlowNode(node);
        }
      });
    });
  }

  async function consultarAgente() {
    if (!btnEvaluar1 || !outSim1) return;

    const asistidaActiva = simAsistida.checked;
    const zona = simZona.value.trim();
    const nivel = simNivel.value.trim();
    const horario = simHorario.value.trim();
    const mensajeUsuario = simMensajeAdicional ? simMensajeAdicional.value.trim() : '';
    const apiKey = simApiKey ? simApiKey.value.trim() : '';

    // Estado visual de carga
    btnEvaluar1.disabled = true;
    btnEvaluar1.innerHTML = '<span class="spinner-inline"></span> Razonando con el Agente...';
    outSim1.style.borderLeftColor = '#3b82f6';
    outSim1.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; color: #93c5fd;">
        <span class="spinner-inline"></span>
        <p class="output-text" style="margin: 0;"><strong>El agente está evaluando tus criterios...</strong> Analizando disponibilidad en clubes de CABA y aplicando reglas R1/R2.</p>
      </div>
    `;

    try {
      const response = await fetch('/api/agente-buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asistidaActiva,
          zona,
          nivel,
          horario,
          mensajeUsuario,
          apiKey
        })
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Respuesta inválida del servidor');
      }

      renderRespuestaAgente(data);

    } catch (err) {
      console.error('Error al consultar el agente:', err);
      outSim1.style.borderLeftColor = '#ef4444';
      outSim1.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
          <span class="output-label" style="color:#ef4444;">Error de Comunicación</span>
          <span class="badge" style="background:#dc2626; color:#fff;">Falla</span>
        </div>
        <p class="output-text">No se pudo contactar con el servicio del agente. Verifica que el servidor Node.js esté corriendo (<code>npm start</code>).</p>
      `;
    } finally {
      btnEvaluar1.disabled = false;
      btnEvaluar1.innerHTML = '<span class="btn-icon">🤖</span> Consultar al Agente Inteligente';
    }
  }

  function renderRespuestaAgente(data) {
    const colors = {
      exito: '#10b981',
      sin_resultados: '#f59e0b',
      incompleto: '#b45309',
      manual: '#64748b'
    };

    const estadoColor = colors[data.estado] || '#f36b21';

    let reglaBadge = '';
    if (data.regla === 'R1') {
      reglaBadge = data.estado === 'exito'
        ? '<span class="badge" style="background:#059669; color:#fff;">Aplica Regla R1 · Éxito</span>'
        : '<span class="badge" style="background:#d97706; color:#fff;">Aplica Regla R1 · Sin Coincidencias</span>';
    } else if (data.regla === 'R2') {
      reglaBadge = '<span class="badge" style="background:#475569; color:#fff;">Aplica Regla R2 · Modo Manual</span>';
    } else {
      reglaBadge = '<span class="badge" style="background:#b45309; color:#fff;">Parámetros Incompletos</span>';
    }

    const iaBadge = data.modo_ia
      ? `<span class="badge" style="background:#4338ca; color:#fff;">✨ Gemini 3.8 Flash</span>`
      : `<span class="badge" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155;">Lógica Agéntica Local</span>`;

    // Renderizar tarjetas de partidos de básquet reales
    let partidosHtml = '';
    if (data.partidos && data.partidos.length > 0) {
      partidosHtml = `
        <div class="matches-results" style="margin-top: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; color: #f8fafc;">
            🏀 ${data.estado === 'manual' ? 'Catálogo Completo Disponible (Búsqueda Manual):' : 'Partidos Compatibles Encontrados:'}
          </h4>
          <div class="matches-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.85rem;">
            ${data.partidos.map(p => `
              <div class="match-mini-card" style="background:#1e293b; border:1px solid #334155; border-radius:10px; padding:0.85rem;">
                <div style="font-weight:700; font-size:0.95rem; color:#f36b21; margin-bottom:0.25rem;">${p.club}</div>
                <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:0.4rem;">📍 ${p.direccion}</div>
                <div style="display:flex; flex-wrap:wrap; gap:0.35rem; font-size:0.75rem;">
                  <span style="background:#0f172a; padding:0.15rem 0.45rem; border-radius:4px; color:#cbd5e1;">⏰ ${p.horario}</span>
                  <span style="background:#0f172a; padding:0.15rem 0.45rem; border-radius:4px; color:#cbd5e1;">🎯 Nivel: ${p.nivel}</span>
                  <span style="background:#064e3b; padding:0.15rem 0.45rem; border-radius:4px; color:#6ee7b7;">👥 ${p.cupos_libres} cupos</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Bloque del nivel Propone
    let propuestaHtml = '';
    if (data.propuesta_proactiva) {
      propuestaHtml = `
        <div style="margin-top: 1rem; padding: 0.85rem; background: rgba(243, 107, 33, 0.08); border: 1px dashed #f36b21; border-radius: 8px;">
          <strong style="color: #f36b21; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">★ Propuesta de Valor Agéntica (Nivel Propone):</strong>
          <p style="font-size: 0.88rem; margin: 0; color: #f1f5f9;">${data.propuesta_proactiva}</p>
        </div>
      `;
    }

    let avisoKeyHtml = '';
    if (data.aviso_config) {
      avisoKeyHtml = `
        <div style="margin-top: 0.85rem; font-size: 0.78rem; color: #94a3b8; background: #0f172a; padding: 0.6rem 0.8rem; border-radius: 6px;">
          💡 <strong>Nota del agente:</strong> ${data.aviso_config}
        </div>
      `;
    }

    outSim1.style.borderLeftColor = estadoColor;
    outSim1.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
        <span class="output-label" style="color:${estadoColor}; margin-bottom:0;">${data.titulo}</span>
        <div style="display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;">
          ${reglaBadge}
          ${iaBadge}
        </div>
      </div>
      
      <p class="output-text" style="margin-bottom:0.5rem;"><strong>Razonamiento del Agente:</strong> ${data.razonamiento_agente}</p>
      
      ${data.mensaje_usuario ? `<p class="output-text" style="color:#e2e8f0;">${data.mensaje_usuario}</p>` : ''}
      
      ${propuestaHtml}
      ${partidosHtml}
      ${avisoKeyHtml}
    `;
  }

  if (btnEvaluar1) {
    btnEvaluar1.addEventListener('click', consultarAgente);
  }

  // ========================================================================
  // 2. ACCESIBILIDAD Y CONTROL POR TECLADO EN DESPLEGABLES (<details>)
  // ========================================================================
  const detailsElements = document.querySelectorAll('.accordion-item');

  detailsElements.forEach(item => {
    const summary = item.querySelector('.accordion-trigger');
    if (!summary) return;

    summary.setAttribute('tabindex', '0');
    summary.setAttribute('role', 'button');
    summary.setAttribute('aria-expanded', item.hasAttribute('open'));

    item.addEventListener('toggle', () => {
      summary.setAttribute('aria-expanded', item.hasAttribute('open'));
    });

    summary.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        item.open = !item.open;
      }
    });
  });

  // Ejecutar primera consulta automática al iniciar para dar feedback inmediato
  consultarAgente();
});
