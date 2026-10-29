---
name: blueprint-lifecycle
description: Implementar o revisar lifecycle, recursos GPU y scheduler de Blueprint; no geometría narrativa.
---

# blueprint-lifecycle

Antes de implementar, leer docs/ARCHITECTURE.md y ports.ts. Diseñar owner por recurso: biblioteca libera compartidos, build libera exclusivos incluso si nunca se adjuntaron. No deducir ownership recorriendo materiales ni liberar texturas prestadas.

Asignar generación y cancelación a cada construcción. Liberar resultados tardíos; un mount descartado no inserta canvas ni listeners. dispose repetido no hace trabajo. Scheduler invalida por progreso/resize/config, pausa por visibilidad y solo continúa frames mientras haya transición activa.

Verificar con cargas diferidas fuera de orden, desmontaje durante await, reconstrucción fallida y ciclos repetidos. Contar RAF/listeners/observers y llamadas dispose por recurso. Node no sustituye prueba WebGL real.

Procedencia adaptada: RenderScheduler.ts; ResourceLibrary.ts; disposeObject3D.ts; ARCHITECTURE_REVIEW.md §§17–21. Consultar docs/AUDIT.md y docs/sources/ARCHITECTURE_REVIEW.md desde la raíz del repo.
