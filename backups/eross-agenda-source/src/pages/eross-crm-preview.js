
import {useMemo,useState} from "react";

const NAV=["Dashboard","Agenda","Clientes","Estadísticas","Empresas","Usuarios","Configuración"];
const SOURCES=["Meta Ads","Instagram","Facebook","WhatsApp","TikTok","LinkedIn","Web","Referido","Cliente externo","Manual / Otro"];
const STAGES=["Nuevo","Contactado","En seguimiento","Cita / Gestión","Negociación","Convertido","Perdido"];
const SEGMENTS=["Prospecto","Cliente","Cliente recurrente","VIP"];
const TAGS=["VIP","Hot Lead","Recurrente","Empresa","Alta prioridad","Referido","Meta Ads","Contenido","Externo","Frío"];
const HOURS=["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const USERS=["Laura","Antony","Carlos","María","Sin asignar"];
const TODAY="2026-10-06";

const seedLeads=[
{id:1,name:"María Fernández",phone:"8888-1020",email:"maria@email.com",source:"Instagram",stage:"En seguimiento",owner:"Laura",segment:"VIP",tags:["VIP","Hot Lead"],date:"2026-10-05",next:"Llamar hoy 3:00 p. m.",notes:"Interesada en paquete mensual de redes."},
{id:2,name:"Carlos Méndez",phone:"8701-2240",email:"carlos@empresa.cr",source:"LinkedIn",stage:"Negociación",owner:"Antony",segment:"Cliente",tags:["Empresa","Alta prioridad"],date:"2026-10-04",next:"Enviar propuesta",notes:"Pyme de servicios B2B."},
{id:3,name:"Ana Rodríguez",phone:"8300-9081",email:"ana@email.com",source:"TikTok",stage:"Nuevo",owner:"Laura",segment:"Prospecto",tags:["Contenido"],date:"2026-10-06",next:"Primer contacto",notes:"Llegó por contenido orgánico."},
{id:4,name:"Sofía Rojas",phone:"7012-9921",email:"sofia@email.com",source:"WhatsApp",stage:"Contactado",owner:"Laura",segment:"Prospecto",tags:["Referido"],date:"2026-10-03",next:"Seguimiento mañana",notes:"Pidió información de pauta."},
{id:5,name:"Diego Salas",phone:"8811-4455",email:"diego@negocio.cr",source:"Meta Ads",stage:"Cita / Gestión",owner:"Antony",segment:"Cliente recurrente",tags:["Recurrente","Meta Ads"],date:"2026-10-02",next:"Reunión 9 oct",notes:"Campaña activa; revisar CPL."},
{id:6,name:"Valeria Gómez",phone:"8990-3004",email:"valeria@email.com",source:"Facebook",stage:"Convertido",owner:"Antony",segment:"VIP",tags:["VIP","Recurrente"],date:"2026-09-29",next:"Onboarding",notes:"Servicio contratado."},
{id:7,name:"Marco Solís",phone:"8600-5550",email:"marco@email.com",source:"Cliente externo",stage:"En seguimiento",owner:"Laura",segment:"Cliente",tags:["Externo"],date:"2026-10-01",next:"Enviar caso de éxito",notes:"Contacto fuera de campañas."}
];

const seedAppts=[
{id:101,leadId:1,date:"2026-10-06",time:"09:00",name:"María Fernández",owner:"Laura",type:"Seguimiento comercial",status:"Confirmada"},
{id:102,leadId:5,date:"2026-10-09",time:"10:00",name:"Diego Salas",owner:"Antony",type:"Reunión",status:"Pendiente"},
{id:103,leadId:2,date:"2026-10-12",time:"13:00",name:"Carlos Méndez",owner:"Antony",type:"Presentación",status:"Confirmada"},
{id:104,leadId:6,date:"2026-10-15",time:"11:00",name:"Valeria Gómez",owner:"Antony",type:"Seguimiento",status:"Atendida"}
];

function fmtDate(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d,12).toLocaleDateString("es-CR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
function stageClass(s){if(s==="Convertido"||s==="Atendida"||s==="Confirmada")return"green";if(s==="Perdido"||s==="No asistió")return"red";if(s==="Nuevo"||s==="Contactado")return"blue";return"amber"}
function initials(n){return n.split(" ").map(x=>x[0]).slice(0,2).join("")}

export default function ErossCRMPreview(){
 const[section,setSection]=useState("Clientes");
 const[leads,setLeads]=useState(seedLeads);
 const[appointments,setAppointments]=useState(seedAppts);
 const[events,setEvents]=useState([
  {id:1,type:"lead_created",text:"Ana Rodríguez · TikTok",when:"Hoy"},
  {id:2,type:"appointment_scheduled",text:"María Fernández · 6 oct 09:00",when:"Hoy"}
 ]);
 const[apptModal,setApptModal]=useState(null);
 const[followModal,setFollowModal]=useState(null);

 function emit(type,text){setEvents(e=>[{id:Date.now(),type,text,when:"Ahora"},...e])}
 function openAppointment(lead=null,date=TODAY,time="09:00"){
   setSection("Agenda");
   setApptModal({mode:lead?"existing":"existing",leadId:lead?String(lead.id):"",date,time,owner:lead?.owner||"Laura",type:"Seguimiento comercial",status:"Pendiente",newName:"",newPhone:"",newEmail:"",newSource:"Instagram"});
 }
 function saveAppointment(form){
   let lead=null;
   if(form.mode==="new"){
     const phone=form.newPhone.trim(), email=form.newEmail.trim().toLowerCase();
     lead=leads.find(l=>(phone&&l.phone===phone)||(email&&l.email.toLowerCase()===email));
     if(!lead){
       lead={id:Date.now(),name:form.newName,phone:form.newPhone,email:form.newEmail,source:form.newSource,stage:"Cita / Gestión",owner:form.owner,segment:"Prospecto",tags:[],date:TODAY,next:"Cita "+form.date+" "+form.time,notes:"Creado desde Agenda."};
       setLeads(ls=>[lead,...ls]);
       emit("lead_created",lead.name+" · "+lead.source);
     }
   }else{
     lead=leads.find(l=>String(l.id)===String(form.leadId));
   }
   if(!lead)return;
   const ap={id:Date.now()+1,leadId:lead.id,date:form.date,time:form.time,name:lead.name,owner:form.owner,type:form.type,status:form.status};
   setAppointments(a=>[...a,ap]);
   setLeads(ls=>ls.map(l=>l.id===lead.id?{...l,stage:l.stage==="Convertido"?l.stage:"Cita / Gestión",owner:form.owner,next:"Cita "+form.date+" "+form.time}:l));
   emit("appointment_scheduled",lead.name+" · "+form.date+" "+form.time);
   setApptModal(null);
 }
 function saveFollow(form){
   setLeads(ls=>ls.map(l=>l.id===form.id?{...l,stage:"En seguimiento",next:form.next,notes:(l.notes?l.notes+"\n":"")+form.note}:l));
   emit("followup_created",form.name+" · "+form.next);
   setFollowModal(null);
 }
 return <div className="app">
  <Sidebar section={section} setSection={setSection}/>
  <main>
   <Top section={section}/>
   {section==="Clientes"&&<Clients leads={leads} setLeads={setLeads} onAgenda={openAppointment} onFollow={setFollowModal} emit={emit}/>}
   {section==="Agenda"&&<Agenda leads={leads} appointments={appointments} onNew={openAppointment}/>}
   {section==="Dashboard"&&<Dashboard leads={leads} appointments={appointments} events={events}/>}
   {section==="Configuración"&&<Settings events={events}/>}
   {!["Clientes","Agenda","Dashboard","Configuración"].includes(section)&&<Placeholder section={section}/>}
  </main>
  {apptModal&&<AppointmentModal form={apptModal} setForm={setApptModal} leads={leads} onSave={saveAppointment} onClose={()=>setApptModal(null)}/>}
  {followModal&&<FollowModal lead={followModal} onSave={saveFollow} onClose={()=>setFollowModal(null)}/>}
  <style jsx global>{css}</style>
 </div>
}

function Sidebar({section,setSection}){return <aside className="side">
 <div className="brand"><div className="mark">E</div><div><b>EROSS</b><small>CONSULTING</small></div></div>
 <div className="user"><span>JP</span><div><b>EROSS</b><small>Superadministrador</small></div></div>
 <nav>{NAV.map(x=><button key={x} className={section===x?"active":""} onClick={()=>setSection(x)}><i></i>{x}</button>)}</nav>
 <div className="oper"><i></i>Plataforma operativa<small>EROSS CRM · Preview</small></div>
 </aside>}

function Top({section}){const copy={Dashboard:"Resumen ejecutivo del embudo comercial.",Agenda:"Citas y gestiones vinculadas a clientes.",Clientes:"Prospectos y clientes captados desde cualquier canal.",Estadísticas:"Rendimiento comercial y conversión.",Empresas:"Administración multiempresa.",Usuarios:"Usuarios, responsables, roles y permisos.",Configuración:"Personalización e integraciones de EROSS."};return <header><div><small>EROSS OS / {section.toUpperCase()}</small><h1>{section}</h1><p>{copy[section]}</p></div><div className="profile"><b>JP</b><span>prado@erosscr.com</span></div></header>}

function Clients({leads,onAgenda,onFollow,emit}){
 const[q,setQ]=useState(""),[source,setSource]=useState("Todos"),[stage,setStage]=useState("Todos"),[owner,setOwner]=useState("Todos"),[segment,setSegment]=useState("Todos"),[tag,setTag]=useState("Todas"),[sel,setSel]=useState(leads[0]?.id),[newLead,setNewLead]=useState(false);
 const rows=useMemo(()=>leads.filter(l=>{
   const text=(l.name+" "+l.phone+" "+l.email+" "+l.tags.join(" ")).toLowerCase();
   return(!q||text.includes(q.toLowerCase()))&&(source==="Todos"||l.source===source)&&(stage==="Todos"||l.stage===stage)&&(owner==="Todos"||l.owner===owner)&&(segment==="Todos"||l.segment===segment)&&(tag==="Todas"||l.tags.includes(tag))
 }),[leads,q,source,stage,owner,segment,tag]);
 const lead=leads.find(l=>l.id===sel)||rows[0];
 return <>
 <div className="kpis"><K title="Prospectos / clientes" value={leads.length} sub="Base demo"/><K title="Hot Leads" value={leads.filter(l=>l.tags.includes("Hot Lead")).length} sub="Prioridad"/><K title="VIP" value={leads.filter(l=>l.segment==="VIP").length} sub="Segmento"/><K title="Convertidos" value={leads.filter(l=>l.stage==="Convertido").length} sub="Etapa"/></div>
 <section className="panel">
  <div className="panelTop"><div><small>CRM / LEADS</small><h2>Clientes y prospectos</h2><p>Origen, etapa, responsable, segmento y etiquetas en una sola ficha.</p></div><button className="primary" onClick={()=>setNewLead(true)}>+ Nuevo lead</button></div>
  <div className="filters">
   <label className="wide">Buscar<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nombre, teléfono, correo o etiqueta..."/></label>
   <Filter title="Origen" value={source} set={setSource} options={["Todos",...SOURCES]}/>
   <Filter title="Etapa" value={stage} set={setStage} options={["Todos",...STAGES]}/>
   <Filter title="Responsable" value={owner} set={setOwner} options={["Todos",...USERS]}/>
   <Filter title="Segmento" value={segment} set={setSegment} options={["Todos",...SEGMENTS]}/>
   <Filter title="Etiqueta" value={tag} set={setTag} options={["Todas",...TAGS]}/>
  </div>
  <div className="clientGrid">
   <div className="leadList"><div className="listHead"><b>{rows.length} resultados</b><span>Clic para abrir ficha</span></div>
   {rows.map(l=><button className={"leadRow "+(lead?.id===l.id?"selected":"")} key={l.id} onClick={()=>setSel(l.id)}>
     <div className="avatar">{initials(l.name)}</div><div className="leadBody"><div><b>{l.name}</b><span className={"pill "+stageClass(l.stage)}>{l.stage}</span></div><small>{l.phone} · {l.email}</small><div className="tags">{l.tags.map(t=><span key={t}>{t}</span>)}</div></div><div className="meta"><b>{l.source}</b><span>{l.owner}</span></div>
   </button>)}</div>
   {lead&&<aside className="detail">
    <div className="detailHead"><div className="bigAvatar">{initials(lead.name)}</div><div><small>FICHA DEL CLIENTE</small><h3>{lead.name}</h3><span>{lead.segment}</span></div></div>
    <div className="status"><span className={"pill "+stageClass(lead.stage)}>{lead.stage}</span><b>{lead.owner}</b></div>
    <Block title="CONTACTO"><p>{lead.phone}</p><p>{lead.email}</p></Block>
    <div className="pair"><div><small>Origen</small><b>{lead.source}</b></div><div><small>Ingreso</small><b>{lead.date}</b></div></div>
    <Block title="ETIQUETAS"><div className="tags big">{lead.tags.map(t=><span key={t}>{t}</span>)}</div></Block>
    <div className="next"><small>PRÓXIMA ACCIÓN</small><b>{lead.next}</b></div>
    <Block title="NOTAS"><p className="pre">{lead.notes}</p></Block>
    <div className="detailActions"><button onClick={()=>onFollow(lead)}>+ Seguimiento</button><button className="blueBtn" onClick={()=>onAgenda(lead)}>Agendar</button></div>
   </aside>}
  </div>
 </section>
 {newLead&&<NewLead leads={leads} onClose={()=>setNewLead(false)} onSave={(l)=>{emit("lead_created",l.name+" · "+l.source);location.reload?null:null;setNewLead(false);window.__noop=1}}/>}
 </>;
}

function Agenda({leads,appointments,onNew}){
 const[view,setView]=useState("Mes"),[selected,setSelected]=useState(TODAY),[owner,setOwner]=useState("Todos");
 const list=appointments.filter(a=>owner==="Todos"||a.owner===owner);
 const day=list.filter(a=>a.date===selected).sort((a,b)=>a.time.localeCompare(b.time));
 const days=Array.from({length:31},(_,i)=>i+1);
 return <>
  <div className="kpis"><K title="Gestiones del mes" value={list.length} sub="Octubre 2026"/><K title="Confirmadas / atendidas" value={list.filter(a=>["Confirmada","Atendida"].includes(a.status)).length} sub="Seguimiento activo"/><K title="Pendientes" value={list.filter(a=>a.status==="Pendiente").length} sub="Requieren gestión"/><K title="Clientes vinculados" value={new Set(list.map(a=>a.leadId)).size} sub="Sin duplicar"/></div>
  <section className="panel">
   <div className="agendaTop"><div><small>AGENDA CRM</small><h2>{view==="Día"?fmtDate(selected):"Octubre 2026"}</h2><p>Cada gestión queda amarrada a la ficha del cliente.</p></div><div className="agendaActions"><div className="tabs">{["Mes","Semana","Día","Lista"].map(v=><button className={view===v?"on":""} onClick={()=>setView(v)} key={v}>{v}</button>)}</div><button className="primary" onClick={()=>onNew(null,selected,"09:00")}>+ Crear gestión</button></div></div>
   <div className="agendaFilter"><label>Responsable<select value={owner} onChange={e=>setOwner(e.target.value)}><option>Todos</option>{USERS.map(u=><option key={u}>{u}</option>)}</select></label><label>Ir a fecha<input type="date" value={selected} onChange={e=>setSelected(e.target.value)}/></label><span>Desde Agenda podés buscar un cliente existente o crear uno nuevo.</span></div>
   {view==="Mes"&&<div className="month"><div className="weekHeader">{["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(x=><b key={x}>{x}</b>)}</div><div className="monthGrid">{[null,null,null,...days].map((d,i)=>d?<button key={i} className={"dayCell "+(selected===`2026-10-${String(d).padStart(2,"0")}`?"sel":"")} onClick={()=>setSelected(`2026-10-${String(d).padStart(2,"0")}`)}><b>{d}</b>{list.filter(a=>a.date===`2026-10-${String(d).padStart(2,"0")}`).slice(0,3).map(a=><span className={stageClass(a.status)} key={a.id}>{a.time} {a.name}</span>)}</button>:<div className="dayCell blank" key={i}/>)}</div></div>}
   {view==="Semana"&&<div className="week">{["2026-10-05","2026-10-06","2026-10-07","2026-10-08","2026-10-09","2026-10-10","2026-10-11"].map(d=><div className="weekDay" key={d}><b>{d.slice(8,10)} oct</b>{list.filter(a=>a.date===d).map(a=><button key={a.id} className={"appt "+stageClass(a.status)} onClick={()=>setSelected(d)}><b>{a.time}</b><span>{a.name}</span><small>{a.owner}</small></button>)}<button className="plusSlot" onClick={()=>onNew(null,d,"09:00")}>+ Gestión</button></div>)}</div>}
   {view==="Día"&&<div className="dayView"><div className="hours">{HOURS.map(h=><b key={h}>{h}</b>)}</div><div>{HOURS.map(h=>{const a=day.find(x=>x.time===h);return <button className="hourRow" key={h} onClick={()=>!a&&onNew(null,selected,h)}>{a?<span className={"appt wideAppt "+stageClass(a.status)}><b>{a.name}</b><small>{a.type} · {a.owner} · {a.status}</small></span>:<small>Disponible · clic para crear gestión</small>}</button>})}</div></div>}
   {view==="Lista"&&<div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Gestión</th><th>Responsable</th><th>Estado</th></tr></thead><tbody>{list.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(a=><tr key={a.id}><td>{a.date}</td><td>{a.time}</td><td><b>{a.name}</b></td><td>{a.type}</td><td>{a.owner}</td><td><span className={"pill "+stageClass(a.status)}>{a.status}</span></td></tr>)}</tbody></table></div>}
  </section>
 </>;
}

function AppointmentModal({form,setForm,leads,onSave,onClose}){
 const duplicate=form.mode==="new"&&leads.find(l=>(form.newPhone&&l.phone===form.newPhone)||(form.newEmail&&l.email.toLowerCase()===form.newEmail.toLowerCase()));
 return <div className="overlay"><form className="modal" onSubmit={e=>{e.preventDefault();onSave(form)}}><button className="x" type="button" onClick={onClose}>×</button><small>NUEVA GESTIÓN</small><h2>Agendar gestión</h2><p>La cita quedará vinculada al cliente y generará el evento <code>appointment_scheduled</code>.</p>
  <div className="switch"><button type="button" className={form.mode==="existing"?"on":""} onClick={()=>setForm({...form,mode:"existing"})}>Cliente existente</button><button type="button" className={form.mode==="new"?"on":""} onClick={()=>setForm({...form,mode:"new"})}>+ Nuevo cliente</button></div>
  {form.mode==="existing"?<label className="full">Cliente<select required value={form.leadId} onChange={e=>setForm({...form,leadId:e.target.value})}><option value="">Seleccionar...</option>{leads.map(l=><option value={l.id} key={l.id}>{l.name} · {l.phone}</option>)}</select></label>:<div className="formgrid">
   <label>Nombre<input required value={form.newName} onChange={e=>setForm({...form,newName:e.target.value})}/></label><label>Teléfono<input value={form.newPhone} onChange={e=>setForm({...form,newPhone:e.target.value})}/></label><label>Correo<input type="email" value={form.newEmail} onChange={e=>setForm({...form,newEmail:e.target.value})}/></label><label>Origen<select value={form.newSource} onChange={e=>setForm({...form,newSource:e.target.value})}>{SOURCES.map(x=><option key={x}>{x}</option>)}</select></label>
  </div>}
  {duplicate&&<div className="dup"><b>Cliente existente detectado:</b> {duplicate.name}. La gestión se ligará a esa ficha y no se creará un duplicado.</div>}
  <div className="formgrid"><label>Fecha<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Hora<input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label><label>Responsable<select value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})}>{USERS.map(u=><option key={u}>{u}</option>)}</select></label><label>Tipo<input value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/></label><label>Estado<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Pendiente</option><option>Confirmada</option><option>Atendida</option><option>No asistió</option></select></label></div>
  <div className="modalFoot"><span>Cliente ↔ Agenda ↔ Evento CRM</span><button className="primary">Guardar gestión</button></div>
 </form></div>
}

function FollowModal({lead,onSave,onClose}){const[next,setNext]=useState(lead.next||""),[note,setNote]=useState("");return <div className="overlay"><form className="modal smallModal" onSubmit={e=>{e.preventDefault();onSave({id:lead.id,name:lead.name,next,note})}}><button className="x" type="button" onClick={onClose}>×</button><small>SEGUIMIENTO</small><h2>{lead.name}</h2><label className="full">Próxima acción<input value={next} onChange={e=>setNext(e.target.value)}/></label><label className="full">Nota<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Resultado de llamada, WhatsApp, reunión..."/></label><div className="modalFoot"><span>Generará <code>followup_created</code></span><button className="primary">Guardar seguimiento</button></div></form></div>}

function NewLead({leads,onClose,onSave}){return <div className="overlay"><div className="modal smallModal"><button className="x" onClick={onClose}>×</button><small>NUEVO LEAD</small><h2>Creación directa</h2><p>En esta preview, la creación completa se demuestra desde <b>Agenda → Crear gestión → + Nuevo cliente</b>, donde además probamos el control de duplicados y el vínculo automático.</p><button className="primary" onClick={onClose}>Entendido</button></div></div>}

function Dashboard({leads,appointments,events}){return <><div className="kpis"><K title="Leads" value={leads.length} sub="Base actual"/><K title="Citas" value={appointments.length} sub="Vinculadas"/><K title="Convertidos" value={leads.filter(l=>l.stage==="Convertido").length} sub="Etapa"/><K title="Eventos CRM" value={events.length} sub="Cola interna"/></div><section className="panel"><div className="panelTop"><div><small>ACTIVIDAD</small><h2>Eventos preparados para integraciones</h2><p>Hoy son internos. Más adelante podrán alimentar Meta CAPI, nuestro CRM, Kommo u otros conectores.</p></div></div><EventList events={events}/></section></>}

function Settings({events}){return <section className="panel settings"><div className="panelTop"><div><small>ARQUITECTURA</small><h2>Integraciones</h2><p>EROSS será el sistema principal. Las plataformas externas reciben o sincronizan eventos.</p></div></div><div className="integrationGrid"><Integration name="Meta Conversions API" desc="Leads, citas, asistencias y ventas" state="Preparado"/><Integration name="EROSS CRM" desc="Pipeline propio, historial y automatizaciones" state="En construcción"/><Integration name="Kommo" desc="Sincronización opcional por cliente" state="Futuro"/><Integration name="WhatsApp" desc="Confirmaciones y seguimiento" state="Futuro"/><Integration name="TikTok / Ads" desc="Señales y atribución futura" state="Futuro"/><Integration name="Webhooks / API" desc="Salida estándar de eventos" state="Preparado"/></div><div className="eventBox"><h3>Eventos base</h3><div className="eventChips">{["lead_created","followup_created","appointment_scheduled","appointment_confirmed","appointment_attended","sale_completed"].map(x=><code key={x}>{x}</code>)}</div><p>No hay ninguna API externa conectada todavía; solo dejamos la arquitectura lista para hacerlo después.</p></div><EventList events={events}/></section>}

function EventList({events}){return <div className="events">{events.map(e=><div key={e.id}><code>{e.type}</code><b>{e.text}</b><span>{e.when}</span></div>)}</div>}
function Integration({name,desc,state}){return <article><span>{state}</span><h3>{name}</h3><p>{desc}</p></article>}
function Placeholder({section}){return <section className="hero"><small>MÓDULO {section.toUpperCase()}</small><h2>{section}</h2><p>La navegación está lista. Este módulo se construirá sobre los mismos clientes, usuarios, eventos y permisos de EROSS.</p></section>}
function Filter({title,value,set,options}){return <label>{title}<select value={value} onChange={e=>set(e.target.value)}>{options.map(x=><option key={x}>{x}</option>)}</select></label>}
function K({title,value,sub}){return <article><span>{title}</span><strong>{value}</strong><small>{sub}</small></article>}
function Block({title,children}){return <div className="block"><small>{title}</small>{children}</div>}

const css=`
:root{--bg:#f5f8fb;--ink:#102033;--line:#dfe7ed;--blue:#0877e9;--gold:#efb536;--green:#20b486;--amber:#e7a62e;--red:#df625b}*{box-sizing:border-box}body{margin:0;background:var(--bg);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink)}button,input,select,textarea{font:inherit}.app{min-height:100vh}.side{position:fixed;inset:0 auto 0 0;width:238px;padding:18px;background:linear-gradient(180deg,#061725,#020d16);color:#fff;display:flex;flex-direction:column}.brand{height:90px;display:flex;align-items:center;gap:10px}.mark{width:54px;height:54px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(135deg,#ffe27a,#dda52e);color:#091725;font-size:33px;font-weight:950}.brand b,.brand small{display:block}.brand b{font-size:25px;color:#f2bd49}.brand small{font-size:8px;letter-spacing:.3em}.user{display:flex;align-items:center;gap:10px;background:#082239;border:1px solid #183b55;padding:11px;border-radius:14px;margin:8px 0 14px}.user>span{width:37px;height:37px;border-radius:50%;display:grid;place-items:center;background:#efb536;color:#081521;font-weight:900}.user b,.user small{display:block}.user small{font-size:9px;color:#9bb1c0}.side nav{display:flex;flex-direction:column;gap:5px}.side nav button{border:0;background:transparent;color:#9fb1c0;text-align:left;border-radius:10px;padding:12px 14px;font-weight:750;display:flex;gap:10px;align-items:center;cursor:pointer}.side nav button i{width:6px;height:6px;border-radius:50%;background:#efb536}.side nav button.active{background:linear-gradient(90deg,#0874e8,#1493ff);color:#fff}.oper{margin-top:auto;font-size:11px;color:#a6b8c5}.oper>i{display:inline-block;width:9px;height:9px;border-radius:50%;background:#2bd69e;margin-right:7px}.oper small{display:block;color:#698296;margin-top:6px}main{margin-left:238px;padding:28px 34px 44px}header{display:flex;justify-content:space-between;align-items:center}header small{font-size:11px;letter-spacing:.14em;color:#8293a1;font-weight:900}header h1{font-size:34px;margin:7px 0 3px}header p{margin:0;color:#738594;font-size:12px}.profile{background:#fff;border:1px solid var(--line);border-radius:999px;padding:10px 14px}.profile b{margin-right:8px}.profile span{font-size:10px;color:#748594}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.kpis article{background:#fff;border:1px solid var(--line);border-radius:15px;padding:16px 18px}.kpis span,.kpis small{display:block;color:#7a8b98}.kpis span{font-size:10px}.kpis strong{display:block;font-size:28px;margin:6px 0}.kpis small{font-size:8px}.panel{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-top:20px}.panelTop,.agendaTop{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;background:#fbfdff;border-bottom:1px solid var(--line)}.panelTop small,.agendaTop small{font-size:8px;color:var(--blue);letter-spacing:.14em;font-weight:900}.panelTop h2,.agendaTop h2{margin:4px 0 2px;font-size:19px}.panelTop p,.agendaTop p{margin:0;color:#7a8b98;font-size:9px}.primary{border:0;background:linear-gradient(135deg,#0870e1,#1193ff);color:#fff;border-radius:11px;padding:12px 17px;font-weight:900;cursor:pointer}.filters{display:grid;grid-template-columns:2.1fr repeat(5,1fr);gap:8px;padding:13px 14px;border-bottom:1px solid var(--line)}.filters label,.agendaFilter label{font-size:8px;color:#647988;font-weight:900}.filters input,.filters select,.agendaFilter input,.agendaFilter select,.modal input,.modal select,.modal textarea{display:block;width:100%;margin-top:4px;padding:9px 10px;border:1px solid #d8e2e9;border-radius:8px;background:#fff;font-size:9px}.clientGrid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.75fr);min-height:590px}.leadList{border-right:1px solid var(--line)}.listHead{display:flex;justify-content:space-between;padding:10px 14px;background:#f8fafc;border-bottom:1px solid var(--line)}.listHead b{font-size:9px}.listHead span{font-size:8px;color:#8495a2}.leadRow{width:100%;border:0;border-bottom:1px solid #edf1f4;background:#fff;padding:13px 14px;display:grid;grid-template-columns:42px 1fr 100px;gap:11px;text-align:left;cursor:pointer}.leadRow:hover,.leadRow.selected{background:#f6fbff}.leadRow.selected{box-shadow:inset 3px 0 0 var(--blue)}.avatar,.bigAvatar{display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,#0b7bea,#2aa7ff);color:#fff;font-weight:900}.avatar{width:42px;height:42px;font-size:11px}.leadBody>div:first-child{display:flex;align-items:center;gap:8px}.leadBody b{font-size:10px}.leadBody>small{display:block;color:#80919d;font-size:8px;margin:3px 0 6px}.tags{display:flex;gap:4px;flex-wrap:wrap}.tags span{background:#edf3f7;border:1px solid #e0e9ef;border-radius:999px;padding:4px 7px;font-size:7px;color:#607584}.meta{text-align:right}.meta b,.meta span{display:block}.meta b{font-size:8px;color:#0b72d7}.meta span{font-size:8px;margin-top:5px}.pill{display:inline-block;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:900}.green{background:#e3f8ef!important;color:#17604b!important}.red{background:#ffe9e6!important;color:#913f38!important}.blue{background:#e8f3ff!important;color:#1464ac!important}.amber{background:#fff1d7!important;color:#80570d!important}.detail{padding:18px;background:#fbfdff}.detailHead{display:flex;align-items:center;gap:11px;padding-bottom:15px;border-bottom:1px solid var(--line)}.bigAvatar{width:52px;height:52px}.detailHead small,.block>small,.pair small,.next small{font-size:7px;letter-spacing:.1em;color:#8394a0;font-weight:900}.detailHead h3{margin:3px 0}.detailHead span{font-size:8px;color:#6d8190}.status{display:flex;justify-content:space-between;padding:13px 0}.status b{font-size:9px}.block{padding:12px 0;border-top:1px solid #e9eef2}.block p{font-size:9px;margin:5px 0;color:#526877}.pre{white-space:pre-line}.pair{display:grid;grid-template-columns:1fr 1fr;padding:12px 0;border-top:1px solid #e9eef2}.pair b{display:block;font-size:9px;margin-top:4px}.next{padding:12px;background:#eef7ff;border:1px solid #d9ebfc;border-radius:12px;margin:5px 0}.next b{display:block;font-size:10px;margin-top:5px;color:#155f9f}.detailActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.detailActions button{border:1px solid #cfe0ef;background:#fff;color:#0877e9;border-radius:9px;padding:10px;font-size:8px;font-weight:900;cursor:pointer}.detailActions .blueBtn{background:#0877e9;color:#fff}.agendaActions{display:flex;gap:10px;align-items:center}.tabs{display:flex;background:#e8eef3;border-radius:10px;padding:3px}.tabs button{border:0;background:transparent;padding:8px 11px;border-radius:8px;font-size:9px;font-weight:800;color:#6c8090}.tabs button.on{background:#fff;color:#0877e9}.agendaFilter{display:flex;align-items:flex-end;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)}.agendaFilter label{width:155px}.agendaFilter>span{margin-left:auto;font-size:8px;color:#7b8d99;padding-bottom:8px}.weekHeader{display:grid;grid-template-columns:repeat(7,1fr);background:#f7f9fb}.weekHeader b{text-align:center;padding:10px;font-size:9px}.monthGrid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:105px}.dayCell{border:0;border-top:1px solid #edf1f4;border-right:1px solid #edf1f4;background:#fff;padding:8px;text-align:left;overflow:hidden}.dayCell>b{display:block;text-align:right;font-size:10px}.dayCell>span{display:block;border-radius:5px;padding:4px;margin-top:4px;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dayCell.sel{box-shadow:inset 0 0 0 2px #0a7cff55;background:#f7fbff}.blank{background:#fafbfc}.week{display:grid;grid-template-columns:repeat(7,1fr);min-height:450px}.weekDay{padding:10px;border-right:1px solid var(--line)}.weekDay>b{display:block;text-align:center;font-size:9px;margin-bottom:8px}.appt{display:block;width:100%;border:0;border-left:3px solid #20b486;border-radius:7px;padding:8px;text-align:left;margin-bottom:7px}.appt b,.appt span,.appt small{display:block}.appt span{font-size:8px;font-weight:800}.appt small{font-size:7px}.plusSlot{width:100%;border:1px dashed #b9cedf;background:#f8fbfe;border-radius:7px;padding:8px;font-size:8px;color:#0877e9}.dayView{display:grid;grid-template-columns:70px 1fr}.hours{display:grid;grid-template-rows:repeat(13,58px);background:#fbfcfd}.hours b{font-size:8px;text-align:right;padding:8px 10px;border-bottom:1px solid var(--line)}.hourRow{display:block;width:100%;height:58px;border:0;border-bottom:1px solid var(--line);background:#fff;text-align:left;padding:5px 12px}.hourRow>small{font-size:8px;color:#a2afb8}.wideAppt{height:46px;padding:7px 10px}.tableWrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:11px 13px;border-bottom:1px solid #edf1f4;text-align:left;font-size:9px}th{background:#f7f9fb;color:#6d8190;font-size:8px}.overlay{position:fixed;inset:0;background:#02101dcc;backdrop-filter:blur(5px);display:grid;place-items:center;z-index:100}.modal{width:min(760px,94vw);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:24px;position:relative}.smallModal{width:min(560px,94vw)}.x{position:absolute;right:18px;top:16px;width:34px;height:34px;border:0;border-radius:50%;background:#edf2f5;font-size:20px}.modal>small{color:#0877e9;font-size:9px;font-weight:900;letter-spacing:.12em}.modal h2{margin:6px 0}.modal p{font-size:10px;color:#718492}.modal code{font-size:8px}.switch{display:flex;background:#edf2f5;border-radius:10px;padding:3px;margin:14px 0}.switch button{flex:1;border:0;background:transparent;border-radius:8px;padding:9px;font-size:9px;font-weight:800}.switch button.on{background:#fff;color:#0877e9}.formgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}.formgrid label,.full{font-size:9px;font-weight:900}.full{display:block;margin:10px 0}.modal textarea{min-height:80px;resize:vertical}.dup{background:#fff4dc;border:1px solid #f0d290;border-radius:10px;padding:10px;font-size:9px;color:#76500a}.modalFoot{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #e8eef2;padding-top:14px;margin-top:14px}.modalFoot>span{font-size:8px;color:#718492}.hero{margin-top:22px;background:linear-gradient(135deg,#071827,#0c2940);color:#fff;border-radius:20px;padding:28px}.hero small{color:#efb536;font-size:9px;font-weight:900}.hero h2{font-size:28px;margin:6px 0}.hero p{color:#afc1ce;font-size:11px}.settings{padding-bottom:18px}.integrationGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;padding:16px}.integrationGrid article{border:1px solid var(--line);border-radius:14px;padding:15px}.integrationGrid article>span{display:inline-block;background:#eef7ff;color:#0877e9;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:900}.integrationGrid h3{font-size:12px;margin:9px 0 4px}.integrationGrid p{margin:0;font-size:8px;color:#7b8d99}.eventBox{margin:0 16px 16px;background:#081a29;color:#fff;border-radius:14px;padding:16px}.eventBox h3{margin:0 0 9px}.eventChips{display:flex;gap:6px;flex-wrap:wrap}.eventChips code{background:#113049;border:1px solid #244b67;border-radius:999px;padding:5px 8px;color:#8fd0ff;font-size:8px}.eventBox p{font-size:8px;color:#9cb1c0;margin:10px 0 0}.events{padding:0 16px}.events>div{display:grid;grid-template-columns:180px 1fr 70px;gap:10px;padding:10px;border-top:1px solid var(--line);align-items:center}.events code{font-size:8px;color:#0877e9}.events b{font-size:9px}.events span{text-align:right;font-size:8px;color:#8394a0}
@media(max-width:1200px){.filters{grid-template-columns:repeat(3,1fr)}.filters .wide{grid-column:span 3}.kpis{grid-template-columns:repeat(2,1fr)}.integrationGrid{grid-template-columns:repeat(2,1fr)}}@media(max-width:950px){.clientGrid{grid-template-columns:1fr}.detail{border-top:1px solid var(--line)}.week{overflow:auto;grid-template-columns:repeat(7,160px)}}
`;
