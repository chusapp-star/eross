import { useEffect, useMemo, useState } from "react";
import AgendaDatabaseUnified from "./agenda-master-review";

const appointmentsSeed = [
  {id:1,date:"2026-10-05",time:"08:00",name:"María Fernández",branch:"Escazú",staff:"Laura",service:"Examen visual",origin:"Meta Ads",status:"Atendida",sale:189000},
  {id:2,date:"2026-10-05",time:"09:00",name:"Carlos Méndez",branch:"Escazú",staff:"Antony",service:"Adaptación de lentes",origin:"WhatsApp",status:"Confirmada",sale:0},
  {id:3,date:"2026-10-05",time:"10:00",name:"Ana Rodríguez",branch:"Heredia",staff:"Laura",service:"Consulta visual",origin:"Presencial",status:"Pendiente",sale:0},
  {id:4,date:"2026-10-05",time:"11:00",name:"Luis Vargas",branch:"Escazú",staff:"Antony",service:"Entrega de lentes",origin:"Meta Ads",status:"Atendida",sale:245000},
  {id:5,date:"2026-10-04",time:"14:00",name:"Paola Jiménez",branch:"Heredia",staff:"Laura",service:"Examen visual",origin:"Google",status:"No asistió",sale:0},
  {id:6,date:"2026-10-03",time:"15:30",name:"Andrés Mora",branch:"Escazú",staff:"Laura",service:"Examen visual",origin:"WhatsApp",status:"Atendida",sale:99000},
  {id:7,date:"2026-10-02",time:"12:00",name:"Valeria Soto",branch:"Escazú",staff:"Antony",service:"Consulta visual",origin:"Meta Ads",status:"Atendida",sale:149000},
  {id:8,date:"2026-10-01",time:"16:00",name:"Ricardo León",branch:"Heredia",staff:"Laura",service:"Examen visual",origin:"Presencial",status:"Confirmada",sale:0}
];

const clients = [
  {name:"María Fernández",id:"1-1111-1111",contact:"maria@email.com",phone:"8888-1122",age:38,sex:"Femenino",company:"Medical Óptica",branch:"Escazú",reviews:3,last:"05/10/2026",source:"Meta Ads"},
  {name:"Carlos Méndez",id:"2-2222-2222",contact:"carlos@email.com",phone:"8777-0031",age:41,sex:"Masculino",company:"Medical Óptica",branch:"Escazú",reviews:2,last:"05/10/2026",source:"WhatsApp"},
  {name:"Ana Rodríguez",id:"1-3333-3333",contact:"ana@email.com",phone:"8811-9922",age:29,sex:"Femenino",company:"Medical Óptica",branch:"Heredia",reviews:1,last:"05/10/2026",source:"Presencial"},
  {name:"Luis Vargas",id:"3-4444-4444",contact:"luis@email.com",phone:"8700-4400",age:52,sex:"Masculino",company:"Medical Óptica",branch:"Escazú",reviews:4,last:"05/10/2026",source:"Meta Ads"},
  {name:"Paola Jiménez",id:"2-5555-5555",contact:"paola@email.com",phone:"8999-2200",age:34,sex:"Femenino",company:"Medical Óptica",branch:"Heredia",reviews:2,last:"04/10/2026",source:"Google"}
];

const companies = [
  {name:"Medical Óptica",modules:"Agenda + Clientes + CRM + Estadísticas",users:6,status:"Activo"},
  {name:"Demo Estética",modules:"Agenda + Clientes",users:4,status:"Activo"},
  {name:"Demo Servicios",modules:"CRM",users:3,status:"Configuración"}
];

const users = [
  {name:"Jesús Prado",email:"prado@erosscr.com",company:"Todas",role:"Superadmin EROSS"},
  {name:"Laura",email:"laura@demo.com",company:"Medical Óptica",role:"Administrador"},
  {name:"Antony",email:"antony@demo.com",company:"Medical Óptica",role:"Recepción"}
];

const nav = ["Dashboard","Agenda","Clientes","Estadísticas","Empresas","Usuarios","Configuración"];

