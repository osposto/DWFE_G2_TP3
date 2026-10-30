# TP3 — Dos sentencias, dos soluciones | FUL Y VALE APP

> **IFTS 29 — Desarrollo de Sistemas Web (Front End)**  
> **Ciclo Lectivo:** 2026 · 2do Cuatrimestre  
> **Modalidad:** Grupal · Construcción 100% Agéntica  
> **Evaluación:** Rúbrica institucional (Aprobado / Desaprobado — Orientado a nivel *Propone*)

---

## 1. Integrantes del Grupo y Roles de Participación

El equipo organizó la dinámica de trabajo de forma coordinada, asumiendo la dirección total del desarrollo sin editar código manualmente, validando cada iteración provista por el agente de programación:

* **Orlando:** Coordinación general del proyecto, formulación de directivas e instrucciones al agente de IA (Antigravity), pruebas funcionales y validación de la experiencia de usuario.
* **Adriana:** Análisis y desmonte de la lógica proposicional de las cuatro sentencias (R1 a R4), especificación de condiciones lógicas y revisión de casos límite/excepciones.
* **Guillermo:** Revisión de la arquitectura visual de los flujos agénticos (SVG), validación de responsividad *desktop-first* sin desbordes horizontales, control de accesibilidad en componentes desplegables y gestión del despliegue.

### Evidencia de Revisión y Mejora Colaborativa (*Nivel Propone*)
Durante la revisión interna del grupo, Adriana observó que la propuesta técnica original para la sentencia **R4** (Inscripción y pago) solo consideraba el escenario de confirmación exitosa o retención pasiva. A partir de esa observación, el equipo debatió y resolvió solicitar al agente la incorporación explícita de un mecanismo de **intervención humana con derivación a soporte** ante eventuales fallas de comunicación con la pasarela bancaria o pagos no imputados tras expirar el tiempo de reserva. Asimismo, Guillermo propuso que en el flujo de **R1** (Búsqueda asistida), ante la ausencia de resultados exactos, el agente brindara al usuario la opción de ampliar el radio kilométrico de búsqueda o activar una alerta proactiva en lugar de un mensaje estático de cierre.

---

## 2. Startup Asignada y Contexto Institucional

* **Nombre de la Startup:** FUL Y VALE APP
* **Logo Original:** Extraído e integrado de forma completa, fidedigna y legible en alta resolución desde el material oficial (`assets/logo.png`).
* **Rubro / Categoría:** Deportes y encuentros recreativos.
* **Objetivo del Servicio:** Aplicación para encontrar partidos de básquet según zona geográfica, horario y nivel de juego de los participantes.
* **Origen y Articulación:** Startup diseñada originalmente por estudiantes del **IFTS 16** mediante formalización de reglas con lógica proposicional. Como equipo de Front End del **IFTS 29**, tomamos esa base conceptual y la transformamos en una propuesta de interacción web y flujos agénticos automatizados.

### Bloques Asignados
Para brindar una cobertura integral de la experiencia deportiva, el proyecto resuelve **ambos bloques** asignados a la startup:

1. **Bloque 1 (`S05-A`) — Búsqueda asistida o manual** (Frases R1 y R2).
2. **Bloque 2 (`S05-B`) — Inscripción y pago** (Frases R3 y R4).

---

## 3. Desmonte Lógico de Sentencias

A continuación se presenta la descomposición analítica de cada sentencia asignada:

### Módulo A: Búsqueda Asistida o Manual
* **Sentencia R1:**
  > *«Si el usuario tiene activa la búsqueda asistida y completó zona, horario y nivel, el sistema busca partidos compatibles; muestra las coincidencias si existen y, si no existen, informa que no encontró resultados.»*
  * **Datos requeridos:** Estado del switch de asistencia (`activo/inactivo`), ubicación/zona del usuario, franja horaria solicitada, nivel autodeclarado (inicial/intermedio/avanzado).
  * **Condición:** `(BúsquedaAsistida == True) ∧ (Zona != Null) ∧ (Horario != Null) ∧ (Nivel != Null)`.
  * **Consecuencia:** Si hay partidos con coincidencia total, se listan y presentan ordenados por relevancia. Si no existen coincidencias, se emite una notificación clara informando la falta de resultados.
  * **Extensión de caso límite (*Propone*):** En caso de cero coincidencias, el agente sugiere ajustar tolerancias (p. ej. radio de +5 km o franjas horarias contiguas).
* **Sentencia R2:**
  > *«Si el usuario desactiva la búsqueda asistida, el sistema mantiene disponible la búsqueda manual y deja de generar sugerencias automáticas.»*
  * **Condición:** `(BúsquedaAsistida == False)`.
  * **Consecuencia:** El agente suspende cualquier sondeo en segundo plano o notificación push, manteniendo el catálogo de partidos abierto a exploración manual y filtrado tradicional sin trabas.

