# Ownership y handoffs

| Superficie | Propietario | Revisión / consumidor |
|---|---|---|
| src/contracts/**, src/index.ts | Orchestrator; Core por asignación explícita | Todos; QA prueba límites |
| src/core/** (futuro) | Core | 3D e Integration |
| src/scene/** (futuro) | 3D | Core y QA |
| src/integration/**, src/playground/** (futuros), página de estado | Integration | Core y QA |
| tests/**, e2e/** y revisión de capturas | QA | Propietario de la función revisa casos |
| docs/**, .agents/**, configuración y CI | Orchestrator | Rol afectado |

Los perfiles no crean procesos por sí solos: al autorizar un hito, el agente principal actúa como Orchestrator y lanza los subagentes necesarios conforme a ORCHESTRATION.md. En implementación el Orchestrator reserva archivos por tarea; conflictos se resuelven antes de editar, no mediante copias alternativas. Los cambios transversales se entregan en secuencia contrato → implementación → integración → QA. Handoff incluye commit/diff local, contratos consumidos, comandos y pendientes.

El Orchestrator reserva archivos y registra asignaciones en docs/HITO_ACTUAL.md al arrancar el hito. Un conflicto o incidencia rutinaria se resuelve internamente; solo se escala al usuario un bloqueo importante según [el protocolo](ORCHESTRATION.md).
