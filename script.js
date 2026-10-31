/**
 * FUL Y VALE APP — Script de Lógica Agéntica y Conexión con Gemini
 * TP3 IFTS 29 · Desarrollo de Sistemas Web Front End
 * Bloque S05-A · Sentencias R1 y R2 (Búsqueda Asistida o Manual)
 * Construcción 100% Agéntica
 */

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('fulyvale-theme');
  let currentTheme = storedTheme === 'light' ? 'light' : 'dark';

  function updateThemeToggle() {
    const isLight = currentTheme === 'light';
    const icon = isLight
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"></path></svg>';

    document.documentElement.dataset.theme = currentTheme;
    themeToggle.innerHTML = icon;
    themeToggle.setAttribute('aria-label', 'Cambiar entre tema claro y oscuro');
    themeToggle.setAttribute('aria-pressed', String(!isLight));
  }

  updateThemeToggle();
  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('fulyvale-theme', currentTheme);
    updateThemeToggle();
  });

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
  const btnCancelar1 = document.getElementById('btn-cancelar-1');
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

  let controladorAborto = null;

  function actualizarBoton() {
    if (!btnEvaluar1 || !simAsistida) return;
    if (simAsistida.checked) {
      btnEvaluar1.innerHTML = '<span class="btn-icon">🤖</span> Consultar al Agente Inteligente';
    } else {
      btnEvaluar1.innerHTML = '<span class="btn-icon">🔍</span> Buscar en Catálogo (Modo Manual)';
    }
  }

  if (simAsistida) {
    simAsistida.addEventListener('change', actualizarBoton);
  }

  if (btnCancelar1) {
    btnCancelar1.addEventListener('click', () => {
      if (controladorAborto) {
        controladorAborto.abort();
        controladorAborto = null;
      }
      btnCancelar1.style.display = 'none';
      btnEvaluar1.disabled = false;
      actualizarBoton();
      outSim1.style.borderLeftColor = '#f59e0b';
      outSim1.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
          <span class="output-label" style="color:#f59e0b;">Consulta Cancelada</span>
          <span class="badge" style="background:#475569; color:#fff;">Detenido</span>
        </div>
        <p class="output-text">⏹️ <strong>Consulta cancelada por el usuario.</strong> Puedes modificar los filtros e iniciar una nueva búsqueda cuando lo desees.</p>
      `;
    });
  }

  async function consultarAgente(opciones = {}) {
    if (!btnEvaluar1 || !outSim1) return;

    const { radioAmpliado = false } = opciones;

    // Si había una petición previa en curso, cancelarla antes de iniciar la nueva
    if (controladorAborto) {
      controladorAborto.abort();
    }
    controladorAborto = new AbortController();

    const asistidaActiva = simAsistida.checked;
    const zona = simZona.value.trim();
    const nivel = simNivel.value.trim();
    const horario = simHorario.value.trim();
    const mensajeUsuario = simMensajeAdicional ? simMensajeAdicional.value.trim() : '';
    const apiKey = simApiKey ? simApiKey.value.trim() : '';

    // Estado visual de carga y mostrar botón de cancelación
    btnEvaluar1.disabled = true;
    if (btnCancelar1) {
      btnCancelar1.style.display = 'inline-flex';
    }

    let textoCarga = asistidaActiva ? 'Razonando con el Agente...' : 'Filtrando catálogo manual...';
    if (radioAmpliado) {
      textoCarga = 'Ampliando radio de búsqueda (+5 km)...';
    }

    btnEvaluar1.innerHTML = `<span class="spinner-inline"></span> ${textoCarga}`;
    outSim1.style.borderLeftColor = '#3b82f6';
    outSim1.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; color: #93c5fd;">
        <span class="spinner-inline"></span>
        <p class="output-text" style="margin: 0;"><strong>${radioAmpliado ? 'Ampliando búsqueda a zonas linderas...' : (asistidaActiva ? 'El agente está evaluando tus criterios...' : 'Buscando en la base de datos...')}</strong> ${radioAmpliado ? 'Explorando clubes compatibles a un radio de +5 km con tu confirmación.' : (asistidaActiva ? 'Analizando disponibilidad en clubes de CABA y aplicando reglas R1/R2.' : 'Filtrando los registros que coinciden con los campos especificados.')}</p>
      </div>
    `;

    try {
      const response = await fetch('/api/agente-buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controladorAborto.signal,
        body: JSON.stringify({
          asistidaActiva,
          zona,
          nivel,
          horario,
          mensajeUsuario,
          apiKey,
          radioAmpliado
        })
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Respuesta inválida del servidor');
      }

      renderRespuestaAgente(data);

    } catch (err) {
      if (err.name === 'AbortError') {
        // Cancelado intencionalmente por el usuario, no mostrar error
        return;
      }

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
      if (btnCancelar1) {
        btnCancelar1.style.display = 'none';
      }
      btnEvaluar1.disabled = false;
      actualizarBoton();
      controladorAborto = null;
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
      const tituloResultados = data.estado === 'manual'
        ? (data.criterios_especificados && data.criterios_especificados.length > 0
            ? 'Partidos Filtrados Manualmente'
            : 'Catálogo Completo Disponible (Búsqueda Manual)')
        : 'Partidos Compatibles Encontrados';

      partidosHtml = `
        <div class="matches-results" style="margin-top: 1.25rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; color: #f8fafc;">
            🏀 ${tituloResultados} (${data.partidos.length}):
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
    } else if (data.estado === 'manual') {
      partidosHtml = `
        <div style="margin-top: 1.25rem; padding: 1rem; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: #cbd5e1;">
          <p style="margin: 0; font-size: 0.9rem;">
            🔍 <strong>Sin coincidencias en búsqueda manual:</strong> Ningún partido del catálogo cumple con los campos especificados. Puedes modificar o limpiar algún filtro para ver más opciones.
          </p>
        </div>
      `;
    }

    // Bloque del nivel Propone con botones interactivos de confirmación
    let propuestaHtml = '';
    if (data.propuesta_proactiva) {
      let botonesPropuesta = '';
      if (data.puede_ampliar_radio || data.puede_activar_vigilante) {
        botonesPropuesta = `
          <div class="propuesta-actions" style="margin-top: 0.85rem; display: flex; gap: 0.6rem; flex-wrap: wrap;">
            ${data.puede_ampliar_radio ? `
              <button type="button" id="btn-aceptar-radio" class="btn btn-sm btn-primary" style="font-size: 0.82rem; padding: 0.45rem 0.9rem; cursor: pointer;">
                📍 Aceptar: Ampliar Radio (+5 km)
              </button>
            ` : ''}
            ${data.puede_activar_vigilante ? `
              <button type="button" id="btn-activar-vigilante" class="btn btn-sm" style="font-size: 0.82rem; padding: 0.45rem 0.9rem; background: #1e293b; border: 1px solid #f36b21; color: #f36b21; cursor: pointer;">
                🔔 Activar Vigilante de Vacantes
              </button>
            ` : ''}
          </div>
          <div id="contenedor-vigilante-confirmacion"></div>
        `;
      }

      propuestaHtml = `
        <div style="margin-top: 1rem; padding: 0.85rem; background: rgba(243, 107, 33, 0.08); border: 1px dashed #f36b21; border-radius: 8px;">
          <strong style="color: #f36b21; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">★ Propuesta de Valor Agéntica (Nivel Propone):</strong>
          <p style="font-size: 0.88rem; margin: 0; color: #f1f5f9;">${data.propuesta_proactiva}</p>
          ${botonesPropuesta}
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

    const badgeRadioAmpliado = data.criterio_ampliado
      ? '<span class="badge" style="background:#0284c7; color:#fff;">📍 Radio +5 km Aplicado</span>'
      : '';

    outSim1.style.borderLeftColor = estadoColor;
    outSim1.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
        <span class="output-label" style="color:${estadoColor}; margin-bottom:0;">${data.titulo}</span>
        <div style="display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;">
          ${reglaBadge}
          ${badgeRadioAmpliado}
          ${iaBadge}
        </div>
      </div>
      
      <p class="output-text" style="margin-bottom:0.5rem;"><strong>Razonamiento del Agente:</strong> ${data.razonamiento_agente}</p>
      
      ${data.mensaje_usuario ? `<p class="output-text" style="color:#e2e8f0;">${data.mensaje_usuario}</p>` : ''}
      
      ${propuestaHtml}
      ${partidosHtml}
      ${avisoKeyHtml}
    `;

    // Vincular interactividad a los botones de la propuesta de valor
    const btnAceptarRadio = document.getElementById('btn-aceptar-radio');
    if (btnAceptarRadio) {
      btnAceptarRadio.addEventListener('click', () => {
        consultarAgente({ radioAmpliado: true });
      });
    }

    const btnActivarVigilante = document.getElementById('btn-activar-vigilante');
    if (btnActivarVigilante) {
      btnActivarVigilante.addEventListener('click', () => {
        btnActivarVigilante.disabled = true;
        btnActivarVigilante.style.opacity = '0.6';
        const contenedor = document.getElementById('contenedor-vigilante-confirmacion');
        if (contenedor) {
          const zonaActual = simZona ? simZona.value : '';
          const nivelActual = simNivel ? simNivel.value : '';
          contenedor.innerHTML = `
            <div style="margin-top: 0.75rem; padding: 0.75rem 1rem; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 8px; color: #a7f3d0; font-size: 0.85rem;">
              🔔 <strong>¡Vigilante de Vacantes Activado con Éxito!</strong><br>
              El agente ha registrado tu alerta proactiva para <em>${zonaActual || 'todas las zonas'}</em> (${nivelActual || 'cualquier nivel'}). Te enviaremos una notificación instantánea apenas un jugador cancele su cupo en estos clubes.
            </div>
          `;
        }
      });
    }
  }

  if (btnEvaluar1) {
    btnEvaluar1.addEventListener('click', () => consultarAgente({ radioAmpliado: false }));
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

  // Inicializar estado del botón según el switch (sin disparar la consulta a la IA)
  actualizarBoton();
});
