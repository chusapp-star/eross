import {useEffect,useState} from "react";
import AgendaApproved from "./agenda-master-review-final-base";

const COLORS=["#C89B3C","#1E88C8","#7657D5","#2A9D78","#D66B62","#6B7A89"];

const INITIAL_TYPES=[
  {id:1,name:"Reunión inicial",duration:30,mode:"Presencial / virtual",color:"#C89B3C",bufferBefore:0,bufferAfter:15,active:true},
  {id:2,name:"Asesoría",duration:60,mode:"Presencial / virtual",color:"#1E88C8",bufferBefore:15,bufferAfter:15,active:true},
  {id:3,name:"Demo",duration:45,mode:"Virtual",color:"#7657D5",bufferBefore:0,bufferAfter:15,active:true},
  {id:4,name:"Seguimiento",duration:30,mode:"Presencial / virtual",color:"#2A9D78",bufferBefore:0,bufferAfter:0,active:true},
];

const INITIAL_DAYS=[
  {day:"Lunes",active:true,start:"08:00",end:"17:00",breakStart:"12:00",breakEnd:"13:00"},
  {day:"Martes",active:true,start:"08:00",end:"17:00",breakStart:"12:00",breakEnd:"13:00"},
  {day:"Miércoles",active:true,start:"08:00",end:"17:00",breakStart:"12:00",breakEnd:"13:00"},
  {day:"Jueves",active:true,start:"08:00",end:"17:00",breakStart:"12:00",breakEnd:"13:00"},
  {day:"Viernes",active:true,start:"08:00",end:"17:00",breakStart:"12:00",breakEnd:"13:00"},
  {day:"Sábado",active:true,start:"09:00",end:"13:00",breakStart:"",breakEnd:""},
  {day:"Domingo",active:false,start:"09:00",end:"13:00",breakStart:"",breakEnd:""},
];

const INITIAL_BLOCKS=[
  {id:1,date:"2026-10-14",from:"13:00",to:"15:00",reason:"Reunión interna"},
  {id:2,date:"2026-10-16",from:"08:00",to:"10:00",reason:"Capacitación"},
];

const EMPTY_TYPE={name:"",duration:30,mode:"Presencial / virtual",color:"#C89B3C",bufferBefore:0,bufferAfter:15};

