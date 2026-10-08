# EROSS Agenda — checkpoint aprobado

Fecha de aprobación visual: 2026-10-07
Última actualización técnica: 2026-10-08

## Versión visual aprobada
- Proyecto Vercel: `eross-agenda`
- Branding EROSS Agenda aprobado: sidebar azul marino, dorado, bloque de marca sin duplicados.
- Menú lateral con iconos.
- Vistas de Agenda: Mes / Semana / Día / Lista / Disponibilidad.
- Configuración: tipos de cita, disponibilidad flexible, horarios extendidos, varias franjas por día, 24 h, bloqueos y zona horaria.
- Formulario completo de cita: cliente/prospecto, teléfono, correo, fecha, hora, tipo, duración, responsable, sede, modalidad, estado, origen, canal de confirmación, recordatorio, etiquetas, comentarios/notas e ID externo CRM.

## Versión técnica actual
- Deployment: `dpl_WHesSBFEpqHEwsYhchC3rcWVnk5D`
- URL:
  https://eross-agenda-hr26qnegq-jesus-prado-portuguez-s-projects.vercel.app/agenda-master-review
- Backend: Next.js API Routes.
- Base de datos: Neon/PostgreSQL.
- Base dedicada: `eross_agenda`.
- Empresa demo multiempresa: `EROSS Demo`.
- La app ya lee datos desde Neon mediante `/api/agenda/bootstrap`.
- Vercel tiene `DATABASE_URL` y `AGENDA_COMPANY_ID` configurados para este proyecto.

## Modelo de datos real
Tablas principales:
- `agenda_companies`
- `agenda_users`
- `agenda_locations`
- `agenda_clients`
- `agenda_appointment_types`
- `agenda_availability_rules`
- `agenda_blocks`
- `agenda_appointments`
- `agenda_appointment_events`
- `agenda_integration_outbox`

La estructura está preparada para múltiples empresas sin mezclar información.

## Protección de agenda
- La disponibilidad se calcula con horario, franjas, duración, márgenes, bloqueos y citas existentes.
- Cada cita guarda `reserved_starts_at` y `reserved_ends_at` para incluir márgenes.
- PostgreSQL protege choques de agenda por responsable mediante exclusión de rangos.
- El backend valida disponibilidad antes de guardar.
- Estados soportados: pending / confirmed / rescheduled / attended / no_show / cancelled.

## Eventos para futuro CRM/Meta
- Las citas generan eventos internos.
- Existe una outbox de integración para desacoplar Agenda de EROSS CRM.
- Agenda puede emitir eventos como `appointment.created`, `appointment.updated`, cambios de estado y `appointment.attended`.
- Las señales para Meta no convierten Agenda en CRM: se preparan como eventos de integración.
- EROSS CRM será otro producto separado y consumirá estos eventos.

## Enfoque funcional del producto
- EROSS Agenda NO se diseña para ópticas ni para una industria específica.
- Es una agenda comercial genérica para PYMES y clientes de EROSSCR.
- Puede recibir leads provenientes de CRM, formularios, campañas, WhatsApp, canales externos o carga manual.
- Ciclo: lead/cliente → cita → confirmación/reprogramación → atención/no asistencia → resultado → evento hacia integraciones.

## Límite de producto: Agenda ≠ CRM
- EROSS Agenda NO debe convertirse en un CRM ni intentar replicar Kommo.
- No incluir pipelines completos, deals, bandeja omnicanal ni automatizaciones comerciales complejas.
- EROSS CRM se desarrollará después como módulo/producto independiente pero fuertemente integrado.

## Regla para próximos cambios
Tomar este checkpoint como base. No retroceder a versiones anteriores ni reemplazar funciones aprobadas sin revisar qué se conserva. Las mejoras deben sumar sobre lo ya aprobado.
