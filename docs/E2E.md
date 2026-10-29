# Pruebas reales de navegador con Playwright

## Alcance actual

Playwright 1.64.1 está instalado desde caché. Usa Edge local en modo headless; no descarga navegadores ni accede a servicios externos. Ejecutar desde el repo: npm.cmd run test:e2e. El runner arranca y cierra Vite en 127.0.0.1:4173; falla si el puerto ya está ocupado para evitar probar una aplicación equivocada. Las peticiones externas de la página se bloquean y hacen fallar el test.

Tres proyectos: escritorio 1440×900, móvil emulado 390×844 y móvil compacto emulado 320×568. Tres casos por proyecto: carga/contenido visible; scroll nativo, teclado y resize; contenido con prefers-reduced-motion. Todos vigilan excepciones, consola, HTTP fallidos y peticiones fallidas. El scaffold cabe en pantalla: los gestos actuales NO acreditan un recorrido ni una transición 3D.

Cada carga adjunta captura completa al informe. En fallo se guardan captura y trace. El vídeo está desactivado porque FFmpeg de Playwright no está disponible localmente; no se descarga ningún binario. Abrir: npm.cmd run test:e2e:report. Modo interactivo: npm.cmd run test:e2e:ui. Ejecutar todo: npm.cmd run check:all. Resultados e informes están ignorados por Git.

Se usa playwright/test, export del paquete playwright que incluye el runner; no hace falta duplicar la dependencia con @playwright/test. Para otro navegador ya instalado, establecer PLAYWRIGHT_CHANNEL=chrome o chromium. En CI futura se instala Chromium y se utiliza PLAYWRIGHT_CHANNEL=chromium. No se ha ejecutado CI remota.

## Matriz pendiente de implementación

No se añaden tests omitidos o mocks de una experiencia inexistente. Estos escenarios deben convertirse en tests activos dentro de cada hito, y fallar si una fase no se alcanza:

| Hito | Interacción real | Comprobación necesaria |
|---|---|---|
| M1 | Slider, wheel/trackpad, teclado y recarga | Mismo progreso observable, límites 0/1, avance y retroceso, sin errores ni listeners duplicados |
| M2 | Scroll desde inicio hasta Draw completo | Canvas renderizado; contorno, puerta y dos cotas visibles; capturas al inicio/medio/final y al retroceder |
| M3 | Recorrido Draw→Extrude→Reveal y regreso | Todas las fases alcanzadas, muros y cámara coherentes, continuidad en fronteras, estado reconstruido al volver al mismo progreso |
| M4 | Llegar a cada estación, CTA y portfolio | Todo el contenido y enlaces accesibles, scroll liberado al final, foco/teclado, móvil táctil, reduced motion y fallback sin WebGL |
| M5 | Cambiar props y montar/desmontar integración | Paridad de configuración, actualización visible y recuperación tras fallos; Framer real requiere entorno autorizado |

El futuro playground expondrá progreso/fase y estado de escena lista mediante un contrato de observabilidad mínimo revisado en M1. Las pruebas combinarán ese estado con efectos visibles: el progreso por sí solo no demuestra que se dibuje geometría. No fijar sleeps arbitrarios: esperar a escena lista, estado alcanzado y render completado. Probar puntos interiores y ambos lados de cada frontera.

Para regresión visual, capturas con toHaveScreenshot y baselines revisados por una persona, por navegador/SO/viewport. No aprobar baselines generados a ciegas ni confiar solo en un canvas no vacío. Primero revisión visual de las capturas y después comparación estable; actualizar referencias solo por un cambio visual intencional. Edge headless y emulación móvil no sustituyen pruebas en GPU y móvil físicos; ni certifican FPS o limpieza de GPU.

## Estado de ejecución

29 de octubre de 2026: npm.cmd run check:all correcto. TypeScript y build pasan, 28 tests unitarios pasan y 9/9 E2E pasan con Edge real headless en Windows (4.3 s). Revisadas las tres capturas: texto completo legible y sin recortes en escritorio y ambos tamaños móviles. Primer intento E2E bloqueado por FFmpeg ausente; se desactivó únicamente la grabación de vídeo y se mantuvieron capturas y traces. CI remota no ejecutada. QA es propietario de e2e/** y de revisar las evidencias; Orchestrator coordina configuración y aceptación.
