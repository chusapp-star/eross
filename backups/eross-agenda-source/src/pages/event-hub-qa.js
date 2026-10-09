import {useEffect,useState} from "react";
export default function EventHubQA(){
 const [authorized,setAuthorized]=useState(null),[report,setReport]=useState(null),[result,setResult]=useState(null),[busy,setBusy]=useState(false);
 const refresh=async()=>{const r=await fetch("/api/agenda/event-hub",{cache:"no-store"});if(r.ok){setReport(await r.json());setAuthorized(true)}else setAuthorized(false)};
 useEffect(()=>{refresh()},[]);
 const run=async()=>{setBusy(true);try{const r=await fetch("/api/agenda/event-hub-process",{method:"POST",headers:{"Content-Type":"application/json"}});setResult({status:r.status,body:await r.json()});await refresh()}catch(e){setResult({error:String(e)})}finally{setBusy(false)}};
 return <main style={{fontFamily:"system-ui,sans-serif",maxWidth:760,margin:"45px auto",padding:24,color:"#1d2833"}}>
 <h1>EROSS Event Hub · QA</h1><p>Laboratorio exclusivo de señales ficticias. No se envían eventos de citas reales.</p>
 {authorized===null?<p>Comprobando sesión...</p>:authorized===false?<p>Iniciá sesión en EROSS Agenda QA y volvé aquí.</p>:<>
 <p><strong>Cola observada:</strong></p><pre style={{background:"#f0f3f8",padding:16,overflowX:"auto"}}>{JSON.stringify(report?.summary,null,2)}</pre>
 <button disabled={busy} onClick={run} style={{padding:"13px 20px",background:"#c28b39",color:"white",border:0,borderRadius:8,cursor:"pointer"}}>{busy?"Ejecutando...":"Probar entrega HTTP (solo QA)"}</button>
 {result&&<><h2>Resultado del procesador</h2><pre style={{background:"#f0f3f8",padding:16,overflowX:"auto"}}>{JSON.stringify(result,null,2)}</pre></>}
 <p><button onClick={refresh}>Actualizar cola</button></p></>}
 </main>;
}
