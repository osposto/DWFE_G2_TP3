# TP3 — Dos sentencias, una solución | FUL Y VALE APP

> **IFTS 29 — Desarrollo de Sistemas Web (Front End)**  
> **Ciclo Lectivo:** 2026 · 2do Cuatrimestre  
> **Modalidad:** Grupal · Construcción 100% Agéntica  
> **Evaluación:** Rúbrica institucional (Aprobado / Desaprobado — Orientado a nivel *Propone*)

---

## 1. Integrantes del Grupo y Roles de Participación

El equipo organizó la dinámica de trabajo de forma coordinada, asumiendo la dirección total del desarrollo sin editar código manualmente, validando cada iteración provista por el agente de programación:

* **Orlando:** Coordinación general del proyecto, formulación de directivas e instrucciones al agente de IA (Antigravity), pruebas funcionales y validación de la experiencia de usuario.
* **Adriana:** Análisis y desmonte de la lógica proposicional de las sentencias asignadas (**R1** y **R2**), especificación de condiciones lógicas y revisión de casos límite (ausencia de resultados).
* **Guillermo:** Revisión de la arquitectura visual del flujo agéntico (diagrama SVG), validación de responsividad *desktop-first* sin desbordes horizontales, control de accesibilidad en componentes desplegables y gestión del despliegue.

### Evidencia de Revisión y Mejora Colaborativa (*Nivel Propone*)
Durante el desmonte de las sentencias, Adriana identificó que en la sentencia **R1** (Búsqueda asistida), la condición de inexistencia de coincidencias normalmente se traduce en un mensaje estático pasivo de "cero resultados", lo que rompe la fluidez de la experiencia del jugador. A partir de esa observación, el equipo debatió y resolvió instruir al agente para incorporar un comportamiento proactivo: ofrecer la ampliación automática de tolerancia de radio geográfico (**+5 km**) o permitir suscribirse a un **«Vigilante Inteligente de Vacantes»** que notifique al jugador si se abre un cupo afín, requiriendo su consentimiento explícito para no vulnerar su preferencia original.

---

## 2. Startup Asignada y Contexto Institucional

* **Nombre de la Startup:** FUL Y VALE APP
* **Logo Original:** Extraído e integrado de forma completa, fidedigna y legible en alta resolución desde el material oficial (`assets/logo.png`).
* **Rubro / Categoría:** Deportes y encuentros recreativos.
* **Objetivo del Servicio:** Aplicación para encontrar y organizar partidos de básquet según zona geográfica, horario y nivel de juego de los participantes.
* **Origen y Articulación:** Startup diseñada originalmente por estudiantes del **IFTS 16** mediante formalización de reglas con lógica proposicional. Como equipo de Front End del **IFTS 29**, tomamos esa base conceptual y la transformamos en una propuesta de interacción web y flujo agéntico automatizado.

### Bloque Asignado
* **Bloque 1 (`S05-A`) — Búsqueda asistida o manual** (Frases R1 y R2).

---

## 3. Desmonte Lógico de Sentencias

A continuación se presenta la descomposición analítica de las sentencias asignadas para el Bloque `S05-A`:

### Módulo: Búsqueda Asistida o Manual
* **Sentencia R1:**
  > *«Si el usuario tiene activa la búsqueda asistida y completó zona, horario y nivel, el sistema busca partidos compatibles; muestra las coincidencias si existen y, si no existen, informa que no encontró resultados.»*
  * **Datos requeridos:** Estado del switch de asistencia (`activo/inactivo`), ubicación/zona del usuario, franja horaria solicitada, nivel autodeclarado (inicial/intermedio/avanzado).
  * **Condición lógica formal:** `(BúsquedaAsistida == True) ∧ (Zona != Null) ∧ (Horario != Null) ∧ (Nivel != Null)`.
  * **Consecuencia:** Si hay partidos con coincidencia total, se listan y presentan ordenados por relevancia. Si no existen coincidencias, se emite una notificación clara informando la falta de resultados.
  * **Extensión de caso límite (*Nivel Propone*):** En caso de cero coincidencias, el agente sugiere proactivamente ajustar tolerancias (radio geográfico de +5 km) o activar una alerta inteligente cuando un partido compatible se abra.

