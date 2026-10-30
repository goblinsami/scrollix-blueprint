# Registro de decisiones · 2026-10-29

| ID | Decisión | Motivo / consecuencia |
|---|---|---|
| ADR-001 | Repo independiente; Corridor solo lectura | Adaptar conocimiento sin acoplar productos ni modificar el origen |
| ADR-002 | Un contrato, defaults y validador | Evitar divergencia entre JSON, playground y Framer |
| ADR-003 | Core en lugar de backend | Sin necesidad actual de servidor o base de datos |
| ADR-004 | Un progreso; captura de scroll en host | Facilita reversibilidad, pruebas puras y salida al portfolio |
| ADR-005 | Ownership explícito de recursos y generaciones | Corregir riesgos de cleanup y carreras detectados en auditoría |
| ADR-006 | Fase 0 sin escena ni runtime | El usuario revisa preparación antes de invertir en funcionalidades |
| ADR-007 | Herramientas exactas y árbol transitivo local | Instalación offline reproducible, sin afirmar actualidad de versiones |
| ADR-008 | Validación estricta con paths | Fallos visibles en autoría; defaults solo para omisiones |

Pendientes: modalidad de distribución Framer, geometría mínima de M2, estrategia de texto técnico, budgets medidos, licencias y hosting. No introducir infraestructura para estas decisiones antes de su hito. No se han creado remotos, commits publicados ni deploys.

## ADR-009 · Ejecución M1–M3 autorizada

El usuario autoriza conjuntamente M1, M2 y M3 el 29/10/2026. Se ejecutan secuencialmente, con agentes especializados y QA independiente por hito. La autorización no incluye M4/M5, despliegue ni nuevas operaciones remotas. Se aprueba observabilidad tipada en ports.ts y un único mountBlueprint público que compone Core con una factoría de escena inyectable. El estado observable y las capturas se complementan; no se acepta declarar visualización correcta solo por leer progreso.

## ADR-010 · Encadre reproducible y readiness visual

Core redondea tamaños CSS y deduplica resize para impedir cámaras distintas por orden de observers entero/fraccional. El host aplica scroll primero y lee el progreso real cuantizado, sin valor transitorio alternativo. SceneDiagnostics añade renderedProgress (inicial-1), actualizado solo después de render exitoso; los E2E esperan su coincidencia con progreso actual antes de capturar. renderCount por sí solo podría corresponder a un frame anterior. Estas decisiones conservan comparación exacta de píxeles sin sleeps ni tolerancias nuevas.

## ADR-011 · M3.5-A: cámara espacial y pausa en la misma timeline

Se conserva runtime/lifecycle de M1–M3. La cámara deja de orbitar sobre el centro con fitting permanente: camera.storyboard es contrato compartido con datos normalizados, perfiles desktop/mobile y keyframes de posición/interés. Solo la última pose usa fitting de la composición; el hold termina en1 sin reloj independiente. La geometría A es provisional y usa wallAxes únicos para dibujo y extrusión, con alturas diferenciadas.

La factoría se separa en cameraPath.ts, sceneGeometry.ts y palettes.ts para no crecer como monolito. Las pruebas de frustum completo durante todas las fases se sustituyen por descubrimiento parcial Draw/Extrude y encuadre global Reveal; se mantienen reversibilidad exacta, cancelación, recursos, errores y cleanup. Se valida que el recorrido no atraviese los muros emergidos.

Evidencia local sin FFmpeg: MediaRecorder captura el canvas WebGL real en WebM, recorriendo scroll nativo y el hold dentro de0–1. Un helper añade únicamente duración EBML a la metadata del stream, preservando los bloques codificados. Los vídeos no incluyen HUD/controles. No se usan secuencias de imágenes para simular vídeo. La evidencia está en artifacts/m35a, ignorada por Git y sin publicar.