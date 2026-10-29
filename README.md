# Scrollix Blueprint

Fase 0: preparación local, pendiente de revisión del usuario. No hay motor, escena WebGL, Draw, Extrude, Reveal, adaptador Framer ni despliegue implementados.

## Uso local (Windows)

Node 24 y npm 11. Desde esta carpeta: npm ci --ignore-scripts --no-audit --no-fund, después npm run check. Para abrir la página de estado: npm run dev. Si PowerShell bloquea npm.ps1, utilizar npm.cmd. La instalación inicial de Fase 0 utiliza únicamente caché local con --offline; no se ha contactado con registros.

## Fuentes de verdad

- [Arquitectura](docs/ARCHITECTURE.md), [contrato](docs/CONTRACT.md), [dirección artística](docs/ART_DIRECTION.md).
- [Auditoría y procedencia](docs/AUDIT.md), [revisión adjunta](docs/sources/ARCHITECTURE_REVIEW.md).
- [Agentes](AGENTS.md), [ownership](docs/OWNERSHIP.md), [hitos](docs/IMPLEMENTATION_PLAN.md), [decisiones](docs/DECISIONS.md).
- [Validación de Fase 0](docs/PHASE0_REPORT.md).

Las dependencias se fijan a versiones ya disponibles en Corridor, adaptando su lockfile transitivo y sin copiar código. No se afirma que sean las versiones más recientes. CI queda definida en archivo; solo se han ejecutado equivalentes locales.

## E2E de navegador

Playwright añadido tras la revisión de Fase 0. npm.cmd run test:e2e ejecuta Edge local en escritorio y dos tamaños móviles. npm.cmd run check:all añade estos E2E a los checks existentes. Ver [alcance y escenarios futuros](docs/E2E.md); actualmente se prueba la página de estado, no una experiencia 3D implementada.

## Autorizar un hito

El usuario autoriza cada hito, por ejemplo «Autorizo M1». El Orchestrator arranca y coordina agentes reales hasta completarlo; resuelve incidencias autónomamente y escala solo bloqueos importantes. Ver [protocolo de inicio y ejecución](docs/ORCHESTRATION.md). Al cerrar el hito se espera autorización del siguiente.
