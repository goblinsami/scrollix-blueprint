# Scrollix Blueprint: protocolo ligero

Modo ligero por defecto: un solo agente secuencial, lectura selectiva, cambios pequeños e informes breves. Minimizar tokens. Multiagente solo con autorización explícita; aprobar un hito no autoriza delegación.

Leer estado y contratos pertinentes, cargar únicamente skills necesarias. Corridor es solo lectura; no reauditarlo. Mantener scroll nativo, timeline única reversible, ejes compartidos y gestión de recursos. Sin grandes refactors.

Pruebas focalizadas durante desarrollo; suite completa una vez al final si es viable. Revisar diff, preservar cambios previos y no ocultar fallos modificando tests. Resumir resultados medidos y límites en docs/STATUS.md.

Alcance autorizado 31/10/2026: tareas 1–4 (protocolo, scroll, composición provisional Draw/Reveal y juntas L/T/cruz con alturas distintas). Conservar storyboard como base. Máximo tres capturas, sin vídeos ni manifiestos. Commit/push para revisión autorizados; detenerse después. No M3.5-C/M4/M5 ni despliegues.

Skills selectivas: blueprint-progress-camera para progreso/encuadre; blueprint-lifecycle para recursos; blueprint-host-integration para hosts; blueprint-validation-qa para contratos. Ver docs/ORCHESTRATION.md.
