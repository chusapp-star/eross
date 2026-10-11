# EROSS Agenda Premium — aceptación de mejoras controladas en QA

Fecha: 11 de octubre de 2026 (UTC). Estado: **entregada para revisión visual del propietario; producción y lanzamiento comercial NO aprobados**.

QA: https://eross-agenda-qa.vercel.app/eross-original-integrado-qa

## Protección y alcance

Se consultaron GitHub, Vercel y Neon antes de escribir código. La rama original `dev/eross-agenda-config-neon-2026-10-08` y el despliegue QA apuntaban efectivamente a `355ef2f11b94583eecbb65281d58fc9397d0d072`; no se tomó como cierto únicamente el informe anterior. Todos los archivos de aplicación recuperados localmente coincidían con sus blobs de GitHub.

| Recurso | Identificación verificada |
|---|---|
| Repositorio | `chusapp-star/eross` (1245120615) |
| Directorio | `backups/eross-agenda-source/src` |
| Base de código | `355ef2f11b94583eecbb65281d58fc9397d0d072` |
| Rama de recuperación, creada antes de editar | `dev/eross-agenda-final-controlled-2026-10-11` |
| Rama de entrega de estas mejoras | `dev/eross-agenda-final-controlled-2026-10-11-validated` |
| Vercel QA | `eross-agenda-qa` / `prj_eCymBxJAiPIs2Bmu1nbVpoJLAxzs` |
| Despliegue inicial QA | `dpl_GyYDX1h9DpQDnETf35AUKpA7dm9Z` |
| Neon QA | proyecto `soft-lake-14045662`, rama `br-red-smoke-b792oaol`, base `eross_agenda` |
| Respaldo recuperable de datos | `br-frosty-pond-b7kpo3e0`, nombre `backup-eross-agenda-qa-355ef2f-20261011`, LSN `0/2381A98` |

Neon rechazó la operación de snapshot para una rama no raíz. Se creó, como alternativa, una **copia completa independiente de la rama QA** y se consultaron sus datos: 19 tablas públicas y los mismos conteos iniciales de citas (21), clientes (16), empresas (18), eventos (54), identidades (31), membresías (35), configuraciones (11), tipos (19) y usuarios (17). La copia permanece separada y sin cambios.

La única migración fue aditiva: `agenda_company_tags_qa`, con catálogo de etiquetas por empresa. No se alteraron columnas ni se eliminaron registros. Comparación final por ID y huella del contenido: **248 registros iniciales de diez tablas permanecen idénticos, sin registros faltantes**. Esas tablas cubren citas, clientes, empresas, usuarios operativos, sedes, tipos, disponibilidad, bloqueos, membresías y configuración de reservas.

Se agregaron exclusivamente una etiqueta y dos clientes/citas ficticios de prueba. Ambas citas se cancelaron mediante la aplicación; sus clientes e historial se conservaron. El intento de reserva duplicada dejó **cero clientes huérfanos**.

No hubo escrituras en EROSS producción, erosscr.com, Medical Óptica Vouchers, Neon principal ni otros proyectos. No se modificaron autenticación, credenciales, roles o permisos. Las bibliotecas de autorización/roles/identidad/multiempresa y el motor de disponibilidad coinciden byte por byte con la versión base. Ambas imágenes del logo también coinciden byte por byte. Los despliegues manuales se dirigieron exclusivamente al ID de Vercel QA; `target: production` es el canal del **proyecto QA**, que contiene sus variables QA existentes, y no el proyecto EROSS de producción. No se modificaron variables ni protecciones de acceso.

## Cambios y commits

| Bloque | Commit | Resultado |
|---|---|---|
| Estadísticas e identidad | `f3a1acc24bc13f49934a914469090d37ce5c1df9` | Reactivación de gráficos originales, reporte real con filtros y CSV; frase debajo del logo |
| Historial y etiquetas | `56acf66587b22185c9406c4fff16c24b44ecfd45` | Estado principal conservado; distintivo e historial de reprogramación; selector múltiple y catálogo por empresa |
| Cuadrícula Día/Semana | `3e8f9c68b67b449c2cfd51abd0d2bbb49d3edf33` | Horarios dinámicos, espacios reservables, bloques de citas, colores y leyenda |
| Corrección móvil | `c0e171e377a9eee7b0a920ded6e306e7f8d46d6f` | Día sin desplazamiento horizontal, controles ajustados, frase sin cortar palabras |
| Distribución de estados | `d3cb8d030eaf83aa148777f7160b6281718d2a3d` | Gráfico original incluye pendientes, canceladas y estado reprogramado heredado |

Último commit de **código funcional probado**: `d3cb8d030eaf83aa148777f7160b6281718d2a3d`, despliegue `dpl_2jpTVAi4wDk1DuCWtdtsGaCY4333`. El commit que incorpora este informe y las evidencias conserva exactamente ese código; su SHA está en la rama de entrega y en el mensaje final. El despliegue final de documentación se comprueba separadamente, sin contar READY como prueba funcional.

