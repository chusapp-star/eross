// Presentation only. The server remains the authority for permissions and booking.
export function responsibleColor(id='unassigned'){
 let hash=0;for(const ch of String(id))hash=(hash*31+ch.charCodeAt(0))>>>0;
 return `hsl(${hash%360} 62% 36%)`;
}
export const wasRescheduled=a=>Boolean(a?.rescheduled||a?.status==='Reprogramada');
export const sourceOptions=['Manual / Otro','CRM','Meta Ads','Facebook','Instagram','WhatsApp','TikTok','LinkedIn','Web','Referidos','Referido','Externo','Google','Presencial','Otros'];
export const baseTags=['VIP','Cliente externo','Seguimiento'];
