import AgendaDatabaseUnified from "./agenda-master-review";
import {useEffect,useState} from "react";
export default function IntegratedAgenda(){
 const [company,setCompany]=useState("EROSS Agenda"),[authorized,setAuthorized]=useState(false),[error,setError]=useState("");
 useEffect(()=>{fetch("/api/agenda/tenant-qa-overview",{cache:"no-store"}).then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error||"Sesión requerida");setCompany(j.company?.name||"EROSS Agenda");setAuthorized(true)}).catch(e=>setError(e.message))},[]);
 const entries=[["▦","Panel","/eross-inicio-qa"],["▤","Agenda","/eross-agenda-integrada-qa"],["▥","Estadísticas","/tenant-report-qa"]];
 return <div style={{display:"grid",gridTemplateColumns:"minmax(200px,230px) minmax(0,1fr)",minHeight:"100vh",fontFamily:"system-ui",background:"#eef2f5"}}>
 <aside style={{background:"#10283d",padding:"22px 16px",color:"white",display:"flex",flexDirection:"column",gap:22}}>
 <a href="/eross-inicio-qa"><img src="/eross-logo.webp" alt="EROSS" style={{width:160,maxWidth:"100%",objectFit:"contain"}}/></a>
 <div style={{padding:14,background:"#ffffff16",borderRadius:12}}><div style={{color:"#ddb45e",fontSize:12}}>MI EMPRESA</div><strong>{company}</strong><div style={{fontSize:12,opacity:.7}}>EROSS Agenda · QA</div></div>
 <nav style={{display:"grid",gap:8}}>{entries.map(([icon,label,url])=><a key={label} href={url} style={{padding:"12px 13px",borderRadius:10,color:label==="Agenda"?"#142b3f":"white",background:label==="Agenda"?"#c69c43":"#ffffff14",textDecoration:"none",fontWeight:750}}>{icon} &nbsp;{label}</a>)}</nav>
 <div style={{marginTop:"auto",fontSize:12,opacity:.7}}>Integración protegida de pruebas · QA</div>
 </aside>
 <main style={{minWidth:0,overflow:"auto"}}>{error?<div style={{margin:28,padding:24,background:"white",borderRadius:14}}><h2>Ingresá a tu empresa</h2><p>{error}</p><a href="/tenant-qa">Iniciar sesión →</a></div>:authorized?<AgendaDatabaseUnified tenantOnly/>:<p style={{padding:30}}>Cargando Agenda Premium...</p>}</main>
 <style jsx global>{`@media(max-width:720px){body>div#__next>div{display:block!important}body>div#__next>div>aside{gap:8!important;padding:10px!important}body>div#__next>div>aside img{max-width:100px!important}body>div#__next>div>aside nav{display:flex!important;flex-wrap:wrap!important}body>div#__next>div>aside nav a{font-size:12px!important;padding:8px!important}}`}</style>
 </div>;
}