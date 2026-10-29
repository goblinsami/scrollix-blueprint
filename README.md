# Scrollix Blueprint

Playground local de arquitectura conceptual. M1, M2 y M3 completados: MVP visual Draw → Extrude → Reveal disponible. Estado y evidencia: [HITO_ACTUAL.md](docs/HITO_ACTUAL.md).

## Probar localmente en Windows

Node 24 y npm 11. Desde C:/WORKSPACE/showcase/scrollix-blueprint:

```powershell
npm.cmd ci --offline --ignore-scripts --no-audit --no-fund
npm.cmd run dev
```

Abrir http://127.0.0.1:5173. La instalación offline requiere la caché local; en otra máquina la instalación mediante registro necesita conexión. El servidor solo escucha en loopback.

El slider Progreso, los botones de fase y el scroll nativo alimentan la misma timeline reversible. El selector Preset cambia Paper, Inverted Blueprint y Material Study sin perder el progreso. La sección sticky termina y permite continuar la página.

## Verificar

```powershell
npm.cmd run check:all
npm.cmd run test:e2e:report
```

TypeScript estricto, Vitest y build Vite; Playwright con Edge headless local en escritorio y dos tamaños móviles. Capturas y traces en playwright-report/ y test-results/, ignorados por Git. Para otro navegador instalado usar PLAYWRIGHT_CHANNEL; ver [E2E](docs/E2E.md).

## Documentación y agentes

- [Plan](docs/IMPLEMENTATION_PLAN.md), [estado del hito](docs/HITO_ACTUAL.md), [orquestación](docs/ORCHESTRATION.md) y [ownership](docs/OWNERSHIP.md).
- [Arquitectura](docs/ARCHITECTURE.md), [contrato](docs/CONTRACT.md), [dirección artística](docs/ART_DIRECTION.md) y [decisiones](docs/DECISIONS.md).
- [Auditoría](docs/AUDIT.md) y [ARCHITECTURE_REVIEW.md adjunto](docs/sources/ARCHITECTURE_REVIEW.md).
- [Informe histórico Fase 0](docs/PHASE0_REPORT.md).

Autorizados conjuntamente M1→M2→M3: el Orchestrator ejecuta cada hito con agentes especializados y QA, sin pedir confirmación entre ellos. M4/M5 y las operaciones remotas quedan fuera de esta ejecución. Corridor permanece en solo lectura.
