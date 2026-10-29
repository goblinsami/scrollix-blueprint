---
name: blueprint-progress-camera
description: Diseñar o revisar progreso reversible, cámara y encuadre responsive de Blueprint.
---

# blueprint-progress-camera

Leer docs/CONTRACT.md y ART_DIRECTION.md. El host es dueño del scroll nativo; Core acepta un único progreso normalizado. La escena no intercepta wheel/touch ni mantiene otra timeline. No trasladar loops del corredor o lógica de bottom sheet.

Mantener muestreo determinista por progreso, fronteras continuas y reversibilidad. Encuadrar con dimensiones de estructura y aspect del contenedor; considerar ambas restricciones horizontal/vertical, no solo ancho de ventana.

Probar endpoints, fronteras, progreso inverso, resize y contenedor móvil estrecho. Distinguir targets visuales de resultados observados. Durante Fase 0 solo documentar: Draw/Extrude/Reveal requieren autorización posterior.

Procedencia adaptada: src/journey/framing.ts; RENDERING_GUIDELINES.md; revisión §20. Consultar docs/AUDIT.md y docs/sources/ARCHITECTURE_REVIEW.md desde la raíz del repo.
