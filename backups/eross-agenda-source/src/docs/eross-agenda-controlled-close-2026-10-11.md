# EROSS Agenda QA — cierre controlado, 11 de octubre de 2026

Estado: ajustes visuales implementados y comprobados; aceptación final pendiente. No se autoriza producción ni lanzamiento comercial.

## Alcance y recuperación

- Repositorio: chusapp-star/eross. Solo archivos de backups/eross-agenda-source/src.
- Recuperación conservada: 2206db387ead8c435620ceb794a2996917390bce, rama dev/eross-agenda-mobile-final-2026-10-11, despliegue QA dpl_CrsujMYdtSSSzxCBycqFv6gBpVY2. Se confirmó su correspondencia antes de editar.
- Rama independiente: dev/eross-agenda-controlled-close-2026-10-11.
- Commit funcional: 7588b772ec0ce222beee206799e9167d22595191. Despliegue funcional comprobado: dpl_E6ruQm13obDJ1jgisPoJ6SWQzsy8, READY, alias eross-agenda-qa.vercel.app.
- Vercel QA: prj_eCymBxJAiPIs2Bmu1nbVpoJLAxzs. El target denominado production dentro de ESTE proyecto sirve exclusivamente al alias QA; no es Agenda producción.
- Neon QA: soft-lake-14045662 / br-red-smoke-b792oaol / eross_agenda. No se modificaron estructuras ni horarios, autenticación, roles o credenciales. Se conserva el respaldo existente br-frosty-pond-b7kpo3e0; es histórico y no representa los cambios recientes del usuario. No es necesario restaurar la base para revertir estos dos cambios visuales.

## Cambios mínimos

1. styles/agenda-qa-responsive.css: encabezado sticky únicamente hasta 820 px, con botón de menú existente, espacio seguro superior y fondo. Escritorio y logo conservados. Contraste y tamaño de etiquetas mejorados exclusivamente en Semana.
2. components/agenda-time-grid.js: clase específica para Semana, nombre accesible “Crear cita” en espacios realmente disponibles y texto “No reservable” en espacios bloqueados. Reutiliza el formulario y la disponibilidad existentes. No cambia Día, reservas, bloqueos, horarios o API.
3. Este documento de continuidad.

## Comportamientos correctos conservados

- Semana ya abría Nueva cita mediante selección de una celda. Se comprobó antes de modificar.
- Sol tiene actualmente todo el día activado de lunes a sábado; domingo inactivo. Por eso aparecen franjas desde 00:00 y se permite 20:30. Es configuración real del usuario; no se cambió.
- Boreal tiene lunes 08:00–20:00 y los demás días inactivos. A las 19:30 permite una cita de 30 minutos; 20:00 y posteriores no son reservables. Con margen visual de dos horas, el rango termina a las 22:00 sin ampliar disponibilidad.
- Sol se representa hasta 24:00; no existe un límite universal de las 20:00.
- Logo, frase, identidad, Mes, Día, gráficos y ambos exportadores conservados.

## Pruebas ejecutadas

