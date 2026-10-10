# EROSS Agenda Premium Multiempresa — informe de aceptación QA

Fecha: 10 de octubre de 2026. Base de trabajo: `fe3be055a4776c7547276e0ef021032e59286e4c`, rama `dev/eross-agenda-config-neon-2026-10-08`.

## Entorno y alcance

Código existente: `backups/eross-agenda-source/src`. Se conserva `pages/eross-original-integrado-qa.js` y el motor `pages/agenda-master-review.js`, con sus cinco vistas y el selector rápido de meses. No se creó otro prototipo ni se editaron los estilos aprobados. Los controles añadidos usan las clases de la interfaz existente; su equivalencia visual queda pendiente de revisión autenticada en navegador.

Base exclusiva de pruebas: Neon `soft-lake-14045662`, rama `br-red-smoke-b792oaol`, base `eross_agenda`. Los datos creados son empresas, identidades, responsables, sedes, clientes y citas ficticios con prefijo QA Acceptance. No se modificaron Neon principal ni Medical Óptica vouchers. No se realizó despliegue en EROSS producción.

Versión funcional desplegada y probada: `b8a86ebc0954eb4f17208cb5e985cae23a15defb`, despliegue asociado al alias durante las pruebas `dpl_9vjSMdX3cMuARQAnLecLBFE3rvhg`, URL https://eross-agenda-qa.vercel.app/eross-original-integrado-qa. También se completó un despliegue manual del mismo commit (`dpl_7EZWPUYkg16Lptsbj9sYgqRmUTjq`). El despliegue EROSS producción permaneció en `dpl_25BA3fHiUhi9PM7HfhjcpTqKaRYa`.

La suite remota pasó 41 comprobaciones de autenticación/reservas y 31 de administración/configuración: **72 comprobaciones HTTP aprobadas contra Vercel QA**, con Neon QA y cuentas ficticias. La versión desplegada coincide con el commit indicado; la compilación local y la de Vercel terminaron correctamente.

Las pruebas HTTP locales ejecutan los handlers reales de Next.js conectados a Neon QA. No sustituyen la prueba del navegador ni la validación funcional del despliegue Vercel. Un estado READY no significa aceptación funcional.

## Bloques y resultados

| Bloque | Resultado comprobado | Estado |
|---|---|---|
| 1. Continuidad | Repositorio, rama y commit recuperados; se consultó el informe anterior para no repetir verificaciones SQL ya efectuadas | Completado |
| 2. Autenticación y permisos | Login real de admin, supervisor y colaborador; ingreso a empresa ajena rechazado; consultas autenticadas; colaborador sin permiso de creación | Probado por HTTP local y Vercel QA |
| 3. Reservas | Creación, duplicados, edición, reprogramación, estados, cancelación, reutilización, reactivación y solicitudes concurrentes | 17 comprobaciones locales y suite remota aprobadas tras corregir UUID |
| 4. Configuración | Tipos, márgenes, franjas múltiples, horario hasta 22:00, 24 h, zona horaria, intervalo y anticipación persistidos; lote inválido sin escritura parcial; tipo ajeno rechazado | Probado por HTTP local y Vercel QA |
| 5. Administración de empresa | Alta de responsables, sedes y cuentas; permisos de supervisor; edición de nombre; protección del propio rol; bloqueo nocturno; historial propio y ajeno | 31 comprobaciones remotas de configuración y administración aprobadas |
| 6. Disponibilidad | Mismo responsable entre sedes, márgenes de ambas citas, límites contiguos, bloqueos nocturnos y último espacio de un día de 24 h | 7 aserciones pasaron |
| 7. Navegador y aceptación comercial | Navegación autenticada, comparación visual, CSV descargado, comportamiento responsive y alta global de empresas | Pendiente; no aprobado para comercializar |

## Errores corregidos

