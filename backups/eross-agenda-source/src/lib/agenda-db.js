import { neon } from "@neondatabase/serverless";

export function getSql(){
  if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
}
export function getCompanyId(){
  if(!process.env.AGENDA_COMPANY_ID) throw new Error("AGENDA_COMPANY_ID is not configured");
  return process.env.AGENDA_COMPANY_ID;
}
export const statusToDb=(v)=>{
  const s=String(v||"").toLowerCase().trim();
  if(s==="pending" || s.includes("no confirm")) return "pending";
  if(s==="confirmed" || s==="confirmada" || s==="confirmado") return "confirmed";
  if(s==="rescheduled" || s.includes("reprogram")) return "rescheduled";
  if(s==="attended" || s.includes("atendid")) return "attended";
  if(s==="no_show" || s.includes("no asisti")) return "no_show";
  if(s==="cancelled" || s.includes("cancel")) return "cancelled";
  return "pending";
};
export const statusToUi=(v)=>({
  pending:"No confirmada",
  confirmed:"Confirmada",
  rescheduled:"Reprogramada",
  attended:"Atendida",
  no_show:"No asistió",
  cancelled:"Cancelada"
}[v]||v||"No confirmada");
