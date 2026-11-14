import {retailDiscovery,retailTypes} from './retail.mjs';
const words=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]+/g)||[];
const ignore=new Set(['de','del','la','el','para','con','en','un','una','por']);
const significant=value=>words(value).filter(word=>!ignore.has(word));
function matches(name,query){
 const target=significant(name);
 return significant(query).every(word=>target.some(token=>token===word||token===word+'s'));
}
export const discoverySources=[
 {name:'Alfa Médica',host:'www.alfamedicacr.com',type:'prestashop'},
 {name:'Disfarma',host:'disfarmacr.com',type:'woo'},
 {name:'EPA',host:'cr.epaenlinea.com',type:'shopify'},
 {name:'Ópticas Visión',host:'www.opticasvision.co.cr',type:'shopify'}
];
async function read(url){
 const result=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
 if(!result.ok)throw Error('Fuente no disponible');
 return result.json();
}
function publicUrl(raw,host){
 try{const u=new URL(raw,'https://'+host);return u.origin==='https://'+host?u.href:null;}catch{return null;}
}
async function queryStore(store,query){
 if(store.type==='prestashop'){
  const response=await fetch('https://'+store.host+'/busqueda?'+new URLSearchParams({s:query}),{redirect:'manual',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Fuente no disponible');
  const html=await response.text();
  if(!/<title>\s*Buscar\s*<\/title>/i.test(html))throw Error('Formato de catálogo no disponible');
  return [...html.matchAll(/<article\b[^>]*product-miniature[^>]*>([\s\S]*?)<\/article>/gi)].flatMap(([,item])=>{
   const title=item.match(/<h2[^>]*product-title[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
   const url=publicUrl(title?.[1]??'/',store.host);
   if(!title||!url)return [];
   const name=title[2].replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').trim();
   const raw=item.match(/<span class="price"[^>]*>([\s\S]*?)<\/span>/i)?.[1]??'';
   const crc=raw.match(/[₡¢]\s*(?:&nbsp;)?\s*([\d.]+)(?:,(\d{2}))?/);
   const value=crc?Number(crc[1].replaceAll('.',''))+Number(crc[2]??0)/100:null;
   return [{name,store:store.name,url,price:value>0?value:null,match:matches(name,query),from:false}];
  });
 }
 const params=new URLSearchParams({per_page:'30',search:query,page:'1'});
 if(store.type==='woo'){
  const data=await read('https://'+store.host+'/wp-json/wc/store/v1/products?'+params);
  if(!Array.isArray(data))throw Error('Formato de catálogo no disponible');
  return data.flatMap(item=>{
   const url=publicUrl(item.permalink,store.host);
   if(!url||typeof item.name!=='string')return [];
   const p=item.prices;
   const value=p?.currency_code==='CRC'&&p.price!==''?Number(p.price)/10**p.currency_minor_unit:null;
   return [{name:item.name,store:store.name,url,price:value>0?value:null,match:matches(item.name,query),from:!!p?.price_range}];
  });
 }
 const shopify=new URLSearchParams({q:query,'resources[type]':'product','resources[limit]':'10'});
 const data=await read('https://'+store.host+(store.name==='EPA'?'/es-cr':'')+'/search/suggest.json?'+shopify);
 if(!Array.isArray(data.resources?.results?.products))throw Error('Formato de catálogo no disponible');
 return data.resources.results.products.flatMap(item=>{
  const url=publicUrl(item.url,store.host);
  if(!url||typeof item.title!=='string')return [];
  const value=Number(item.price);
  return [{name:item.title,store:store.name,url,price:Number.isFinite(value)&&value>0?value:null,match:matches(item.title,query),from:String(item.price_min)!==String(item.price_max)}];
 });
}
export async function discover(query,market){
 const selected=Object.hasOwn(retailTypes,market)?[]:market==='todos'?discoverySources:market==='optica'?discoverySources.filter(s=>s.name==='Ópticas Visión'):discoverySources.filter(s=>s.name!=='Ópticas Visión');
 const [legacy,retail]=await Promise.all([Promise.all(selected.map(async store=>{
  try{return {store:store.name,items:await queryStore(store,query),ok:true};}
  catch{return {store:store.name,items:[],ok:false};}
 })),(market==='todos'||Object.hasOwn(retailTypes,market))?retailDiscovery(query,market==='todos'?null:market):[]]);
 const responses=[...legacy,...retail];
 const relevant=item=>significant(query).some(term=>significant(item.name).some(token=>token===term||token===term+'s'));
 const results=responses.flatMap(r=>r.items).filter(item=>item.market||relevant(item)).sort((a,b)=>Number(b.match)-Number(a.match)||(a.price??Infinity)-(b.price??Infinity));
 return {results,checkedAt:new Date().toISOString(),sources:responses.map(({store,ok})=>({store,ok}))};
}