export default function AgendaConfigurationV2(){
  const [configOpen,setConfigOpen]=useState(false);
  const [tab,setTab]=useState("types");
  const [types,setTypes]=useState(INITIAL_TYPES);
  const [days,setDays]=useState(INITIAL_DAYS);
  const [blocks,setBlocks]=useState(INITIAL_BLOCKS);
  const [timezone,setTimezone]=useState("America/Costa_Rica");
  const [showTypeForm,setShowTypeForm]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [menuId,setMenuId]=useState(null);
  const [showBlockForm,setShowBlockForm]=useState(false);
  const [toast,setToast]=useState("");
  const [newType,setNewType]=useState(EMPTY_TYPE);
  const [newBlock,setNewBlock]=useState({date:"2026-10-20",from:"09:00",to:"10:00",reason:""});

  useEffect(()=>{
    const bind=()=>{
      const buttons=[...document.querySelectorAll("button")];
      buttons.forEach(btn=>{
        if(btn.dataset.erossConfigBound==="1") return;
        const label=(btn.textContent||"").trim().toLowerCase();
        if(label.includes("configur")){
          btn.dataset.erossConfigBound="1";
          btn.addEventListener("click",()=>setConfigOpen(true));
        }else if(["dashboard","agenda","clientes","estadísticas","estadisticas","reportes","empresas","usuarios"].some(x=>label===x || label.includes(x))){
          btn.dataset.erossConfigBound="1";
          btn.addEventListener("click",()=>setConfigOpen(false));
        }
      });
    };
    bind();
    const obs=new MutationObserver(bind);
    obs.observe(document.body,{childList:true,subtree:true});
    return()=>obs.disconnect();
  },[]);

  // Rehidratar la configuración visible con los valores reales guardados en Neon.
  useEffect(()=>{
    if(!configOpen)return;
    const controller=new AbortController();
    (async()=>{
      try{
        const response=await fetch("/api/agenda/config",{cache:"no-store",signal:controller.signal});
        if(!response.ok)throw new Error("No se pudo leer la configuración");
        const saved=await response.json();
        if(controller.signal.aborted)return;
        if(saved.timezone)setTimezone(saved.timezone);
        if(Array.isArray(saved.types))setTypes(saved.types);
        if(Array.isArray(saved.days)){
          const defaultDays=INITIAL_DAYS.map(d=>({...d}));
          setDays(defaultDays.map(d=>{
            const rule=saved.days.find(x=>x.day===d.day && !x.user_id && !x.location_id);
            if(!rule)return d;
            const first=Array.isArray(rule.slots)?rule.slots[0]:null;
            return {...d,active:rule.active!==false,start:first?.start||d.start,end:first?.end||d.end};
          }));
        }
      }catch(error){
        if(!controller.signal.aborted)setToast("No se pudo cargar la configuración de Neon");
      }
    })();
    return ()=>controller.abort();
  },[configOpen]);

  useEffect(()=>{
    const close=()=>setMenuId(null);
    window.addEventListener("click",close);
    return()=>window.removeEventListener("click",close);
  },[]);

  const [savingConfig,setSavingConfig]=useState(false);
  const saveConfig=async()=>{
    if(savingConfig)return;
    setSavingConfig(true);
    try{
      const response=await fetch("/api/agenda/config",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({timezone,types})
      });
      const result=await response.json();
      if(!response.ok || !result.ok)throw new Error(result.error||"No se pudo guardar");
      flash("Tipos de cita y zona horaria guardados en Neon");
    }catch(error){
      flash(error.message||"Error al guardar en Neon");
    }finally{setSavingConfig(false);}
  };

  const flash=(m)=>{
    setToast(m);
    setTimeout(()=>setToast(""),1800);
  };

  const resetType=()=>{
    setNewType(EMPTY_TYPE);
    setEditingId(null);
    setShowTypeForm(false);
  };

  const openCreate=()=>{
    setNewType(EMPTY_TYPE);
    setEditingId(null);
    setShowTypeForm(true);
    setMenuId(null);
  };

  const openEdit=(t)=>{
    setNewType({
      name:t.name,
      duration:t.duration,
      mode:t.mode,
      color:t.color,
      bufferBefore:t.bufferBefore||0,
      bufferAfter:t.bufferAfter||0
    });
    setEditingId(t.id);
    setShowTypeForm(true);
    setMenuId(null);
    window.scrollTo({top:0,behavior:"smooth"});
  };

  const saveType=()=>{
    if(!newType.name.trim()) return;
    if(editingId){
      setTypes(v=>v.map(x=>x.id===editingId?{...x,...newType,name:newType.name.trim(),duration:Number(newType.duration),bufferBefore:Number(newType.bufferBefore),bufferAfter:Number(newType.bufferAfter)}:x));
      flash("Tipo de cita actualizado");
    }else{
      setTypes(v=>[...v,{id:Date.now(),...newType,name:newType.name.trim(),duration:Number(newType.duration),bufferBefore:Number(newType.bufferBefore),bufferAfter:Number(newType.bufferAfter),active:true}]);
      flash("Tipo de cita creado");
    }
    resetType();
  };

  const duplicateType=(t)=>{
    setTypes(v=>[...v,{...t,id:Date.now(),name:t.name+" · copia"}]);
    setMenuId(null);
    flash("Tipo de cita duplicado");
  };

  // Conservar el historial de citas: retirar un tipo significa desactivarlo.
  // Se guarda de manera definitiva al pulsar «Guardar cambios».
  const deleteType=(id)=>{
    setTypes(v=>v.map(x=>x.id===id?{...x,active:false}:x));
    setMenuId(null);
    flash("Tipo desactivado. Guardá los cambios para confirmar.");
  };

  const addBlock=()=>{
    if(!newBlock.date || !newBlock.reason.trim()) return;
    setBlocks(v=>[...v,{id:Date.now(),...newBlock,reason:newBlock.reason.trim()}]);
    setShowBlockForm(false);
    flash("Bloqueo agregado");
  };

  return <>
    <AgendaApproved/>

    {configOpen && <main className="ec-overlay">
      <div className="ec-wrap">
        <header className="ec-head">
          <div>
            <div className="ec-kicker">EROSS AGENDA</div>
            <h1>Configuración de agenda</h1>
            <p>Definí cómo puede reservarse el tiempo de tu empresa. Esta configuración aplica a citas internas y futuras reservas públicas.</p>
          </div>
          <button className="ec-save" onClick={saveConfig} disabled={savingConfig}><span>✓</span> {savingConfig?"Guardando…":"Guardar cambios"}</button>
        </header>

        <section className="ec-summary">
          <article><span className="ec-summaryIcon">◷</span><div><strong>{types.filter(x=>x.active).length}</strong><small>Tipos activos</small></div></article>
          <article><span className="ec-summaryIcon">▣</span><div><strong>{days.filter(x=>x.active).length}</strong><small>Días disponibles</small></div></article>
          <article><span className="ec-summaryIcon">⊘</span><div><strong>{blocks.length}</strong><small>Bloqueos próximos</small></div></article>
        </section>

        <nav className="ec-tabs">
          <button className={tab==="types"?"on":""} onClick={()=>setTab("types")}>Tipos de cita</button>
          <button className={tab==="availability"?"on":""} onClick={()=>setTab("availability")}>Disponibilidad</button>
          <button className={tab==="blocks"?"on":""} onClick={()=>setTab("blocks")}>Horarios y bloqueos</button>
        </nav>

        {tab==="types" && <section className="ec-panel">
          <div className="ec-panelHead">
            <div><h2>Tipos de cita</h2><p>Creá los servicios o gestiones que una persona puede reservar.</p></div>
            <button className="ec-primary" onClick={openCreate}>＋ Nuevo tipo de cita</button>
          </div>

          {showTypeForm && <div className="ec-formCard ec-typeForm">
            <label className="wideName"><span>Nombre</span><input value={newType.name} onChange={e=>setNewType({...newType,name:e.target.value})} placeholder="Ej. Consulta inicial"/></label>
            <label><span>Duración</span><select value={newType.duration} onChange={e=>setNewType({...newType,duration:e.target.value})}><option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option></select></label>
            <label><span>Modalidad</span><select value={newType.mode} onChange={e=>setNewType({...newType,mode:e.target.value})}><option>Presencial / virtual</option><option>Presencial</option><option>Virtual</option><option>Telefónica</option></select></label>

            <div className="ec-colorField">
              <span>Color</span>
              <div className="ec-colors">
                {COLORS.map(c=><button key={c} aria-label={"Color "+c} className={newType.color===c?"selected":""} style={{background:c}} onClick={()=>setNewType({...newType,color:c})}/>)}
              </div>
            </div>

            <label><span>Margen antes</span><select value={newType.bufferBefore} onChange={e=>setNewType({...newType,bufferBefore:e.target.value})}><option value="0">Sin margen</option><option value="10">10 min</option><option value="15">15 min</option><option value="30">30 min</option></select></label>
            <label><span>Margen después</span><select value={newType.bufferAfter} onChange={e=>setNewType({...newType,bufferAfter:e.target.value})}><option value="0">Sin margen</option><option value="10">10 min</option><option value="15">15 min</option><option value="30">30 min</option></select></label>

            <div className="ec-formActions">
              <button onClick={resetType}>Cancelar</button>
              <button className="ec-primary" onClick={saveType}>{editingId?"Guardar":"Crear"}</button>
            </div>
          </div>}

          <div className="ec-typeList">
            {types.map(t=><article className="ec-type" key={t.id}>
              <div className="ec-typeMark" style={{background:t.color}}/>
              <div className="ec-typeMain">
                <strong>{t.name}</strong>
                <span>{t.duration} min · {t.mode}</span>
                {(t.bufferBefore>0||t.bufferAfter>0) && <small>Margen: {t.bufferBefore>0?t.bufferBefore+" min antes":"sin margen antes"} · {t.bufferAfter>0?t.bufferAfter+" min después":"sin margen después"}</small>}
              </div>
              <span className={t.active?"ec-state active":"ec-state"}>{t.active?"Activo":"Inactivo"}</span>
              <button className={t.active?"ec-switch on":"ec-switch"} onClick={()=>setTypes(v=>v.map(x=>x.id===t.id?{...x,active:!x.active}:x))}><i/></button>

              <div className="ec-menuWrap">
                <button className="ec-more" onClick={(e)=>{e.stopPropagation();setMenuId(menuId===t.id?null:t.id)}}>•••</button>
                {menuId===t.id && <div className="ec-menu" onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>openEdit(t)}>✎ <span>Editar</span></button>
                  <button onClick={()=>duplicateType(t)}>⧉ <span>Duplicar</span></button>
                  <button className="danger" onClick={()=>deleteType(t.id)}>⊘ <span>Desactivar</span></button>
                </div>}
              </div>
            </article>)}
          </div>
        </section>}

        {tab==="availability" && <section className="ec-panel">
          <div className="ec-panelHead">
            <div><h2>Disponibilidad semanal</h2><p>Horario base en el que la empresa puede recibir citas. Luego podrá personalizarse por responsable o sede.</p></div>
            <label className="ec-timezone">
              <span>Zona horaria</span>
              <select value={timezone} onChange={e=>setTimezone(e.target.value)}>
                <option value="America/Costa_Rica">Costa Rica · GMT-6</option>
                <option value="America/Guatemala">Guatemala · GMT-6</option>
                <option value="America/Panama">Panamá · GMT-5</option>
                <option value="America/Bogota">Colombia · GMT-5</option>
                <option value="America/Mexico_City">Ciudad de México</option>
              </select>
            </label>
          </div>

          <div className="ec-days">
            {days.map((d,i)=><div className={d.active?"ec-day active":"ec-day"} key={d.day}>
              <div className="ec-dayName">
                <button className={d.active?"ec-switch on":"ec-switch"} onClick={()=>setDays(v=>v.map((x,j)=>j===i?{...x,active:!x.active}:x))}><i/></button>
                <strong>{d.day}</strong>
              </div>
              {d.active ? <>
                <label><small>Desde</small><input type="time" value={d.start} onChange={e=>setDays(v=>v.map((x,j)=>j===i?{...x,start:e.target.value}:x))}/></label>
                <label><small>Hasta</small><input type="time" value={d.end} onChange={e=>setDays(v=>v.map((x,j)=>j===i?{...x,end:e.target.value}:x))}/></label>
                <div className="ec-break"><span>Descanso</span><b>{d.breakStart&&d.breakEnd?d.breakStart+" – "+d.breakEnd:"Sin descanso"}</b></div>
              </> : <div className="ec-closed">No disponible</div>}
            </div>)}
          </div>

          <div className="ec-bottomGrid">
            <article><span className="ec-miniIcon">↔</span><div><strong>Margen general</strong><p>Se aplica cuando un tipo de cita no tenga margen propio.</p></div><select defaultValue="15"><option value="0">Sin margen</option><option value="10">10 min</option><option value="15">15 min</option><option value="30">30 min</option></select></article>
            <article><span className="ec-miniIcon">⌛</span><div><strong>Anticipación mínima</strong><p>Evita reservas de último minuto.</p></div><select defaultValue="120"><option value="60">1 hora</option><option value="120">2 horas</option><option value="1440">24 horas</option></select></article>
          </div>
        </section>}

        {tab==="blocks" && <section className="ec-panel">
          <div className="ec-panelHead">
            <div><h2>Horarios y bloqueos</h2><p>Reservá espacios que no deben aparecer como disponibles: reuniones, vacaciones, capacitaciones o cierres.</p></div>
            <button className="ec-primary" onClick={()=>setShowBlockForm(v=>!v)}>＋ Nuevo bloqueo</button>
          </div>

          {showBlockForm && <div className="ec-formCard ec-blockForm">
            <label><span>Fecha</span><input type="date" value={newBlock.date} onChange={e=>setNewBlock({...newBlock,date:e.target.value})}/></label>
            <label><span>Desde</span><input type="time" value={newBlock.from} onChange={e=>setNewBlock({...newBlock,from:e.target.value})}/></label>
            <label><span>Hasta</span><input type="time" value={newBlock.to} onChange={e=>setNewBlock({...newBlock,to:e.target.value})}/></label>
            <label className="wide"><span>Motivo</span><input value={newBlock.reason} onChange={e=>setNewBlock({...newBlock,reason:e.target.value})} placeholder="Ej. Reunión interna"/></label>
            <div className="ec-formActions"><button onClick={()=>setShowBlockForm(false)}>Cancelar</button><button className="ec-primary" onClick={addBlock}>Agregar bloqueo</button></div>
          </div>}

          <div className="ec-blocks">
            {blocks.map(b=><article key={b.id}>
              <div className="ec-dateBox"><strong>{b.date.slice(8,10)}</strong><span>OCT</span></div>
              <div className="ec-blockMain"><strong>{b.reason}</strong><span>{b.from} – {b.to}</span></div>
              <span className="ec-private">No disponible para reservas</span>
              <button className="ec-delete" onClick={()=>setBlocks(v=>v.filter(x=>x.id!==b.id))}>Eliminar</button>
            </article>)}
            {!blocks.length && <div className="ec-empty">No hay bloqueos próximos.</div>}
          </div>
        </section>}
      </div>

      {toast && <div className="ec-toast">✓ {toast}</div>}
    </main>}

    <style jsx global>{`
      .ec-overlay{position:fixed;left:248px;top:0;right:0;bottom:0;z-index:40;background:#f4f7fa;overflow:auto;color:#12283c;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .ec-wrap{max-width:1320px;margin:0 auto;padding:38px 42px 70px}
      .ec-head{display:flex;align-items:flex-start;justify-content:space-between;gap:30px;margin-bottom:25px}
      .ec-kicker{font-size:10px;letter-spacing:.17em;font-weight:900;color:#b78726;margin-bottom:7px}
      .ec-head h1{font-size:30px;line-height:1.1;margin:0;color:#10273d;letter-spacing:-.035em;font-weight:900}
      .ec-head p{max-width:720px;margin:9px 0 0;color:#617387;font-size:13px;line-height:1.55;font-weight:550}
      .ec-save,.ec-primary{border:0;border-radius:10px;background:linear-gradient(135deg,#cda43e,#9f7621);color:white;font-weight:850;padding:11px 17px;box-shadow:0 7px 18px rgba(129,91,22,.17);cursor:pointer}
      .ec-save span{margin-right:6px}
      .ec-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}
      .ec-summary article{background:white;border:1px solid #dfe6ed;border-radius:13px;padding:17px 19px;display:flex;gap:13px;align-items:center;box-shadow:0 4px 14px rgba(22,48,72,.04)}
      .ec-summaryIcon,.ec-miniIcon{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:#f3ead6;color:#a57921;font-size:18px;font-weight:900}
      .ec-summary strong{display:block;font-size:22px;color:#142b41;line-height:1}
      .ec-summary small{display:block;color:#76879a;font-size:11px;margin-top:5px;font-weight:700}
      .ec-tabs{display:flex;gap:5px;border-bottom:1px solid #dce4eb;margin-bottom:0}
      .ec-tabs button{border:0;background:transparent;color:#65788b;font-weight:800;padding:12px 16px;cursor:pointer;border-bottom:3px solid transparent}
      .ec-tabs button.on{color:#9d7526;border-bottom-color:#c8a03d}
      .ec-panel{background:#fff;border:1px solid #dde5ec;border-radius:0 0 15px 15px;padding:25px 26px 29px;box-shadow:0 7px 22px rgba(17,42,63,.045)}
      .ec-panelHead{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:20px}
      .ec-panelHead h2{font-size:19px;margin:0;color:#132b42;font-weight:900;letter-spacing:-.02em}
      .ec-panelHead p{font-size:12px;color:#718397;margin:5px 0 0;font-weight:550}
      .ec-timezone{display:flex;align-items:center;gap:9px;border:1px solid #dce4ea;background:#f8fafb;padding:7px 9px;border-radius:10px}
      .ec-timezone span{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#78899a;font-weight:900}
      .ec-timezone select{border:0;background:transparent;color:#435b70;font-size:11px;font-weight:800;outline:none}
      .ec-typeList{display:flex;flex-direction:column;border:1px solid #e2e8ee;border-radius:12px;overflow:visible}
      .ec-type{display:grid;grid-template-columns:6px 1fr auto auto 34px;gap:15px;align-items:center;padding:15px 16px;background:white;border-bottom:1px solid #e8edf2;position:relative}
      .ec-type:first-child{border-radius:12px 12px 0 0}
      .ec-type:last-child{border-bottom:0;border-radius:0 0 12px 12px}
      .ec-typeMark{width:6px;height:48px;border-radius:10px}
      .ec-typeMain strong{display:block;color:#183149;font-size:13px;font-weight:900}
      .ec-typeMain span{display:block;margin-top:4px;color:#738597;font-size:11px;font-weight:650}
      .ec-typeMain small{display:block;margin-top:4px;color:#97a3af;font-size:9px;font-weight:700}
      .ec-state{font-size:10px;font-weight:850;color:#9a6a69;background:#faeceb;padding:5px 8px;border-radius:999px}
      .ec-state.active{color:#207457;background:#e6f5ee}
      .ec-switch{width:38px;height:21px;border:0;border-radius:999px;background:#cbd5de;position:relative;cursor:pointer;padding:0}
      .ec-switch i{position:absolute;width:17px;height:17px;left:2px;top:2px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,.18);transition:.18s}
      .ec-switch.on{background:#bea04c}
      .ec-switch.on i{left:19px}
      .ec-menuWrap{position:relative}
      .ec-more{border:0;background:transparent;color:#8292a0;font-weight:900;cursor:pointer;width:32px;height:30px}
      .ec-menu{position:absolute;right:0;top:30px;z-index:20;width:142px;padding:5px;background:white;border:1px solid #dce4eb;border-radius:10px;box-shadow:0 12px 28px rgba(20,45,67,.16)}
      .ec-menu button{width:100%;display:flex;align-items:center;gap:8px;border:0;background:white;color:#40586d;text-align:left;padding:8px 9px;border-radius:7px;font-size:11px;font-weight:750;cursor:pointer}
      .ec-menu button:hover{background:#f3f6f8}
      .ec-menu button.danger{color:#a95855}
      .ec-formCard{display:grid;gap:12px;align-items:end;background:#f8fafc;border:1px solid #dde5ec;border-radius:12px;padding:15px;margin-bottom:16px}
      .ec-typeForm{grid-template-columns:1.8fr .8fr 1.25fr 1.2fr .9fr .9fr auto}
      .ec-formCard label span,.ec-colorField>span{display:block;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#76889a;margin-bottom:6px}
      .ec-formCard input,.ec-formCard select,.ec-bottomGrid select,.ec-day input{width:100%;box-sizing:border-box;border:1px solid #d8e1e8;border-radius:8px;background:white;color:#284156;font-size:12px;padding:9px 10px;outline:none}
      .ec-colors{display:flex;gap:6px;align-items:center;height:36px}
      .ec-colors button{width:24px;height:24px;border-radius:50%;border:3px solid transparent;cursor:pointer;box-shadow:0 0 0 1px rgba(20,40,60,.08)}
      .ec-colors button.selected{border-color:white;box-shadow:0 0 0 2px #a9802d}
      .ec-formActions{display:flex;gap:8px}
      .ec-formActions button{border:1px solid #d9e1e8;border-radius:8px;background:white;color:#556a7e;font-weight:800;padding:9px 12px;cursor:pointer;white-space:nowrap}
      .ec-formActions .ec-primary{color:white;border:0}
      .ec-days{border:1px solid #e0e7ed;border-radius:12px;overflow:hidden}
      .ec-day{min-height:67px;padding:11px 14px;display:grid;grid-template-columns:190px 145px 145px 1fr;gap:13px;align-items:center;border-bottom:1px solid #e7edf2;background:#fbfcfd}
      .ec-day:last-child{border-bottom:0}
      .ec-day.active{background:white}
      .ec-dayName{display:flex;align-items:center;gap:12px}
      .ec-dayName strong{font-size:12px;color:#253f55}
      .ec-day label small{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#8292a1;font-weight:900;margin-bottom:4px}
      .ec-break{justify-self:start;background:#f3f6f8;border-radius:8px;padding:8px 12px;min-width:150px}
      .ec-break span{display:block;color:#8292a1;font-size:9px;font-weight:800;text-transform:uppercase}
      .ec-break b{display:block;color:#3f566c;font-size:11px;margin-top:3px}
      .ec-closed{grid-column:2/-1;color:#9aa7b2;font-size:11px;font-weight:750}
      .ec-bottomGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:15px}
      .ec-bottomGrid article{display:grid;grid-template-columns:38px 1fr 125px;align-items:center;gap:12px;border:1px solid #e0e7ed;border-radius:11px;padding:14px}
      .ec-bottomGrid strong{font-size:12px;color:#264057}
      .ec-bottomGrid p{font-size:10px;color:#7c8c9b;margin:3px 0 0}
      .ec-blockForm{grid-template-columns:1.2fr 1fr 1fr 2fr auto}
      .ec-blocks{border:1px solid #e1e7ed;border-radius:12px;overflow:hidden}
      .ec-blocks article{display:grid;grid-template-columns:54px 1fr auto auto;gap:14px;align-items:center;padding:13px 15px;border-bottom:1px solid #e8edf1}
      .ec-blocks article:last-child{border-bottom:0}
      .ec-dateBox{width:45px;height:45px;border-radius:9px;background:#f4ead4;display:grid;place-items:center;align-content:center}
      .ec-dateBox strong{font-size:15px;color:#8d6720;line-height:1}
      .ec-dateBox span{font-size:8px;color:#9b7a3b;font-weight:900;margin-top:3px}
      .ec-blockMain strong{display:block;color:#203a50;font-size:12px}
      .ec-blockMain span{display:block;color:#7b8b9a;font-size:10px;margin-top:4px}
      .ec-private{font-size:9px;font-weight:850;color:#6e7f8f;background:#eef2f5;border-radius:999px;padding:6px 9px}
      .ec-delete{border:0;background:transparent;color:#a86b69;font-size:10px;font-weight:850;cursor:pointer}
      .ec-empty{padding:30px;text-align:center;color:#8594a1;font-size:12px}
      .ec-toast{position:fixed;right:28px;bottom:28px;z-index:80;background:#12304a;color:white;border-left:4px solid #c6a04b;border-radius:9px;padding:12px 16px;font-size:12px;font-weight:800;box-shadow:0 10px 28px rgba(10,35,54,.23)}
      @media(max-width:1180px){
        .ec-typeForm{grid-template-columns:1.5fr .8fr 1.2fr 1fr;align-items:end}
        .ec-formActions{grid-column:4}
      }
      @media(max-width:1050px){
        .ec-overlay{left:220px}
        .ec-wrap{padding:28px 24px 60px}
        .ec-day{grid-template-columns:150px 130px 130px 1fr}
      }
      @media(max-width:850px){
        .ec-overlay{left:0}
        .ec-summary,.ec-bottomGrid{grid-template-columns:1fr}
        .ec-head,.ec-panelHead{flex-direction:column;align-items:stretch}
        .ec-day{grid-template-columns:1fr 1fr}
        .ec-break,.ec-closed{grid-column:1/-1}
        .ec-type{grid-template-columns:6px 1fr auto}
        .ec-state{display:none}
        .ec-typeForm,.ec-blockForm{grid-template-columns:1fr}
        .ec-formActions{grid-column:auto}
      }
    `}</style>
  </>;
}
