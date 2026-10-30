# Dirección artística

Objetivo: arquitectura editorial, calmada y precisa para estudios; la estructura es conceptual, no una simulación BIM ni una galería de cuadros. Secuencia implementada: plano técnico que se dibuja → volumen que emerge → vista aérea oblicua con continuidad al portfolio HTML.

| Preset | Dirección propuesta |
|---|---|
| Paper | Fondo marfil, líneas grafito, cotas finas, volumen mate claro |
| Inverted Blueprint | Azul profundo, líneas claras, contraste legible, emisión contenida |
| Material Study | Neutros minerales, superficies mates, acento cálido discreto |

Los tres presets tienen paleta, fondo, líneas, materiales de muros y controles implementados. No importar texturas del corredor ni su catálogo de forma automática. Jerarquía visual: contorno estructural, divisiones, retícula, cotas y anotaciones. Puertas y cotas se construyen paramétricamente en floorPlan.ts; texto narrativo siempre en HTML.

Cámara sin giros bruscos ni reseteos ocultos; encuadre por tamaño real del contenedor, incluyendo móvil vertical. Transición continua y reversible; scroll del documento conserva acceso al portfolio. En reduced motion usar estado estático legible y contenido completo, sin depender de animación para entender el proyecto.

QA ejecutada en M1–M3: desktop 1440×900, móvil 390×844 y 320×568; verificar recortes, cotas, jerarquía, contraste y no desbordamiento. Las tres resoluciones se probaron con Playwright y capturas revisadas. Presupuesto inicial propuesto: DPR ≤1.5 por defecto, ≤2 absoluto; sin sombras dinámicas obligatorias ni postprocesado necesario. Medir frame time y recursos en dispositivos acordados antes de prometer FPS.

## Revisión M3.5-A: puesta en escena para aprobación

La dirección cinematográfica sustituye la lectura de maqueta externa de M3. Draw empieza bajo y oblicuo y se traslada horizontalmente sobre un suelo técnico que se extiende fuera del encuadre. Se descubren zonas y líneas por partes; no hay textos decorativos sobre el suelo. Extrude acerca muros y relaciones de altura a la cámara. Solo Reveal asciende y permite leer el conjunto, con elevación final62° y sostén desde.94a1 con defaults.

La composición A es provisional: estudio oeste, galería este y foro norte,14ejes compartidos por líneas y muros con alturas.5..1.3×la base y huecos abiertos. No equivale a la geometría definitiva de B. La luz y materiales se conservan de M3; sombras/acabado cinematográfico pertenecen a C.

La inspección inicial encontró móvil Draw-end sin geometría técnica visible y se corrigieron dos puntos de interés hacia ejes realmente dibujados. No se aceptó el grid vacío como descubrimiento arquitectónico. A entrega seis puntos por dispositivo y dos vídeos para que el usuario apruebe o corrija la dirección; tests verdes no conceden esa aprobación.