function Brand({large=false,compact=false}){
  return <div className={"brandCrop "+(large?"large ":"")+(compact?"compact":"")}>
    <img src="/eross-logo.webp" alt="EROSS Consulting"/>
  </div>;
}

export default function Home(){
 const [section,setSection]=useState("Dashboard"),[auth,setAuth]=useState("loading"),[overview,setOverview]=useState(null),[report,setReport]=useState(null),[error,setError]=useState("");
 useEffect(()=>{let live=true;Promise.all([fetch("/api/agenda/tenant-qa-overview",{cache:"no-store"}),fetch("/api/agenda/tenant-qa-report?from=2026-01-01&to=2027-01-01",{cache:"no-store"})]).then(async ([a,b])=>{const [j,r]=await Promise.all([a.json(),b.json()]);if(!a.ok||!b.ok)throw Error(j.error||r.error||"Acceso requerido");if(live){setOverview(j);setReport(r);setAuth("ok")}}).catch(e=>{if(live){setError(e.message);setAuth("error")}});return()=>{live=false}},[]);
 if(auth==="loading")return <div className="loginPage"><section className="loginVisual"><Brand large/><h1>Bienvenido a<br/><span>EROSS Agenda</span></h1><p>Comprobando acceso a tu empresa...</p></section></div>;
 if(auth==="error")return <div className="loginPage"><section className="loginVisual"><Brand large/><div className="tagline">ESTRATEGIA · MARKETING · CRECIMIENTO</div><h1>Bienvenido a<br/><span>EROSS Agenda</span></h1><p>Tu sistema de gestión de citas, clientes y crecimiento empresarial.</p></section><section className="loginCard"><div className="secure">ACCESO SEGURO · QA</div><h2>Ingresá a tu empresa</h2><p>{error}</p><a className="goldBtn" style={{display:"inline-block",textDecoration:"none"}} href="/tenant-qa">Iniciar sesión segura →</a></section></div>;
 const menus=["Dashboard","Agenda","Clientes","Estadísticas","Empresas","Usuarios","Configuración"];
 const metric=(label,value,note)=> <Metric label={label} value={value} note={note}/>;
 const rows=(obj)=>Object.entries(obj||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=><div key={k} className="companyRow"><b>{k}</b><span className="badge amber">{v}</span></div>);
 return <div className="shell">
 <aside className="sidebar"><Brand compact/><div className="userCard"><span>{overview?.company?.name?.[0]||"E"}</span><div><b>{overview?.company?.name||"EROSS"}</b><small>{overview?.role||"Usuario"}</small></div></div><nav>{menus.map(item=><button key={item} className={section===item?"active":""} onClick={()=>setSection(item)}><i></i>{item}</button>)}</nav><div className="sideFoot"><span></span> Plataforma operativa<small>EROSS Agenda · QA integrada</small></div></aside>
 <main className="main"><header className="topbar"><div><small>EROSS OS / {overview?.company?.name}</small><h1>{section}</h1></div><div className="profile">{overview?.role||"Empresa"} <span>Datos reales · Neon QA</span></div></header>
 {section==="Dashboard"&&<><section className="welcome"><div><span className="pill gold">{overview?.company?.name?.toUpperCase()}</span><h2>Panel principal EROSS</h2><p>Información operativa de tu empresa, conectada a Neon.</p></div><button className="goldBtn small" onClick={()=>setSection("Agenda")}>Abrir Agenda Premium →</button></section><section className="cards four">{metric("Total de citas",report?.total||0,"Año 2026")}{metric("Confirmadas",report?.statuses?.confirmed||0,"Seguimiento activo")}{metric("Pendientes",report?.statuses?.pending||0,"Por confirmar")}{metric("Canceladas",report?.statuses?.cancelled||0,"Citas canceladas")}</section><div className="twoCol"><Panel title="Citas por mes" action={<button className="link" onClick={()=>setSection("Estadísticas")}>Ver estadísticas →</button>}>{rows(report?.byMonth)}</Panel><Panel title="Accesos rápidos"><button className="blueBtn" onClick={()=>setSection("Agenda")}>Gestionar agenda →</button><p>Entrá al calendario, consultá citas y gestioná sus estados.</p><button className="blueBtn" onClick={()=>setSection("Estadísticas")}>Estadísticas de la empresa →</button></Panel></div></>}
 {section==="Agenda"&&<AgendaDatabaseUnified tenantOnly/>}
 {section==="Estadísticas"&&<><section className="cards four">{metric("Total",report?.total||0,"Citas 2026")}{metric("Atendidas",report?.statuses?.attended||0,"Finalizadas")}{metric("No asistieron",report?.statuses?.no_show||0,"Ausencias")}{metric("Reprogramadas",report?.statuses?.rescheduled||0,"Cambios")}</section><div className="twoCol"><Panel title="Por responsable">{rows(report?.byResponsible)}</Panel><Panel title="Por sede">{rows(report?.byLocation)}</Panel></div></>}
 {["Clientes","Empresas","Usuarios","Configuración"].includes(section)&&<Panel title={section+" · diseño original conservado"}><p>Esta sección original está preservada, pero su conexión segura a la base de datos todavía está pendiente. No mostramos registros ficticios como si fueran reales.</p><button className="blueBtn" onClick={()=>setSection("Dashboard")}>Volver al panel</button></Panel>}
 </main></div>;
}
function Login({onLogin}){
  return <div className="loginPage">
    <section className="loginVisual">
      <Brand large/>
      <div className="tagline">ESTRATEGIA · MARKETING · CAPACITACIONES · CRECIMIENTO</div>
      <h1>Bienvenido a<br/><span>EROSS Agenda</span></h1>
      <p>Tu sistema de gestión de citas, clientes y crecimiento empresarial.</p>
      <div className="featureRow"><span>▣ Organiza</span><span>✦ Automatiza</span><span>↗ Haz crecer</span></div>
    </section>
    <form className="loginCard" onSubmit={e=>{e.preventDefault();onLogin()}}>
      <div className="secure">ACCESO SEGURO</div><h2>Inicia sesión</h2><p>Accede a tu cuenta para continuar.</p>
      <label>Correo electrónico<input defaultValue="prado@erosscr.com"/></label>
      <label>Contraseña<input type="password" placeholder="••••••••"/></label>
      <div className="loginMeta"><label><input type="checkbox" defaultChecked/> Recordarme</label><button type="button">¿Olvidaste tu contraseña?</button></div>
      <button className="goldBtn">Iniciar sesión →</button>
      <div className="demo">Demo inicial · el acceso real se conecta en la siguiente fase.</div>
    </form>
  </div>
}

