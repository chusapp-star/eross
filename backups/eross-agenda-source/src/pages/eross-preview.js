
import {useMemo,useState} from "react";

const nav=["Dashboard","Agenda","Clientes","Estadísticas","Empresas","Usuarios","Configuración"];

const initialLeads=[
{id:1,name:"María Fernández",phone:"8888-1020",email:"maria@email.com",source:"Instagram",stage:"En seguimiento",owner:"Laura",segment:"VIP",tags:["VIP","Hot Lead"],date:"2026-10-05",next:"Llamar hoy 3:00 p. m.",notes:"Interesada en paquete mensual de redes."},
{id:2,name:"Carlos Méndez",phone:"8701-2240",email:"carlos@empresa.cr",source:"LinkedIn",stage:"Negociación",owner:"Antony",segment:"Cliente",tags:["Empresa","Alta prioridad"],date:"2026-10-04",next:"Enviar propuesta",notes:"Pyme de servicios B2B."},
{id:3,name:"Ana Rodríguez",phone:"8300-9081",email:"ana@email.com",source:"TikTok",stage:"Nuevo",owner:"Laura",segment:"Prospecto",tags:["Nuevo","Contenido"],date:"2026-10-06",next:"Primer contacto",notes:"Llegó por contenido orgánico."},
{id:4,name:"Sofía Rojas",phone:"7012-9921",email:"sofia@email.com",source:"WhatsApp",stage:"Contactado",owner:"Laura",segment:"Prospecto",tags:["Referido"],date:"2026-10-03",next:"Seguimiento mañana",notes:"Pidió información de pauta."},
{id:5,name:"Diego Salas",phone:"8811-4455",email:"diego@negocio.cr",source:"Meta Ads",stage:"Cita / Gestión",owner:"Antony",segment:"Cliente recurrente",tags:["Recurrente","Meta Ads"],date:"2026-10-02",next:"Reunión 9 oct",notes:"Campaña activa; revisar CPL."},
{id:6,name:"Valeria Gómez",phone:"8990-3004",email:"valeria@email.com",source:"Facebook",stage:"Convertido",owner:"Antony",segment:"VIP",tags:["VIP","Recurrente"],date:"2026-09-29",next:"Onboarding",notes:"Servicio contratado."},
{id:7,name:"Marco Solís",phone:"8600-5550",email:"marco@email.com",source:"Cliente externo",stage:"En seguimiento",owner:"Laura",segment:"Cliente",tags:["Externo"],date:"2026-10-01",next:"Enviar caso de éxito",notes:"Contacto fuera de campañas."},
{id:8,name:"Andrea Mora",phone:"8777-2020",email:"andrea@email.com",source:"Web",stage:"Perdido",owner:"Antony",segment:"Prospecto",tags:["Frío"],date:"2026-09-28",next:"Sin seguimiento",notes:"No respondió después de 3 intentos."}
];

const sources=["Todos","Meta Ads","Instagram","Facebook","WhatsApp","TikTok","LinkedIn","Web","Referido","Cliente externo","Manual / Otro"];
const stages=["Todos","Nuevo","Contactado","En seguimiento","Cita / Gestión","Negociación","Convertido","Perdido"];
const segments=["Todos","Prospecto","Cliente","Cliente recurrente","VIP"];
const tagOptions=["VIP","Hot Lead","Recurrente","Empresa","Alta prioridad","Referido","Meta Ads","Contenido","Externo","Frío"];

export default function ErossPreview(){
 const[section,setSection]=useState("Clientes");
 return <div className="app">
   {section==="Agenda"&&<iframe className="agendaFrame" src="/agenda-preview" title="EROSS Agenda"/>}
   <aside className="side">
     <div className="brand"><div className="mark">E</div><div><b>EROSS</b><small>CONSULTING</small></div></div>
     <div className="user"><span>JP</span><div><b>EROSS</b><small>Superadministrador</small></div></div>
     <nav>{nav.map(function(x){return <button key={x} className={section===x?"active":""} onClick={function(){setSection(x)}}><i></i>{x}</button>})}</nav>
     <div className="oper"><i></i>Plataforma operativa<small>EROSS · Preview</small></div>
   </aside>

   {section!=="Agenda"&&<main className="module">
     <header><div><small>EROSS OS / {section.toUpperCase()}</small><h1>{section}</h1><p>{copy(section)}</p></div><div className="profile"><b>JP</b><span>prado@erosscr.com</span></div></header>
     {section==="Clientes"?<ClientsModule/>:<Placeholder section={section} setSection={setSection}/>}
   </main>}
   <style jsx global>{css}</style>
 </div>
}

