// This invitation flow is intentionally unavailable outside the isolated QA database.
export function activationQAEnabled(){
 try{return process.env.EROSS_MULTIEMPRESA_QA_ENABLED==='true'&&process.env.EROSS_EVENT_HUB_QA_ENABLED==='true'&&new URL(process.env.DATABASE_URL||'https://invalid').hostname==='ep-ancient-meadow-b7e50je2-pooler.c-13.us-east-1.aws.neon.tech'}catch{return false}
}
