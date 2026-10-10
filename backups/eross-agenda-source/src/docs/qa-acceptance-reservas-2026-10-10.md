# EROSS Agenda QA — aceptación de reservas y aislamiento (2026-10-10)

Entorno exclusivo: Neon soft-lake-14045662 / br-red-smoke-b792oaol / eross_agenda. Vercel eross-agenda-qa. **No acredita salida a producción**.

## Verificaciones efectuadas (consulta SQL, sin alterar registros)
- Restricción PostgreSQL de solapamiento por responsable activo: **1** (presente).
- Solapamientos activos existentes entre citas con responsable: **0**.
- Relaciones cruzadas entre empresas, citas y clientes: **0**.
- Relaciones cruzadas entre empresas, citas y tipos de servicio: **0**.
- Relaciones cruzadas entre empresas, citas y responsables: **0**.
- Relaciones cruzadas entre empresas, citas y sedes: **0**.

## Verificaciones de código
- POST/PATCH de citas exige responsable y sede activos y valida UUID antes de convertirlos.
- POST/PATCH aplica horario, anticipación mínima y bloqueos en servidor.
- Restricción exclusion en DB protege reservas solapadas del mismo responsable; error 23P01 se traduce a HTTP 409.
- PATCH de estado genera evento y encola la integración.
- QA no usa la versión original EROSS de producción ni Neon main.

## No ejecutado / bloqueante
- El acceso HTTP a QA desde la herramienta de prueba respondió 401 `deployment_authentication_required`. No hay sesión autorizada de usuario de prueba disponible.
- **No se han ejecutado** pruebas E2E reales de crear, editar, reprogramar, cancelar, reactivar o reservar concurrentemente. No marcar como aprobadas.
- Sol y Luna no tienen responsables ni sedes; requieren configuración de prueba previa para flujos de reserva.
- Aislamiento de datos SQL comprobado; autenticación cruzada entre sesiones de Sol/Luna todavía no probada.

## Regla de cierre
No declarar el bloque de citas «aprobado para mercado» hasta completar los escenarios anteriores con evidencias (respuesta HTTP, ID de cita y verificación de datos) en un entorno de pruebas seguro. No modificar datos reales ni producción.