function ClientsModule(){
 const[leads,setLeads]=useState(initialLeads);
 const[q,setQ]=useState("");
 const[source,setSource]=useState("Todos");
 const[stage,setStage]=useState("Todos");
 const[owner,setOwner]=useState("Todos");
 const[segment,setSegment]=useState("Todos");
 const[tag,setTag]=useState("Todas");
 const[selected,setSelected]=useState(initialLeads[0]);
 const[modal,setModal]=useState(false);

 const rows=useMemo(function(){
   return leads.filter(function(l){
     const search=(l.name+" "+l.phone+" "+l.email+" "+l.notes+" "+l.tags.join(" ")).toLowerCase();
     return (!q||search.includes(q.toLowerCase())) &&
       (source==="Todos"||l.source===source) &&
       (stage==="Todos"||l.stage===stage) &&
       (owner==="Todos"||l.owner===owner) &&
       (segment==="Todos"||l.segment===segment) &&
       (tag==="Todas"||l.tags.includes(tag));
   });
 },[leads,q,source,stage,owner,segment,tag]);

 const vip=leads.filter(function(l){return l.segment==="VIP"}).length;
 const hot=leads.filter(function(l){return l.tags.includes("Hot Lead")}).length;
 const converted=leads.filter(function(l){return l.stage==="Convertido"}).length;

 return <>
  <div className="leadKpis">
   <article><span>Prospectos / clientes</span><strong>{leads.length}</strong><small>Base demo actual</small></article>
   <article><span>Hot Leads</span><strong>{hot}</strong><small>Prioridad alta</small></article>
   <article><span>VIP</span><strong>{vip}</strong><small>Segmento especial</small></article>
   <article><span>Convertidos</span><strong>{converted}</strong><small>Etapa comercial</small></article>
  </div>

  <section className="clients">
   <div className="clientTop">
    <div><small>CRM / LEADS</small><h2>Clientes y prospectos</h2><p>Organizá los leads que llegan desde redes, campañas, WhatsApp, web y canales externos.</p></div>
    <button className="primary" onClick={function(){setModal(true)}}>+ Nuevo lead</button>
   </div>

   <div className="filters">
    <label className="search">Buscar<input value={q} onChange={function(e){setQ(e.target.value)}} placeholder="Nombre, teléfono, correo o etiqueta..."/></label>
    <label>Origen<select value={source} onChange={function(e){setSource(e.target.value)}}>{sources.map(function(x){return <option key={x}>{x}</option>})}</select></label>
    <label>Etapa<select value={stage} onChange={function(e){setStage(e.target.value)}}>{stages.map(function(x){return <option key={x}>{x}</option>})}</select></label>
    <label>Responsable<select value={owner} onChange={function(e){setOwner(e.target.value)}}><option>Todos</option><option>Laura</option><option>Antony</option></select></label>
    <label>Segmento<select value={segment} onChange={function(e){setSegment(e.target.value)}}>{segments.map(function(x){return <option key={x}>{x}</option>})}</select></label>
    <label>Etiqueta<select value={tag} onChange={function(e){setTag(e.target.value)}}><option>Todas</option>{tagOptions.map(function(x){return <option key={x}>{x}</option>})}</select></label>
   </div>

   <div className="clientGrid">
    <div className="leadList">
     <div className="leadListHead"><b>{rows.length} resultados</b><span>Origen · etapa · responsable · etiquetas</span></div>
     {rows.map(function(l){return <button key={l.id} className={"leadRow "+(selected&&selected.id===l.id?"sel":"")} onClick={function(){setSelected(l)}}>
       <div className="avatar">{l.name.split(" ").map(function(x){return x[0]}).slice(0,2).join("")}</div>
       <div className="leadMain"><div className="leadName"><b>{l.name}</b><span className={"stage "+stageClass(l.stage)}>{l.stage}</span></div><small>{l.phone} · {l.email}</small><div className="tags">{l.tags.map(function(t){return <span key={t}>{t}</span>})}</div></div>
       <div className="leadMeta"><b>{l.source}</b><span>{l.owner}</span><small>{l.date}</small></div>
     </button>})}
     {rows.length===0&&<div className="empty">No hay leads con esos filtros.</div>}
    </div>

    <LeadDetail lead={selected}/>
   </div>
  </section>

  {modal&&<NewLead onClose={function(){setModal(false)}} onSave={function(l){const next={id:Date.now(),...l};setLeads([next].concat(leads));setSelected(next);setModal(false)}}/>}
 </>;
}

