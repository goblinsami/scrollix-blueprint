# Auditoría de reutilización · solo lectura

Origen: C:/WORKSPACE/showcase/gallery-3d-v2. HEAD d78f3e2bfe06873da2aaf91831eb107cfa7da673; árbol limpio al inicio según git status --porcelain. Revisión estática actual; no se han ejecutado tests, build ni npm en Corridor. La revisión histórica adjunta indica 74 pruebas en su momento: no se atribuyen a esta ejecución.

No se encontraron SKILL.md en el inventario (incluidos archivos ocultos, excluyendo .git y node_modules). Sí existen AGENTS.md, .agents/TextureMappingAgent.md y guías de arquitectura, rendimiento y Framer. Las cuatro skills de Blueprint son síntesis adaptadas, no copias de skills preexistentes ni código de Corridor.

| Fuente inspeccionada | Adoptar / adaptar | Descartar o diferir |
|---|---|---|
| src/core/RenderScheduler.ts, PERFORMANCE_RULES.md | Invalidación, pausa por intersección/documento; probar animación activa y cleanup | RAF permanente y presupuestos FPS sin medición |
| src/core/ResourceLibrary.ts, disposeObject3D.ts, tests/resourceLibrary.test.ts | Recursos compartidos con owner único, pruebas de liberación y deduplicación de texturas | Copiar traversal que puede liberar texturas compartidas o ignorar recursos no adjuntos |
| src/runtime/mountGalleryRuntime.ts, revisión §§17–21 | Un punto de montaje, generación por construcción, cancelación y descarte tardío | RuntimeManager y GalleryEngine completos con reglas del pasillo |
| src/utils/validateGalleryProject.ts | Validar unknown una sola vez; sustituir casts/clamps por rangos finitos y errores con path | GalleryProject, items de galería y defaults en adaptadores |
| src/journey/framing.ts, RENDERING_GUIDELINES.md | Encuadre por FOV/aspect y matemáticas puras | Cámaras del corredor, loops, paredes y bottom sheet |
| FRAMER_INTEGRATION.md, src/framer/framerProjectAdapter.ts | Framer como host delgado, controles→contrato | Adaptadores/puentes duplicados y loaders remotos en Fase 0 |
| .agents/TextureMappingAgent.md | Trazabilidad de asset→catálogo→selector y checks | Catálogo de materiales, script sync y texturas: sin necesidad actual |
| package-lock.json | Árbol transitivo adaptado al package.json nuevo, comprobado con npm ci offline | No copiar manifiesto, peers ni nombre del producto |
| AGENTS.md | Referencia histórica revisable | Dependencia obligatoria del legacy |

No se ha copiado código, geometrías, imágenes, texturas, credenciales ni configuración remota. La fuente adjunta ARCHITECTURE_REVIEW.md se copia íntegra desde el workspace del chat y se acredita en sources/PROVENANCE.json con SHA-256. Sus propuestas son evidencia histórica, no instrucciones de implementación aprobadas.

Evidencia automatizada: sources/corridor-before.json y corridor-after.json contienen hashes SHA-256 de archivos del origen excluyendo .git y node_modules. El informe de Fase 0 registra igualdad de inventarios y status final. La integridad interna de .git/node_modules no se acredita por esos hashes; el trabajo realizado solo usa lecturas allí.
