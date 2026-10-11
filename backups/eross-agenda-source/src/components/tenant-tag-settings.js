import {useEffect,useState} from 'react';
export default function TenantTagSettings(){
 const [tags,setTags]=useState([]),[label,setLabel]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function load(){const r=await fetch('/api/agenda/tenant-qa-tags',{cache:'no-store'}),j=await r.json();if(!r.ok)throw Error(j.error);setTags(j.tags||[])}
 useEffect(()=>{load().catch(e=>setMessage(e.message))},[]);
 async function add(){setBusy(true);setMessage('');try{const r=await fetch('/api/agenda/tenant-qa-tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label})}),j=await r.json();if(!r.ok)throw Error(j.error);setLabel('');await load();setMessage('Etiqueta guardada para esta empresa')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 return <section className="panel"><h3>Etiquetas de clientes y citas</h3><p>VIP, Cliente externo y Seguimiento están disponibles. Las opciones personalizadas pertenecen solo a esta empresa y son independientes del tipo de cita y el origen.</p><div className="erossColorLegend">{tags.map(t=><span key={t}>{t}</span>)}</div><label>Nueva etiqueta<input aria-label="Nueva etiqueta de empresa" maxLength={48} value={label} onChange={e=>setLabel(e.target.value)}/></label><button className="blueBtn" disabled={busy||!label.trim()} onClick={add}>{busy?'Guardando…':'Añadir etiqueta'}</button>{message&&<p role="status">{message}</p>}</section>
}
