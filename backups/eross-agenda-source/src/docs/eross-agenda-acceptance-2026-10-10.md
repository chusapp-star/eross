# EROSS Agenda Premium Multiempresa — aceptación QA actualizada

Fecha de trabajo: 10 de octubre de 2026, Costa Rica. Continuación tras la pausa de Work: 11 de octubre UTC. Este informe sustituye las listas antiguas que marcaban toda la navegación autenticada como pendiente.

## Dictamen

**Las dos verificaciones móviles pendientes están aprobadas. QA queda entregada para la revisión visual y aprobación final del usuario; el lanzamiento comercial sigue sin autorización.** Se conservan las 79 comprobaciones HTTP remotas previamente aprobadas, sin repetirlas. El cierre autenticado verifica exclusivamente el selector y cambio de empresa, y los controles y navegación semanal a 360 px. La sesión fue iniciada personalmente por el usuario y quedó activa en QA Empresa Sol al terminar.

La identidad visual se conserva a nivel de los estilos base y componentes existentes. Se añadieron reparaciones responsive, descritas abajo. No se certifica equivalencia píxel a píxel con una captura aprobada de referencia ni pruebas en dispositivos iOS/Android físicos. No se tocaron EROSS producción, Neon principal ni Medical Óptica vouchers.

## Entorno y versión

- Repositorio: `chusapp-star/eross`.
- Rama: `dev/eross-agenda-config-neon-2026-10-08`.
- Directorio: `backups/eross-agenda-source/src`.
- Base conservada: `fe3be055a4776c7547276e0ef021032e59286e4c`.
- Código funcional conservado: `78b1fcbc28e7d272f668025ba207cefb78bf948d`.
- QA: https://eross-agenda-qa.vercel.app/eross-original-integrado-qa
- Punto de recuperación y versión probada en este cierre: `f7e7bf9782d9391ac4b605833a8a8530e8868661`.
- Despliegue autenticado probado: `dpl_HyutyPyLFT4QVbQ6aHCwfy81xnR3`; metadatos GitHub y alias QA comprobados. READY acredita compilación y despliegue; las dos verificaciones se acreditan por interacción real y capturas.
- La entrega de este cierre añade solamente documentación y evidencia visual sobre ese punto de recuperación; no modifica código, estilos, base de datos ni permisos. El commit de entrega y su despliegue se comunican en el cierre de la conversación.
- Neon exclusivo: proyecto `soft-lake-14045662`, rama `br-red-smoke-b792oaol`, base `eross_agenda`.
- EROSS producción sigue en `dpl_25BA3fHiUhi9PM7HfhjcpTqKaRYa`, comprobado nuevamente al reanudar.

Vercel etiqueta el destino del proyecto **eross-agenda-qa** como `production`. Esa etiqueta pertenece al proyecto QA y no significa un despliegue en el proyecto EROSS producción.

## Bloques completados y evidencia

| Bloque | Resultado comprobado | Evidencia |
|---|---|---|
| Acceso | Usuario estableció personalmente su contraseña QA; login empresarial y selección autorizada de Sol/Luna. Credenciales heredadas sin cambios | Activación local: 18 aserciones; sesión real observada en navegador |
| Navegación | Dashboard, Agenda Premium, Clientes, Estadísticas, Empresas, Usuarios y Configuración; retorno entre secciones sin perder la sesión | Pruebas del navegador compartido antes de la pausa |
| Agenda | Mes, Semana, Día, Lista y Disponibilidad muestran la misma cita de Sol; selector rápido de meses operativo | Cita `f5220188-8bc1-4d1e-b487-51ab11a9c924` |
| Gestión de citas | Crear, confirmar, reprogramar de 11:30 a 12:00, editar notas desde móvil, cancelar, reactivar y consultar historial | UI + registros Neon QA, seis eventos persistidos |
| Disponibilidad | 12:00 ocupado y deshabilitado; tras cancelar queda disponible; al reactivar vuelve a ocupado | Resultado visible, más suite HTTP de reservas |
| Clientes | Búsqueda real, conteo de citas y fecha de última cita; cliente ficticio de Sol ausente en Luna y Boreal | UI y CSV descargados |
| CSV | Descarga real de clientes Sol, estadísticas Sol y clientes Boreal; apertura y análisis CSV UTF-8 válidos | Tres archivos `qa-browser-*.csv` |
| Configuración | Alta de responsables/sedes en Sol y Boreal, parámetros guardados en Sol; servicio nuevo y horario de lunes 08:00–20:00 en Boreal, con resumen actualizado | UI + suite HTTP de 31 controles de administración |
| Usuarios y roles | Directorio, roles y consulta de permisos visibles. Cambio del propio rol rechazado. Admin/supervisor/colaborador y accesos ajenos probados por HTTP | Suite remota + prueba local de cambio de empresa (19 aserciones) |
| Concurrencia de roles | Dos administradores se intentan degradar simultáneamente: un cambio aplicado, el otro denegado; queda un administrador y una auditoría | 7 aserciones remotas y 7 locales |
| Multiempresa | Crear Boreal desde UI, cambiar a ella, configurar servicio/responsable/sede y reservar; volver a Sol. Boreal comienza sin datos ajenos | Empresa `3db4e6fd-12c2-4f02-8fb9-de9ae5f116c7` |
| Aislamiento de reservas | Sol y Boreal pueden reservar el mismo 16/11/2026 a las 12:00 con sus propios recursos. Sus clientes, servicios y citas siguen separados | Dos citas persistidas con distintos `company_id`; CSV independientes |

