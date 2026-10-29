# Pruebas E2E de navegador · M1–M3

## Ejecutar localmente

Playwright 1.64.1 utiliza Edge instalado, headless, sin descargar navegadores. Desde el repo: npm.cmd run test:e2e; informe: npm.cmd run test:e2e:report. El runner arranca/cierra Vite en 127.0.0.1:4173 y falla si está ocupado. Se bloquean peticiones externas y se hacen fallar excepciones, consola error y HTTP/peticiones fallidos. No hay servidor de renderizado remoto.

Tres proyectos: desktop1440×900, móvil emulado390×844 y compacto320×568. Configuración en playwright.config.ts; cambiar PLAYWRIGHT_CHANNEL permite usar otro navegador instalado. La CI preparada instala Chromium; no se ha ejecutado en remoto durante estos hitos. Se usa el runner exportado por playwright/test, sin duplicar @playwright/test.

## Cobertura activa

| Suite | Verifica |
|---|---|
| scaffold.spec.ts | Controles visibles, teclado/range, pointer y touch tap reales, botones de fase, scroll nativo ida/vuelta/salida, presets, resize y recarga con reduced motion |
| draw.spec.ts | WebGL real, aparición de segmentos y diferencias de píxeles, retorno exacto al mismo progreso y al inicio, reconstrucciones de presets con un canvas y presupuesto de recursos estable |
| sequence.spec.ts | Draw completo→Extrude→Reveal, altura y cámara, reversa con imagen exacta, recorrido mediante wheel, resize sin perder geometría y ciclos de mount/update/dispose públicos con canvas real |

e2e/rendered.ts espera renderedProgress===progress antes de capturar, además de los estados/fases y renderCount. Evita confundir un RAF anterior con el estado solicitado. No hay sleeps arbitrarios ni snapshots aprobados automáticamente. e2e/pngPixels.ts decodifica píxeles PNG para comparar imágenes en la misma sesión; reversa y regreso a Paper exigen diferencia cero. El modelo geométrico y los diagnósticos se contrastan con las imágenes, no se usan como sustituto del render.

## Evidencia

29/10/2026: npm.cmd run check:all pasa: TypeScript, 73 tests unitarios, build y 33 E2E. Se revisaron capturas de plano, extrusión y Reveal en las tres resoluciones. Se conservaron comparaciones estrictas al corregir carreras de resize y scroll encontradas durante QA.

Capturas adjuntas al informe y PNG nombrados en test-results/ por suite/proyecto. En fallo: screenshot y trace; vídeo desactivado por no disponer de FFmpeg local. Informes/artefactos están ignorados por Git. Revisar con npm.cmd run test:e2e:report. Las capturas permiten inspección visual; no se afirma una regresión visual entre versiones basada en baselines aprobados por el usuario.

## Siguientes hitos

M4 incorporará narrativa, CTAs/portfolio real, foco, accesibilidad completa, reduced motion/fallback WebGL de producto y pruebas táctiles de arrastre/swipe. Los taps táctiles actuales prueban el range; wheel en emulación móvil no equivale a un swipe físico. M5 probará la integración Framer y actualizaciones reales del host. No se han implementado esos hitos.

Headless y emulación no certifican FPS ni memoria de driver en GPU/móvil físicos. Los presupuestos observados cuentan recursos propios por escena; se complementan con pruebas de dispose, no son una medición completa de memoria GPU.

QA es propietario de tests, fixtures, E2E y revisión de imágenes; cada agente corrige sus módulos. El Orchestrator coordina contratos, configuración y aceptación. Consultar HITO_ACTUAL.md.
