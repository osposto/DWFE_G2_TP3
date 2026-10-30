/**
 * FUL Y VALE APP — Script de Lógica Agéntica y Accesibilidad
 * TP3 IFTS 29 · Desarrollo de Sistemas Web Front End
 * Bloque S05-A · Sentencias R1 y R2 (Búsqueda Asistida o Manual)
 * Construcción 100% Agéntica
 */

document.addEventListener('DOMContentLoaded', () => {

  // ========================================================================
  // 1. SIMULADOR AGÉNTICO: Búsqueda Asistida o Manual (R1 y R2)
  // ========================================================================
  const simAsistida = document.getElementById('sim-asistida');
  const simZona = document.getElementById('sim-zona');
  const simNivel = document.getElementById('sim-nivel');
  const simHorario = document.getElementById('sim-horario');
  const simHayPartidos = document.getElementById('sim-hay-partidos');
  const btnEvaluar1 = document.getElementById('btn-evaluar-1');
  const outSim1 = document.getElementById('resultado-sim-1');

  function evaluarModulo1() {
    if (!btnEvaluar1 || !outSim1) return;

    const asistidaActiva = simAsistida.checked;
    const zona = simZona.value.trim();
    const nivel = simNivel.value.trim();
    const horario = simHorario.value.trim();
    const hayPartidos = simHayPartidos.checked;

    let reglaHtml = '';
    let mensaje = '';
    let tipoEstado = 'info';

    if (!asistidaActiva) {
      // Regla R2: Si el usuario desactiva la búsqueda asistida, el sistema mantiene disponible la búsqueda manual y deja de generar sugerencias automáticas.
      reglaHtml = '<span class="badge" style="background:#475569; color:#fff;">Aplica Regla R2</span>';
      mensaje = '<strong>Búsqueda asistida desactivada:</strong> El agente suspende cualquier sondeo en segundo plano o notificación proactiva. La interfaz mantiene disponible el catálogo completo en modo de búsqueda manual tradicional.';
      tipoEstado = 'warning';
    } else {
      // Asistida activa -> Evaluar si completó zona, horario y nivel
      if (!zona || !nivel || !horario) {
        const faltantes = [];
        if (!zona) faltantes.push('Zona');
        if (!nivel) faltantes.push('Nivel');
        if (!horario) faltantes.push('Horario');

        reglaHtml = '<span class="badge" style="background:#b45309; color:#fff;">Condición Incompleta</span>';
        mensaje = `<strong>Faltan datos obligatorios:</strong> Para activar el emparejamiento asistido se requiere completar: <em>${faltantes.join(', ')}</em>. El agente solicita al usuario completar los parámetros faltantes.`;
        tipoEstado = 'warning';
      } else {
        // Campos completos -> Regla R1: Si existen coincidencias las muestra; si no, informa que no encontró resultados
        if (hayPartidos) {
          reglaHtml = '<span class="badge" style="background:#059669; color:#fff;">Aplica Regla R1 · Éxito</span>';
          mensaje = `<strong>¡Coincidencias encontradas!</strong> El agente halló partidos compatibles en <strong>${zona}</strong> para nivel <strong>${nivel}</strong> en la franja <strong>${horario}</strong>. Se muestran y priorizan en pantalla.`;
          tipoEstado = 'success';
        } else {
          reglaHtml = '<span class="badge" style="background:#d97706; color:#fff;">Aplica Regla R1 · Sin Coincidencias</span>';
          mensaje = `<strong>Sin resultados exactos:</strong> El sistema informa claramente al usuario que no encontró partidos para esos filtros.<br><br><em>★ Propone (Nivel Institucional):</em> El agente sugiere proactivamente ampliar el radio de búsqueda a <strong>+5 km</strong> o activar un <strong>«Vigilante de Vacantes»</strong> que le avise en tiempo real si se libera un cupo compatible.`;
          tipoEstado = 'warning';
        }
      }
    }

    renderOutput(outSim1, reglaHtml, mensaje, tipoEstado);
  }

  if (btnEvaluar1) {
    btnEvaluar1.addEventListener('click', evaluarModulo1);
  }

  // Helper para renderizar el resultado del simulador con feedback visual accesible
  function renderOutput(container, badgeHtml, text, state) {
    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#f36b21'
    };

    container.style.borderLeftColor = colors[state] || colors.info;
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
        <span class="output-label" style="color:${colors[state] || colors.info}; margin-bottom:0;">Resolución del Agente:</span>
        ${badgeHtml}
      </div>
      <p class="output-text">${text}</p>
    `;
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

  // Ejecutar simulación inicial con valores por defecto
  evaluarModulo1();
});
