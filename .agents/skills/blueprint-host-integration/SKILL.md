---
name: blueprint-host-integration
description: Crear o revisar hosts DOM y Framer que consumen el único runtime Blueprint.
---

# blueprint-host-integration

Leer src/index.ts y docs/CONTRACT.md. Convertir controles o JSON a unknown y pasar una vez por validateBlueprintProject; usar createDefaultProject, sin defaults alternativos. Mostrar errores con path. Contenido editorial se inserta como texto en HTML semántico.

El adaptador solo monta, actualiza, dimensiona y desmonta. No importar internals de escena ni interpolación. Una única integración Framer consume el mismo mount del playground. Resize depende del contenedor; scroll sticky debe permitir continuar al portfolio.

Probar paridad entre controles/JSON, montaje repetido, error recuperable y cambio de props durante carga. No cargar bundles remotos, desplegar o publicar sin permiso. Fase 0 no incluye implementar Framer.

Procedencia adaptada: FRAMER_INTEGRATION.md; src/framer/framerProjectAdapter.ts; revisión §20. Consultar docs/AUDIT.md y docs/sources/ARCHITECTURE_REVIEW.md desde la raíz del repo.