1. El validador UUID de creación rechazaba identificadores legítimos: impedía reservar aunque login y lectura funcionaran.
2. Disponibilidad ignoraba citas del mismo responsable en otra sede y no aplicaba correctamente márgenes de citas existentes ni bloqueos que cruzaban medianoche. Usa los rangos reservados persistidos.
3. Reactivar una cita cancelada verificaba solo la restricción de solapamiento; ahora comprueba horario, anticipación, bloqueos y vigencia de servicio, responsable y sede.
4. Guardar recordatorio `0` producía NULL; ahora conserva la elección “Sin recordatorio”.
5. Configuración estaba vinculada al administrador heredado y podía escribir parcialmente antes de detectar errores. Ahora resuelve la empresa de la sesión, valida el lote completo y guarda transaccionalmente.
6. Alta de responsables requería un UUID explícito porque la tabla no tiene valor predeterminado; el endpoint genera el identificador.
7. Estadísticas y resumen quedaban desactualizados tras modificar citas; se actualizan al cambiar de sección y guardar operaciones. Se redujeron consultas del resumen.
8. Se añadió cierre de sesión, historial visible y edición deshabilitada para colaboradores.
9. El login integrado usa credenciales reales y solicita selección únicamente entre membresías autorizadas; ya no exige ingresar por una pantalla de laboratorio Sol/Luna.
10. Se añadieron cuentas de acceso, responsables operativos, sedes, servicios, horarios y bloqueos dentro de la interfaz existente. El correo ya registrado no permite sobrescribir credenciales.
11. Se uniformó validación de origen en endpoints modificados y se protegió la exportación CSV contra valores que puedan interpretarse como fórmulas.
12. Next.js se actualizó de 14.2.30 a 14.2.35 dentro de la misma línea, según el parche oficial: https://nextjs.org/blog/security-update-2025-12-11.

## Evidencias y reproducción

- `docs/qa-flow-evidence-1791647728422.json`: pruebas de autenticación/lectura, con el fallo de creación original documentado. Ese fallo no se acredita como aprobado.
- `docs/qa-flow-evidence-1791647939311.json`: 17 comprobaciones de reservas posteriores a la corrección, todas aprobadas; transporte local declarado.
- `docs/qa-flow-evidence-1791649451523.json`: **41 comprobaciones remotas aprobadas** contra Vercel QA, con `transport: null` (sin intermediario local).
- `docs/qa-admin-evidence-2026-10-10.json`: **31 comprobaciones remotas aprobadas** de administración, recursos, configuración, historial y cuentas; `transport` es la URL HTTPS de QA.
- `docs/qa-status-evidence-2026-10-10.json`: reprogramación, membresías y reactivación bloqueada.
- `scripts/qa-availability-check.mjs`: comprobaciones deterministas del cálculo que usa la interfaz.
- `scripts/qa-start.mjs`: inicia Next.js y la suite en un mismo entorno de red; recibe configuración por stdin sin persistir secretos. `suite` admite reservas, `admin` y `status`; `resume` restringe la ejecución a las empresas ficticias identificadas en la evidencia. Las pruebas generan datos ficticios y no envían mensajes.

## Criterios que aún impiden aceptación comercial

- Completar navegación autenticada en navegador sobre el nuevo despliegue QA: Mes, Semana, Día, Lista, Disponibilidad, Clientes, Estadísticas, Empresas, Usuarios, Configuración y retorno entre secciones.
- Comparar la interfaz renderizada con el prototipo aprobado, en escritorio y móvil; comprobar descarga y apertura del CSV, persistencia después de recargar, errores visibles y ausencia de regresiones de CSS.
- Validar el alta global de empresas con una identidad autorizada para provisión. `EROSS_QA_COMPANY_PROVISIONER_IDENTITY_ID` no está configurado en el proyecto QA: un administrador de empresa no se convierte automáticamente en administrador global.
- Acordar y probar la salida del modo QA en un futuro entorno de lanzamiento, conservando aislamiento, migraciones y configuración. Esta sesión no autoriza cambiar producción antes de aprobación.

## Límite de la validación visual

El navegador superó la protección de Vercel y renderizó el formulario integrado nuevo. La solicitud segura de acceso a la empresa terminó con control manual del usuario; la observación posterior siguió mostrando el formulario de ingreso, sin una sesión empresarial autenticada. No se acreditan navegación interna, CSV descargado ni comparación visual completa. Para cerrar esos puntos se requiere iniciar sesión en QA mediante el navegador compartido, sin enviar contraseñas por chat.

## Dictamen

Aceptación técnica parcial con evidencia. **No se declara la aplicación terminada ni aprobada para lanzamiento comercial mientras los criterios pendientes no se cumplan.** Los bloques comprobados sirven de continuidad; no deben reiniciarse con otra auditoría general.
