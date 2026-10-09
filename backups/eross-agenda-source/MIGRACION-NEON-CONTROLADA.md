# EROSS Agenda — recuperación hacia Neon propio (2026-10-09)

## Base nueva verificada
- Neon project id: `soft-lake-14045662`
- Nombre: `eross-agenda-db`
- Database: `eross_agenda`
- Organización: `org-flat-art-40805212` (Jesus), cuenta `chusapp@gmail.com`
- Acceso Neon verificado: ADMIN; rol PostgreSQL `eross_agenda_owner`
- PostgreSQL 18.6; al comprobarlo, **0 tablas públicas**.

## Base antigua
- Endpoint: `ep-long-unit-b7ja9zpj-pooler.c-13.us-east-1.aws.neon.tech`
- API bootstrap del despliegue aprobado funcionó y devolvió 1 empresa, 3 usuarios, 1 sucursal, 4 tipos de cita, 7 reglas de disponibilidad, 2 bloqueos, 3 citas.
- **No hay acceso administrativo confirmado** al proyecto original y NO hay respaldo completo verificado.
- Vercel `DATABASE_URL` es Sensitive; no copiar al repositorio.

## Inventario de tablas evidenciadas en el código
1. `agenda_companies`
2. `agenda_users`
3. `agenda_locations`
4. `agenda_clients`
5. `agenda_appointment_types`
6. `agenda_availability_rules`
7. `agenda_blocks`
8. `agenda_appointments`
9. `agenda_appointment_events`
10. `agenda_integration_outbox`
11. `agenda_booking_settings` (solo en rama de desarrollo y migración 001, no presumir en base antigua)

## Secuencia de seguridad antes del cambio de DATABASE_URL
1. Obtener esquema real de la base antigua (tablas, columnas, tipos, llaves, índices, secuencias y constraints) mediante acceso SQL autorizado.
2. Exportar TODOS los registros y comparar recuentos y claves; no basta respuesta de /api/agenda/bootstrap, porque omite tablas, eventos e integraciones.
3. Crear esquema en Neon nuevo, importar y cotejar datos bajo transacción/proceso verificable.
4. Probar en Preview independiente con conexión nueva y protección habilitada; no publicar endpoints de diagnóstico.
5. Plan de corte con respaldo, ventana sin escrituras y reversión; solo entonces cambiar conexión de producción.
6. Restringir APIs administrativas y de lectura de citas con autenticación antes de comercializar (se halló ausencia de autorización robusta en el código).

## Estado
- Nuevo proyecto y base creados y verificados.
- Migración de esquema: pendiente; no inventar DDL derivado únicamente de consultas parciales.
- Exportación de datos antiguos: pendiente; no afirmar copia completa.
- Vercel y base antigua: sin cambios.
