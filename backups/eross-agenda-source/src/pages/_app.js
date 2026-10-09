import "../styles/globals.css";
import "../styles/logo-fix.css";
import {useEffect,useState} from "react";
import {useRouter} from "next/router";

function AgendaLogin({children}){
  const [state,setState]=useState("checking");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const router=useRouter();
  const tenantPage=router.pathname==="/agenda-empresa-qa";
  const protectedPage=router.pathname.startsWith("/agenda-");
  useEffect(()=>{
    if(!protectedPage)return;
    let live=true;
    fetch(tenantPage?"/api/agenda/tenant-qa-overview":"/api/agenda/session",{credentials:"same-origin",cache:"no-store"})
      .then(r=>r.json()).then(j=>{if(live)setState((tenantPage?j.ok:j.authenticated)?"ok":"login");})
      .catch(()=>{if(live)setState("login");});
    return ()=>{live=false;};
  },[protectedPage,tenantPage]);
  if(!protectedPage)return children;
  if(state==="checking")return <main style={{padding:36,fontFamily:"system-ui"}}>Comprobando acceso a EROSS Agenda…</main>;
  if(state==="login"&&tenantPage)return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f6f5f2",fontFamily:"system-ui",padding:20}}><section style={{background:"white",padding:32,borderRadius:18,maxWidth:420}}><h1>EROSS Agenda</h1><p>Ingresá primero con tu cuenta individual de empresa. Esta vista no usa la contraseña administrativa anterior.</p><a href="/tenant-qa" style={{display:"inline-block",padding:"13px 20px",borderRadius:9,background:"#bd913c",color:"white",textDecoration:"none"}}>Iniciar sesión multiempresa</a></section></main>;
  if(state==="login")return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",fontFamily:"system-ui",background:"#f6f5f2"}}>
    <form onSubmit={async e=>{
      e.preventDefault();setError("");
      try{
        const res=await fetch("/api/agenda/session",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
        const data=await res.json();
        if(!res.ok)throw new Error(data.error||"No se pudo ingresar");
        setPassword("");setState("ok");
      }catch(e){setError(e.message);}
    }} style={{background:"white",borderRadius:16,padding:32,maxWidth:380,width:"90%",boxShadow:"0 10px 40px #0001"}}>
      <h1 style={{margin:"0 0 8px"}}>EROSS Agenda</h1>
      <p style={{color:"#555"}}>Acceso administrativo de la empresa de pruebas</p>
      <label htmlFor="agenda-password">Contraseña</label>
      <input id="agenda-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required style={{display:"block",width:"100%",padding:12,margin:"10px 0 18px",boxSizing:"border-box",border:"1px solid #ccc",borderRadius:8}}/>
      {error&&<p role="alert" style={{color:"#a22"}}>{error}</p>}
      <button type="submit" style={{width:"100%",padding:13,borderRadius:8,background:"#182a2d",color:"white",cursor:"pointer"}}>Ingresar</button>
    </form>
  </main>;
  return children;
}
export default function App({Component,pageProps}){return <AgendaLogin><Component {...pageProps}/></AgendaLogin>;}
