# EROSS Agenda — puertas de calidad antes de vista previa (2026-10-08)

No desplegar desde esta rama todavía.

## Cambios preparados
- Lectura de tipos, franjas y zona horaria de Neon.
- Guardado explícito de tipos de cita y franjas.
- Desactivación de tipos para conservar historial.
- API de bloqueos por empresa: crear, listar, eliminar.
- Rechazo de bloqueo cuando se cruza con una cita existente.
- Intervalos de inicio y anticipación mínima persistidos en tabla nueva **pendiente de migración**.

## Dependencias de pruebas
1. Identificar el proyecto Neon y una rama de **pruebas**, sin ejecutar SQL en producción.
2. Inspeccionar `agenda_companies`, `agenda_appointment_types`, `agenda_availability_rules`, `agenda_blocks`, `agenda_appointments`.
3. Validar compatibilidad de la migración `migrations/001_agenda_booking_settings.sql` contra ese esquema.
4. Verificar que no hay acceso público a las API mutables. **El código rescatado no muestra autenticación/autorización de usuario**, y `AGENDA_COMPANY_ID` es un tenant estático. Antes de abrir la aplicación comercialmente deben introducirse sesiones y autorización por empresa.
5. Compilar la rama completa y hacer pruebas de integración en Neon aislado.
6. Confirmar alta y edición de tipos, desactivación, jornadas nocturnas, carga tras recargar, crear/borrar bloqueo, no bloqueos sobre citas, intervalos y anticipación.
7. Revisar secuencias de guardado parcial, ventanas de concurrencia y conflictos de agenda; las verificaciones previas a insertar no garantizan atomicidad por sí solas.
8. Sólo después, desplegar una preview separada. No promover a producción sin aprobación.

## Observaciones técnicas conocidas
- La UI de reglas globales todavía contiene algunos controles históricos no conectados a la nueva persistencia.
- Falta conectar el cálculo visual de horas disponibles con `slot_interval_min` y `min_notice_min`.
- La migración de nueva tabla no se ha ejecutado. Mientras falte, esa API responderá con error de base de datos.
- Cambiar una regla no debe anunciar guardado total cuando una parte falla: revisar manejo de operaciones parciales.
