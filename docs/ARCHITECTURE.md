# Arquitectura implementada · M3.5-A

Landing arquitectónica conceptual, sin CAD aportado por el comprador. Un runtime independiente de hosts, un progreso normalizado y una escena. No hay API ni base de datos.

## Flujo

Playground DOM → validateBlueprintProject → mountBlueprint → mountBlueprintRuntime → createBlueprintScene.

src/index.ts es el punto público de composición. Core recibe una factoría de escena por inyección; no depende de Three.js. El host captura scroll nativo, slider y teclado; todos alimentan runtime.setProgress. Core sampleTimeline transforma un progreso absoluto en fracciones Draw/Extrude/Reveal. La escena no intercepta wheel ni touch y no mantiene otra timeline.

## Módulos y ownership

- src/contracts/: BlueprintProject v1, defaults únicos, validación unknown, puertos de runtime/escena y observabilidad tipada.
- src/core/timeline.ts: muestreo puro, finito, acotado y reversible.
- src/core/runtime.ts: montaje, actualización transaccional, generaciones/abort, resize, observadores, invalidación y suscripción.
- src/playground/mountPlayground.ts: controles, scroll sticky nativo, presets, viewport responsive y salida al documento. El texto de proyecto se inserta como texto; el template HTML es estático.
- src/scene/floorPlan.ts: segmentos paramétricos de contorno/partición, hueco de entrada, arco y dos cotas.
- src/scene/motion.ts: altura de muros y coordinación de la cámara espacial con una única timeline.
- src/scene/framing.ts: encuadre de ocho esquinas del volumen usando la misma base de cámara.
- src/scene/cameraPath.ts: posición/lookAt por keyframes normalizados, perfiles y hold; fitting global del último keyframe.
- src/scene/sceneGeometry.ts: suelo/retícula extendidos, drawRange, cotas y muros desde los mismos ejes.
- src/scene/createBlueprintScene.ts: composición Three.js y render bajo demanda, con geometría/cámara delegadas a helpers.
- src/scene/ResourceOwner.ts: ownership explícito y liberación deduplicada de todos los recursos asignados.

## Lifecycle y render

Cada actualización valida antes de cancelar la construcción pendiente. Solo el último build válido se aplica; los resultados tardíos se liberan. El candidato se dimensiona, recibe progreso y completa un primer render antes de reemplazar la última escena válida. Si falla su construcción/preparación, la escena anterior se conserva. El progreso se mantiene en actualizaciones de preset.

dispose es idempotente: aborta trabajo pendiente y elimina RAF, observers, listeners, canvas, geometrías, materiales, texturas y contexto. Tras dispose las mutaciones no producen trabajo. Cada escena comparte geometría/material de muros y libera también recursos no adjuntos. No hay importaciones ni dependencias de Corridor.

El scheduler agrupa invalidaciones en un RAF, sin bucle permanente. Pausa si el documento está oculto o el contenedor queda fuera de pantalla y reanuda trabajo pendiente al volver. Resize usa píxeles CSS positivos redondeados de forma única y DPR limitado por proyecto; entradas equivalentes no provocan resize redundante. Esta cuantización evita carreras entre DOMRect fraccional y clientHeight entero.

## Escena y cámara

Plano centrado en XZ, Y arriba. Los segmentos subdivididos se dibujan con drawRange; puerta y cotas siguen subintervalos dentro de Draw. CanvasTexture genera los dos textos técnicos sin assets remotos. Muros comparten los ejes del plano y respetan el hueco de entrada. La altura base crece con smoothstep durante Extrude y cada eje aplica su heightScale; Reveal descubre la composición con una cámara aérea oblicua. Toda transformación se reconstruye desde progreso, sin acumular deltas ni depender del tiempo transcurrido.

La cámara se traslada por posiciones y puntos de interés diferenciados en Draw/Extrude, con up mundialY. Solo la pose final usa framing global según FOV/aspect/fill. Los recortes anteriores son narrativos; se comprueba que la cámara no atraviese muros. La dirección final default tiene62° sobre el suelo y se mantiene desde holdStart hasta1. Las anotaciones compensan tamaño y perspectiva para seguir legibles. Sin sombras dinámicas obligatorias ni postprocesado.

## Observabilidad y pruebas

getState/subscribe entregan snapshots independientes con fase/fracciones, sceneReady, disposed y diagnósticos reales de escena. sceneReady requiere primer render correcto. El host proyecta datos a dataset del viewport para E2E. Los tests esperan coincidencia entre renderedProgress y progreso actual y avance de renderCount y combinan estado, geometría, píxeles y revisión de capturas; un dato de progreso no demuestra por sí solo visualización correcta.

## Fuera de estos hitos

M3.5-B/C requieren aprobación visual deA: geometría definitiva y acabado/optimización. M4: narrativa editorial completa, CTAs/portfolio real, accesibilidad y fallback WebGL de producto. M5: adaptador Framer y distribución. El playground actual no equivale a esas integraciones. Las pruebas headless y la emulación móvil no certifican rendimiento ni memoria en GPU física.
