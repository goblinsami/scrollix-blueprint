# Estado · 31/10/2026

Las cuatro tareas están completadas localmente. Implementación existente en `b98d625`; revisada sin rehacerla, con un solo agente y sin avanzar de hito.

| Tarea | Verificación |
|---|---|
| Modo secuencial ligero | AGENTS.md y docs/ORCHESTRATION.md establecen un agente, lectura selectiva, pruebas focalizadas y delegación solo con autorización expresa |
| Scroll manual | Scroll nativo lineal, recorrido max(2400 px, 4 pantallas), actualización agrupada por RAF y sticky adaptable; slider/teclado/touch comparten el mismo progreso. Reduced motion conserva Reveal estático |
| Composición arquitectónica | Composición provisional abierta y asimétrica, suelo continuo y contornos con espesor derivados de los mismos ejes que los muros; cotas de envolvente real: 11,90 × 17,42 m por defecto. Storyboard conservado |
| Juntas | wallUnion.ts genera una superficie ortogonal común, sin caras internas ni volúmenes superpuestos. Tests L/T/cruz y T de alturas distintas verifican volumen, superficie cerrada, ausencia de triángulos duplicados y aristas internas |

## Pruebas ejecutadas en esta comprobación

- `npm.cmd run check`: TypeScript, **98 tests unitarios (7 archivos)** y build correctos.
- E2E focalizados en Edge: **24 casos de interacción/lifecycle** correctos en desktop, móvil y móvil compacto; incluyen scroll inverso, resize, teclado/touch, presets y reduced motion.
- Hold: se detectó que el redondeo del scroll podía dejar la prueba móvil justo antes de holdStart. Se corrigió solo la preparación del test para entrar en el primer píxel alcanzable dentro del hold, sin cambiar el producto ni relajar igualdad de cámara o píxeles.
- Revalidación del ajuste: TypeScript y **3 E2E de hold** correctos (4,4 s). Total: 27 escenarios E2E distintos verificados; la suite visual completa no se ejecutó.
- Revisadas las tres capturas existentes de artifacts/review-tasks-1-4/: Draw desktop, Reveal desktop y Reveal móvil. Sin nuevas capturas de entrega, vídeos ni manifiestos.

Build correcto con advertencia de bundle de 501,62 kB (>500 kB). Geometría todavía provisional y ortogonal; aprobación artística pendiente. Las pruebas headless no certifican rendimiento GPU ni móvil físico.

Publicación: subir los commits locales pendientes y esta actualización con la corrección del test a main. El cambio previo de .gitignore (línea vacía) queda intacto y fuera del nuevo commit. No se modificó Corridor ni se inició M3.5-C/M4/M5; sin despliegues. Detenerse tras commit/push.
