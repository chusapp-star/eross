# EROSS Agenda — checkpoint aprobado

Fecha de aprobación: 2026-10-07

## Versión aprobada
- Proyecto Vercel: `eross-agenda`
- Deployment aprobado: `dpl_FcAv2qCfU3GLwjrC7vdJqTUB3NKL`
- URL de revisión aprobada:
  https://eross-agenda-4f5tvve6o-jesus-prado-portuguez-s-projects.vercel.app/agenda-master-review

## Estado visual aprobado
- Sidebar en azul marino con acentos dorados.
- Branding EROSS Agenda con bloque superior aprobado y sin duplicados.
- Menú lateral con iconos.
- Dashboard limpio y consistente con EROSS.
- Agenda con vistas Mes / Semana / Día / Lista.
- Mayor contraste en horas, días y numeración.
- Clientes con avatares/iniciales.
- Reportes con iconos funcionales.
- Mejor contraste en nombres, títulos y textos de tablas.
- Estilo general: moderno, premium, corporativo y legible.

## Enfoque funcional del producto
- EROSS Agenda NO se diseña para ópticas ni para una industria específica.
- Es una agenda comercial genérica para PYMES y clientes de EROSSCR.
- Debe recibir y gestionar leads provenientes de CRM, formularios, campañas, WhatsApp, canales externos o carga manual.
- Una cita o gestión debe poder asociarse a un lead/prospecto/cliente, empresa, responsable, sede o equipo, origen y estado.
- El ciclo comercial esperado es: lead entra → se agenda una cita/gestión → se confirma/reprograma/cancela → se atiende o se marca ausencia → se registra el resultado.
- Cuando una cita/gestión realmente se ejecuta, el sistema debe generar una señal comercial utilizable por el CRM y por integraciones futuras con plataformas publicitarias como Meta.
- La integración futura con Meta/CRM debe permitir distinguir una simple cita creada de una gestión realmente efectiva, para atribución, medición y optimización de campañas.
- El CRM principal será construido como otro módulo/plataforma del ecosistema EROSSCR; EROSS Agenda debe quedar preparado para interoperar con él mediante API/webhooks/eventos, sin acoplarse a una sola plataforma.

## Límite de producto: Agenda ≠ CRM
- EROSS Agenda NO debe convertirse en un CRM ni intentar replicar Kommo.
- Su responsabilidad termina en la gestión de citas, disponibilidad, responsables, clientes/prospectos vinculados a la cita, estados de asistencia, recordatorios, notas operativas, reportes de agenda y emisión/recepción de eventos.
- No debe incluir pipelines comerciales completos, embudos de ventas, gestión de oportunidades/deals, bandeja omnicanal, automatizaciones comerciales complejas, seguimiento integral del ciclo de ventas ni otras funciones propias de un CRM.
- EROSS CRM será un producto/módulo separado que se desarrollará después, inspirado funcionalmente en herramientas como Kommo pero bajo la marca y ecosistema EROSS.
- EROSS Agenda y EROSS CRM deben quedar fuertemente integrados, pero desacoplados: cada uno con su propia responsabilidad, datos y lógica.
- La Agenda debe poder recibir un lead/cliente desde el CRM y devolver eventos como cita creada, confirmada, reprogramada, cancelada, atendida, no asistió y resultado de la gestión.
- El CRM será quien mantenga el historial comercial completo, pipeline, oportunidades y automatizaciones; la Agenda será la fuente especializada de verdad sobre citas y asistencia.

## Principio de arquitectura
La agenda debe funcionar como una pieza del ecosistema comercial EROSSCR, no como un sistema aislado ni como sustituto del futuro CRM. Los eventos importantes deben quedar preparados para interoperar mediante API/webhooks/eventos con EROSS CRM y otras integraciones.

## Regla para próximos cambios
Tomar este checkpoint como base. No retroceder a versiones anteriores ni reemplazar funciones aprobadas al hacer ajustes visuales o funcionales. Evitar cualquier alcance que convierta EROSS Agenda en un CRM.
