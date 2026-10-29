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