| Prueba | Resultado y evidencia |
| --- | --- |
| Compilación Next.js | npm run build terminó con código 0 |
| Disponibilidad/cuadrícula | qa-timeline-regression.mjs: 15 PASS; pruebas de modelo, no sustituyen navegador |
| Roles, sesión, filtros y empresa | qa-final-read-regression.mjs: 8 PASS con SQL/auth simulados; no se afirma acceso real con otras credenciales |
| Generador XLSX | qa-report-excel-regression.mjs PASS: round-trip, fechas, totales, filtros, encabezados, nombres tipo fórmula y periodo vacío |
| Sesión autenticada | Usuario inició sesión en navegador compartido; acceso Sol admin y recarga de escritorio correctos |
| Menú móvil 390 px | Después de desplazamiento vertical y hasta filas 23:30, encabezado y ☰ permanecieron visibles; abre menú, permite navegar a Empresas y Clientes |
| Nueva cita semanal | Selección de 16/11/2026 19:30 en móvil y escritorio precarga fecha, hora, Reunión QA, QA Responsable Sol y QA Sede Sol |
| Horarios bloqueados | Domingo Sol sin espacios disponibles; Boreal fuera de jornada muestra No reservable, botón deshabilitado |
| Creación extendida | Una cita ficticia nueva creada en Sol 16/11 19:30, Confirmada, sin canal de notificación ni recordatorio |
| Reprogramación | A 20:30, conserva Confirmada y añade Reprogramada. Horario anterior disponible y nuevo ocupado/deshabilitado |
| Historial | Navegador y SQL QA muestran anterior 19:30–20:00, nuevo 20:30–21:00 y actor admin |
| Cinco vistas | Cita reprogramada localizada en Mes, Semana, Día, Lista y Disponibilidad |
| Cancelación | Cancelada conserva Reprogramada/historial; 20:30 vuelve a Disponible. Confirmado por SQL y después de recargar escritorio |
| Cambio multiempresa móvil | Sol → Luna → Boreal → Sol; dashboard 7, 3 y 1 citas respectivamente, coinciden con Neon. Luna muestra sus tres clientes, no el fixture de Sol; Boreal su cita y responsable propios |
| Integridad tenant QA | SQL: 0 clientes de otra empresa, 0 responsables de otra empresa, 0 eventos de otra empresa asociados a citas |
| Reserva ocupada | Celda de cita vigente deshabilitada; no se intentó una segunda reserva mediante API en esta intervención. La protección servidor no se modificó y mantiene las verificaciones previas |
| Aislamiento de ramas | Sintaxis de regla aprobada comprobada con sh: omite solo Preview dev/eross-agenda-*; master, rama web y producción continúan construyendo. Configuración no modificada |

Registro de prueba conservado, sin eliminación: cita 6020ec3f-2693-4d10-9f97-bad67a66497d / cliente “QA Cierre Extendido 1110”. Estado final Cancelada. No se editaron citas o clientes existentes.

## Exportaciones y limitaciones reales

- Escritorio: los intentos de recuperar CSV y XLSX en el navegador compartido devolvieron errores de descarga. Un intento posterior provocó reinicio del controlador de navegador por rechazo de descarga. No hay archivo nuevo recuperado verificable.
- Móvil 390 px: CSV agotó espera de 10 segundos; XLSX devolvió “Download failed”. Estadísticas siguió funcionando, sin error visible de la aplicación. Logs runtime QA consultados para tenant-qa-report no devolvieron registros; esto no prueba éxito HTTP ni identifica la causa.
- El generador XLSX pasó pruebas locales de contenido. Esto NO certifica la descarga extremo a extremo.
- Quedan pendientes la recuperación efectiva y lectura de archivos CSV/XLSX desde navegador actual, y la descarga en iPhone/Android físicos. No se dispone de teléfono físico en este entorno.
- No se ejecutó un nuevo inicio de sesión con colaborador u otro rol. Se conservan pruebas anteriores y se ejecutaron las regresiones de política; credenciales y permisos no se alteraron.
- No se repitieron las 79 pruebas previamente aprobadas. READY no se considera prueba funcional.

## Protección de proyectos excluidos

Lectura de Vercel confirmó sin cambios los proyectos y despliegues conocidos de Agenda producción y los tres Vouchers: dpl_25BA3fHiUhi9PM7HfhjcpTqKaRYa, dpl_XxN6cSGYFPawQHHysYymetuaFPJB, dpl_8QDgVdF4xDvJdkh6zSubru47H5WA y dpl_GaceN4kPg45tAYSU7caUz4eQphVQ. erosscr.com sigue en dpl_4J4LStpsPCdbQxwbx1N2hrKRwZ4f, master f39ab102a38378302b9fadbe6b2315b62875a24a. No se accedió a bases ajenas para escribir y no se modificaron variables, dominios, reglas de Vercel o integraciones.

## Reversión y continuidad

Revertir únicamente los dos archivos visuales a 2206 en esta rama, o volver al despliegue QA de recuperación. No restaurar toda la base de datos: se perderían configuraciones recientes del usuario. Mantener las ramas anteriores, datos e historial.

Entrega para revisión visual en https://eross-agenda-qa.vercel.app/eross-original-integrado-qa. Detener desarrollo tras documentar y publicar esta entrega únicamente en QA. La aprobación definitiva y comercial queda en manos del usuario, después de resolver las limitaciones indicadas.