function LeadDetail({lead}){
 if(!lead)return <aside className="detail"><div className="empty">Seleccioná un lead.</div></aside>;
 return <aside className="detail">
  <div className="detailHead"><div className="bigAvatar">{lead.name.split(" ").map(function(x){return x[0]}).slice(0,2).join("")}</div><div><small>FICHA DEL LEAD</small><h3>{lead.name}</h3><span>{lead.segment}</span></div></div>
  <div className="statusLine"><span className={"stage "+stageClass(lead.stage)}>{lead.stage}</span><b>{lead.owner}</b></div>
  <div className="detailBlock"><small>CONTACTO</small><p>{lead.phone}</p><p>{lead.email}</p></div>
  <div className="detailPair"><div><small>Origen</small><b>{lead.source}</b></div><div><small>Ingreso</small><b>{lead.date}</b></div></div>
  <div className="detailBlock"><small>ETIQUETAS</small><div className="tags large">{lead.tags.map(function(t){return <span key={t}>{t}</span>})}</div></div>
  <div className="next"><small>PRÓXIMA ACCIÓN</small><b>{lead.next}</b></div>
  <div className="detailBlock"><small>NOTAS</small><p>{lead.notes}</p></div>
  <div className="detailActions"><button>+ Seguimiento</button><button>Agendar</button></div>
 </aside>
}

function NewLead({onClose,onSave}){
 const[form,setForm]=useState({name:"",phone:"",email:"",source:"Instagram",stage:"Nuevo",owner:"Laura",segment:"Prospecto",tags:[],date:"2026-10-06",next:"Primer contacto",notes:""});
 function toggleTag(t){setForm({...form,tags:form.tags.includes(t)?form.tags.filter(function(x){return x!==t}):form.tags.concat([t])})}
 return <div className="overlay"><form className="modal" onSubmit={function(e){e.preventDefault();onSave(form)}}>
  <button type="button" className="x" onClick={onClose}>×</button><small>NUEVO LEAD</small><h2>Agregar prospecto / cliente</h2><p>Podrá venir de redes, pauta, WhatsApp, web o un canal externo.</p>
  <div className="formgrid">
   <label>Nombre<input required value={form.name} onChange={function(e){setForm({...form,name:e.target.value})}} placeholder="Nombre completo"/></label>
   <label>Teléfono<input value={form.phone} onChange={function(e){setForm({...form,phone:e.target.value})}} placeholder="8888-8888"/></label>
   <label>Correo<input type="email" value={form.email} onChange={function(e){setForm({...form,email:e.target.value})}} placeholder="correo@ejemplo.com"/></label>
   <label>Origen<select value={form.source} onChange={function(e){setForm({...form,source:e.target.value})}}>{sources.filter(function(x){return x!=="Todos"}).map(function(x){return <option key={x}>{x}</option>})}</select></label>
   <label>Etapa<select value={form.stage} onChange={function(e){setForm({...form,stage:e.target.value})}}>{stages.filter(function(x){return x!=="Todos"}).map(function(x){return <option key={x}>{x}</option>})}</select></label>
   <label>Responsable<select value={form.owner} onChange={function(e){setForm({...form,owner:e.target.value})}}><option>Laura</option><option>Antony</option></select></label>
   <label>Segmento<select value={form.segment} onChange={function(e){setForm({...form,segment:e.target.value})}}>{segments.filter(function(x){return x!=="Todos"}).map(function(x){return <option key={x}>{x}</option>})}</select></label>
   <label>Próxima acción<input value={form.next} onChange={function(e){setForm({...form,next:e.target.value})}}/></label>
  </div>
  <label className="notesLabel">Notas<textarea value={form.notes} onChange={function(e){setForm({...form,notes:e.target.value})}} placeholder="Contexto del lead, interés, observaciones..."/></label>
  <div className="tagPicker"><b>Etiquetas</b><div>{tagOptions.map(function(t){return <button type="button" key={t} className={form.tags.includes(t)?"on":""} onClick={function(){toggleTag(t)}}>{t}</button>})}</div></div>
  <div className="modalfoot"><span>Las etiquetas pueden combinarse.</span><button className="primary">Guardar lead</button></div>
 </form></div>
}

