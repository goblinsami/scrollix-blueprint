# M3.5 — Cinematic Redesign: plan operativo recibido

Recepción del Orchestrator: 30/10/2026. Fuente íntegra: [M3_5_CINEMATIC_BRIEF.md](M3_5_CINEMATIC_BRIEF.md). Base local revisada: M1–M3, commit 14da40a. El encargo autoriza implementar únicamente M3.5-A; este handoff registra el plan, sin iniciar cambios de producto ni agentes de implementación.

## Alcance y parada obligatoria

A debe validar storyboard, escala y cámara sobre composición provisional suficiente. No construir aún toda la geometría definitiva ni pulir iluminación/materiales como trabajo de B/C. Conservar runtime, lifecycle, scroll nativo, sticky, timeline global 0–1, contrato único, playground compartido y ownership WebGL.

La entrega obligatoria de A es código, resultados de pruebas, **12 capturas (6 puntos × desktop/móvil) y 2 grabaciones del recorrido completo (desktop/móvil)**. Después: **detenerse para aprobación visual explícita del usuario**. Un resultado verde de QA no autoriza B. B requiere aprobar A; C requiere aprobar B. No M4/M5, CAD/BIM, editor arquitectónico, deploy ni push de M3.5 sin autorización explícita. El tramo final puede reservar espacio para contemplación/CTA, pero A no implementa el CTA comercial ni una integración Framer nueva.

## Diagnóstico de la base actual

- motion.ts genera direction/up alrededor de un interés centrado y targetY derivado de altura; no define posiciones ni lookAt espaciales independientes. Esto produce órbita, no recorrido.
- createBlueprintScene.ts llama getFramingDistance en todo frame y fase para mantener el conjunto visible. Ese uso contradice descubrir la planta por partes. El helper se conserva para resolver el encuadre de Reveal, no como limitador permanente de Draw/Extrude.
- La cámara final actual se inclina 50° desde la vertical, equivalente a 40° respecto al plano horizontal. La nueva revisión debe medir explícitamente elevación respecto al suelo y acabar entre 55–70° (propuesta storyboard: 62°), sin confundir ambos ángulos.
- floorPlan.ts define perímetro rectangular con división en L y una altura común. A necesita solo una composición abierta/asimétrica provisional de varios ejes y vacíos para probar escala y trayectoria. La composición final y el dibujo técnico ampliado pertenecen a B.
- La superficie es una tabla finita cuyos bordes se ven. En Draw debe leerse como plano monumental continuo más allá del encuadre, con retícula técnica coherente; no añadir texto conceptual sobre el suelo.
- BlueprintProject.camera solo contiene fov y fill por dispositivo. Revisar su ampliación coordinada para representar la trayectoria elegida sin valores alternativos en host/renderer.

## Contratos antes de paralelizar

Orchestrator y Core acuerdan primero una representación tipada de keyframes: progreso global, posición, lookAt y orientación/up coherentes; perfiles desktop/móvil y tramo final de sostén. Preferir coordenadas normalizadas a las dimensiones de la composición para evitar que el cambio de tamaño de proyecto invalide toda la cámara. La decisión de campos exactos se registra al implementar, junto con defaults únicos, validación y tests; no duplicar configuración ni crear otra timeline.

Una función pura debe muestrear posición/interés/orientación desde progreso absoluto y perfil responsive, con interpolación continua, determinista y reversible. La selección o mezcla de perfil depende del contenedor, no de eventos de entrada. getFramingDistance solo ayuda a fijar los keyframes de descubrimiento global de Reveal. El último keyframe llega antes de1 y se mantiene hasta1; esta pausa pertenece a la misma timeline, no a un temporizador independiente.

El dibujo y la extrusión consumirán una definición geométrica compartida, incluso provisional. Si se necesitan distintas alturas en A, se asignan a esos mismos segmentos/identificadores para que el muro emerja de la línea correspondiente; no mantener dos planos divergentes.

## Asignaciones y dependencias

