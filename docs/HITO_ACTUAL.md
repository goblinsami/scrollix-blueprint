# Ejecución M1–M3

Autorización del usuario (29/10/2026): «completa secuencialmente sin detenerte el M1, M2 Y M3». Incluye delegación real e implementación/QA de los tres, sin paradas entre hitos. M4/M5, despliegues y pushes no forman parte de esta autorización.

## Contratos aprobados para M1

ports.ts añade TimelineState, BlueprintState, SceneDiagnostics, suscripción, lectura de estado y una factoría de escena cancelable. El runtime recibe la factoría por inyección; en M1 no existe escena y sceneReady=false. En M2 se conecta la escena real por el único punto público de montaje. Timeline pura con progreso [0,1], fases continuas, avances/reversos deterministas. Diagnósticos acompañan las pruebas visuales, no las sustituyen.

## Asignaciones y orden

| Hito | Agente | Archivos reservados | Salida |
|---|---|---|---|
| M1 | Core | src/core/** | Timeline, runtime, lifecycle cancelable, scheduler, subscribe |
| M1 | Integration | src/integration/**, src/playground/**, src/main.ts, src/style.css, index.html | Playground local, slider, scroll sticky nativo, presets, resize y estado observable |
| M1 | QA | tests/runtime.test.ts, tests/timeline.test.ts, e2e/** | Pruebas independientes y navegador real |
| M2 | 3D | src/scene/** | Plano Draw paramétrico, puerta, dos cotas y recursos explícitos |
| M2 | QA | tests/scene.test.ts, e2e/** | Reversibilidad, capturas desktop/móvil y ownership |
| M3 | 3D | src/scene/** | Extrude, Reveal, cámara continua |
| M3 | QA | tests/**, e2e/** | Recorrido completo, fronteras, reconstrucciones y capturas |
| Todos | Orchestrator | src/contracts/**, src/index.ts, docs/**, configuración | Contratos, integración, decisiones y aceptación |

Checks: npm run check:all; QA revisión de capturas, errores de navegador y recursos. No modificar Corridor. Estado inicial: M1 en ejecución, M2/M3 pendientes.

## Cierre M1 y apertura M2

M1 aprobado por QA y Orchestrator: TypeScript, build, 46 tests unitarios (28 contrato, 8 timeline, 10 runtime) y 15 E2E correctos. Capturas revisadas en 1440×900, 390×844 y 320×568: controles completos sin recortes. Sin escena todavía, explícitamente. M2 en ejecución por 3D, QA amplía tests de geometría/recursos y WebGL real; M3 pendiente de aceptación M2.

## Cierre M2 y apertura M3

M2 aprobado por QA y Orchestrator: TypeScript, build, 58 unitarios y 21 E2E correctos. Canvas WebGL real; contorno paramétrico, puerta/arco y dos cotas de12.00m/18.00m verificados con modelo, diferencias de píxeles y capturas. Reversa y reconstrucción Paper reproducen imagen exacta en los tres tamaños. Resuelta carrera entre resize entero/fraccional con cuantización única en Core y deduplicación; regresión unitaria añadida. Cotas ajustadas a legibilidad12/13CSSpx. 3D inicia M3; QA amplía pruebas a volumen, cámara, fronteras y reconstrucciones. No se han realizado acciones remotas ni cambios en Corridor.

## Cierre M3 · 29/10/2026

M1, M2 y M3 COMPLETADOS secuencialmente bajo la autorización conjunta. Orchestrator coordinó los agentes Core, Integration, 3D y QA reales. M3: muros compartidos sobre los ejes del plano, hueco de entrada, materiales de los tres presets y cámara continua cenital→oblicua. El movimiento absoluto vuelve al mismo estado geométrico y visual al retroceder.

Validación final: TypeScript, 73 unitarios (contrato/timeline/lifecycle/geometría/recursos/movimiento/frustum), build y 33 E2E correctos. Incluye dibujo y borrado, fases y fronteras, altura/cámara, teclado/wheel/range/pointer/tap táctil, resize, presets y ciclos WebGL reales de mount/update/dispose. Comparaciones de píxeles exactas para reversa y retorno a Paper. Capturas de desktop1440×900, móvil390×844 y compacto320×568 revisadas por QA y Orchestrator; las cotas se mantienen visibles y legibles.

Correcciones durante QA: cuantización/dedup resize en Core, sincronización del host desde scroll real, readiness por renderedProgress, encuadre continuo con up vector compartido y desplazamiento de cota lateral fuera de la silueta del muro. No se rebajaron los asserts visuales ni se aprobaron baselines a ciegas.

Corridor: 307 archivos comparados de nuevo con inventario/hash inicial; idénticos (excluidos .git/node_modules). Sin cambios remotos, despliegues ni modificaciones del origen. M4/M5 pendientes de autorización; este cierre se limita al MVP visual local.

## Nuevo encargo recibido · 30/10/2026

El usuario entrega M3.5 Cinematic Redesign al Orchestrator. Fuente íntegra: docs/M3_5_CINEMATIC_BRIEF.md. Autorización limitada a M3.5-A (storyboard, cámara y composición provisional). Requiere seis encuadres desktop/móvil y grabaciones del recorrido; detenerse para aprobación visual antes de B/C. No M4/M5 ni push/deploy de M3.5. M1–M3 ya publicados en14da40ae8a3f01358b502e0942908185648bdc8e, verificado origin/main.

## Inicio M3.5-A · 30/10/2026

Autorización explícita: «completa M3.5-A». Solo cámara/storyboard y composición provisional; gate visual del usuario antes de B. Reservas: Core en src/contracts/{BlueprintProject,defaults,validate,ports}.ts; 3D en src/scene/**; QA en tests/**, e2e/** y arnés/evidencia artifacts/m35a; Orchestrator en docs y proyección de diagnósticos del host cuando contrato esté listo. Contrato aprobado camera.storyboard con holdStart y perfiles desktop/mobile de keyframes {at,position,lookAt,fit?}; coords normalizadas x/y*width,z*depth; worldUp Y; fit solo último frame y hold hasta1. Defaults dependen de los límites de la única timeline. Sin push/deploy ni cambios en Corridor.

## Entrega M3.5-A · publicada; aprobación visual pendiente

Implementación y QA técnico completados; código, informe y galería `artifacts/m35a/` publicados en `goblinsami/scrollix-blueprint`. La galería contiene 12 capturas originales, 2 WebM del recorrido completo, 12 fotogramas decodificados y manifiestos. Informe con imágenes y enlaces directos: [docs/reports/M3.5-A.md](reports/M3.5-A.md). La aprobación artística del usuario sigue pendiente. DETENIDO antes de M3.5-B/C y M4/M5.
