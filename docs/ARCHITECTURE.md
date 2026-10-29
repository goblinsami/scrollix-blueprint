# Arquitectura propuesta

Landing arquitectónica conceptual, sin CAD aportado por el comprador. Un runtime independiente de hosts, un progreso normalizado y una escena. No se necesita API ni base de datos en este alcance.

## Flujo futuro

Host DOM/Framer → validateBlueprintProject → BlueprintProject → runtime Core → escena 3D. El host calcula progreso desde scroll nativo de una sección sticky y llama setProgress; el runtime coordina timeline y scheduler. La escena recibe progreso, resize y render; no conoce el navegador como fuente de entrada. Las estaciones se representan en HTML semántico; ningún texto editorial depende de WebGL.

## Fronteras y estado actual

src/contracts contiene tipos, defaults y validación operativos. ports.ts declara interfaces futuras; NO hay implementaciones de runtime o escena. src/main.ts muestra solo el estado de preparación y comprueba que Three.js se resuelve. El build Vite actual genera una página estática, no una librería distribuible.

src/core, src/scene e integration se crearán al iniciar sus hitos; no se añaden clases vacías que simulen trabajo implementado. Core y contratos no importan Three.js, React ni Framer. Integration será el único dueño de captura de scroll. Ningún módulo importa rutas de Corridor.

## Semántica futura del lifecycle

mount recibe contenedor y proyecto normalizado; puede rechazar con error recuperable. Cada montaje/actualización tendrá generación y cancelación: una actualización más reciente prevalece y los resultados tardíos se liberan. updateProject conserva el último estado válido si falla; dispose es idempotente y cancela listeners, observers, RAF y cargas. Tras dispose, mutaciones no producen trabajo. resize usa tamaño del contenedor en píxeles CSS y DPR efectivo limitado por config. setProgress limita números finitos a [0,1]; valores no finitos se rechazan. Estas reglas se implementarán y probarán en M1.

Recursos compartidos pertenecen a la biblioteca que los crea; los nodos de escena no liberan texturas prestadas. Cada construcción dispone sus recursos no adjuntos y evita doble liberación. Scheduler por invalidación, pausa por visibilidad y continuación únicamente mientras haya transición activa.

## Integración y entrega pendientes

Una integración React/Framer futura llamará el mismo mount/update/dispose que el playground. El modo de entrega local/remoto se decide con una prueba vertical; no hay loaders remotos hoy. Netlify y licencias son decisiones posteriores, fuera de Fase 0. Reducción de movimiento y fallback HTML deben existir antes de entrega comercial.