function Dashboard({appointments,onNew,go}){
  const today=appointments.filter(a=>a.date==="2026-10-05");
  return <>
    <section className="welcome"><div><span className="pill gold">SUPERADMIN EROSS</span><h2>Hola, Prado 👋</h2><p>Resumen de actividad del ecosistema.</p></div><button className="goldBtn small" onClick={onNew}>+ Nueva cita</button></section>
    <section className="cards four">
      <Metric label="Citas hoy" value={today.length} note="Operación del día"/>
      <Metric label="Confirmadas" value={today.filter(a=>a.status==="Confirmada").length} note="Seguimiento activo"/>
      <Metric label="Atendidas" value={today.filter(a=>a.status==="Atendida").length} note="Citas completadas"/>
      <Metric label="Venta registrada" value={"₡"+today.reduce((s,a)=>s+a.sale,0).toLocaleString("es-CR")} note="Asociada a citas"/>
    </section>
    <div className="twoCol">
      <Panel title="Agenda de hoy" action={<button className="link" onClick={()=>go("Agenda")}>Ver agenda →</button>}>{today.map(a=><Appointment key={a.id} a={a}/>)}</Panel>
      <Panel title="Empresas activas" action={<button className="link" onClick={()=>go("Empresas")}>Administrar →</button>}>{companies.map(c=><div className="companyRow" key={c.name}><div className="companyIcon">{c.name[0]}</div><div><b>{c.name}</b><small>{c.modules}</small></div><span className={"badge "+(c.status==="Activo"?"green":"amber")}>{c.status}</span></div>)}</Panel>
    </div>
  </>
}

