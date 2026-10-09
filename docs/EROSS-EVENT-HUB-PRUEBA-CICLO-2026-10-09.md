# QA Event Hub — 2026-10-09

## Aislamiento
Rama temporal Neon: `qa-event-hub-ciclo-2026-10-09` (`br-red-smoke-b792oaol`) en proyecto `eross-agenda-db`, separada del `main`. La base principal con tres citas recuperadas no fue modificada.
Cita sintética: `b62cb0fb-f5b4-4184-98ff-6c8bf921c10a`.

## Pruebas de base de datos realizadas
- Confirmación `confirmed`: 1 evento, 1 outbox.
- Reprogramado `rescheduled` (estado, no se cambió la hora): 1 evento, 1 outbox.
- Cancelación `cancelled`: 1 evento, 1 outbox.
- Atendida `attended`: 1 evento, 1 outbox.
- Ausencia `no_show`: 1 evento, 1 outbox.
- Repetir `no_show`: 0 cambios, 0 eventos, 0 outbox nuevos.
- Conteo: 5 eventos, 5 señales para CRM, 5 event_id distintos.
- Se ejecutaron sentencias SQL con el mismo patrón CTE de la ruta API `/api/agenda/status`; **no se probó una petición HTTP autenticada ni interacción de navegador**.

## Pendientes bloqueantes
- Conectar a UI las transiciones de estado; guardar formulario hoy todavía usa `/api/agenda/appointments`.
- Crear y editar citas emiten eventos mediante varias instrucciones SQL, no en una sola transacción. Corregir.
- Reprogramación real requiere comprobar fecha/hora y conflicto, y emitir `appointment.rescheduled` solo cuando el horario cambie; no confundir cambio de etiqueta con reprogramación.
- Verificar creación, edición, reprogramación, cancelación desde API autenticada y navegador con datos ficticios.
- Implementar worker real de entrega CRM, estados/reintentos, idempotencia, aislamiento multiempresa y auditoría. Outbox insertado no significa evento entregado.
- No afirmar pruebas end-to-end completadas hasta cubrir esos pendientes.
