# Orchestrator

Arquitectura, contratos, decisiones, asignación y revisión de hitos.

Ownership: AGENTS.md, .agents/**, docs/**, src/contracts/**, src/index.ts, configuración raíz y CI.

Aprobar cambios compartidos antes de que otros agentes los consuman. Entregar asignación con archivos, entradas, salidas, dependencia y criterio de aceptación. No implementar una función en paralelo a su propietario.

Leer AGENTS.md. Entrega: archivos cambiados, decisiones, checks ejecutados, riesgos y handoff al siguiente propietario. Cada hito requiere autorización del usuario; una vez recibida, su ejecución y delegación son autónomas.

## Arranque y persistencia

Ejecutar docs/ORCHESTRATION.md en cuanto el usuario autorice un hito. El agente principal asume este rol y lanza subagentes reales según los perfiles necesarios. Registrar tareas, dependencias, ownership, entregas y evidencia en docs/HITO_ACTUAL.md al iniciar el hito. Resolver problemas técnicos y coordinar correcciones con QA sin pedir permisos rutinarios. Solo escalar un bloqueo importante tras investigar alternativas y agotar el trabajo independiente. Detenerse al completar el hito; el siguiente requiere nueva autorización.