function Agenda({appointments,onNew}){
  return <>
    <div className="toolbar"><div><h2>Agenda general</h2><p>Visualización de citas y estados.</p></div><button className="blueBtn" onClick={onNew}>+ Crear cita</button></div>
    <Panel title="Citas recientes">{appointments.map(a=><Appointment key={a.id} a={a}/>)}</Panel>
  </>
}

function Appointment({a}){return <div className="appointment"><div className="time">{a.time}</div><div className="grow"><b>{a.name}</b><small>{a.service} · {a.branch} · {a.staff}</small></div><span className={"badge "+(a.status==="Atendida"||a.status==="Confirmada"?"green":a.status==="No asistió"?"red":"amber")}>{a.status}</span></div>}

function Clients(){
  const [q,setQ]=useState("");
  const [branch,setBranch]=useState("Todas");
  const filtered=clients.filter(c=>(branch==="Todas"||c.branch===branch)&&[c.name,c.id,c.contact,c.phone].join(" ").toLowerCase().includes(q.toLowerCase()));
  const exportCsv=()=>downloadCsv("EROSS_clientes.csv",[["Cliente","Cédula","Email","Teléfono","Edad","Sexo","Empresa","Sucursal","Revisiones","Última","Origen"],...filtered.map(c=>[c.name,c.id,c.contact,c.phone,c.age,c.sex,c.company,c.branch,c.reviews,c.last,c.source])]);
  return <>
    <div className="toolbar"><div><h2>Clientes</h2><p>Base central adaptable a cliente, paciente o prospecto.</p></div><div className="buttons"><button className="plainBtn" onClick={exportCsv}>↓ Exportar CSV</button><button className="blueBtn">+ Nuevo cliente</button></div></div>
    <Panel>
      <div className="filters"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nombre, cédula, email o teléfono..."/><select value={branch} onChange={e=>setBranch(e.target.value)}><option>Todas</option><option>Escazú</option><option>Heredia</option></select></div>
      <div className="clientTable"><div className="clientRow head"><span>Cliente</span><span>Cédula</span><span>Contacto</span><span>Edad</span><span>Sexo</span><span>Sucursal</span><span>Revisiones</span><span>Última</span></div>{filtered.map(c=><div className="clientRow" key={c.id}><span><b>{c.name}</b><small>{c.source}</small></span><span>{c.id}</span><span>{c.phone}<small>{c.contact}</small></span><span>{c.age}</span><span>{c.sex}</span><span>{c.branch}</span><span>{c.reviews}</span><span>{c.last}</span></div>)}</div>
    </Panel>
  </>
}

