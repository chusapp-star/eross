import {useEffect,useState} from "react";
import {createPortal} from "react-dom";
import AgendaConfigBase from "./agenda-master-review-flex-base";

const INITIAL_DAYS=[
  {day:"Lunes",active:true,allDay:false,slots:[{id:11,start:"06:00",end:"14:00"},{id:12,start:"15:00",end:"22:00"}]},
  {day:"Martes",active:true,allDay:false,slots:[{id:21,start:"06:00",end:"22:00"}]},
  {day:"Miércoles",active:true,allDay:false,slots:[{id:31,start:"06:00",end:"22:00"}]},
  {day:"Jueves",active:true,allDay:false,slots:[{id:41,start:"06:00",end:"22:00"}]},
  {day:"Viernes",active:true,allDay:false,slots:[{id:51,start:"06:00",end:"23:59"}]},
  {day:"Sábado",active:true,allDay:false,slots:[{id:61,start:"07:00",end:"23:00"}]},
  {day:"Domingo",active:true,allDay:false,slots:[{id:71,start:"08:00",end:"20:00"}]}
];

function FlexibleAvailability(){
  const [days,setDays]=useState(INITIAL_DAYS);
  const [timezone,setTimezone]=useState("America/Costa_Rica");
  const [slotStep,setSlotStep]=useState("30");
  const [notice,setNotice]=useState("120");
  const [toast,setToast]=useState("");

  // El panel flexible se monta al abrir Disponibilidad: cargar valores persistidos, no los de demostración.
  useEffect(()=>{
    const controller=new AbortController();
    (async()=>{
      try{
        const response=await fetch("/api/agenda/config",{cache:"no-store",signal:controller.signal});
        if(!response.ok)throw new Error("Error al cargar disponibilidad");
        const saved=await response.json();
        if(controller.signal.aborted)return;
        const settingResponse=await fetch("/api/agenda/booking-settings",{cache:"no-store",signal:controller.signal});
        if(settingResponse.ok){
          const settings=await settingResponse.json();
          if(!controller.signal.aborted){
            setSlotStep(String(settings.slotStep??30));
            setNotice(String(settings.notice??120));
          }
        }
        if(saved.timezone)setTimezone(saved.timezone);
        if(Array.isArray(saved.days)){
          setDays(INITIAL_DAYS.map(day=>{
            const rule=saved.days.find(x=>x.day===day.day && !x.user_id && !x.location_id);
            if(!rule)return day;
            return {...day,active:rule.active!==false,allDay:!!rule.allDay,
              slots:Array.isArray(rule.slots)?rule.slots.map((slot,i)=>({
                id:slot.id||i+1,start:slot.start||"08:00",end:slot.end||"17:00"
              })):day.slots};
          }));
        }
      }catch(error){
        if(!controller.signal.aborted)setToast("No se pudo cargar la disponibilidad de Neon");
      }
    })();
    return ()=>controller.abort();
  },[]);

  const [savingAvailability,setSavingAvailability]=useState(false);
  const saveAvailability=async()=>{
    if(savingAvailability)return;
    setSavingAvailability(true);
    try{
      const response=await fetch("/api/agenda/config",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({timezone,days:days.map(d=>({
          day:d.day,active:d.active,allDay:d.allDay,
          slots:d.slots.map(({start,end})=>({start,end}))
        }))})
      });
      const result=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error||"No se pudo guardar");
      const settingsResponse=await fetch("/api/agenda/booking-settings",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({slotStep:Number(slotStep),notice:Number(notice)})
      });
      const settingsResult=await settingsResponse.json();
      if(!settingsResponse.ok||!settingsResult.ok)
        throw new Error("Horarios guardados, pero falló el intervalo/anticipación: "+(settingsResult.error||"Error"));
      flash("Disponibilidad y reglas de reserva guardadas en Neon");
    }catch(error){
      flash(error.message||"Error al guardar disponibilidad");
    }finally{setSavingAvailability(false);}
  };

  const flash=(m)=>{setToast(m);setTimeout(()=>setToast(""),1600);};

  const updateDay=(idx,patch)=>{
    setDays(v=>v.map((d,i)=>i===idx?{...d,...patch}:d));
  };

  const updateSlot=(dayIdx,slotId,field,value)=>{
    setDays(v=>v.map((d,i)=>i!==dayIdx?d:{
      ...d,
      slots:d.slots.map(s=>s.id===slotId?{...s,[field]:value}:s)
    }));
  };

  const addSlot=(idx)=>{
    setDays(v=>v.map((d,i)=>i!==idx?d:{
      ...d,
      slots:[...d.slots,{id:Date.now()+i,start:"14:00",end:"22:00"}]
    }));
  };

  const removeSlot=(idx,slotId)=>{
    setDays(v=>v.map((d,i)=>i!==idx?d:{
      ...d,
      slots:d.slots.filter(s=>s.id!==slotId)
    }));
  };

  return <div className="ex-flex">
    <div className="ex-head">
      <div>
        <h2>Disponibilidad semanal</h2>
        <p>Configurá horarios reales de operación: jornadas extendidas, varias franjas por día, 24 horas o turnos que cruzan medianoche.</p>
      </div>
      <label className="ex-timezone">
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

    <div className="ex-info">
      <span>◷</span>
      <p><b>Horario flexible.</b> Si una franja termina a una hora menor que la de inicio —por ejemplo 18:00 → 02:00— EROSS la tratará como un turno que continúa después de medianoche.</p>
    </div>

    <div className="ex-days">
      {days.map((d,idx)=><section className={d.active?"ex-day active":"ex-day"} key={d.day}>
        <div className="ex-dayTop">
          <div className="ex-dayName">
            <button className={d.active?"ex-switch on":"ex-switch"} onClick={()=>updateDay(idx,{active:!d.active})}><i/></button>
            <strong>{d.day}</strong>
            {!d.active && <span className="ex-closed">No disponible</span>}
          </div>

          {d.active && <label className="ex-24">
            <input type="checkbox" checked={d.allDay} onChange={e=>updateDay(idx,{allDay:e.target.checked})}/>
            <span>24 horas</span>
          </label>}
        </div>

        {d.active && <div className="ex-dayBody">
          {d.allDay ? <div className="ex-allDay">
            <span className="ex-clock">24/7</span>
            <div><b>Disponible todo el día</b><small>00:00 – 23:59</small></div>
          </div> : <>
            <div className="ex-slots">
              {d.slots.map((s,slotIdx)=><div className="ex-slot" key={s.id}>
                <span className="ex-slotLabel">Franja {slotIdx+1}</span>
                <label><small>Desde</small><input type="time" value={s.start} onChange={e=>updateSlot(idx,s.id,"start",e.target.value)}/></label>
                <span className="ex-arrow">→</span>
                <label><small>Hasta</small><input type="time" value={s.end} onChange={e=>updateSlot(idx,s.id,"end",e.target.value)}/></label>
                {d.slots.length>1 && <button className="ex-remove" title="Eliminar franja" onClick={()=>removeSlot(idx,s.id)}>×</button>}
              </div>)}
            </div>
            <button className="ex-add" onClick={()=>addSlot(idx)}>＋ Agregar otra franja</button>
          </>}
        </div>}
      </section>)}
    </div>

    <div className="ex-rules">
      <article>
        <span className="ex-ruleIcon">⌚</span>
        <div><strong>Intervalos de inicio</strong><p>Cada cuánto aparecen horas reservables.</p></div>
        <select value={slotStep} onChange={e=>setSlotStep(e.target.value)}>
          <option value="15">Cada 15 min</option>
          <option value="20">Cada 20 min</option>
          <option value="30">Cada 30 min</option>
          <option value="60">Cada 60 min</option>
        </select>
      </article>
      <article>
        <span className="ex-ruleIcon">⌛</span>
        <div><strong>Anticipación mínima</strong><p>Evita reservas demasiado cercanas.</p></div>
        <select value={notice} onChange={e=>setNotice(e.target.value)}>
          <option value="0">Sin límite</option>
          <option value="60">1 hora</option>
          <option value="120">2 horas</option>
          <option value="360">6 horas</option>
          <option value="1440">24 horas</option>
        </select>
      </article>
    </div>

    <div className="ex-footer">
      <div><b>{days.filter(d=>d.active).length} días activos</b><span> · horarios listos para conectarse al motor del calendario</span></div>
      <button onClick={saveAvailability} disabled={savingAvailability}>✓ {savingAvailability?"Guardando…":"Guardar disponibilidad"}</button>
    </div>

    {toast && <div className="ex-toast">✓ {toast}</div>}
  </div>;
}

