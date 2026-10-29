# BlueprintProject v1

Autoridad ejecutable: src/contracts/BlueprintProject.ts, defaults.ts y validate.ts. El contrato v1 se consume por runtime y escena M1–M3; los campos de estaciones y accesibilidad completa se desarrollarán en M4.

validateBlueprintProject acepta unknown y devuelve un objeto nuevo completo. {} es una configuración válida mínima. Solo campos ausentes/undefined reciben defaults; null, tipos erróneos, campos desconocidos y valores fuera de rango generan ProjectValidationError con path. No hay coerción ni clamp silencioso. JSON se parsea en el host antes de validar; texto HTML se conserva como texto y el host debe usar textContent, nunca innerHTML.

| Campo | Default | Restricción |
|---|---|---|
| schemaVersion | 1 | Solo 1; otras versiones requieren migración explícita |
| id / title | blueprint / Scrollix Blueprint | Texto no vacío, máximo 4000 caracteres |
| art.preset | paper | paper, inverted-blueprint, material-study |
| structure.width / depth | 12 / 18 | Metros, 1–100 |
| structure.wallHeight | 3 | Metros, 0.5–20 |
| timeline.drawEnd / extrudeEnd | 0.35 / 0.7 | 0.01–0.98 / 0.02–0.99; drawEnd < extrudeEnd |
| camera.fov | 45 | Grados verticales, 20–80 |
| camera.desktopFill / mobileFill | 0.75 / 0.65 | Fracción de encuadre, 0.2–0.95 |
| quality.dprCap | 1.5 | 1–2 |
| accessibility.reducedMotion | system | system o always |
| stations | [] | Máximo 50; id único, at finito [0,1] estrictamente creciente; title requerido, body opcional vacío |

Todos los números deben ser finitos. Cada estación requiere id, at y title. Las dimensiones usan X=ancho, Z=profundidad, Y=altura; origen centrado en el suelo. Progreso implementado: Draw [0,drawEnd], Extrude [drawEnd,extrudeEnd], Reveal [extrudeEnd,1]; fronteras continuas y reversibles. La geometría conceptual paramétrica está en src/scene/floorPlan.ts; no hay importación CAD.

createDefaultProject genera objetos independientes. Ningún host puede declarar defaults alternativos. Añadir campos exige actualizar tipo, factory, validador, tests, documentación y consumidores en una sola entrega coordinada. ports.ts fija firmas operativas; su semántica está en ARCHITECTURE.md. BlueprintRuntime añade getState y subscribe; BlueprintState contiene TimelineState, sceneReady/disposed y SceneDiagnostics. Los diagnósticos cuentan recursos propios (no memoria del driver GPU), segmentos visibles, altura y cámara. Cada snapshot es independiente; subscribe notifica al suscribirse y tras cambios/render.

SceneDiagnostics.renderedProgress inicia en -1 y se actualiza solo tras render exitoso. El progreso lógico puede adelantarse a la imagen mientras el RAF está pendiente; un consumidor que capture o inspeccione imagen debe esperar que ambos coincidan.