function Placeholder({section,setSection}){
 return <><section className="hero"><div><small>MÓDULO {section.toUpperCase()}</small><h2>{section}</h2><p>La navegación ya está activa. Esta es la pantalla base sobre la que construiremos el módulo.</p></div><button onClick={function(){setSection("Clientes")}}>Ir a Clientes</button></section><div className="cards">{cards(section).map(function(c,i){return <article key={i}><span>{c[0]}</span><strong>{c[1]}</strong><small>EROSS OS</small></article>})}</div></>;
}

function stageClass(s){if(s==="Convertido")return"green";if(s==="Perdido")return"red";if(s==="Nuevo"||s==="Contactado")return"blue";return"amber"}

function copy(s){
 if(s==="Dashboard")return "Resumen ejecutivo de leads, seguimientos, conversiones y actividad.";
 if(s==="Clientes")return "Base de prospectos y clientes captados desde redes, campañas y otros canales.";
 if(s==="Estadísticas")return "Rendimiento comercial, fuentes de leads, conversión y operación.";
 if(s==="Empresas")return "Administración multiempresa y configuración de clientes EROSS.";
 if(s==="Usuarios")return "Usuarios, responsables, roles y permisos por empresa.";
 return "Preferencias, horarios, módulos, etapas y personalización de cada empresa.";
}

function cards(s){
 const data={
  Dashboard:[["Leads nuevos","—"],["Seguimientos","—"],["Conversiones","—"],["Ventas","—"]],
  Estadísticas:[["Conversión","Por configurar"],["Fuentes","Meta / IG / WA"],["Rendimiento","Por responsable"],["Exportación","CSV / reportes"]],
  Empresas:[["Multiempresa","Base prevista"],["Sucursales","Configurables"],["Branding","Por cliente"],["Módulos","Activables"]],
  Usuarios:[["Roles","Por empresa"],["Permisos","Configurables"],["Responsables","Asignables"],["Auditoría","Prevista"]],
  Configuración:[["Horarios","Por empresa"],["Etapas CRM","Configurables"],["Servicios","Configurables"],["Terminología","Adaptable"]]
 };
 return data[s]||[];
}

