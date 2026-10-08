# EROSS Agenda — Estado de rescate (2026-10-08)

## Estado confirmado
- Despliegue aprobado: `dpl_WHesSBFEpqHEwsYhchC3rcWVnk5D` en Vercel, **sin modificar**.
- Repositorio de respaldo temporal: `chusapp-star/eross`, rama `backup/eross-agenda-source-2026-10-08`.
- **10 archivos únicos ya guardados y verificados en GitHub**, dentro de `backups/eross-agenda-source/src/`.

## Archivos ya respaldados
- `package.json`; `next.config.js`; `lib/agenda-db.js`; `pages/_app.js`
- `pages/agenda-master-review.js`
- `pages/agenda-master-review-engine-base.js`
- `pages/agenda-master-review-flex-base.js`
- `pages/agenda-master-review-final-base.js`
- `pages/agenda-master-review-exact-base.js`
- `pages/agenda-master-review-text-base.js`

Los tres archivos grandes aportados por el usuario se recuperaron desde los adjuntos de la conversación y se compararon contra el contenido leído nuevamente de GitHub: coincidencia exacta.

## Búsqueda adicional
Se revisó la carpeta de Biblioteca `/EROSS`: contiene snapshots Markdown de octubre 5 y 6, pero **no el ZIP/código operativo íntegro** de la versión del 8 de octubre.

## Dependencias prioritarias aún pendientes
1. `pages/agenda-master-review-approved-base.js` (import directo desde `exact-base.js`).
2. Demás archivos importados transitivamente desde `approved-base.js` y desde otras pantallas.
3. `pages/api/agenda/bootstrap.js`, `appointments.js`, `config.js`.
4. `pages/index.js`, estilos e imágenes que utilice el proyecto.

## Limitaciones y reglas
- El conector de Vercel recorta los archivos mayores de aproximadamente 1,5 KB y oculta los IDs de rutas API por profundidad en el árbol.
- El respaldo sigue siendo **parcial**: NO desplegar, fusionar a `master` ni afirmar que compila.
- No copiar secretos, `.env`, ni tokens a GitHub.
- Antes de restaurar: reunir dependencias, pruebas de build y verificación funcional con entorno seguro.
