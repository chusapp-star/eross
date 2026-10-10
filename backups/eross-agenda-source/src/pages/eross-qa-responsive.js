import {activationQAEnabled} from '../lib/agenda-qa-activation';
export async function getServerSideProps({query,res}){
 res.setHeader('Cache-Control','no-store');
 if(!activationQAEnabled())return {notFound:true};
 return {props:{width:[360,390,768].includes(Number(query.width))?Number(query.width):390}};
}
// QA viewport harness: embeds the actual approved page; it does not copy or redesign it.
export default function ResponsiveQA({width}){return <main style={{padding:12}}><h1>Verificación responsive QA · {width} px</h1><iframe title="EROSS QA móvil" src="/eross-original-integrado-qa" style={{width,height:844,border:'1px solid #ccd4db'}}/></main>}
