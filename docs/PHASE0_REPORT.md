# Entrega de Fase 0 · 29 de octubre de 2026

Estado: preparación terminada; DETENIDO para revisión del usuario. M1–M5 no iniciados.

## Pasos 1–10

1. Repo independiente creado en C:/WORKSPACE/showcase/scrollix-blueprint; Git inicializado en main, sin remoto ni commit inicial (archivos disponibles para revisión).
2. Scaffold TypeScript estricto + Vite + Three.js + Vitest; página de estado estática sin renderer WebGL.
3. Auditoría estática de Corridor en solo lectura; inventario, HEAD, status y comparación SHA-256.
4. Cuatro skills adaptadas en .agents/skills/: lifecycle, progreso/cámara, integración y validación/QA. No existían SKILL.md en el origen.
5. Cinco perfiles en .agents/: Orchestrator, Core, 3D, Integration, QA; no procesos de agentes ejecutándose.
6. BlueprintProject v1, factory de defaults independientes, validación estricta unknown y puertos futuros tipados.
7. Arquitectura, contrato, dirección artística, decisiones y revisión histórica adjunta con procedencia verificable.
8. Ownership y reglas de handoff/cambio de contratos documentados.
9. Plan M0–M5 con dependencias y aceptación, condicionado a revisión antes de implementar.
10. Workflow CI Windows/Linux preparado; equivalentes locales de typecheck, tests y build ejecutados.

## Validaciones ejecutadas

- Node v24.15.0 / npm 11.12.1 en Windows.
- npm ci --offline --ignore-scripts --no-audit --no-fund: PASS, 61 paquetes desde caché. Se adaptó el lockfile transitivo local de Corridor para evitar resolver versiones no cacheadas. El primer intento de resolución offline falló por @vitest/pretty-format 3.2.7 ausente; quedó resuelto con el árbol fijado.
- npm run check: PASS: tsc --noEmit; Vitest 3.2.6, 1 archivo y 28 pruebas; Vite 7.3.5, build correcto.
- Skills: 4/4 pasan comprobación local de formato, nombre, description y ausencia de placeholders. quick_validate.py no pudo ejecutarse porque no hay intérprete Python operativo; se usó comprobación equivalente para estos frontmatters simples.
- Corridor: 307 archivos comparados (excluidos .git y node_modules), inventario y SHA-256 idénticos; git status --porcelain final vacío; HEAD d78f3e2bfe06873da2aaf91831eb107cfa7da673.
- ARCHITECTURE_REVIEW.md adjunto: SHA-256 f7ef50067ffa60dbc80a024e8a2189fd77711f484f08760673a4850c285568c1; copia íntegra verificada.

## Límites de la evidencia

No se ejecutaron tests/build de Corridor. No hay validación visual de navegador, WebGL, Framer, móvil real o rendimiento: no se ha implementado esa experiencia. CI es configuración preparada, no una ejecución remota. No hubo despliegues, configuración de licencias, llamadas de publicación ni cambios en Corridor. Las dependencias usan versiones locales conocidas; no se investigó su actualidad ni se contactó con registros.

## Comandos de reproducción

Desde el repo, en PowerShell: npm.cmd ci --offline --ignore-scripts --no-audit --no-fund; después npm.cmd run check. En una máquina sin esa caché, quitar --offline requiere acceso al registro. npm.cmd run dev abre un servidor únicamente en 127.0.0.1. La salida dist/ y node_modules/ están ignoradas por Git.

Revisar primero CONTRACT.md, ARCHITECTURE.md, ART_DIRECTION.md e IMPLEMENTATION_PLAN.md. Ninguna función de Draw, Extrude o Reveal está desarrollada.
