import {availabilitySlots} from './agenda-availability';
const minute=t=>{const [h,m]=String(t||'00:00').split(':').map(Number);return h*60+m};
const previousDay=date=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)};
export const timeLabel=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
function dayRanges(data,date,userId,locationId){
 const windows=[];
 for(const [day,carry] of [[date,false],[previousDay(date),true]]){
  const weekday=new Date(day+'T12:00:00Z').getUTCDay();
  const matches=(data.availability||[]).filter(r=>Number(r.weekday)===weekday&&(!r.user_id||r.user_id===userId)&&(!r.location_id||r.location_id===locationId));
  const rule=matches.sort((a,b)=>(Number(!!b.user_id)+Number(!!b.location_id))-(Number(!!a.user_id)+Number(!!a.location_id)))[0];
  if(!rule?.active)continue;
  for(const w of rule.all_day?[{start:'00:00',end:'24:00'}]:rule.slots||[]){
   const start=minute(w.start),end=minute(w.end);
   if(carry){if(end<=start&&!rule.all_day)windows.push([0,end]);}
   else windows.push([start,end<=start?1440:end]);
  }
 }
 return windows;
}
export function layoutAppointments(appointments,start,end){
 const items=appointments.filter(a=>a.status!=='Cancelada').map(a=>({...a,start:Math.max(start,(a._startMinute??minute(a.time))),end:Math.min(end,(a._startMinute??minute(a.time))+Number(a.duration||30))})).filter(a=>a.end>a.start).sort((a,b)=>a.start-b.start||a.end-b.end);
 const clusters=[];let cluster=[],finish=-1;
 for(const a of items){if(cluster.length&&a.start>=finish){clusters.push(cluster);cluster=[];finish=-1}cluster.push(a);finish=Math.max(finish,a.end)}if(cluster.length)clusters.push(cluster);
 for(const group of clusters){const lanes=[];for(const a of group){let lane=lanes.findIndex(t=>t<=a.start);if(lane<0)lane=lanes.length;lanes[lane]=a.end;a.lane=lane}for(const a of group)a.laneCount=lanes.length;}
 return items;
}
export function timelineModel({data,days,type,settings,userId='',locationId='',visiblePadding=0}){
 const step=Math.max(1,Math.min(30,Number(settings?.slotStep||30))),ranges=[];
 const columns=days.map(date=>{
  const appointments=(data.appointments||[]).filter(a=>(a.date===date||(a.date===previousDay(date)&&minute(a.time)+Number(a.duration||30)>1440))&&(!userId||a.responsible_user_id===userId)&&(!locationId||a.location_id===locationId)).map(a=>a.date===date?a:{...a,_startMinute:minute(a.time)-1440,continues:true});
  const windows=dayRanges(data,date,userId,locationId);ranges.push(...windows);
  for(const a of appointments)ranges.push([Math.max(0,a._startMinute??minute(a.time)),Math.min(1440,(a._startMinute??minute(a.time))+Number(a.duration||30))]);
  const slots=userId&&locationId&&type?[...availabilitySlots(data,previousDay(date),type,settings,userId,locationId),...availabilitySlots(data,date,type,settings,userId,locationId)].filter(s=>s.date===date):[];
  return {date,appointments,slots:[...new Map(slots.map(s=>[s.time,s])).values()],windows};
 });
 const valid=ranges.filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&b>a);
 if(!valid.length)return {columns,start:0,end:0,step,rows:[],height:0};
 const start=Math.max(0,Math.floor(Math.min(...valid.map(([a])=>a))/step)*step),end=Math.min(1440,Math.ceil((Math.max(...valid.map(([,b])=>b))+Math.max(0,Math.min(1440,Number(visiblePadding)||0)))/step)*step);
 const rows=Array.from({length:Math.ceil((end-start)/step)},(_,i)=>start+i*step);
 return {columns:columns.map(c=>({...c,layout:layoutAppointments(c.appointments,start,end)})),start,end,step,rows,height:rows.length*32};
}