* **Sentencia R2:**
  > *«Si el usuario desactiva la búsqueda asistida, el sistema mantiene disponible la búsqueda manual y deja de generar sugerencias automáticas.»*
  * **Condición lógica formal:** `(BúsquedaAsistida == False)`.
  * **Consecuencia:** El agente suspende cualquier sondeo en segundo plano o notificación proactiva, manteniendo el catálogo de partidos abierto a exploración manual y filtrado tradicional sin bloqueos.

---

## 4. Propuesta Agéntica Presentada en la Landing

* **Módulo de Emparejamiento Deportivo Asistido:**  
  Un agente de software que evalúa en tiempo real las preferencias del jugador, optimiza trayectos y empareja niveles de habilidad deportiva. Da autonomía al jugador para alternar en cualquier instante entre recomendaciones proactivas y búsqueda manual tradicional sin fricción.

---

## 5. Registro de Herramientas de IA y Construcción Agéntica

El proyecto fue desarrollado aplicando estrictamente el principio **100% agéntico**, donde el grupo actuó como director y evaluador de producto:

* **Entorno / Aplicación:** Google Antigravity IDE.
* **Modelo Utilizado:** Gemini 3.8 Flash.
* **Modalidad de Trabajo:** Formulación de requerimientos por fases, auditoría de código generado, inspección visual de interfaces y solicitud de ajustes y refactorizaciones continuas.

### Bitácora de Iteraciones y Mejoras Solicitadas (*Nivel Propone*)

| Iteración | Instrucción / Solicitud del Grupo | Comportamiento / Problema Detectado | Mejora Aplicada por el Agente |
| :--- | :--- | :--- | :--- |
| **01** | Lectura del PDF oficial y análisis de requisitos. | Se requería identificar con exactitud la startup asignada y sus sentencias lógicas. | Extracción y formalización del bloque `S05-A` (Búsqueda asistida o manual: R1 y R2) de FUL Y VALE APP. |
| **02** | Recuperación y fidelidad de marca. | Extracción de la identidad gráfica desde el documento original. | Se renderizó la página del PDF a 300 DPI y se aisló el escudo original en [`assets/logo.png`](file:///home/orlando/tecnicatura_superior/Tecnicatura_A3_C1/Desarrollo_web_Front/TP3/assets/logo.png). |
| **03** | Modelado del diagrama de flujo. | La consigna exige representar fielmente condiciones `SÍ / NO` y casos límite. | Diagrama vectorial SVG nítido y responsivo con bifurcaciones para datos incompletos y derivación a sugerencias proactivas. |
| **04** | Accesibilidad y diseño *Desktop-First*. | Garantizar navegación sin desbordes y componentes colapsables navegables por teclado. | Implementación de etiquetas semánticas `<details>` y `<summary>` con foco visible y estilos de contraste optimizados. |
| **05** | Servidor local y preparación para despliegue. | Transición de servidor local a entorno estándar Node.js/Express. | Configuración de `server.js` y `package.json` para ejecución local y compatibilidad directa con Vercel. |

---

## 6. Instrucciones de Reproducción Local

Para ejecutar y probar la landing page en un entorno local con **Node.js**:

1. Posicionarse en el directorio raíz del proyecto:
   ```bash
   cd /home/orlando/tecnicatura_superior/Tecnicatura_A3_C1/Desarrollo_web_Front/TP3
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor local:
   ```bash
   npm start
   ```
4. Abrir un navegador web e ingresar a:
   ```
   http://localhost:3000
   ```

### Lista de Comprobación (*Checklist* de Verificación)
* [x] **Visualización en Desktop:** Layout centrado, jerarquía visual clara y ausencia total de barras de scroll horizontal.
* [x] **Identidad Visual:** Logo original visible en cabecera y sección hero con alta nitidez.
* [x] **Interacción de Desplegables:** Los bloques `<details>` se abren y cierran mediante clic del mouse y mediante la tecla `Enter` o `Espacio`.
* [x] **Lectura del Diagrama:** Diagrama de flujo SVG nítido y vectorial que distingue entradas, condiciones, acciones agénticas y bifurcaciones.
* [x] **Simulador Interactivo:** Consola interactiva en vivo que evalúa en tiempo real las reglas R1 y R2.

---

## 7. Enlaces del Proyecto

* **Repositorio de código:** https://github.com/osposto/DWFE_G2_TP3
* **Landing publicada:** `[Pendiente de publicación en Vercel]` *(Completar tras conectar Vercel con el repositorio)*
