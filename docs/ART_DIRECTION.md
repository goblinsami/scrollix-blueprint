# Dirección artística

Objetivo: arquitectura editorial, calmada y precisa para estudios; la estructura es conceptual, no una simulación BIM ni una galería de cuadros. Secuencia futura: plano técnico que se dibuja → volumen que emerge → vista aérea oblicua con continuidad al portfolio HTML.

| Preset | Dirección propuesta |
|---|---|
| Paper | Fondo marfil, líneas grafito, cotas finas, volumen mate claro |
| Inverted Blueprint | Azul profundo, líneas claras, contraste legible, emisión contenida |
| Material Study | Neutros minerales, superficies mates, acento cálido discreto |

Presets son intención artística, no materiales implementados. No importar texturas del corredor ni su catálogo de forma automática. Jerarquía visual: contorno estructural, divisiones, retícula, cotas y anotaciones. Puertas y cotas se construirán paramétricamente en M2; texto narrativo siempre en HTML.

Cámara sin giros bruscos ni reseteos ocultos; encuadre por tamaño real del contenedor, incluyendo móvil vertical. Transición continua y reversible; scroll del documento conserva acceso al portfolio. En reduced motion usar estado estático legible y contenido completo, sin depender de animación para entender el proyecto.

QA futura: desktop 1440×900, móvil 390×844 y 320×568; verificar recortes, cotas, jerarquía, contraste y no desbordamiento. Estas resoluciones son criterios de revisión, no resultados actuales. Presupuesto inicial propuesto: DPR ≤1.5 por defecto, ≤2 absoluto; sin sombras dinámicas obligatorias ni postprocesado necesario. Medir frame time y recursos en dispositivos acordados antes de prometer FPS.
