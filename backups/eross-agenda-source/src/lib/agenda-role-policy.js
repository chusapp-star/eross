// Centralized role policy for EROSS Agenda. Deny unknown actions/roles.
export const AGENDA_ROLE_POLICY=Object.freeze({
 admin:Object.freeze(["appointments.read","appointments.create","appointments.edit","appointments.status","companies.manage","users.manage","integrations.monitor"]),
 supervisor:Object.freeze(["appointments.read","appointments.create","appointments.edit","appointments.status","integrations.monitor"]),
 collaborator:Object.freeze(["appointments.read"])
});
export function roleCan(role,action){
 return Boolean(Object.prototype.hasOwnProperty.call(AGENDA_ROLE_POLICY,role)&&AGENDA_ROLE_POLICY[role].includes(action));
}


// Navigation permissions are derived on the server, never trusted from the browser.
// Individual grants will be enabled only after an audited tenant-scoped persistence layer exists.
export const AGENDA_NAVIGATION=Object.freeze({
  Dashboard:"appointments.read",Agenda:"appointments.read",Clientes:"appointments.read",
  "Estadísticas":"appointments.read",Empresas:"companies.view",
  Usuarios:"users.manage","Configuración":"companies.manage"
});
export function navigationForRole(role){
 const base=AGENDA_ROLE_POLICY[role]||[];
 return Object.keys(AGENDA_NAVIGATION).filter(section=>
  section==="Empresas" ? (role==="admin"||role==="supervisor") :
  base.includes(AGENDA_NAVIGATION[section])
 );
}