Los gráficos `LineChart`, `Donut`, `Funnel` y `RankPanel` se localizaron en la implementación histórica `32a111c31bbb467ce13c4a1ccae270a1bbae999a` y en el archivo original conservado. Se reconectaron a los datos reales de la empresa. No se inventaron ventas ni conversiones monetarias.

Se conservan Mes, Día, Semana, Lista, Disponibilidad, clientes, empresas, usuarios, configuración, tipos por empresa, márgenes, bloqueos y prevención de solapamientos. La cuadrícula se agrega únicamente a las vistas Día/Semana de la agenda autenticada QA, utilizando el motor existente. La selección de todos los responsables/sedes es consulta; reservar exige recursos concretos. Las canceladas siguen consultables y liberan disponibilidad.

Origen, Tipo de cita y Etiquetas son campos separados. Se conservan valores existentes y se ofrecen Meta Ads, Facebook, Instagram, WhatsApp, TikTok, LinkedIn, Web, Referidos, Externo y otros. VIP, Cliente externo y Seguimiento son opciones base; las personalizadas pertenecen a cada empresa. No se sustituyó el esquema existente de eventos/outbox de integración CRM.

Al cambiar fecha u hora en QA se conserva el estado principal y se registra `appointment.rescheduled` con inicio/fin anteriores y nuevos e identidad/rol del actor. El distintivo persiste por el historial y se muestra junto al estado, incluso después de cancelar. Los eventos históricos sin actor o fin anterior lo indican expresamente, sin datos inventados.

## Archivos de aplicación modificados o agregados

- `components/agenda-time-grid.js`
- `components/tenant-configuration-editor.js`
- `components/tenant-tag-settings.js`
- `db/migrations/20261011-company-tags-qa.sql`
- `lib/agenda-timeline.js`
- `lib/agenda-visual.js`
- `pages/_app.js`
- `pages/agenda-master-review.js`
- `pages/api/agenda/appointments.js`
- `pages/api/agenda/bootstrap.js`
- `pages/api/agenda/history.js`
- `pages/api/agenda/tenant-qa-report.js`
- `pages/api/agenda/tenant-qa-tags.js`
- `pages/eross-original-integrado-qa.js`
- `scripts/qa-final-read-regression.mjs`
- `scripts/qa-tags-regression.mjs`
- `scripts/qa-timeline-regression.mjs`
- `styles/agenda-qa-final.css`

También se agregan este informe, el estado inicial y las evidencias de estas mejoras. Los informes históricos se conservan.

## Pruebas ejecutadas

Las 79 pruebas históricas conservan su informe original; **no se repitieron ni se presentan como ejecutadas sobre esta versión nueva**. Las comprobaciones siguientes sí se ejecutaron durante estas mejoras.

| Prueba | Método y evidencia | Resultado |
|---|---|---|
| Acceso autenticado y navegación | Sesión compartida del administrador; recargas de QA y navegación Dashboard, Agenda, Clientes, Estadísticas, Empresas, Usuarios y Configuración | Correcto |
| Estadísticas reales y filtros | Sol inicialmente 3 citas; filtro de responsable reducido a 2; tras dos fixtures total 5, confirmada 1, pendiente 1, canceladas 3, reprogramadas por historial 2 | Correcto |
| CSV de estadísticas | Descarga real del navegador, lectura de CSV; estados y total 5 coherentes, TikTok 1; secciones de mes/día/responsable/sede/origen/tipo | Correcto |
| Creación y etiquetas | Nueva cita `QA Controlado Final 1011`, Confirmada, TikTok, VIP y QA Controlado 1011 | Correcto |
| Reprogramación | 23/11/2026, 09:00→10:00 Costa Rica; estado Confirmada conservado, distintivo Reprogramada, actor Chus QA aceptación | Correcto |
| Persistencia | Recarga, reapertura y consulta Neon de cita y eventos | Correcto |
| Doble reserva | Intento en el mismo responsable/sede/horario; error real de choque; SQL posterior con cero clientes del intento rechazado | Correcto |
| Cancelación | Fixture cancelado, distintivo Cancelada + Reprogramada; horario 10:00 vuelve disponible; eventos conservados | Correcto |
| Crear/editar desde cuadrícula | Clic 17/11/2026 09:00, formulario prellenado; creación `QA Cuadrícula Final 1011`, aparece inmediatamente; clic en bloque, notas editadas y persistentes; cancelación libera celda | Correcto |
| Configuración existente | Carga de zona horaria, intervalos, anticipación, tipos, márgenes, responsables, sedes y jornadas; no se cambiaron valores existentes | Correcto |
| Etiquetas por empresa | Etiqueta creada en Sol; ausente en catálogo Luna; clientes Sol ausentes de Luna | Correcto |
| Aislamiento Sol/Luna/Boreal | Cambios entre empresas autorizadas, encabezado/recursos/clientes propios; Boreal no muestra citas Sol | Correcto |
| Jornada extendida real | Boreal 08:00–20:00 en Día y Semana, espacio 19:30 disponible; Sol 09:00–18:00 | Correcto |
| Administración y permisos | Directorio de cuentas y usuarios operativos; consulta Ver permisos del colaborador; no se cambiaron roles | Correcto |
| Selector móvil 360 px | Sol→Luna→Sol mediante selector nativo y botón; encabezado y clientes cambian a la empresa elegida | Correcto |
| Semana móvil 360 px | Semana siguiente/anterior; acceso al domingo, selección y retorno al lunes; desplazamiento interno 1172 px, contenedor 174 px | Correcto |
| Día móvil 360 px | Día siguiente/anterior, clic libre prellena fecha/hora, clic cita abre detalle; cuadrícula 174/174 px sin desplazamiento horizontal | Correcto |
| Estadísticas/clientes móvil | Datos y filtros accesibles; cuerpo sin desbordamiento horizontal medido | Correcto |
| Logo y motores conservados | Huellas SHA-256 y comparación byte por byte de archivos clave | Correcto |
| Build | Builds completos Next.js durante los bloques, incluidos ambos últimos ajustes; despliegues QA compilaron | Correcto |

