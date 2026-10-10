const pad=n=>String(n).padStart(2,"0");
const addDays=(date,n)=>{const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function minutes(t){const [h,m]=(t||"00:00").split(":").map(Number);return h*60+m}
export function availabilitySlots(data,date,type,bookingSettings={slotStep:30,notice:120},userId="",locationId=""){
  const d=new Date(date+"T12:00:00"),weekday=d.getDay();
  const matches=(data.availability||[]).filter(x=>Number(x.weekday)===weekday&&(!x.user_id||x.user_id===userId)&&(!x.location_id||x.location_id===locationId));
  const rule=matches.sort((a,b)=>Number(Boolean(b.user_id))+Number(Boolean(b.location_id))-Number(Boolean(a.user_id))-Number(Boolean(a.location_id)))[0];
  if(!rule||!rule.active)return[];
  const step=Number(bookingSettings.slotStep||30),dur=Number(type?.duration||30),before=Number(type?.bufferBefore||0),after=Number(type?.bufferAfter||0);
  const nowParts=new Intl.DateTimeFormat("en-CA",{
    timeZone:data.company?.timezone||"America/Costa_Rica",
    year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",
    hourCycle:"h23"
  }).formatToParts(new Date());
  const part=name=>nowParts.find(p=>p.type===name)?.value;
  const nowWall=Date.UTC(Number(part("year")),Number(part("month"))-1,Number(part("day")),
    Number(part("hour")),Number(part("minute")));
  const windows=rule.all_day?[{start:"00:00",end:"24:00"}]:(rule.slots||[]),out=[];
  for(const w of windows){
    let a=minutes(w.start),b=minutes(w.end);if(b<=a)b+=1440;
    for(let s=Math.ceil((a+before)/step)*step;s+dur<=b;s+=step){
      if(s-before<a||s+dur+after>b)continue;
      const actualDate=s>=1440?addDays(date,1):date,mm=((s%1440)+1440)%1440,time=pad(Math.floor(mm/60))+":"+pad(mm%60);
      let busy=false,reason="";
      const wall=(day,tm)=>Date.parse(day+"T"+tm+":00Z");
      const candidateStart=wall(actualDate,time)-before*60000,candidateEnd=wall(actualDate,time)+(dur+after)*60000;
      for(const ap of data.appointments||[]){
        if(ap.status==="Cancelada")continue;
        if(userId&&ap.responsible_user_id!==userId)continue;
        // A responsible cannot be in two locations at once.
        const service=data.types.find(t=>t.id===ap.appointment_type_id);
        const st=ap.reserved_start_wall?Date.parse(ap.reserved_start_wall+"Z"):wall(ap.date,ap.time)-Number(service?.bufferBefore||0)*60000;
        const en=ap.reserved_end_wall?Date.parse(ap.reserved_end_wall+"Z"):wall(ap.date,ap.time)+(Number(ap.duration||30)+Number(service?.bufferAfter||0))*60000;
        if(candidateStart<en&&candidateEnd>st){busy=true;reason="Ocupado · "+ap.name;break}
      }
      if(!busy)for(const bl of data.blocks||[]){
        if(bl.user_id&&bl.user_id!==userId)continue;
        if(bl.location_id&&bl.location_id!==locationId)continue;
        const st=wall(bl.date,bl.from),en=wall(bl.end_date||bl.date,bl.to);
        if(candidateStart<en&&candidateEnd>st){busy=true;reason="Bloqueado · "+(bl.reason||"Bloqueo");break}
      }
      const startWall=Date.UTC(Number(actualDate.slice(0,4)),Number(actualDate.slice(5,7))-1,
        Number(actualDate.slice(8,10)),Math.floor(mm/60),mm%60);
      if(startWall-nowWall<Number(bookingSettings.notice??120)*60000){
        busy=true;reason="No cumple la anticipación mínima";
      }
      if(mm%step!==0){busy=true;reason="Fuera del intervalo de reserva";}
      out.push({time,date:actualDate,available:!busy,reason:busy?reason:"Disponible"});
    }
  }return out;
}