### Módulo B: Inscripción y Pago
* **Sentencia R3:**
  > *«Si un usuario cumple los requisitos del partido, solicita inscribirse, aún no tiene una inscripción y hay cupo libre, el sistema reserva un cupo e inicia una inscripción pendiente; si el partido es arancelado, muestra el pago pendiente.»*
  * **Datos requeridos:** ID de usuario, ID de partido, validación de perfil/edad/nivel, estado de inscripción previa, contador de cupos disponibles en tiempo real, atributo arancelario (`gratuito/arancelado`).
  * **Condición:** `(CumpleRequisitos == True) ∧ (SolicitaInscripcion == True) ∧ (InscripcionPrevia == False) ∧ (CuposLibres > 0)`.
  * **Consecuencia:** Reserva inmediata (bloqueo transaccional) del cupo para evitar *overbooking*. Se crea el registro `Inscripción Pendiente`. Si el partido es arancelado, se despliega la orden con estado `Pago Pendiente`.
* **Sentencia R4:**
  > *«Si existe una inscripción pendiente en un partido arancelado y su pago todavía no fue confirmado, el sistema mantiene esa inscripción pendiente y no la confirma.»*
  * **Condición:** `(Estado == 'InscripcionPendiente') ∧ (EsArancelado == True) ∧ (PagoConfirmado == False)`.
  * **Consecuencia:** El sistema mantiene el cupo reservado bajo un temporizador prudencial sin emitir confirmación definitiva hasta recibir el webhook de la pasarela de pagos.
  * **Extensión con Intervención Humana (*Propone*):** Si se detecta una inconsistencia bancaria (p. ej. comprobante adjuntado pero webhook fallido), el agente deriva el ticket a un moderador humano para validación manual sin desestimar al usuario.

---

## 4. Propuestas Agénticas Presentadas en la Landing

1. **Módulo de Matching Deportivo Asistido:**  
   Un agente de software que evalúa en tiempo real las preferencias del jugador, optimiza trayectos y empareja niveles competitivos. Da autonomía al jugador para alternar en cualquier instante entre recomendaciones proactivas y búsqueda manual tradicional.
2. **Módulo Transaccional de Cupos y Pagos Seguros:**  
   Un agente de gestión que previene el *overbooking* asegurando temporalmente la plaza y orquestando la comunicación asíncrona con plataformas de cobro, protegiendo tanto la vacante del jugador como la transparencia del organizador.

---

## 5. Registro de Herramientas de IA y Construcción Agéntica

El proyecto fue desarrollado aplicando estrictamente el principio **100% agéntico**, donde el grupo actuó como director y evaluador de producto:

* **Entorno / Aplicación:** Google Antigravity IDE.
* **Modelo Utilizado:** Gemini 3.8 Flash (High).
* **Modalidad de Trabajo:** Formulación de requerimientos por fases, auditoría de código generado, inspección visual de interfaces y solicitud de ajustes y refactorizaciones continuas.

### Bitácora de Iteraciones y Mejoras Solicitadas (*Nivel Propone*)

| Iteración | Instrucción / Solicitud del Grupo | Comportamiento / Problema Detectado | Mejora Aplicada por el Agente |
| :--- | :--- | :--- | :--- |
| **01** | Lectura del PDF oficial y análisis de requisitos. | El documento contenía dos bloques distintos (`S05-A` y `S05-B`) para FUL Y VALE APP. | El grupo resolvió abordar ambos bloques para dar una solución completa y robusta de la plataforma. |
| **02** | Recuperación y fidelidad de marca. | Extracción de la identidad gráfica desde el documento original. | Se renderizó la página del PDF a 300 DPI y se aisló el escudo original en [`assets/logo.png`](file:///home/orlando/tecnicatura_superior/Tecnicatura_A3_C1/Desarrollo_web_Front/TP3/assets/logo.png). |
| **03** | Modelado de diagramas de flujo. | La consigna exige representar fielmente condiciones `SÍ / NO` y casos límite. | Se planificaron diagramas vectoriales legibles con bifurcaciones para excepciones y derivación a humanos. |
| **04** | Accesibilidad y diseño *Desktop-First*. | Garantizar navegación sin desbordes y componentes colapsables navegables por teclado. | Implementación de etiquetas semánticas `<details>` y `<summary>` con foco visible y estilos de contraste optimizados. |

---

## 6. Instrucciones de Reproducción Local

Para ejecutar y probar la landing page en un entorno local:

1. Clonar el repositorio o posicionarse en el directorio raíz:
   ```bash
   cd /home/orlando/tecnicatura_superior/Tecnicatura_A3_C1/Desarrollo_web_Front/TP3
   ```
2. Iniciar un servidor HTTP local (Python 3):
   ```bash
   python3 -m http.server 8000
   ```
3. Abrir un navegador web e ingresar a:
   ```
   http://localhost:8000
   ```

### Lista de Comprobación (*Checklist* de Verificación)
* [x] **Visualización en Desktop:** Layout centrado, jerarquía visual clara y ausencia total de barras de scroll horizontal.
* [x] **Identidad Visual:** Logo original visible en cabecera y sección hero con alta nitidez.
* [x] **Interacción de Desplegables:** Los bloques `<details>` se abren y cierran mediante clic del mouse y mediante la tecla `Enter` o `Espacio`.
* [x] **Lectura de Diagramas:** Los dos diagramas de flujo son nítidos, vectoriales y distinguen caminos positivos, negativos y derivaciones a soporte.

---

## 7. Enlaces del Proyecto

* **Repositorio de código:** `[Pendiente de publicación]` *(Completar con URL de GitHub del grupo)*
* **Landing publicada:** `[Pendiente de publicación]` *(Completar con URL pública de Vercel / GitHub Pages)*

