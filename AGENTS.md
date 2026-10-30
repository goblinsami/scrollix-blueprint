# Scrollix Blueprint: reglas compartidas

## Estado y alcance

Fase 0 terminada. El usuario autoriza cada hito por separado; esa autorización activa al Orchestrator y permite la ejecución autónoma mediante subagentes hasta completarlo. Seguir docs/ORCHESTRATION.md. No iniciar el siguiente hito sin autorización. Corridor es referencia de SOLO LECTURA. No desplegar, crear repositorios remotos, publicar ni configurar servicios externos sin permiso explícito. No modificar el proyecto de origen para estabilizarlo como requisito previo.

## Autoridad y flujo

El Orchestrator coordina cuatro roles: Core, 3D, Integration y QA. Son perfiles de trabajo definidos en .agents/; su presencia no inicia procesos ni agentes autónomos. La autorización de un hito incluye activar los subagentes necesarios, sin pedir confirmación adicional. Leer docs/OWNERSHIP.md y docs/IMPLEMENTATION_PLAN.md antes de asignar trabajo.

Cambios de contrato requieren propuesta con consumidores afectados, migración y pruebas; Orchestrator aprueba antes de edición paralela. Un solo propietario escribe cada archivo por tarea. Compartir contratos primero; luego ejecutar tareas independientes. No añadir un backend, paquete universal, segundo motor, segunda timeline ni validadores propios de cada host.

## Calidad y skills locales

Antes de entregar: npm run check y revisión del diff. No cambiar snapshots o tests solo para ocultar fallos. QA revisa invariantes y regresiones; documentación distingue objetivos de resultados medidos.

Leer según tarea:
- .agents/skills/blueprint-lifecycle/SKILL.md para montaje, recursos y scheduler.
- .agents/skills/blueprint-progress-camera/SKILL.md para progreso, encuadre y responsive.
- .agents/skills/blueprint-host-integration/SKILL.md para normalización y Framer.
- .agents/skills/blueprint-validation-qa/SKILL.md para contratos y verificación.

## Ampliación posterior a Fase 0

El usuario autoriza infraestructura y pruebas E2E Playwright reales sobre la aplicación disponible. Esto permite modificar tests/configuración/CI/documentación para ese fin; no inicia Draw, Extrude o Reveal. Consultar docs/E2E.md.

## Arranque operativo

Al recibir autorización de un hito, el agente principal asume Orchestrator y ejecuta [el protocolo de orquestación](docs/ORCHESTRATION.md). Iniciar, delegar, integrar y verificar hasta completar la aceptación. Resolver incidencias rutinarias de forma autónoma; escalar solo bloqueos importantes tras investigar alternativas. Al cerrar el hito, informar y esperar autorización del siguiente.

## Estado tras ejecución autorizada M1–M3

El usuario autorizó conjuntamente M1→M2→M3 y se completaron en orden con agentes reales y QA independiente. Ver docs/HITO_ACTUAL.md. M4/M5 requieren nueva autorización. No se han realizado pushes ni despliegues durante esta implementación.

## Estado M3.5-A

Implementado para revisión visual el30/10/2026. Ver docs/M3_5_A_REPORT.md. No iniciar M3.5-B/C hasta aprobación artística explícita del usuario, aunque las pruebas pasen. No iniciar M4/M5 ni publicar cambios sin autorización.
