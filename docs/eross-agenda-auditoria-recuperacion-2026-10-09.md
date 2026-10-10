# EROSS Agenda — Auditoría de recuperación (2026-10-09)

## Regla de conservación
NO modificar los proyectos Vercel originales `eross-agenda`, `eross-agenda-neon-pruebas` ni ningún proyecto de vouchers de Medical Óptica. Todo el trabajo de integración se desarrolla en `eross-agenda-qa`, rama `dev/eross-agenda-config-neon-2026-10-08`, Neon branch `qa-event-hub-ciclo-2026-10-09`.

## Inventario confirmado directamente en GitHub
- `backups/eross-agenda-source/src/pages/index.js`: conserva entrada y logo EROSS, navegación y los componentes Login, Dashboard, Agenda, Clients, Statistics, Companies, Users y Settings. ATENCIÓN: Dashboard, Agenda, Clientes, Estadísticas, Empresas y Usuarios aquí se alimentan parcial o totalmente de arrays de demostración y no deben presentarse como conectados a Neon.
- `pages/agenda-master-review.js`: interfaz con vistas Mes/Semana/Día/Lista/Disponibilidad, formulario amplio y peticiones API reales.
- `pages/agenda-master-review-flex-base.js` y `pages/agenda-master-review-engine-base.js`: pantallas auxiliares de configuración/disponibilidad. Revisar qué se ha persistido realmente antes de afirmar funcionalidad completa.
- `pages/eross-inicio-qa.js`: nuevo shell/branding con panel real simplificado, pero NO reproduce la totalidad de la interfaz inicial.
- `pages/eross-agenda-integrada-qa.js`: navega a la Agenda real dentro del shell nuevo; no supone recuperación visual exacta del diseño inicial.
- `pages/tenant-report-qa.js`: panel de estadísticas por empresa en QA. Se corrigió alias SQL `month_key` en API, pero hace falta validar petición autenticada completa en navegador.

## Trabajo probado en QA
- Crear, editar y confirmar cita real Empresa Luna con Neon y eventos/outbox (3 eventos y señales luego del test).
- Aislamiento Sol vs Luna de citas probadas previamente.
- Compilación READY de Vercel QA en varias entregas. Una compilación READY no implica aprobación funcional.

## Prioridad y criterios de aceptación: restauración ANTES de funciones nuevas
1. Inventariar recursos visuales originales (logo, CSS, login, menú y layout) y documentar respaldo; **no sobreescribir** el código original.
2. Construir un único shell multiempresa coherente: acceso seguro -> panel completo -> Agenda Premium -> clientes -> estadísticas -> empresas/usuarios por rol -> configuración; reutilizar diseños originales donde sea posible, no reconstruirlos a ciegas.
3. Datos reales solo cuando la pantalla tenga endpoint seguro con tenant derivado de sesión y permiso; si no, identificarla como pendiente y no mostrar registros ficticios como reales.
4. Corregir fallos de panel, autorización y navegación, comprobar no regresión de reservas, historial, conflicto y eventos/outbox.
5. Ejecutar verificaciones técnicas agrupadas; solicitar una sola revisión visual del usuario después de una entrega significativa.
6. No promover QA a producción sin revisión funcional, pruebas de aislamiento, backups y aprobación expresa.

## Otros requisitos previamente aprobados y pendientes de verificar módulo a módulo
Bienvenida premium; KPI por empresa; clientes/VIP; notas; fecha completa; responsables; sedes; tipos de citas; disponibilidad y bloqueos; vistas Mes/Semana/Día/Lista; historial; exportación Excel; usuarios/roles; reportes; notificaciones de confirmación; integración futura CRM y Meta. No asumir que todos están completamente implementados por figurar en el diseño.

## Último checkpoint
Vercel proyecto QA `prj_eCymBxJAiPIs2Bmu1nbVpoJLAxzs`, último despliegue READY `dpl_83JmFtn5trRjpg6shz9vuqYgWAyv`; original Vercel `prj_tKHbcTLpTkPHLijVIc2XIaIgnSBR` intocable.
