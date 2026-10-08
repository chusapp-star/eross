# EROSS Agenda — auditoría de rescate de código (2026-10-08)

## Fuente de verdad / despliegue preservado
- Proyecto Vercel: `eross-agenda`; ID `prj_tKHbcTLpTkPHLijVIc2XIaIgnSBR`.
- Último deployment aprobado: `dpl_WHesSBFEpqHEwsYhchC3rcWVnk5D` (READY).
- URL: https://eross-agenda-hr26qnegq-jesus-prado-portuguez-s-projects.vercel.app/agenda-master-review
- Proyecto Vercel `eross` está conectado con `chusapp-star/eross`, pero `eross-agenda` **no consta como conectado a GitHub**.
- Único repo encontrado con búsquedas de nombres `eross` y `agenda`: `chusapp-star/eross`, rama `master`. Contiene checkpoints, **no código Next.js operativo**.

## Inventario verificado en el deployment
- `src/lib/agenda-db.js`
- `src/next.config.js`; `src/package.json`
- `src/pages/_app.js`; `src/pages/index.js`
- `src/pages/agenda-master-review.js` (pantalla principal)
- `src/pages/agenda-master-review-engine-base.js` (motor base)
- `src/pages/agenda-master-review-approved-base.js`
- `src/pages/agenda-master-review-base-premium.js`
- `src/pages/agenda-master-review-contrast-base.js`
- `src/pages/agenda-master-review-exact-base.js`
- `src/pages/agenda-master-review-final-base.js`
- `src/pages/agenda-master-review-flex-base.js`
- `src/pages/agenda-master-review-icons-base.js`
- `src/pages/agenda-master-review-polished-base.js`
- `src/pages/agenda-master-review-premium-base.js`
- `src/pages/agenda-master-review-text-base.js`
- `src/pages/agenda-master-preview.js`; `src/pages/agenda-preview.js`
- `src/pages/agenda-review-full-base.js`; `src/pages/agenda-review-full.js`
- `src/pages/eross-crm-preview.js`; `src/pages/eross-preview.js`
- `src/public/eross-approved-brand.webp`; `src/public/eross-logo.webp`
- `src/styles/globals.css`; `src/styles/logo-fix.css`
- API routes `out/api/agenda/appointments`, `bootstrap`, `config` y directorio fuente `src/pages/api/agenda` (árbol truncado por Vercel a profundidad 3).

## Limitación comprobada
El conector Vercel devuelve completas respuestas para archivos pequeños (p. ej. `package.json`), pero recorta los archivos grandes a ~1.506 bytes decodificados (base64 de longitud 2.014). Por tanto, **NO se ha recuperado ni respaldado todo el código**, y no es seguro restaurar la aplicación a partir de esas respuestas parciales.

## Protocolo seguro
1. No redeployar, modificar o reemplazar el deployment aprobado hasta obtener una copia íntegra del código.
2. Localizar el ZIP/proyecto original de Next.js, o exportar íntegramente source desde Vercel a través de un procedimiento que no recorte archivos.
3. Verificar todos los archivos y API; excluir `.env`, variables de conexión, tokens, etc. del repositorio.
4. Crear repo independiente `chusapp-star/eross-agenda`, efectuar commit de fuente completa, conectar GitHub↔Vercel; primero deploy preview y probar regresiones.
5. Retomar mejoras del handoff empezando por Configuración ↔ Neon.

**Estado de auditoría:** inventario documentado; la app actual permanece intacta; el respaldo del código completo sigue pendiente.
