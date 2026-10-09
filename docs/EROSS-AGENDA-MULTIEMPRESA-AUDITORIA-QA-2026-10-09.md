# EROSS Agenda — Puerta de seguridad multiempresa (QA, 2026-10-09)

## Alcance verificado
- Rama Neon aislada: `qa-event-hub-ciclo-2026-10-09`. No modificar la base principal.
- 1 empresa, 3 usuarios, 7 citas y 14 mensajes en outbox al momento de esta revisión.
- Las consultas `bootstrap` y `event-hub`, y la selección de mensajes del worker, filtran por `company_id`.
- En este conjunto de datos, las relaciones entre cita y cliente, responsable, sede, y outbox y cita presentan **0 referencias cruzadas entre empresas**.

## Bloqueos para declarar EROSS multiempresa listo para producción
1. La sesión `agenda-auth.js` firma un cookie con rol `admin`, pero **no incluye identidad de usuario ni identificador de empresa**.
2. `getCompanyId()` toma un único `AGENDA_COMPANY_ID` de configuración del despliegue: funciona para una empresa por instancia, **no para tenants simultáneos**.
3. Las claves foráneas de citas a clientes, responsables y sedes validan existencia de IDs, pero por sí solas **no garantizan que los registros referenciados pertenezcan a la misma empresa**.
4. QA solo contiene **una empresa**. Los conteos cero de referencias cruzadas no constituyen una prueba de aislamiento entre dos tenants.

## Diseño aprobado para la fase siguiente
- Sesiones de usuario reales con `user_id`, pertenencia a empresa y rol; nunca confiar en `company_id` enviado por navegador.
- Resolver `company_id` en servidor desde sesión y membresía verificada; bloquear acceso sin membresía.
- Toda consulta de lectura/escritura y evento usa el tenant de sesión.
- Restricciones compuestas / validación transaccional para impedir referencias entre empresas en citas y Event Hub.
- Worker autorizado por destino y empresa, credenciales de receptor independientes por tenant.
- Ensayos en QA con **dos empresas ficticias**, usuarios separados y pruebas de lectura, escritura, IDOR, eventos y reintentos entre tenants.
- No migrar ni activar multiempresa en el proyecto original hasta superar pruebas y revisión de autenticación.

## Decisión operativa
Event Hub funciona automáticamente; sin botón obligatorio para clientes ni reintento manual en producción. El panel conserva solo supervisión e incidencias. La opción de ejecución manual QA es exclusivamente para pruebas técnicas.

## Pruebas SQL de solo lectura
```sql
SELECT
 (SELECT count(*) FROM agenda_appointments a JOIN agenda_clients c ON c.id=a.client_id WHERE a.company_id<>c.company_id) cross_company_clients,
 (SELECT count(*) FROM agenda_appointments a JOIN agenda_users u ON u.id=a.responsible_user_id WHERE a.company_id<>u.company_id) cross_company_users,
 (SELECT count(*) FROM agenda_appointments a JOIN agenda_locations l ON l.id=a.location_id WHERE a.company_id<>l.company_id) cross_company_locations,
 (SELECT count(*) FROM agenda_integration_outbox o JOIN agenda_appointments a ON a.id=o.appointment_id WHERE o.company_id<>a.company_id) cross_company_signals;
```
