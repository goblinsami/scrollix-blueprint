# M3.5-A · Entrega para aprobación visual

Fecha: 30 de octubre de 2026. Base: M1–M3, commit14da40a. Estado: implementación y QA técnico completados; aprobación artística del usuario pendiente. No iniciar M3.5-B/C, M4 ni M5.

## Qué cambió

- Storyboard espacial tipado en BlueprintProject: posición/lookAt normalizados, perfiles desktop/móvil y holdStart. Defaults únicos, adaptación a timings y validación estricta, incluida degeneración entre keyframes.
- Cámara baja y oblicua que se traslada por el plano durante Draw, pasa cerca de muros durante Extrude y asciende a62° sobre el suelo en Reveal. El fitting global resuelve solo la última pose; hold.94..1 con defaults.
- Composición provisional de tres zonas abiertas,14ejes compartidos entre líneas y muros, alturas.5..1.3×base y huecos. Suelo/retícula extendidos sin tabla finita ni texto conceptual sobre el suelo.
- Factoría separada en cameraPath.ts, sceneGeometry.ts y palettes.ts. Se conserva runtime, lifecycle, scheduler por invalidación, scroll nativo y gestión explícita de recursos.
- Diagnósticos de cámara y frame presentado; el host observa, sin calcular otra cámara ni timeline.

## Evidencia entregada

Galería con12capturas y2vídeos: http://127.0.0.1:5173/artifacts/m35a/index.html . Playground: http://127.0.0.1:5173/ . Ambos requieren el servidor local npm.cmd run dev; loopback comprobado HTTP200.

Carpeta: artifacts/m35a (ignorada por Git, sin publicar).

| Punto | Progreso default | Desktop / móvil |
|---|---|---|
| Inicio Draw |0| desktop/mobile-01-draw-start.png |
| Mitad Draw |.175| desktop/mobile-02-draw-mid.png |
| Final Draw |.35| desktop/mobile-03-draw-end.png |
| Mitad Extrude |.525| desktop/mobile-04-extrude-mid.png |
| Inicio Reveal |.70| desktop/mobile-05-reveal-start.png |
| Reveal final |1| desktop/mobile-06-reveal-final.png |

Viewport desktop1440×900; móvil390×844. Capturas completas del playground. Vídeos del canvas sinHUD: desktop-journey.webm,20.178s,1358×547; mobile-journey.webm,20.183s,360×552. Ambos alcanzan progreso1, tienen duración finita al abrir, decodifican y llegan a ended=true, sin errores de navegador. Se extrajeron seis muestras de cada vídeo para revisar el recorrido real; video-thumbnails.json contiene sus timestamps. La primera muestra utiliza el primer frame presentable a1ms, porque audio/loadeddata en t0 puede preceder a la presentación del primer bitmap. Los posters se extraen del propio vídeo.

El arnés usa MediaRecorder VP9+Opus con pista local silenciosa para mantener el reloj durante el hold; no usa micrófono ni salida de altavoz. Solo para captura preserva el buffer WebGL en contexto de navegador aislado; no cambia esa opción en producto. El helper WebM añade Duration a la metadata sin recodificar los bloques. No es una secuencia de imágenes. FFmpeg y servicios remotos no son necesarios.

## Validaciones

npm.cmd run check:all: PASS. TypeScript,93pruebas unitarias, build y36E2E (19.5s) en escritorio, móvil y compacto320×568. Verificados contratos/defaults, continuidad de keyframes y fases, dirección no degenerada, traslación horizontal real, perfiles distintos, frustum completo solo Reveal, hold constante, reversibilidad exacta de píxeles, presets, resize y montaje/actualización/desmontaje. La ruta se muestrea en1001puntos por perfil para detectar cruces con muros ya extruidos.

QA detectó Draw móvil sin estructura visible; se ajustaron dos intereses a ejes realmente dibujados. El test de tinta distingue líneas antialias de retícula (gridRGB≥212, umbralRGB<190), sin relajar las comparaciones exactas de reversa. La reproducción de vídeo se verificó además de la existencia de archivos; se rechazaron candidatos y pruebas intermedias.

Cadencia RAF observada durante grabación: media16.68ms y p9516.8ms. Es pacing headless de esta máquina, no certificación de FPS ni memoria en GPU/móvil físicos. Recursos propios por escena:9geometrías,9materiales,2texturas; no equivale a medir memoria del driver.

## Reproducir y revisar

```powershell
npm.cmd run check:all
node scripts/capture-m35a.mjs
node scripts/record-m35a.mjs
npm.cmd run dev
```

El arnés de evidencia utiliza un puerto loopback separado y cierra el servidor que crea. Manifest: captures.json y recordings.json. QA y Orchestrator revisaron las doce capturas y muestras decodificadas de ambos vídeos; esa revisión permite entregar A, no aprobar la dirección artística por el usuario.

Corridor continúa en solo lectura: HEADd78f3e2bfe06873da2aaf91831eb107cfa7da673, git status limpio al cierre. No se realizaron commits, push ni deploy de M3.5-A.

## Parada obligatoria

Revisar especialmente escala/descubrimiento en Draw, proximidad de Extrude, ascenso de Reveal y ritmo del hold. La geometría es provisional; composición definitiva y acabado/luces pertenecen a B/C. Esperar aprobación visual explícita antes de continuar.
