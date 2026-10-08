# EROSS Agenda — continuidad para nuevo chat

Fecha: 2026-10-08

## Cómo retomar
El usuario está construyendo EROSS Agenda como producto genérico para PYMES dentro del ecosistema EROSSCR.

NO es una agenda para ópticas.
NO debe convertirse en CRM.
EROSS CRM se construirá después, estilo Kommo, como producto separado pero integrado por API/eventos.

## Estado aprobado de producto
- Sidebar EROSS navy/dorado aprobado.
- Agenda conserva Mes / Semana / Día / Lista.
- Se agregó Disponibilidad como quinta vista; no reemplaza las vistas anteriores.
- Formulario completo de cita debe conservar comentarios/notas, origen, estado, responsable, sede/modalidad, canal, recordatorio, etiquetas y campos ya aprobados.
- Configuración incluye tipos de cita, color, duración, márgenes, horarios extendidos, múltiples franjas por día, 24 h, bloqueos y zona horaria.
- Motor de disponibilidad calcula horas válidas usando franjas + duración + márgenes + bloqueos + citas.
- Regla de desarrollo: mejorar sumando; no eliminar funciones aprobadas sin revisar qué se conserva.

## Persistencia / backend
- Vercel project: eross-agenda
- Neon/Postgres conectado.
- Base dedicada: eross_agenda
- Multiempresa diseñada.
- Empresa demo: EROSS Demo
- DATABASE_URL y AGENDA_COMPANY_ID configurados en Vercel.
- Tablas:
  agenda_companies
  agenda_users
  agenda_locations
  agenda_clients
  agenda_appointment_types
  agenda_availability_rules
  agenda_blocks
  agenda_appointments
  agenda_appointment_events
  agenda_integration_outbox
- Arquitectura preparada para señales hacia futuro EROSS CRM y Meta mediante eventos/outbox.

## Checkpoint principal
Ver: docs/eross-agenda-checkpoint-aprobado.md

## Próximo objetivo
Continuar desde la persistencia real/multiempresa y verificar que todas las vistas y el formulario completo lean/escriban la misma fuente de datos sin regresiones visuales o funcionales.

## Frase útil para abrir el próximo chat
"Seguimos con EROSS Agenda. Lee el checkpoint docs/eross-agenda-checkpoint-aprobado.md y el handoff docs/eross-agenda-next-chat.md del repo chusapp-star/eross. Continuemos exactamente desde ahí sin perder funciones aprobadas."