const css=`
:root{--bg:#f5f8fb;--ink:#102033;--line:#dfe7ed;--blue:#0877e9;--gold:#efb536;--green:#20b486;--amber:#e7a62e;--red:#df625b}
*{box-sizing:border-box}html,body,#__next{margin:0;width:100%;min-height:100%;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink)}button,input,select,textarea{font:inherit}.app{min-height:100vh}.agendaFrame{position:fixed;inset:0;width:100%;height:100%;border:0;background:var(--bg)}.side{position:fixed;inset:0 auto 0 0;width:238px;padding:18px;background:linear-gradient(180deg,#061725,#020d16);color:#fff;display:flex;flex-direction:column;z-index:50}.brand{height:90px;display:flex;align-items:center;gap:10px}.mark{width:54px;height:54px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(135deg,#ffe27a,#dda52e);color:#091725;font-size:33px;font-weight:950}.brand b,.brand small{display:block}.brand b{font-size:25px;color:#f2bd49}.brand small{font-size:8px;letter-spacing:.3em}.user{display:flex;align-items:center;gap:10px;background:#082239;border:1px solid #183b55;padding:11px;border-radius:14px;margin:8px 0 14px}.user>span{width:37px;height:37px;border-radius:50%;display:grid;place-items:center;background:#efb536;color:#081521;font-weight:900}.user b,.user small{display:block}.user small{font-size:9px;color:#9bb1c0}.side nav{display:flex;flex-direction:column;gap:5px}.side nav button{border:0;background:transparent;color:#9fb1c0;text-align:left;border-radius:10px;padding:12px 14px;font-weight:750;display:flex;gap:10px;align-items:center;cursor:pointer}.side nav button i{width:6px;height:6px;border-radius:50%;background:#efb536}.side nav button.active{background:linear-gradient(90deg,#0874e8,#1493ff);color:#fff}.side nav button:hover:not(.active){background:#0a2235;color:#fff}.oper{margin-top:auto;font-size:11px;color:#a6b8c5}.oper>i{display:inline-block;width:9px;height:9px;border-radius:50%;background:#2bd69e;margin-right:7px}.oper small{display:block;color:#698296;margin-top:6px}
.module{margin-left:238px;min-height:100vh;padding:28px 34px 44px;background:var(--bg);position:relative;z-index:20}header{display:flex;justify-content:space-between;align-items:center}header>div>small{font-size:11px;letter-spacing:.15em;color:#8293a1;font-weight:900}header h1{font-size:34px;margin:7px 0 3px}header p{margin:0;color:#738594;font-size:12px}.profile{background:#fff;border:1px solid var(--line);border-radius:999px;padding:10px 14px}.profile b{margin-right:8px}.profile span{font-size:10px;color:#748594}
.leadKpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.leadKpis article{background:#fff;border:1px solid var(--line);border-radius:15px;padding:16px 18px}.leadKpis span,.leadKpis small{display:block;color:#7a8b98}.leadKpis span{font-size:10px}.leadKpis strong{display:block;font-size:27px;margin:6px 0}.leadKpis small{font-size:8px}
.clients{background:#fff;border:1px solid var(--line);border-radius:19px;overflow:hidden}.clientTop{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;background:#fbfdff;border-bottom:1px solid var(--line)}.clientTop small{font-size:8px;color:var(--blue);letter-spacing:.14em;font-weight:900}.clientTop h2{margin:4px 0 2px;font-size:19px}.clientTop p{margin:0;color:#7a8b98;font-size:9px}.primary{border:0;background:linear-gradient(135deg,#0870e1,#1193ff);color:white;border-radius:11px;padding:12px 17px;font-weight:900;cursor:pointer}
.filters{display:grid;grid-template-columns:2.1fr repeat(5,1fr);gap:8px;padding:13px 14px;border-bottom:1px solid var(--line)}.filters label{font-size:8px;color:#647988;font-weight:900}.filters input,.filters select{display:block;width:100%;margin-top:4px;padding:9px 10px;border:1px solid #d8e2e9;border-radius:8px;background:#fff;font-size:9px}
.clientGrid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.75fr);min-height:580px}.leadList{border-right:1px solid var(--line)}.leadListHead{display:flex;justify-content:space-between;padding:10px 14px;background:#f8fafc;border-bottom:1px solid var(--line)}.leadListHead b{font-size:9px}.leadListHead span{font-size:8px;color:#8495a2}.leadRow{width:100%;border:0;border-bottom:1px solid #edf1f4;background:#fff;padding:13px 14px;display:grid;grid-template-columns:42px 1fr 100px;gap:11px;text-align:left;cursor:pointer}.leadRow:hover,.leadRow.sel{background:#f6fbff}.leadRow.sel{box-shadow:inset 3px 0 0 var(--blue)}.avatar,.bigAvatar{display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,#0b7bea,#2aa7ff);color:#fff;font-weight:900}.avatar{width:42px;height:42px;font-size:11px}.leadName{display:flex;align-items:center;gap:8px}.leadName b{font-size:10px}.leadMain>small{display:block;color:#80919d;font-size:8px;margin:3px 0 6px}.tags{display:flex;gap:4px;flex-wrap:wrap}.tags span{background:#edf3f7;border:1px solid #e0e9ef;border-radius:999px;padding:4px 7px;font-size:7px;color:#607584}.leadMeta{text-align:right}.leadMeta b,.leadMeta span,.leadMeta small{display:block}.leadMeta b{font-size:8px;color:#0b72d7}.leadMeta span{font-size:8px;margin-top:5px}.leadMeta small{font-size:7px;color:#91a1ac;margin-top:4px}.stage{display:inline-block;border-radius:999px;padding:4px 7px;font-size:7px;font-weight:900}.stage.green{background:#e3f8ef;color:#17604b}.stage.red{background:#ffe9e6;color:#913f38}.stage.blue{background:#e8f3ff;color:#1464ac}.stage.amber{background:#fff1d7;color:#80570d}
.detail{padding:18px;background:#fbfdff}.detailHead{display:flex;align-items:center;gap:11px;padding-bottom:15px;border-bottom:1px solid var(--line)}.bigAvatar{width:52px;height:52px;font-size:14px}.detailHead small{font-size:7px;letter-spacing:.12em;color:#8192a0;font-weight:900}.detailHead h3{margin:3px 0;font-size:16px}.detailHead span{font-size:8px;color:#697e8c}.statusLine{display:flex;justify-content:space-between;align-items:center;padding:13px 0}.statusLine b{font-size:9px}.detailBlock{padding:12px 0;border-top:1px solid #e9eef2}.detailBlock small,.detailPair small,.next small{display:block;font-size:7px;letter-spacing:.09em;color:#8394a0;font-weight:900}.detailBlock p{font-size:9px;margin:5px 0;color:#526877}.detailPair{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 0;border-top:1px solid #e9eef2}.detailPair b{display:block;font-size:9px;margin-top:5px}.tags.large{margin-top:7px}.next{background:#eef7ff;border:1px solid #d9ebfc;border-radius:12px;padding:12px;margin:4px 0 12px}.next b{display:block;font-size:10px;margin-top:5px;color:#155f9f}.detailActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.detailActions button{border:1px solid #cfe0ef;background:#fff;color:#0877e9;border-radius:9px;padding:9px;font-size:8px;font-weight:900}.empty{text-align:center;padding:30px;color:#8a9ba7;font-size:10px}
.hero{margin-top:22px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#071827,#0c2940);color:white;border-radius:20px;padding:28px}.hero small{font-size:9px;letter-spacing:.16em;color:#f3bb3d;font-weight:900}.hero h2{font-size:30px;margin:6px 0}.hero p{margin:0;color:#afc1ce;font-size:11px}.hero button{border:0;background:linear-gradient(135deg,#0870e1,#1193ff);color:#fff;border-radius:11px;padding:12px 17px;font-weight:900}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.cards article{background:#fff;border:1px solid var(--line);border-radius:15px;padding:18px}.cards span,.cards small{display:block;color:#7a8b98}.cards strong{display:block;font-size:18px;margin:8px 0}
.overlay{position:fixed;inset:0;background:#02101dcc;backdrop-filter:blur(5px);display:grid;place-items:center;z-index:100}.modal{width:min(760px,94vw);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:24px;position:relative}.x{position:absolute;right:18px;top:16px;width:34px;height:34px;border:0;border-radius:50%;background:#edf2f5;font-size:20px}.modal>small{color:#0877e9;font-size:9px;letter-spacing:.12em;font-weight:900}.modal h2{margin:6px 0}.modal>p{margin:0 0 14px;color:#7c8d99;font-size:10px}.formgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.formgrid label,.notesLabel{font-size:9px;font-weight:900}.formgrid input,.formgrid select,.notesLabel textarea{display:block;width:100%;margin-top:5px;padding:10px;border:1px solid #d7e1e9;border-radius:9px;background:white}.notesLabel{display:block;margin-top:12px}.notesLabel textarea{min-height:70px;resize:vertical}.tagPicker{margin-top:13px}.tagPicker>b{font-size:9px}.tagPicker>div{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.tagPicker button{border:1px solid #d9e3ea;background:#fff;border-radius:999px;padding:6px 9px;font-size:8px}.tagPicker button.on{background:#0877e9;color:#fff;border-color:#0877e9}.modalfoot{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e9eef2;margin-top:17px;padding-top:14px}.modalfoot>span{font-size:8px;color:#7d8e9b}
@media(max-width:1250px){.filters{grid-template-columns:repeat(3,1fr)}.filters .search{grid-column:span 3}.leadKpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:1000px){.clientGrid{grid-template-columns:1fr}.detail{border-top:1px solid var(--line)}.cards{grid-template-columns:repeat(2,1fr)}}
`;