## Conteos verificables de suites

| Suite | Transporte | Aserciones aprobadas |
|---|---|---:|
| Autenticación y reservas | HTTPS Vercel QA | 41 |
| Administración, recursos y configuración | HTTPS Vercel QA | 31 |
| Concurrencia de administradores | HTTPS Vercel QA | 7 |
| **Total remoto** | | **79** |
| Activación segura | Next.js local con Neon QA | 18 |
| Cambio autorizado de empresa | Next.js local con Neon QA | 19 |
| Concurrencia de administradores | Next.js local con Neon QA | 7 |

Los resultados locales no se suman al total remoto. Los recorridos del navegador se describen por operación, sin inventar un conteo de aserciones automatizadas. Las suites de 41 y 31 validaron el commit `b8a86ebc0954eb4f17208cb5e985cae23a15defb`; la concurrencia remota validó `01bdfe00b6ea0f1ec5ea2a0765b93d17582f9bba`. Las modificaciones posteriores son reparaciones CSS y evidencia; no se atribuye una repetición completa de las suites al último commit.

## CSV descargados

- `qa-browser-clientes-sol.csv`: 170 bytes, seis columnas, un cliente ficticio de Sol y una cita.
- `qa-browser-estadisticas-sol.csv`: 279 bytes. En el momento de la descarga: dos citas, una pendiente y una reprogramada; totales por mes, responsable y sede coinciden con la UI. Después se canceló y reactivó la cita visual, que quedó confirmada; el archivo conserva correctamente el estado del momento de exportación.
- `qa-browser-clientes-boreal.csv`: 176 bytes, un cliente ficticio de Boreal y una cita; no contiene el cliente de Sol.

## Responsive y conservación visual

Se conservaron sin cambios frente a `fe3be055`:

- `styles/globals.css`: 12.701 bytes, SHA-256 `7d7332cc65bbfdfba2edd839861666c1eed14abf113749224c46d841b2557198`.
- `styles/logo-fix.css`: 2.094 bytes, SHA-256 `c9a7002331032668b60a5ccbec7192c52f2c025125d9c654d2155dc66bcc6d79`.
- CSS global del motor: 11.805 bytes, SHA-256 `d968d8f7aff8a37bd95f24ca6924dac2bce1b10f34b15fba63c1734bc38dae79`.

Se añadió `styles/agenda-qa-responsive.css`, limitado a pantallas de hasta 820/700 px y a la interfaz integrada. Corrige el mínimo automático del grid de meses, evita que tablas y correos ensanchen la página, permite acomodar controles y tarjetas, limita selectores y hace legibles los nombres del menú móvil. No reemplaza el prototipo, el motor ni los estilos de escritorio.

El comprobador `/eross-qa-responsive?width=360|390|768` carga mediante iframe la página aprobada real. No contiene otra implementación de la agenda. Su ruta está restringida al entorno QA.

Resultados observados antes de la pausa:

| Pantalla | Ancho del contenido / scrollWidth | Resultado |
|---|---|---|
| Mes 390 px | 373 / 373 | Desbordamiento inicial de 1.216 px corregido; calendario contenido |
| Usuarios 390 px | 373 / 373 | Correos largos y selectores contenidos; menú legible |
| Configuración 390 px | 373 / 373 | Controles accesibles sin desbordamiento global |
| Lista 390 px | 388 / 388 | Tabla de 610 px se desplaza dentro de su panel |
| Clientes 360 px | 358 / 358 | Tabla de 950 px contenida en su propio panel |
| Dashboard 360 px | 343 / 343 | Tarjetas y bienvenida contenidas |
| Estadísticas 360 px | 343 / 343 | Tarjetas contenidas tras corregir sus mínimos |
| Disponibilidad 360 px | 343 / 343 | Sin desbordamiento global |
| Mes 768 px | 751 / 751 | Calendario contenido |

También se abrieron Semana y Día en móvil, se consultó el formulario y el historial, y se guardó una nota desde 390 px; la nota reaparece en escritorio y Neon QA. La tabla semanal mantiene desplazamiento interior para sus siete columnas.

### Cierre autenticado de los dos pendientes móviles

