# Inicio y ejecución autónoma de cada hito

## Autorización y arranque

El usuario autoriza hitos identificados, por ejemplo: «Autorizo M1». También puede autorizar expresamente una secuencia, como M1→M2→M3; en ese caso se completa en orden sin solicitar confirmación entre esos hitos. Esa autorización activa al Orchestrator e incluye delegar el trabajo del hito en agentes especializados, integrar sus cambios, ejecutar pruebas y corregir fallos hasta satisfacer sus criterios de aceptación. No pedir una segunda confirmación para repartir tareas o empezar. No hace falta que el usuario pegue el plan de nuevo.

El agente principal de la sesión asume el papel de Orchestrator: lee AGENTS.md, su perfil, IMPLEMENTATION_PLAN.md, OWNERSHIP.md y el estado real del repositorio. Lanza subagentes reales con los perfiles Core, 3D, Integration o QA según las tareas del hito. Los archivos de perfiles no ejecutan agentes por sí mismos. No crear chats del usuario como sustituto de subagentes.

Si una autorización no identifica el hito y el contexto no permite resolverlo con claridad, aclarar únicamente ese dato antes de implementar. Este protocolo por sí solo no autoriza iniciar M1 ni los hitos posteriores.

## Ciclo de ejecución

1. Revisar el estado existente y los criterios del hito. Crear o actualizar docs/HITO_ACTUAL.md con el hito autorizado, la referencia a la autorización, las tareas, dependencias, agentes responsables, archivos reservados y checks previstos. Respetar cambios previos del usuario.
2. Cerrar contratos y decisiones necesarias. El Orchestrator puede aprobar cambios internos dentro del alcance autorizado; registra los cambios y avisa a sus consumidores. No trasladar decisiones técnicas rutinarias al usuario.
3. Descomponer y asignar tareas concretas con entradas, salida esperada, ownership y criterios verificables. Iniciar los subagentes necesarios; no activar cinco roles sin trabajo útil. Respetar el límite de agentes disponible y escalonar tareas cuando falten plazas. QA recibe el criterio de aceptación desde el inicio y dispone de una revisión independiente de la implementación.
4. Ejecutar en paralelo solo tareas independientes con archivos separados. Los cambios compartidos se secuencian. El Orchestrator sigue trabajando en coordinación e integración, recibe entregas y desbloquea dependencias; no escribe simultáneamente los mismos archivos que otro agente.
5. Integrar, revisar y ejecutar los checks apropiados. QA implementa/mantiene tests y E2E, ejecuta los escenarios del hito, revisa capturas y traces y reporta fallos. El propietario de cada módulo corrige; QA vuelve a verificar. Repetir hasta satisfacer la aceptación, sin dar un hito por terminado con pruebas fallidas u omisiones obligatorias.
6. Cerrar el hito con evidencia: archivos y comportamiento entregados, comandos y resultados, capturas cuando proceda, limitaciones y decisiones. Actualizar docs/HITO_ACTUAL.md. Si hay autorización conjunta para una secuencia, pasar al siguiente hito autorizado tras cumplir la aceptación del anterior. Al completar el último autorizado, detenerse y esperar nueva autorización.

## Autonomía y bloqueos

Resolver por cuenta propia fallos de compilación/tests, bugs, conflictos de integración, contratos internos, tareas mal divididas y decisiones reversibles dentro del hito. Consultar código, documentación y herramientas locales; corregir la causa, reasignar trabajo o adoptar una alternativa que cumpla el criterio. Mantener al usuario informado con avances breves, sin convertirlos en solicitudes de aprobación.

Un bloqueo importante impide cumplir una condición obligatoria y no admite una solución razonable dentro de la autorización existente: falta una decisión de producto esencial, acceso imprescindible, una dependencia externa insustituible, o se requiere una acción destructiva o remota no autorizada. Un test rojo, un primer intento fallido o una tarea difícil no bastan para detenerse.

Antes de escalar, investigar alternativas proporcionales y completar todo trabajo independiente. No repetir indefinidamente el mismo intento ni rebajar criterios de aceptación, ocultar errores, desactivar pruebas pertinentes o aprobar baselines visuales a ciegas para declarar éxito.

Si sigue bloqueado: indicar el problema concreto, evidencia, intentos y alternativas, impacto en la aceptación y la mínima decisión o acción que se necesita del usuario. Dejar el estado y la reanudación documentados; no declarar el hito completado. Una orden expresa del usuario de pausar o cambiar el alcance prevalece.

## Límites persistentes

Corridor permanece en SOLO LECTURA. No desplegar, publicar, crear remotos o realizar trabajo remoto sin permiso explícito. La autonomía no amplía esos permisos ni el alcance del hito. Si una herramienta exige aprobación técnica para operar en la ruta autorizada, seguir ese mecanismo sin tratarlo como una nueva decisión de producto.

## Estado al establecer este protocolo

M0 terminado; infraestructura E2E añadida. M1–M5 no iniciados. El siguiente arranque requiere que el usuario autorice M1 u otro hito identificado cuyas dependencias estén satisfechas.