function Statistics({appointments}){
  const [from,setFrom]=useState("2026-10-01");
  const [to,setTo]=useState("2026-10-05");
  const filtered=useMemo(()=>appointments.filter(a=>a.date>=from&&a.date<=to),[appointments,from,to]);
  const attended=filtered.filter(a=>a.status==="Atendida").length;
  const confirmed=filtered.filter(a=>a.status==="Confirmada").length;
  const noShow=filtered.filter(a=>a.status==="No asistió").length;
  const sold=filtered.filter(a=>a.sale>0).length;
  const revenue=filtered.reduce((s,a)=>s+(a.sale||0),0);
  const conversion=attended?Math.round(sold/attended*100):0;
  const byOrigin=countBy(filtered,"origin"), byBranch=countBy(filtered,"branch"), byStatus=countBy(filtered,"status"), byService=countBy(filtered,"service");
  const days=["2026-10-01","2026-10-02","2026-10-03","2026-10-04","2026-10-05"];
  const trend=days.map(d=>filtered.filter(a=>a.date===d).length);
  const exportStats=()=>downloadCsv("EROSS_estadisticas.csv",[["Fecha","Hora","Cliente","Sucursal","Responsable","Motivo","Origen","Estado","Venta"],...filtered.map(a=>[a.date,a.time,a.name,a.branch,a.staff,a.service,a.origin,a.status,a.sale])]);

  return <>
    <div className="toolbar"><div><h2>Estadísticas</h2><p>Lectura gerencial de citas, asistencia, conversión y ventas.</p></div><button className="plainBtn" onClick={exportStats}>↓ Exportar informe CSV</button></div>
    <section className="panel filterPanel"><div className="dateFilters"><label>Desde<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Hasta<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><label>Empresa<select><option>Todas</option><option>Medical Óptica</option></select></label><label>Sucursal<select><option>Todas</option><option>Escazú</option><option>Heredia</option></select></label></div></section>

    <section className="cards six">
      <Metric label="Citas" value={filtered.length} note="Periodo seleccionado"/>
      <Metric label="Atendidas" value={attended} note="Citas completadas"/>
      <Metric label="No asistieron" value={noShow} note="No-show"/>
      <Metric label="Con compra" value={sold} note="Venta asociada"/>
      <Metric label="Importe vendido" value={"₡"+revenue.toLocaleString("es-CR")} note="Total registrado"/>
      <Metric label="Compra / atendida" value={conversion+"%"} note="Conversión"/>
    </section>

    <div className="analyticsTop">
      <Panel title="Tendencia de citas" subtitle="Movimiento diario del periodo">
        <LineChart values={trend}/>
        <div className="chartLegend"><span>1 Oct</span><span>2 Oct</span><span>3 Oct</span><span>4 Oct</span><span>5 Oct</span></div>
      </Panel>
      <Panel title="Estado de las citas" subtitle="Distribución actual">
        <Donut total={filtered.length} attended={attended} confirmed={confirmed} noShow={noShow}/>
      </Panel>
    </div>

    <Panel title="Embudo comercial" subtitle="Del agendamiento a la compra">
      <Funnel values={[filtered.length,confirmed+attended,attended,sold]}/>
    </Panel>

    <div className="analyticsGrid">
      <RankPanel title="Origen que genera citas" data={byOrigin}/>
      <RankPanel title="Rendimiento por sucursal" data={byBranch}/>
      <RankPanel title="Citas por estado" data={byStatus}/>
      <RankPanel title="Motivos de cita" data={byService}/>
    </div>
  </>
}

function LineChart({values}){
  const max=Math.max(1,...values), w=620,h=190,p=24;
  const pts=values.map((v,i)=>({x:p+i*((w-p*2)/(values.length-1)),y:h-p-(v/max)*(h-p*2)}));
  const d=pts.map((q,i)=>(i?"L":"M")+q.x+" "+q.y).join(" ");
  return <svg className="lineChart" viewBox={"0 0 "+w+" "+h} preserveAspectRatio="none">
    <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a7cff" stopOpacity=".28"/><stop offset="100%" stopColor="#0a7cff" stopOpacity="0"/></linearGradient></defs>
    {[0,1,2,3].map(i=><line key={i} x1="24" x2="596" y1={30+i*42} y2={30+i*42} className="gridLine"/>)}
    <path d={d+" L "+pts[pts.length-1].x+" 170 L "+pts[0].x+" 170 Z"} fill="url(#area)"/>
    <path d={d} className="trendLine"/>
    {pts.map((q,i)=><g key={i}><circle cx={q.x} cy={q.y} r="5" className="point"/><text x={q.x} y={q.y-12} textAnchor="middle">{values[i]}</text></g>)}
  </svg>
}

function Donut({total,attended,confirmed,noShow}){
  const safe=Math.max(total,1); const a=attended/safe*100,c=confirmed/safe*100,n=noShow/safe*100;
  return <div className="donutWrap"><div className="donut" style={{background:"conic-gradient(#0a7cff 0 "+a+"%, #19caa0 "+a+"% "+(a+c)+"%, #f0b43d "+(a+c)+"% "+(a+c+n)+"%, #e8eef3 "+(a+c+n)+"% 100%)"}}><div><strong>{total}</strong><span>citas</span></div></div><div className="donutLegend"><span><i className="b"></i>Atendidas {attended}</span><span><i className="g"></i>Confirmadas {confirmed}</span><span><i className="y"></i>No asistieron {noShow}</span></div></div>
}

function Funnel({values}){
  const labels=["Citas","Confirmadas","Atendidas","Con compra"], max=Math.max(1,values[0]);
  return <div className="funnel">{values.map((v,i)=><div key={labels[i]} style={{width:(54+46*(v/max))+"%"}}><span>{labels[i]}</span><b>{v}</b></div>)}</div>
}

