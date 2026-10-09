# EROSS — Visión del ecosistema digital (aprobada, 2026-10-09)

## Visión de producto
EROSS será una plataforma comercial modular para emprendedores y PYMES, no tres aplicaciones aisladas. **erosscr.com** será la web comercial, puerta de entrada y punto de acceso a herramientas. Debe ser moderna, minimalista, dinámica y animada. Mantener identidad visual EROSS.

## Componentes
1. **EROSSCR.COM**: servicios, formularios, captación de leads, CTA WhatsApp, enlaces a Agenda, CRM y portal privado. La web también produce señales de navegación y conversión elegibles, respetando consentimiento.
2. **EROSS Agenda**: calendario Mes/Semana/Día/Lista/Disponibilidad; crear, confirmar, reprogramar, cancelar, atender, marcar ausencias y bloquear horarios. Conserva sedes, responsables, tipos, comentarios, filtros, reportes y configuración.
3. **EROSS CRM** (próximo proyecto grande): leads, clientes, oportunidades, embudos, seguimiento, ventas, relación con campañas y agenda.
4. **EROSS Event Hub**: contrato central de eventos, registro durable, outbox, reintentos, trazabilidad, aislamiento de errores, idempotencia y deduplicación. Conecta web, agenda, CRM e integraciones externas; no es requisito que todos los módulos compartan despliegue o base.
5. **Medición e integraciones**: Meta Pixel + Conversions API, Meta Ads, WhatsApp; potencialmente Google Ads. Coordinar Pixel/browser y CAPI/server con `event_id`; evitar conversiones duplicadas. El CRM decide qué eventos comerciales enviar; la web puede enviar señales de Pixel/CAPI mediante integración segura y consentida.
6. **Portal y planes**: cuentas privadas por empresa, módulos contratados, roles, reportes, planes y suscripciones en fase posterior.

## Flujo comercial esperado
Anuncio/campaña -> visita erosscr.com -> evento web -> formulario / contacto / WhatsApp -> lead CRM -> reserva en Agenda -> señal al Event Hub -> CRM registra cambios -> conversión comercial elegible -> Meta CAPI (con deduplicación si hubo Pixel).
Los cambios de la agenda deben llegar al CRM sin que una caída temporal de CRM impida reservar.

## Contrato inicial de eventos
Eventos de agenda: `appointment.created`, `appointment.confirmed`, `appointment.rescheduled`, `appointment.cancelled`, `appointment.attended`, `appointment.no_show`; actualizaciones generales `appointment.updated`.
Web: PageView, ViewContent, Contact, Lead (según consentimiento y acción real).
CRM: lead qualified, opportunity, purchase/sale won y valores de conversión, cuando corresponda.
Campos mínimos: `event_id` global único, `event_type`, `occurred_at`, `company_id`, `appointment_id`/`client_id` cuando aplique, identificador de lead CRM, fuente/atribución permitida y `schema_version`. No enviar PII indiscriminadamente ni compartir datos entre empresas.

## Principios no negociables
- **Multiempresa**: aislamiento por tenant + autenticación, autorización por rol, nada de confiar en IDs enviados por cliente.
- **Modularidad**: cada módulo continúa funcionando si otro falla.
- **Eventos fiables**: persistir en la misma transacción del cambio, worker con reintentos/backoff, idempotencia, observabilidad y cola de fallos; no afirmar entrega al CRM solo por insertar en outbox.
- **Una fuente de verdad por dominio**: citas en Agenda, pipeline comercial en CRM.
- **Datos reales** en estadísticas y reportes; no mezclar simulados sin marcarlos.
- **Consentimiento** y seguridad para Pixel/CAPI, cifrado de credenciales y secreto por empresa; deduplicación de eventos.
- **Regresiones**: no quitar funciones aprobadas para añadir otras nuevas, pruebas primero en `eross-agenda-neon-pruebas`.
- **Infraestructura**: el original `eross-agenda` se conserva intacto hasta validación. Nuevo Neon propio `eross-agenda-db`, DB `eross_agenda`, con copia parcial restaurada de 3 citas y registros relacionados; faltan historial completo y pruebas end-to-end.
- No asumir que datos de muestra del módulo visual heredado son datos de Neon.

## Orden de ejecución acordado
1. Completar y probar ciclo de reservas y estados en Agenda, con outbox al CRM y sin CAPI directa.
2. Diseñar e implementar Event Hub básico: esquema de eventos, worker y entrega futura.
3. Integrar enlaces, captación y señales en erosscr.com sin romper su web actual.
4. Construir EROSS CRM multiempresa, enlazado a Agenda y Event Hub.
5. Activar integración Meta/automatizaciones con consentimiento y deduplicación.
6. Portal de clientes, roles comerciales, planes y suscripciones.

## Estado (a fecha de documento)
La rama de desarrollo usa `agenda_integration_outbox` con destino `eross_crm`, pero NO hay CRM ni entregas reales ni Event Hub productivo todavía. Deben probarse flujo de citas, seguridad multiempresa, integridad y consistencia de eventos. Este documento guarda el diseño y las decisiones, NO representa funciones implementadas.