| Verificación | Acciones y resultado | Medidas a 360 px |
|---|---|---|
| Selector y cambio seguro de empresa | Selector limitado a las tres membresías autorizadas: Boreal, Luna y Sol. Elegir Luna deja Sol activa hasta pulsar “Cambiar de empresa”. El cambio abre el dashboard de Luna con tres citas (una confirmada, una pendiente, una cancelada). El retorno abre Sol con dos citas (una confirmada, una pendiente, ninguna cancelada), conservando la sesión | Página 343 / 343 px; selector 197 px, límites horizontales 107–306 px |
| Controles y navegación semanal | “Semana siguiente” cambia 05–11/10 a 12–18/10; “Semana anterior” restaura 05–11/10. El campo de fecha operado con teclado nativo abre 16–22/11 y muestra la cita de Sol a las 12:00. Ambos botones caben en la tarjeta. El desplazamiento horizontal interno alcanza sábado/domingo y vuelve al inicio | Página 343 / 343 px; barra 191 / 191 px, límites 111–302 px; columnas 191 / 1.028 px, desplazamiento interno 0 → 837 → 0 |

No fueron necesarias nuevas correcciones: las reparaciones existentes funcionan. No se repitieron las 79 pruebas. Esta comprobación responsive utiliza la página aprobada real dentro del iframe QA, sin sustitución de interfaz; no constituye certificación de hardware iOS/Android.

Capturas autenticadas del cierre:

- [Selector de empresa, Luna elegida y Sol todavía activa](qa-mobile-company-360-20261011.jpg).
- [Dashboard de Luna después del cambio autorizado](qa-mobile-company-luna-360-20261011.jpg).
- [Semana y controles contenidos, cita de Sol](qa-mobile-week-360-20261011.jpg).
- [Desplazamiento interior hasta sábado y domingo](qa-mobile-week-scroll-360-20261011.jpg).
- [Registro estructurado del cierre y huellas de las capturas](qa-mobile-final-evidence-2026-10-11.json).

## Seguridad y errores corregidos

Además de los arreglos anteriores de UUID, márgenes, rangos reservados, bloqueo nocturno, reactivación, recordatorio cero, configuración transaccional y CSV seguro, este bloque añadió:

1. Activación de identidades QA sin sobrescribir contraseñas existentes: invitación hash de un solo uso, vencimiento, contraseña scrypt y sesión HttpOnly/Secure/SameSite=Strict. El usuario completó su propia activación.
2. Cambio de empresa autenticado, únicamente entre membresías vigentes; el servidor vuelve a resolver el rol y renueva la sesión. Al cambiar, la interfaz se recarga para descartar datos de la empresa anterior.
3. Resumen de configuración actualizado después de guardar recursos, servicios y horarios.
4. Mutaciones de rol serializadas por empresa con bloqueo transaccional y revalidación del administrador dentro de la operación. La carrera remota devolvió 200/403, dejó un administrador y registró una sola auditoría.
5. Validación estricta de UUID en cambios de rol: identificador de guiones rechazado con 400.
6. Reparaciones responsive descritas arriba.

Las empresas originales no tenían buzones de correo configurados. `qa-sol@eross.invalid` y `qa-luna@eross.invalid` son identificadores de acceso heredados, no correos receptores. No se cambiaron sus contraseñas. La identidad de aceptación es `ecd0a759-9d86-40bd-9f49-edc97ac2f08f`; su permiso de provisión se configuró únicamente en el proyecto Vercel QA. Los accesos temporales creados para pruebas HTTP se revocaron al terminar; no se desactivó la protección de despliegues.

## Evidencias y continuidad

- `qa-flow-evidence-1791649451523.json`: 41 controles remotos.
- `qa-admin-evidence-2026-10-10.json`: 31 controles remotos.
- `qa-role-race-remote-evidence-2026-10-10.json`: 7 controles remotos.
- `qa-activation-evidence-2026-10-10.json`: 18 controles locales.
- `qa-switch-evidence-2026-10-10.json`: 19 controles locales.
- `qa-role-race-evidence-2026-10-10.json`: 7 controles locales.
- `qa-design-source-evidence-2026-10-10.json`: comparación de estilos base.
- `qa-browser-evidence-2026-10-10.json`: operaciones de navegador y verificaciones de continuidad.
- Tres CSV reales de navegador indicados arriba.

Compilación completa local de Next.js 14.2.35 aprobada para la primera reparación responsive y permisos. Las compilaciones Vercel posteriores también finalizaron. Los errores locales ENOTEMPTY de `.next/export` se resolvieron compilando una copia temporal limpia; no se alteró la aplicación para ocultarlos.

## Entrega para aprobación del usuario

Las dos comprobaciones pendientes quedan cerradas. La página QA aprobada queda abierta con sesión de QA Empresa Sol, lista para la revisión visual final del usuario. Para revisar móvil, el comprobador QA está en https://eross-agenda-qa.vercel.app/eross-qa-responsive?width=360 y carga la misma aplicación.

Persisten los límites previamente documentados: no se certificó entrega externa de WhatsApp/SMS/correos (las citas visuales usan “Ninguno” y recordatorio cero); los permisos individuales editables están fuera del módulo activo, y los permisos efectivos probados son por rol. Tampoco se declara equivalencia píxel a píxel sin una captura aprobada de referencia ni pruebas en dispositivos físicos.

**Aceptación de las dos verificaciones móviles: aprobada. Entrega QA: lista para revisión visual final. Aprobación comercial y promoción a producción: pendientes de la decisión del usuario; no realizadas.**
