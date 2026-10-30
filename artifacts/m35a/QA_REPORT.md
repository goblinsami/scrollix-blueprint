# QA M3.5-A · Evidencia local

Estado técnico: preparación de revisión visual completada. La aprobación artística corresponde al usuario; B/C no están autorizados por este resultado.

## Reproducción

- `npm.cmd run check:all`: TypeScript, build, **93 pruebas unitarias y 36 E2E** correctos. Los E2E cubren desktop 1440×900, móvil 390×844 y smoke compacto 320×568; última tanda completa 19.5 s.
- `node scripts/capture-m35a.mjs`: 12 PNG del playground (6 puntos × desktop/móvil), `captures.json` e `index.html`.
- `node scripts/record-m35a.mjs`: 2 WebM reales de canvas, manifiestos y 12 fotogramas decodificados desde los propios vídeos. Usa Edge instalado y un servidor local dedicado en 127.0.0.1:4174; no instala ni descarga binarios.

## Grabaciones verificadas

| Perfil | Viewport | Canvas grabado | Duración reproducible | Tamaño |
|---|---|---|---|---|
| Desktop | 1440×900 | 1358×547 | 20.178 s | 8,886,537 bytes |
| Móvil emulado | 390×844 | 360×552 | 20.183 s | 7,123,998 bytes |

Recorrido por scroll nativo de 0 a holdStart durante 18 s; holdStart→1 durante 2.2 s, con la cámara fija en ese tramo de la misma timeline. Vídeos VP9/Opus, sin HUD. No son montajes de capturas. La pista Opus es un reloj silencioso generado localmente mediante WebAudio; no se utiliza micrófono ni se conecta a altavoces. Ambos archivos tienen duración finita al abrir y reproducen hasta `video.ended=true`.

El arnés de grabación (solo él) solicita preserveDrawingBuffer para leer continuamente los píxeles WebGL reales. No modifica src, shaders, geometría ni cámara. El helper WebM añade el campo EBML Duration sin recodificar bloques de vídeo. En Edge, loadeddata en t=0 podía preceder a la primera presentación del bitmap; la extracción realiza un seek de inicialización a 0.001 s, registrado en los thumbnails. El poster usa ese primer fotograma real, no una imagen fabricada. Todos los fotogramas extraídos pasaron detección de luminancia no negra y revisión visual.

El muestreo requestAnimationFrame de la sesión aislada fue ~16.68 ms de media y ~16.8 ms p95. Esto describe el navegador headless probado, con instrumentación de captura; no acredita FPS de móvil físico ni memoria del driver GPU. decodedFrames corresponde a las ventanas de reproducción/seek verificadas, no al total de frames del archivo.

## Semántica de las pruebas

- Defaults, validación de storyboard, keyframes/tuplas dispersas, dirección degenerada entre poses, independencia de objetos y compatibilidad de configuración mínima.
- Continuidad en todos los keyframes y fronteras; trayectoria espacial y perfil móvil; elevación final 55–70° (default62°), hold exacto y reversibilidad.
- Muestreo de cámara frente a los muros extruidos en 1001 puntos de cada perfil; sin cruce importante de cámara/near plane en la composición por defecto.
- El fit global se exige en Reveal; Draw permite descubrir por partes. En p=0 el dibujo todavía no existe. En mitad/final de Draw se verifica interés estructural dentro del frame y capturas reales; no se exige encajar el modelo completo.
- E2E espera renderedProgress===progress antes de capturar. Conserva comparaciones de píxeles EXACTAS para reversa y reconstrucción del mismo preset, además de lifecycle/cancelación/recursos y limpieza de canvas.
- El contador de tinta Paper usa RGB<190: la retícula base tiene canales>=212 y las líneas de1px con antialias no siempre contienen suficientes píxeles RGB<95. Se conserva el mínimo de50 píxeles interiores y se excluye el HUD; no se rebajó la reversibilidad exacta ni se ocultó un fallo de producto.

## Archivos y límites

Ver `index.html`, `captures.json`, `recordings.json` y `video-thumbnails.json`. Los PNG cuyo nombre contiene `-video-` proceden de decodificar el WebM, no de capturar la escena por separado. `manifest.json` registra hashes de fuentes y evidencia. La composición es provisional de A y el acabado no representa B/C. Artefactos locales ignorados por Git; no se publicaron remotos ni se modificó Corridor.
