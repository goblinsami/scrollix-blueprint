---
name: blueprint-validation-qa
description: Validar cambios de contratos y preparar evidencia de calidad de Blueprint sin confundir tests puros con WebGL.
---

# blueprint-validation-qa

Partir de tipo, factory y validador únicos. Probar inputs desconocidos, NaN/Infinity, rangos, enums, versiones, IDs duplicados, orden, objetos independientes y roundtrip JSON. Cada campo nuevo se actualiza junto con consumidores y docs. No crear tests que solo comparen texto de documentación o repliquen la implementación.

Ejecutar npm run check en Blueprint; no ejecutar comandos que escriban caché en Corridor. Para funciones futuras añadir pruebas de lifecycle y recursos; después navegador real, móvil y accesibilidad.

Registrar comandos, cantidades, resultados y límites de evidencia. build no demuestra interacción, Framer, FPS ni limpieza GPU. No ejecutar CI remoto ni despliegue sin permiso; el workflow local solo se revisa y se ejecutan sus checks equivalentes.

Procedencia adaptada: src/utils/validateGalleryProject.ts; src/tests/resourceLibrary.test.ts; .agents/TextureMappingAgent.md. Consultar docs/AUDIT.md y docs/sources/ARCHITECTURE_REVIEW.md desde la raíz del repo.
