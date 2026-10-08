# EROSS Agenda — Rescate automatizado parcial (8 octubre 2026)

## Rama de respaldo
`backup/eross-agenda-source-2026-10-08` en `chusapp-star/eross` (NO fusionar con master ni desplegar).

## Archivos fuente íntegros recuperados de Vercel a GitHub
- `src/package.json`
- `src/next.config.js`
- `src/lib/agenda-db.js`
- `src/pages/_app.js`
- `src/pages/agenda-master-review-final-base.js`
- `src/pages/agenda-master-review-text-base.js`
- `src/pages/agenda-master-review-exact-base.js`

## Archivos suministrados manualmente en el chat (pendientes de unificación al repositorio)
- `src/pages/agenda-master-review.js`
- `src/pages/agenda-master-review-engine-base.js`
- `src/pages/agenda-master-review-flex-base.js`
- `src/pages/agenda-master-review-final-base.js` (también ya recuperado automáticamente a GitHub)

Por tanto hay **10 archivos fuente únicos identificados con copias íntegras** entre los dos métodos (7 en GitHub, 3 exclusivos en adjuntos de la conversación).

## Limitaciones
La API de Vercel a través del conector está truncando archivos mayores (~1.5 KB) y el árbol de despliegue a profundidad 3, ocultando IDs de `api/agenda/{bootstrap,config,appointments}.js`. No se ha recuperado el código completo ni hecho prueba de build.

## Siguiente paso seguro
Recuperar los archivos grandes y las tres API por método que permita descarga íntegra, reunir también estilos, imágenes y demás componentes de la cadena de imports, ejecutar build y verificar comportamientos con entorno de pruebas. No tocar variables privadas, base Neon ni despliegue aprobado.