| Orden | Rol | Archivos previstos / ownership | Entrega de A |
|---|---|---|---|
| A0 | Orchestrator + Core por asignación | src/contracts/BlueprintProject.ts, defaults.ts, validate.ts, ports.ts si procede; docs/CONTRACT.md y DECISIONS.md | Contrato de trayectoria/perfiles/hold y observabilidad aprobados antes de consumidores; sin romper proyectos mínimos existentes |
| A1 | 3D | src/scene/motion.ts, framing.ts; nuevo cameraPath.ts si separa responsabilidades | Keyframes espaciales, posición/lookAt/up, trayectos desktop/móvil y Reveal 55–70° con hold; pruebas de la cámara preparada para geometría provisional |
| A2 | 3D | src/scene/floorPlan.ts, createBlueprintScene.ts; helper de geometría si procede | Composición provisional abierta/asimétrica; suelo sin borde visible en Draw; extrusiones próximas a cámara y alturas/aberturas suficientes para juzgar escala |
| A3 | Integration | src/playground/** y src/style.css solo si necesario | Conservar controles/scroll nativo y mismo runtime; exponer estado de cámara/render para captura, sin cámara ni timeline propias en el host |
| A4 | QA | tests/**, e2e/** y evidencia local | Pruebas de continuidad/reversa/lifecycle, desktop/móvil,12 capturas y2 grabaciones; revisión técnica independiente y paquete visual para el usuario |
| A5 | Orchestrator | docs/HITO_ACTUAL.md, ART_DIRECTION.md, ARCHITECTURE.md y este plan | Integración, decisiones, comandos/resultados y entrega con parada obligatoria antes de B |

A0 precede a A1/A2. A1 y A2 comparten archivos de escena: un único propietario 3D los ejecuta secuencialmente o separa helpers antes de paralelizar. Integration no edita archivos de escena. QA puede preparar casos/evidencia durante la implementación, pero la suite final se ejecuta con código congelado. Registrar reservas reales en HITO_ACTUAL.md al arrancar ejecución.

## Storyboard de revisión A

Muestrear a partir de los límites configurados, no de porcentajes repetidos en varios módulos. Con defaults drawEnd=.35 y extrudeEnd=.70:

| Captura | Progreso default | Intención visual |
|---|---|---|
| 01 · Inicio Draw |0| Cámara baja/oblicua cercana; plano continúa fuera del encuadre, sin revelar el conjunto |
| 02 · Mitad Draw |.175| Traslación horizontal evidente hacia otro interés técnico; líneas que aparecen a escala cercana |
| 03 · Final Draw |.35| Se ha descubierto otra zona, no una planta completa centrada |
| 04 · Mitad Extrude |.525| Muros próximos emergiendo de sus ejes, profundidad y alturas diferenciadas |
| 05 · Inicio Reveal |.70| Inicio legible del ascenso; composición aún en proceso de descubrimiento |
| 06 · Reveal final |1| Conjunto visible por primera vez, elevación 55–70°, silueta abierta/asimétrica y encuadre sostenido |

Desktop 1440×900 y móvil 390×844 son los dos paquetes obligatorios. Mantener además smoke de compacto 320×568. Documentar el progreso de llegada al hold y comprobar que el encuadre permanece constante desde ese punto hasta1. Las seis capturas no sustituyen a los vídeos: estos deben permitir detectar ritmo, escala y saltos entre posiciones.

## Adaptación de pruebas existentes

La expectativa de **frustum completo durante todas las fases** representa el diseño M3 y es incompatible con el nuevo objetivo. En A, Draw/Extrude permiten recortes intencionales y descubrimiento parcial; el encuadre global se exige en Reveal. Replantear tests de la cámara aplicada a escena para esa nueva semántica. Conservar las propiedades matemáticas del helper de fitting donde siga siendo usado, y distinguirlas del encuadre narrativo real.

No confundir recorte narrativo con fallos: near-plane clipping de muros cercanos, cámara atravesando geometría, suelo terminado visible, cotas cortadas por error o salida completa del recorrido siguen siendo defectos. Sustituir los tests acoplados al rectángulo/L por invariantes del modelo provisional y sus ejes compartidos, sin eliminar cobertura de puerta, valores técnicos o ownership.

Mantener validación/defaults, timeline única, generaciones/cancelación, último estado válido, dispose, resize cuantizado y presupuestos de recursos. Conservar reversa determinista y comparación estricta de imagen al volver al mismo progreso dentro de la misma sesión. Actualizar expectativas dependientes del storyboard antiguo, documentando el motivo; no añadir tolerancias para ocultar saltos.

QA añade continuidad en todos los keyframes, fronteras de fase y entrada al hold; perfil responsive; posición/lookAt finitos y coherentes; ausencia de giro brusco/up degenerado; mismo estado al ir y volver; un canvas por runtime y limpieza tras actualizaciones/desmontajes. Las capturas esperan renderedProgress===progress. Ejecutar npm.cmd run check:all y registrar cantidades/resultados reales;73 unitarios/33 E2E es evidencia histórica de M3, no de A.

## Grabaciones y riesgos prácticos

La configuración actual tiene vídeo desactivado y no dispone de FFmpeg de Playwright. No prometer grabaciones hasta verificar la cadena local. Primera alternativa: MediaRecorder + canvas.captureStream en Edge con un codec WebM soportado, manejado desde el arnés QA, reproduciendo el progreso/scroll existente y capturando frames reales. No introduce una segunda timeline en producto. Especificar si el vídeo contiene solo canvas; para incluir HUD/control del playground se necesita un método de captura de viewport compatible.

Antes de producir la entrega, verificar que los dos vídeos se reproducen, contienen el recorrido completo, tienen duración/ritmo útiles y muestran el hold final. No entregar una sucesión de imágenes como si fuese grabación. Si MediaRecorder no sirve y hace falta un binario no disponible, investigar otra opción local; cualquier descarga/servicio remoto que requiera permiso se escala con la mínima necesidad concreta. No bloquear por el primer intento fallido ni omitir la grabación obligatoria sin comunicar la limitación.

Rendimiento: registrar observaciones de frame time y carga razonable en el navegador probado, sin afirmar FPS de móvil físico ni memoria del driver a partir de emulación/headless. Una medición técnica aceptable no sustituye la aprobación artística.

## Criterios de cierre y aprobación

A termina solo cuando el código funciona, QA técnico pasa, existen las12 capturas y2 grabaciones y el Orchestrator revisa la puesta en escena contra el brief: Draw no parece maqueta; hay desplazamiento espacial; Extrude transmite proximidad/volumen; Reveal descubre el conjunto; estética arquitectónica/editorial/cinematográfica.

Entonces entregar evidencia y detenerse. **La aprobación artística corresponde al usuario. No comenzar M3.5-B, M3.5-C, M4 o M5 automáticamente.** El handoff actual deja ese protocolo listo; no modifica aún la cámara ni la geometría.

## Estado de ejecución · 30/10/2026

A implementada tras autorización explícita «completa M3.5-A». Contrato y cámara espacial integrados; composición provisional de14ejes compartidos y3zonas abiertas; móvil ajustado tras detectar retícula vacía. QA técnico:93unitarios+36E2E+typecheck/build correctos. Entrega visual en artifacts/m35a e informe M3_5_A_REPORT.md. APROBACIÓN VISUAL PENDIENTE DEL USUARIO: no iniciar B/C ni M4/M5.
