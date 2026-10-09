// Tenant resolver for future authenticated endpoints.
// Never use browser-provided company_id as a trusted selector.
const allowedRoles=new Set(["admin","supervisor","collaborator"]);
export async function resolveTenantMembership(sql,{identityId,companyId,roles}){
 if(!identityId||!companyId)return null;
 const memberships=await sql`
  SELECT m.id::text AS membership_id,m.identity_id::text AS identity_id,m.company_id::text AS company_id,m.role
  FROM eross_company_memberships m
  JOIN eross_identities i ON i.id=m.identity_id
  JOIN agenda_companies c ON c.id=m.company_id
  WHERE i.id=${identityId}::uuid AND m.company_id=${companyId}::uuid
    AND i.active=true AND m.active=true AND c.active=true
  LIMIT 1`;
 const membership=memberships[0]||null;
 if(!membership||!allowedRoles.has(membership.role))return null;
 if(roles&&!roles.includes(membership.role))return null;
 return membership;
}
