# Estado · 31/10/2026
## Issue #2 · M3.5-A.3 — Recorrido sticky ampliado

Completada con un único agente. Único cambio de producto en CSS: distancia efectiva de 10 alturas de viewport en escritorio y 6 en móvil (breakpoint existente <=600 px). Journey añade la altura del sticky: total 11 pantallas desktop / 7 móvil. JS continúa leyendo las dimensiones reales del DOM, sin duplicar la fórmula.

Verificación real en Edge headless:

| Viewport | Distancia efectiva | Altura total journey |
|---|---|---|
| 1440×900 | 9000 px | 9900 px |
| 390×844 | 5064 px | 5908 px |
| 320×568 | 3408 px | 3976 px |

También verificado el límite responsive: 600×450 →2700 px; 601×450 →4500 px. E2E comprueban avance/reversa, 100%, sticky, salida al HTML y reduced motion. Smoothing de130 ms, timeline, controles, cámara, geometría y materiales sin cambios.

Pruebas: npm.cmd run check PASS (TypeScript,104 unitarios y build); 6 E2E focalizados PASS (18,6 s) mediante manual-scroll/scaffold y grep "calibrated native scroll|wheel traverses". Sin vídeos, galerías ni nuevas capturas. Persiste aviso de bundle >500 kB. Commit/push a main autorizados para esta issue; detenerse sin otros hitos.

## Issue #1 · M3.5-A.2 — Suavizado del scroll manual

Implementada con un único agente, sobre la base de las cuatro tareas ya completadas. No se modificaron keyframes, materiales, geometría ni runtime de escena.

- El host separa targetProgress (scroll real) y visualProgress (único progreso enviado al runtime). Filtro exponencial independiente de FPS: alpha = 1-exp(-dt/130 ms), sin velocidad acumulada ni overshoot; nuevos targets sustituyen inmediatamente a los anteriores.
- Convergencia exacta al target al alcanzar error <=0.0001; RAF únicamente durante transición y cancelación al desmontar. Slider, teclado del range y botones siguen siendo directos y no se sobrescriben con valores visuales atrasados.
- Reduced motion cancela la interpolación pendiente y aplica el target inmediatamente; se conserva la vista Reveal estática existente. Scroll nativo, sticky, recorrido, hold y salida a la página permanecen operativos.
- Referencia: artifacts/m35a/desktop-journey.webm. El vídeo avanza con scroll continuo; el nuevo filtro convierte los pasos manuales en valores intermedios sin imponer una duración o velocidad fija. Tau de 130 ms es la calibración inicial dentro del rango solicitado; la evaluación perceptual sigue abierta a revisión del usuario.

Archivos: src/playground/progressSmoother.ts (nuevo), mountPlayground.ts, tests/progressSmoother.test.ts (nuevo) y e2e/manual-scroll.spec.ts. Sin dependencias nuevas.

## Validación ejecutada

- Focalizada inicial: 6 pruebas del filtro correctas (30/60/120 FPS, inversión, convergencia, RAF en reposo, controles directos, reduced motion y dispose/callback tardío).
- Cierre: npm.cmd run check — TypeScript, **104 unitarios en 8 archivos** y build correctos.
- npm.cmd run test:e2e -- e2e/manual-scroll.spec.ts e2e/scaffold.spec.ts --grep-invert "loads a usable" — **24 E2E correctos (20,9 s)** en escritorio, móvil y compacto. Verifican pasos intermedios, inversión, asentamiento exacto, pausa de render, interrupción por reduced motion, slider/teclado/touch, presets y fin del recorrido.
- La prueba existente de reversibilidad ahora espera igualdad exacta visual/target antes de comparar; no se amplió su tolerancia. No se ejecutó QA visual extensa ni se generaron nuevas capturas de entrega, vídeos o manifiestos.

Build correcto con la advertencia previa de bundle >500 kB (ahora 502,33 kB). No se afirma certificación de FPS/GPU físicos ni aprobación artística automática.

## Trabajo previo conservado

Las tareas 1–4 siguen completadas: protocolo secuencial ligero, scroll nativo calibrado, composición provisional abierta con contornos/cotas de envolvente real y unión superficial de muros L/T/cruz con alturas distintas. Implementación base en b98d625. Su geometría permanece provisional y ortogonal.

Commit/push autorizados a main para esta issue. Sin cambios en Corridor, sin despliegues ni avance a otros hitos. Detenerse tras publicar.
