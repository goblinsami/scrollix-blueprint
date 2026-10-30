# Scrollix Blueprint — M3.5: Cinematic Redesign

## Contexto

Hemos completado M1–M3 y disponemos de un MVP funcional, pero su resultado visual no corresponde a la dirección artística del producto.

Actualmente, la escena se percibe como una pequeña maqueta arquitectónica observada desde fuera. La cámara permanece centrada en la geometría y utiliza `getFramingDistance()` para mantener el conjunto visible.

**Esto debe cambiar.**

Scrollix Blueprint debe ser una experiencia cinematográfica inmersiva: un recorrido sobre un plano técnico monumental que progresivamente se transforma en arquitectura tridimensional.

El usuario debe descubrir el espacio por partes y comprender el conjunto únicamente durante Reveal.

## Objetivo principal

Rediseñar la puesta en escena conservando la infraestructura funcional existente.

**No reconstruir el proyecto desde cero. No iniciar M4 ni M5.**

## 1. Dirección artística obligatoria

### DRAW — Exploración

- Cámara relativamente baja, oblicua y cercana al suelo.
- Desplazamiento horizontal real sobre el plano arquitectónico.
- Las líneas, retículas, puertas, cotas y símbolos técnicos se dibujan progresivamente.
- El plano debe extenderse visualmente más allá del encuadre; no mostrar sus bordes.
- El movimiento debe transmitir escala monumental y sensación de descubrimiento.
- No añadir frases decorativas ni textos conceptuales sobre el suelo.

### EXTRUDE — Transformación

- La cámara continúa su trayectoria espacial.
- Los muros y elementos estructurales emergen desde las líneas correspondientes.
- La arquitectura debe aparecer cerca de la cámara, generando profundidad y escala.
- Incorporar diferentes alturas, huecos y relaciones espaciales.
- Evitar que la escena parezca una habitación rectangular observada desde arriba.

### REVEAL — Descubrimiento

- La cámara asciende progresivamente.
- Termina en una vista aérea oblicua, aproximadamente 55–70° respecto al plano horizontal.
- Por primera vez se revela la composición arquitectónica completa.
- Mantener el encuadre final durante un tramo de scroll para permitir contemplarlo y leer el CTA.
- Después, transición natural a las secciones HTML de Framer.

## 2. Cambios técnicos

Revisar específicamente:

- `src/scene/motion.ts`
- `src/scene/framing.ts`
- `src/scene/floorPlan.ts`
- `src/scene/createBlueprintScene.ts`
- `src/contracts/BlueprintProject.ts`

Implementar un sistema de cámara basado en keyframes espaciales con:

- Posición de cámara.
- Punto de interés (`lookAt`).
- Orientación coherente.
- Interpolación suave, determinista y reversible.
- Trayectorias diferenciadas para desktop y móvil.
- Encuadre global automático reservado principalmente para Reveal.

Evitar que la cámara orbite permanentemente alrededor del centro.

Mantener una única timeline global de progreso `0–1`.

Separar progresivamente la lógica de cámara, geometría y animación, evitando que `createBlueprintScene.ts` se convierta en un módulo monolítico.

## 3. Composición arquitectónica

La planta actual —perímetro rectangular y división en L— es insuficiente para la dirección artística.

Diseñar una composición conceptual abierta y asimétrica, con:

- Varias zonas arquitectónicas relacionadas.
- Muros de distintas longitudes y alturas.
- Aberturas y espacios negativos.
- Ejes, retículas, puertas, cotas y anotaciones técnicas coherentes.
- Una silueta interesante desde la vista aérea final.

El dibujo técnico y los elementos extruidos deben compartir la misma definición geométrica.

No desarrollar un importador CAD/BIM ni un editor de arquitectura.

## 4. Ejecución por etapas

### M3.5-A — Storyboard y cámara

Primero, crear una composición provisional suficiente para probar la escala y los encuadres. No desarrollar todavía toda la geometría definitiva.

Implementar la nueva cámara y generar capturas en seis puntos del progreso:

- Inicio de Draw.
- Mitad de Draw.
- Final de Draw.
- Mitad de Extrude.
- Inicio de Reveal.
- Reveal final.

Entregar capturas desktop y móvil y una grabación del recorrido completo.

**DETENERSE AQUÍ PARA APROBACIÓN VISUAL DEL USUARIO.**

No comenzar M3.5-B automáticamente.

### M3.5-B — Geometría y dibujo técnico

Solo después de aprobar M3.5-A:

- Sustituir la composición arquitectónica provisional.
- Ampliar el dibujo técnico.
- Sincronizar líneas y extrusiones.
- Ajustar los encuadres a la composición definitiva.

Entregar nueva revisión visual y detenerse.

### M3.5-C — Acabado cinematográfico

Solo después de aprobar M3.5-B:

- Iluminación y sombras.
- Materiales de los tres presets.
- Ritmo de las transiciones.
- Ajustes responsive.
- Optimización de rendimiento.

## 5. Restricciones arquitectónicas

Conservar:

- Runtime y lifecycle existentes.
- Scroll nativo y sección sticky.
- Timeline determinista y reversible.
- Playground compartido con el motor.
- Gestión explícita de recursos WebGL.
- Contrato `BlueprintProject` como fuente de verdad.
- Sistema de agentes, ownership y pruebas existentes.

No duplicar motores, timelines, sistemas de configuración ni integraciones.

No modificar `gallery-3d-v2`.

## 6. Validación

QA debe comprobar:

- Ausencia de saltos bruscos de cámara.
- Interpolación y reversibilidad.
- Correcto montaje y desmontaje.
- Ausencia de clipping importante.
- Encuadres adaptados a desktop y móvil.
- Pruebas unitarias y E2E existentes.
- Rendimiento razonable.

Los criterios visuales son igualmente obligatorios:

1. Draw no debe parecer una maqueta vista desde fuera.
2. La cámara debe recorrer el espacio, no limitarse a orbitar.
3. Extrude debe transmitir volumen y escala.
4. Reveal debe descubrir una composición que antes no era completamente visible.
5. La estética debe ser arquitectónica, editorial y cinematográfica.

**Pasar los tests no equivale a aprobar la dirección artística.**

## 7. Instrucciones para el Orchestrator

Coordina a los agentes Core, 3D, Integration y QA según sus responsabilidades.

Antes de implementar, revisa las instrucciones existentes en `AGENTS.md`, las skills adaptadas de Corridor y los contratos actuales.

Prioriza cambios incrementales sobre la base M1–M3.

Actualiza la documentación pertinente y deja constancia de las decisiones arquitectónicas.

**Autorización actual: implementar únicamente M3.5-A.**

Al finalizar, entrega el código, los resultados de las pruebas, las seis capturas y la grabación desktop/móvil.

Detente y espera aprobación visual. No avances a M3.5-B o M3.5-C, no despliegues y no hagas push sin autorización explícita.