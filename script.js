/**
 * FUL Y VALE APP — Script de Lógica Agéntica y Accesibilidad
 * TP3 IFTS 29 · Desarrollo de Sistemas Web Front End
 * Construcción 100% Agéntica
 */

document.addEventListener('DOMContentLoaded', () => {

  // ========================================================================
  // 1. SIMULADOR MÓDULO 1: Búsqueda Asistida o Manual (R1 y R2)
  // ========================================================================
  const simAsistida = document.getElementById('sim-asistida');
  const simZona = document.getElementById('sim-zona');
  const simNivel = document.getElementById('sim-nivel');
  const simHorario = document.getElementById('sim-horario');
  const simHayPartidos = document.getElementById('sim-hay-partidos');
  const btnEvaluar1 = document.getElementById('btn-evaluar-1');
  const outSim1 = document.getElementById('resultado-sim-1');

  function evaluarModulo1() {
    const asistidaActiva = simAsistida.checked;
    const zona = simZona.value.trim();
    const nivel = simNivel.value.trim();
    const horario = simHorario.value.trim();
    const hayPartidos = simHayPartidos.checked;

    let reglaHtml = '';
    let mensaje = '';
    let tipoEstado = 'info';

    if (!asistidaActiva) {
      // Regla R2
      reglaHtml = '<span class="badge" style="background:#475569; color:#fff;">Aplica Regla R2</span>';
      mensaje = '<strong>Búsqueda asistida desactivada:</strong> El sistema suspende el agente de sugerencias automáticas y mantiene disponible el catálogo completo en modo de búsqueda manual tradicional.';
      tipoEstado = 'warning';
    } else {
      // Asistida activa -> Evaluar si completó zona, horario y nivel
      if (!zona || !nivel || !horario) {
        const faltantes = [];
        if (!zona) faltantes.push('zona');
        if (!nivel) faltantes.push('nivel');
        if (!horario) faltantes.push('horario');

        reglaHtml = '<span class="badge" style="background:#b45309; color:#fff;">Condición Incompleta</span>';
        mensaje = `<strong>Faltan datos obligatorios:</strong> El agente detecta que falta completar: <em>${faltantes.join(', ')}</em>. Solicita completar los campos sin generar sanciones ni búsquedas en falso.`;
        tipoEstado = 'warning';
      } else {
        // Campos completos -> Regla R1
        if (hayPartidos) {
          reglaHtml = '<span class="badge" style="background:#059669; color:#fff;">Aplica Regla R1 · Éxito</span>';
          mensaje = `<strong>¡Coincidencias encontradas!</strong> El agente halló partidos compatibles en <strong>${zona}</strong> para nivel <strong>${nivel}</strong> (${horario}). Se listan y destacan con prioridad.`;
          tipoEstado = 'success';
        } else {
          reglaHtml = '<span class="badge" style="background:#d97706; color:#fff;">Aplica Regla R1 · Sin Coincidencias</span>';
          mensaje = `<strong>Sin resultados inmediatos:</strong> El sistema informa al usuario que no encontró partidos compatibles. <em>★ Mejora Propone:</em> El agente ofrece ampliar el radio geográfico a +5 km o activar una alerta inteligente cuando un partido se abra.`;
          tipoEstado = 'warning';
        }
      }
    }

    renderOutput(outSim1, reglaHtml, mensaje, tipoEstado);
  }

  btnEvaluar1.addEventListener('click', evaluarModulo1);

  // ========================================================================
  // 2. SIMULADOR MÓDULO 2: Inscripción y Pago (R3 y R4)
  // ========================================================================
  const simRequisitos = document.getElementById('sim-requisitos');
  const simSinInscripcion = document.getElementById('sim-sin-inscripcion');
  const simHayCupo = document.getElementById('sim-hay-cupo');
  const simArancelado = document.getElementById('sim-arancelado');
  const simPagoConfirmado = document.getElementById('sim-pago-confirmado');
  const btnEvaluar2 = document.getElementById('btn-evaluar-2');
  const outSim2 = document.getElementById('resultado-sim-2');

  function evaluarModulo2() {
    const requisitos = simRequisitos.checked;
    const sinInscripcion = simSinInscripcion.checked;
    const hayCupo = simHayCupo.checked;
    const esArancelado = simArancelado.checked;
    const pagoConfirmado = simPagoConfirmado.checked;

    let reglaHtml = '';
    let mensaje = '';
    let tipoEstado = 'info';

    // Validación preliminar
    if (!requisitos || !sinInscripcion || !hayCupo) {
      const motivos = [];
      if (!requisitos) motivos.push('El jugador no cumple con los requisitos del partido (nivel/edad)');
      if (!sinInscripcion) motivos.push('El usuario ya cuenta con una inscripción activa en este partido');
      if (!hayCupo) motivos.push('No quedan cupos libres disponibles (cancha completa)');

      reglaHtml = '<span class="badge" style="background:#dc2626; color:#fff;">Inscripción Rechazada</span>';
      mensaje = `<strong>No se puede iniciar inscripción:</strong> ${motivos.join('; ')}. No se alteran los cupos del sistema.`;
      tipoEstado = 'danger';
    } else {
      // Cumple requisitos, sin inscripción y con cupo libre -> Aplica Regla R3
      if (!esArancelado) {
        reglaHtml = '<span class="badge" style="background:#059669; color:#fff;">Aplica Regla R3 · Gratuito</span>';
        mensaje = '<strong>¡Lugar asegurado!</strong> Al ser un encuentro gratuito, el agente reserva el cupo y confirma la inscripción de manera inmediata emitiendo el pase digital.';
        tipoEstado = 'success';
      } else {
        // Es arancelado -> Estado Pago Pendiente
        if (pagoConfirmado) {
          reglaHtml = '<span class="badge" style="background:#059669; color:#fff;">Aplica Regla R3 + Pago OK</span>';
          mensaje = '<strong>¡Inscripción confirmada!</strong> La pasarela bancaria acreditó el arancel. El agente pasa la reserva de "Pendiente" a "Confirmada Definitiva".';
          tipoEstado = 'success';
        } else {
          // No confirmado aún -> Regla R4
          reglaHtml = '<span class="badge" style="background:#d97706; color:#fff;">Aplica Regla R4 · Retención Activa</span>';
          mensaje = '<strong>Inscripción y Pago Pendientes:</strong> El agente mantiene reservado el cupo bajo un bloqueo temporal (15 min) y <em>no confirma la inscripción</em> hasta que el webhook de pago emita confirmación válida.<br><br><em>★ Nivel Propone (Intervención Humana):</em> Si el usuario reporta débito bancario pero la pasarela demoró la respuesta, se transfiere automáticamente el reclamo a un moderador humano.';
          tipoEstado = 'warning';
        }
      }
    }

    renderOutput(outSim2, reglaHtml, mensaje, tipoEstado);
  }

  btnEvaluar2.addEventListener('click', evaluarModulo2);

  // Helper para renderizar resultado
  function renderOutput(container, badgeHtml, text, state) {
    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#f36b21'
    };

    container.style.borderLeftColor = colors[state] || colors.info;
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
        <span class="output-label" style="color:${colors[state] || colors.info}; margin-bottom:0;">Resolución del Agente:</span>
        ${badgeHtml}
      </div>
      <p class="output-text">${text}</p>
    `;
  }

  // ========================================================================
  // 3. ACCESIBILIDAD Y TECLADO EN DESPLEGABLES (<details>)
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

  // Ejecutar simuladores con valores por defecto al cargar la página
  evaluarModulo1();
  evaluarModulo2();
});