function RankPanel({title,data}){
  const max=Math.max(1,...data.map(x=>x[1]));
  return <Panel title={title}><div className="rankList">{data.map(([name,v],i)=><div className="rankRow" key={name}><span className="rank">{i+1}</span><div className="rankName"><b>{name}</b><div><i style={{width:(v/max*100)+"%"}}></i></div></div><strong>{v}</strong></div>)}</div></Panel>
}

function Companies(){return <><div className="toolbar"><div><h2>Empresas conectadas</h2><p>Cada cliente usa solo los módulos que necesita.</p></div><button className="blueBtn">+ Nueva empresa</button></div><div className="companyCards">{companies.map(c=><div className="companyCard" key={c.name}><div className="companyIcon big">{c.name[0]}</div><span className={"badge "+(c.status==="Activo"?"green":"amber")}>{c.status}</span><h3>{c.name}</h3><p>{c.modules}</p><div className="companyData"><b>{c.users}</b> usuarios</div><button>Administrar empresa</button></div>)}</div></>}
function Users(){return <Panel title="Usuarios y permisos"><div className="simpleTable"><div className="simpleRow head"><span>Usuario</span><span>Empresa</span><span>Rol</span></div>{users.map(u=><div className="simpleRow" key={u.email}><span><b>{u.name}</b><small>{u.email}</small></span><span>{u.company}</span><span>{u.role}</span></div>)}</div></Panel>}
function Settings(){return <div className="settingsGrid">{[["Campos por empresa","Paciente / Cliente / Prospecto"],["Colaboradores","Profesional / Vendedor / Técnico"],["Estados de cita","Personalizables"],["Marca del cliente","Logo, colores y remitente"],["Confirmación por correo","Preparada"],["WhatsApp","Siguiente fase"]].map(([a,b])=><div className="settingCard" key={a}><span>{a}</span><b>{b}</b><button>Configurar</button></div>)}</div>}

function NewAppointment({onClose,onSave}){
  const [f,setF]=useState({date:"2026-10-05",time:"12:00",name:"",branch:"Escazú",staff:"Laura",service:"Examen visual",origin:"Meta Ads",status:"Pendiente",sale:0});
  const set=(k,v)=>setF({...f,[k]:v});
  return <div className="overlay"><form className="modal" onSubmit={e=>{e.preventDefault();onSave(f)}}><div className="modalHead"><div><small>NUEVA CITA</small><h2>Crear nueva cita</h2></div><button type="button" onClick={onClose}>×</button></div><div className="form"><label>Cliente<input required value={f.name} onChange={e=>set("name",e.target.value)}/></label><label>Fecha<input type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></label><label>Hora<input type="time" value={f.time} onChange={e=>set("time",e.target.value)}/></label><label>Sucursal<select value={f.branch} onChange={e=>set("branch",e.target.value)}><option>Escazú</option><option>Heredia</option></select></label><label>Motivo<select value={f.service} onChange={e=>set("service",e.target.value)}><option>Examen visual</option><option>Consulta visual</option><option>Entrega de lentes</option></select></label><label>Origen<select value={f.origin} onChange={e=>set("origin",e.target.value)}><option>Meta Ads</option><option>WhatsApp</option><option>Google</option><option>Presencial</option></select></label></div><div className="modalFoot"><div><b>✦ Confirmación preparada</b><small>Luego conectamos el proveedor de correo de cada empresa.</small></div><button className="blueBtn">Guardar cita</button></div></form></div>
}

function Metric({label,value,note}){return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function Panel({title,subtitle,action,children}){return <section className="panel"><div className="panelHead"><div>{title&&<h3>{title}</h3>}{subtitle&&<p>{subtitle}</p>}</div>{action}</div>{children}</section>}
function countBy(rows,key){const o={};rows.forEach(r=>o[r[key]]=(o[r[key]]||0)+1);return Object.entries(o).sort((a,b)=>b[1]-a[1])}
function downloadCsv(name,rows){const esc=v=>'"'+String(v??"").replaceAll('"','""')+'"';const csv=rows.map(r=>r.map(esc).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