export default function AgendaFlexibleHours(){
  const [portalNode,setPortalNode]=useState(null);

  useEffect(()=>{
    let current=null;
    const sync=()=>{
      const panels=[...document.querySelectorAll(".ec-panel")];
      const target=panels.find(p=>{
        const h=p.querySelector("h2");
        return h && (h.textContent||"").toLowerCase().includes("disponibilidad semanal");
      });

      if(target){
        let root=target.querySelector("#eross-flex-availability");
        if(!root){
          root=document.createElement("div");
          root.id="eross-flex-availability";
          target.appendChild(root);
        }
        target.classList.add("ex-host");
        if(current!==root){
          current=root;
          setPortalNode(root);
        }
      }else{
        document.querySelectorAll(".ec-panel.ex-host").forEach(p=>p.classList.remove("ex-host"));
        current=null;
        setPortalNode(null);
      }
    };

    sync();
    const obs=new MutationObserver(sync);
    obs.observe(document.body,{childList:true,subtree:true});
    return()=>obs.disconnect();
  },[]);

  return <>
    <AgendaConfigBase/>
    {portalNode && createPortal(<FlexibleAvailability/>,portalNode)}
    <style jsx global>{`
      .ec-panel.ex-host{padding:0!important;overflow:visible!important}
      .ec-panel.ex-host>*:not(#eross-flex-availability){display:none!important}
      #eross-flex-availability{display:block!important}

      .ex-flex{padding:25px 26px 29px;color:#173149;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .ex-head{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:15px}
      .ex-head h2{font-size:19px!important;margin:0!important;color:#132b42!important;font-weight:900!important;letter-spacing:-.02em}
      .ex-head p{font-size:12px;color:#718397;margin:5px 0 0;max-width:720px;font-weight:550;line-height:1.45}
      .ex-timezone{display:flex;align-items:center;gap:9px;border:1px solid #dce4ea;background:#f8fafb;padding:8px 10px;border-radius:10px;white-space:nowrap}
      .ex-timezone span{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#78899a;font-weight:900}
      .ex-timezone select{border:0;background:transparent;color:#435b70;font-size:11px;font-weight:800;outline:none}

      .ex-info{display:flex;align-items:flex-start;gap:10px;border:1px solid #e4d4a8;background:#fbf7ed;border-radius:10px;padding:11px 13px;margin-bottom:14px}
      .ex-info>span{width:27px;height:27px;display:grid;place-items:center;border-radius:8px;background:#efe2bf;color:#a87920;font-weight:900}
      .ex-info p{margin:1px 0 0;color:#716343;font-size:10.5px;line-height:1.5}

      .ex-days{display:flex;flex-direction:column;gap:9px}
      .ex-day{border:1px solid #e0e7ed;background:#f8fafb;border-radius:11px;padding:13px 15px}
      .ex-day.active{background:white}
      .ex-dayTop{display:flex;justify-content:space-between;align-items:center;gap:15px}
      .ex-dayName{display:flex;align-items:center;gap:11px}
      .ex-dayName strong{min-width:82px;color:#263f55;font-size:12.5px;font-weight:900}
      .ex-closed{font-size:10px;color:#98a5b0;font-weight:750}
      .ex-switch{width:38px;height:21px;border:0;border-radius:999px;background:#cbd5de;position:relative;cursor:pointer;padding:0}
      .ex-switch i{position:absolute;width:17px;height:17px;left:2px;top:2px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,.18);transition:.18s}
      .ex-switch.on{background:#bea04c}
      .ex-switch.on i{left:19px}
      .ex-24{display:flex;align-items:center;gap:7px;font-size:10px;color:#5c7083;font-weight:800;cursor:pointer}
      .ex-24 input{accent-color:#b78a29;width:15px;height:15px}

      .ex-dayBody{margin-top:10px;padding-top:10px;border-top:1px solid #edf1f4}
      .ex-slots{display:flex;flex-wrap:wrap;gap:8px}
      .ex-slot{display:grid;grid-template-columns:auto 96px auto 96px auto;gap:8px;align-items:end;background:#f7f9fb;border:1px solid #e2e8ed;border-radius:9px;padding:8px 9px}
      .ex-slotLabel{align-self:center;color:#8392a0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}
      .ex-slot label small{display:block;color:#8493a1;font-size:8px;font-weight:900;text-transform:uppercase;margin-bottom:3px}
      .ex-slot input{width:96px;box-sizing:border-box;border:1px solid #d9e2e8;border-radius:7px;background:white;color:#294157;padding:7px 8px;font-size:11px;font-weight:750}
      .ex-arrow{align-self:center;color:#9aa7b1;font-weight:900}
      .ex-remove{align-self:center;border:0;background:#eef2f5;color:#81909d;border-radius:7px;width:26px;height:26px;font-size:17px;cursor:pointer}
      .ex-remove:hover{background:#faeceb;color:#a85f5b}
      .ex-add{margin-top:8px;border:0;background:transparent;color:#9b7426;font-size:10px;font-weight:900;cursor:pointer;padding:4px 0}
      .ex-allDay{display:flex;align-items:center;gap:12px;background:#f7f3e9;border:1px solid #e9dbb9;border-radius:9px;padding:10px 12px}
      .ex-clock{width:42px;height:32px;display:grid;place-items:center;background:#c49a3b;color:white;border-radius:8px;font-size:10px;font-weight:900}
      .ex-allDay b{display:block;color:#5f512e;font-size:11px}
      .ex-allDay small{display:block;color:#8f805c;font-size:9px;margin-top:2px}

      .ex-rules{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
      .ex-rules article{display:grid;grid-template-columns:38px 1fr 145px;gap:11px;align-items:center;border:1px solid #e0e7ed;border-radius:11px;padding:13px;background:white}
      .ex-ruleIcon{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:#f3ead6;color:#a57921;font-size:17px;font-weight:900}
      .ex-rules strong{display:block;color:#294157;font-size:11.5px}
      .ex-rules p{margin:3px 0 0;color:#80909e;font-size:9.5px}
      .ex-rules select{border:1px solid #dbe3e9;border-radius:8px;background:white;color:#465d71;padding:8px 9px;font-size:10.5px;font-weight:750}

      .ex-footer{display:flex;justify-content:space-between;align-items:center;gap:20px;border-top:1px solid #e6ebef;margin-top:17px;padding-top:16px}
      .ex-footer div{font-size:10.5px;color:#7a8b99}
      .ex-footer div b{color:#455d72}
      .ex-footer button{border:0;border-radius:9px;background:linear-gradient(135deg,#cda43e,#9f7621);color:white;font-weight:850;padding:10px 14px;cursor:pointer;box-shadow:0 6px 15px rgba(129,91,22,.13)}
      .ex-toast{position:fixed;right:28px;bottom:28px;z-index:90;background:#12304a;color:white;border-left:4px solid #c6a04b;border-radius:9px;padding:12px 16px;font-size:12px;font-weight:800;box-shadow:0 10px 28px rgba(10,35,54,.23)}

      @media(max-width:1100px){
        .ex-head{align-items:flex-start}
        .ex-slot{grid-template-columns:auto 90px auto 90px auto}
        .ex-slot input{width:90px}
        .ex-rules{grid-template-columns:1fr}
      }
      @media(max-width:800px){
        .ex-head,.ex-footer{flex-direction:column;align-items:stretch}
        .ex-timezone{justify-content:space-between}
        .ex-slot{grid-template-columns:1fr 1fr}
        .ex-slotLabel{grid-column:1/-1}
        .ex-arrow{display:none}
        .ex-remove{grid-column:1/-1}
        .ex-rules article{grid-template-columns:38px 1fr}
        .ex-rules select{grid-column:1/-1}
      }
    `}</style>
  </>;
}
