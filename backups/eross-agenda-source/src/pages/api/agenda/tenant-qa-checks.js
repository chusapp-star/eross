import {requireAgendaAdmin} from "../../../lib/agenda-auth";
import {getSql} from "../../../lib/agenda-db";
// Read-only integrity suite: no appointments, customers, or events are changed.
export default async function handler(req,res){
 if(req.method!=="GET")return res.status(405).json({error:"Método no permitido"});
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")
  return res.status(404).json({error:"No disponible"});
 if(!requireAgendaAdmin(req,res))return;
 try{
  const sql=getSql();
  const violations=await sql`
   SELECT
    (SELECT count(*)::int FROM agenda_appointments a JOIN agenda_clients t ON t.id=a.client_id WHERE t.company_id<>a.company_id) AS clients,
    (SELECT count(*)::int FROM agenda_appointments a JOIN agenda_users t ON t.id=a.responsible_user_id WHERE t.company_id<>a.company_id) AS users,
    (SELECT count(*)::int FROM agenda_appointments a JOIN agenda_locations t ON t.id=a.location_id WHERE t.company_id<>a.company_id) AS locations,
    (SELECT count(*)::int FROM agenda_appointments a JOIN agenda_appointment_types t ON t.id=a.appointment_type_id WHERE t.company_id<>a.company_id) AS types,
    (SELECT count(*)::int FROM agenda_appointment_events e JOIN agenda_appointments a ON a.id=e.appointment_id WHERE e.company_id<>a.company_id) AS events,
    (SELECT count(*)::int FROM agenda_integration_outbox o JOIN agenda_appointments a ON a.id=o.appointment_id WHERE o.company_id<>a.company_id) AS outbox`;
  const names=["agenda_appt_client_tenant_fk","agenda_appt_user_tenant_fk","agenda_appt_location_tenant_fk","agenda_appt_type_tenant_fk","agenda_event_appt_tenant_fk","agenda_outbox_appt_tenant_fk"];
  const constraints=await sql`SELECT conname,convalidated FROM pg_constraint WHERE conname=ANY(${names})`;
  const present=new Set(constraints.filter(x=>x.convalidated).map(x=>x.conname));
  const memberships=await sql`
   SELECT i.email,m.company_id::text,m.role
   FROM eross_company_memberships m JOIN eross_identities i ON i.id=m.identity_id
   WHERE i.email IN ('qa-sol@eross.invalid','qa-luna@eross.invalid') AND m.active=true AND i.active=true`;
  const sol=memberships.filter(x=>x.email==="qa-sol@eross.invalid"),luna=memberships.filter(x=>x.email==="qa-luna@eross.invalid");
  const tests=[
   ...Object.entries(violations[0]||{}).map(([name,value])=>({name:"Integridad: "+name,passed:Number(value)===0,actual:Number(value)})),
   ...names.map(name=>({name:"Restricción: "+name,passed:present.has(name)})),
   {name:"Cuenta Sol limitada a su empresa",passed:sol.length===1&&sol[0].company_id==="eec3c94c-34b0-4c91-b209-67e957a13e01"&&sol[0].role==="admin"},
   {name:"Cuenta Luna limitada a su empresa",passed:luna.length===1&&luna[0].company_id==="eec3c94c-34b0-4c91-b209-67e957a13e02"&&luna[0].role==="supervisor"}
  ];
  res.status(200).json({ok:true,read_only:true,scope:"qa_database_checks_only",checked_at:new Date().toISOString(),passed:tests.filter(x=>x.passed).length,total:tests.length,tests});
 }catch(e){console.error("tenant QA checks",e);res.status(500).json({error:"No se pudieron completar las verificaciones"})}
}
