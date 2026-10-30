# Plan por hitos

M0 está completado. El usuario autoriza cada hito por separado. Esa autorización pone en marcha al Orchestrator y a los agentes necesarios hasta completar el hito, conforme a [ORCHESTRATION.md](ORCHESTRATION.md). M1, M2 y M3 están completados; M4 y M5 siguen pendientes. Ver HITO_ACTUAL.md para evidencia y autorización conjunta. Cada hito requiere comprobar dependencias y asignar archivos; contratos compartidos se cierran antes del trabajo paralelo.

| Hito | Responsable / dependencia | Entrega y aceptación |
|---|---|---|
| M0 · preparación | Orchestrator | Repo, auditoría, skills, perfiles, contrato, docs, scaffold y checks locales; revisión del usuario |
| M1 · runtime y playground mínimo · COMPLETADO | Core + Integration; M0 aprobado | mount/update/dispose único, progreso puro y control manual; tests de cancelación, idempotencia, entradas inválidas y resize; ninguna duplicación Framer |
| M2 · Draw vertical · COMPLETADO | 3D; M1 estable | Un contorno, puerta y dos cotas paramétricas; reversible con slider y scroll nativo; revisión desktop/móvil y ownership GPU verificado |
| M3 · Extrude y Reveal · COMPLETADO | 3D + Core; M2 aprobado | Volumen emerge con cámara continua; fronteras de fase, progreso 0/1 e inversión sin saltos; recurso estable tras reconstrucciones |
| M4 · narrativa y responsive | Integration + QA; M3 | Estaciones HTML, portfolio, teclado y reduced motion; fallback sin WebGL y scroll sin bloqueo; capturas y pruebas en tamaños acordados |
| M5 · Framer y distribución | Integration + Orchestrator; M4 | Un adaptador, paridad con playground y versiones completas; prueba de montaje repetido y errores de carga. Publicación y servicios remotos solo con permiso explícito |

QA participa desde M1: tests puros de timeline; integración de lifecycle con dobles de renderer/cargas; posteriormente navegador real para WebGL, accesibilidad, visibilidad y pérdida de contexto. Medir memoria/recursos tras ciclos mount/update/dispose y frame time en móvil real. Los tests actuales solo acreditan contratos y build.

Antes de cada handoff: npm run check; comparar diff con ownership; registrar evidencia, pendientes y criterio no satisfecho. El Orchestrator resuelve cualquier cambio de API antes de continuar dependientes. No se requiere refactorizar Corridor para iniciar Blueprint.

## Ampliación QA autorizada

Preparar y ejecutar Playwright sobre el scaffold actual está autorizado. No amplía por sí solo el alcance a implementar M1–M5. Cada hito incorporará los escenarios E2E de [E2E.md](E2E.md) como criterio de aceptación, además de sus tests puros.

## Inicio y cierre

Una autorización como «Autorizo M1» basta para iniciar planificación, delegación real, implementación, integración y QA de ese hito. No solicitar aprobación entre tareas rutinarias. El Orchestrator mantiene docs/HITO_ACTUAL.md desde el arranque y solo interrumpe la ejecución por un bloqueo importante no resoluble dentro de su autorización. Tras completar la aceptación, presenta resultados y espera la autorización del siguiente hito.

## M3.5 · Cinematic Redesign (antes de M4)

Brief recibido por el Orchestrator el 30/10/2026: [fuente íntegra](M3_5_CINEMATIC_BRIEF.md). [Plan operativo y asignaciones](M3_5_PLAN.md). Se conserva la infraestructura M1–M3 y se rediseña la puesta en escena.

- M3.5-A: storyboard, cámara espacial y composición provisional. Autorización limitada a A; este handoff deja el plan preparado, sin cambios de producto. Entrega12 capturas (6 puntos×desktop/móvil),2 grabaciones y resultados técnicos. DETENERSE para aprobación visual del usuario.
- M3.5-B: geometría/dibujo técnico definitivo; solo después de aprobar A. Nueva parada visual al cerrar B.
- M3.5-C: acabado cinematográfico, materiales/iluminación, ritmo y rendimiento; solo después de aprobar B.

M4/M5 permanecen fuera de alcance. No push ni deploy de M3.5 sin autorización explícita. Tests verdes no equivalen a aprobación artística.

M3.5-A implementado el30/10/2026 y entregado para revisión visual. B/C bloqueados hasta aprobación explícita. Ver M3_5_A_REPORT.md y la galería local en artifacts/m35a/index.html.
