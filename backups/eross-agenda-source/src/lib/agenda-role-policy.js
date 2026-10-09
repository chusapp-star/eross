// Centralized role policy for EROSS Agenda. Deny unknown actions/roles.
export const AGENDA_ROLE_POLICY=Object.freeze({
 admin:Object.freeze(["appointments.read","appointments.create","appointments.edit","appointments.status","companies.manage","users.manage","integrations.monitor"]),
 supervisor:Object.freeze(["appointments.read","appointments.create","appointments.edit","appointments.status","integrations.monitor"]),
 collaborator:Object.freeze(["appointments.read"])
});
export function roleCan(role,action){
 return Boolean(Object.prototype.hasOwnProperty.call(AGENDA_ROLE_POLICY,role)&&AGENDA_ROLE_POLICY[role].includes(action));
}