Automatizadas, diferenciadas de pruebas contra servicios vivos:

- `scripts/qa-final-read-regression.mjs`: **8** comprobaciones unitarias de sesión ausente/membresía inválida/roles, consulta ligada a empresa, agregación/filtros y fechas inválidas; SQL/autorización simulados.
- `scripts/qa-tags-regression.mjs`: **6** comprobaciones unitarias de catálogo, aislamiento, permiso de escritura, validación y sesión; SQL/autorización simulados.
- `scripts/qa-timeline-regression.mjs`: **12** comprobaciones del modelo sobre el motor real: jornada hasta 22:00, ocupación/cancelación, bloqueos, madrugada/nocturnos, 24 h, cita cruzando medianoche, solapamientos visuales, configuración vacía, filtros y recursos no ambiguos.
- `scripts/qa-availability-check.mjs`: **7** comprobaciones existentes de márgenes, sede, nocturnos y 24 h.

**Total: 33 comprobaciones automatizadas aprobadas**, además de los flujos autenticados de la tabla. No hay una cifra agregada que mezcle estas pruebas con las 79 históricas.

## Evidencias y límites

Carpeta `docs/final-evidence-2026-10-11`: capturas reales de estadísticas, semana de escritorio, día móvil, recorrido semanal móvil, selector móvil y formulario; CSV real `qa-stats-final.csv`. Los JSON `qa-final-read-regression`, `qa-tags-regression`, `qa-timeline-regression`, `qa-final-preserved-files`, `qa-final-export-check` y `qa-final-controlled-evidence` complementan el informe.

Fixtures conservados:

- `12d6406a-51d8-4cca-a597-93de031a9ede`: QA Controlado Final 1011; cancelada, origen TikTok, etiquetas VIP/QA Controlado 1011; historial anterior 15:00–15:30Z y nuevo 16:00–16:30Z, actor `ecd0a759-9d86-40bd-9f49-edc97ac2f08f`.
- `6c73edcb-19d2-4d30-98eb-a166b0bd75e5`: QA Cuadrícula Final 1011; cancelada, 17/11/2026 15:00–15:30Z. No se borraron sus clientes ni eventos.

La sesión autenticada fue suministrada por el propietario. No se repitió el ingreso de contraseña ni se inició sesión de nuevo como supervisor/colaborador: sus restricciones nuevas se comprobaron con pruebas unitarias y sus módulos centrales permanecen idénticos; las pruebas vivas anteriores siguen en su informe histórico. No se enviaron WhatsApp, correos ni SMS: ambos fixtures nuevos usaron canal Ninguno y sin recordatorio. No se probó una integración externa nueva con CRM. La revisión móvil se ejecutó en el contenedor responsive de la aplicación real a 360 px, no en un teléfono físico.

No se recuperaron capturas anteriores de HuliPractice en el contexto disponible. Se implementaron los requisitos funcionales de horas, bloques y acciones sin copiar diseño ni código del proveedor. Se mantuvo el shell aprobado, sus imágenes y módulos. Las mejoras solicitadas cambian deliberadamente estadísticas, Día/Semana y pequeños componentes; no corresponde afirmar igualdad de píxeles en esas áreas nuevas. La revisión visual final es del propietario.

## Recuperación

Código: desplegar manualmente `355ef2f11b94583eecbb65281d58fc9397d0d072` únicamente al proyecto QA identificado. La rama de recuperación permanece en ese commit. Los bloques tienen padres consecutivos y pueden revertirse individualmente dentro de la rama de mejoras.

Datos: la copia Neon `br-frosty-pond-b7kpo3e0` contiene el estado anterior a las mejoras. Una recuperación debe cotejar primero los cambios posteriores y preparar una copia o restauración exclusivamente QA; este trabajo no ha ejecutado reset, borrado, sustitución de conexión ni restauración sobre la rama activa. La tabla adicional no obliga a destruir datos para volver al código base.

**Decisión final: QA preparada para revisión visual de estas mejoras; producción y lanzamiento comercial pendientes de aprobación expresa y de las verificaciones externas que correspondan.**
