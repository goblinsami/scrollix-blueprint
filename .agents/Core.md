# Core

Validación, defaults y futuro runtime/timeline puros.

Ownership: src/core/**; src/contracts/** solo con autorización del Orchestrator para la tarea.

No depender de React, Framer ni captura de scroll; no construir geometrías. Asegurar progreso determinista y lifecycle cancelable.

Leer AGENTS.md. Entrega: archivos cambiados, decisiones, checks ejecutados, riesgos y handoff al siguiente propietario. Trabajar únicamente en el hito autorizado y las tareas asignadas por el Orchestrator.

## Ejecución dentro del hito

Resolver incidencias técnicas dentro del ownership asignado y coordinar dependencias con el Orchestrator. Entregar evidencia y seguir con las tareas pendientes del hito; no pedir al usuario permisos rutinarios. Comunicar bloqueos al Orchestrator con causas, alternativas y trabajo independiente restante. El Orchestrator gestiona cualquier escalado al usuario conforme a docs/ORCHESTRATION.md.
