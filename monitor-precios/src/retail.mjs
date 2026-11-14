import {get} from 'node:https';
export const retailStores={
 monge:{name:'Monge',host:'www.tiendamonge.com'},
 gollo:{name:'Gollo',host:'www.gollo.com'},
 walmart:{name:'Walmart',host:'www.walmart.co.cr'}
};
export const retailTypes={
 tecnologia:{celulares:'Celulares',pantallas:'Pantallas',portatiles:'Laptops'},
 linea:{lavadoras:'Lavadoras',refrigeradoras:'Refrigeradoras',cocinas:'Cocinas'}
};
const normalized=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const retailers=Object.entries(retailStores);
const categoryMatchers={celulares:/\b(celular|smartphone|iphone|galaxy)\b/,pantallas:/\b(pantalla|televisor|smart tv)\b/,portatiles:/\b(laptop|notebook|macbook|computadora portatil)\b/,lavadoras:/\b(lavadora|lavasecadora)\b/,refrigeradoras:/\b(refrigeradora|refrigerador|nevera)\b/,cocinas:/\b(cocina|estufa)\b/};
const accessory=/\b(funda|estuche|cargador|audifonos|protector|vidrio|control remoto|soporte|cable|adaptador|repuesto|tapa|pedestal|pared|limpiador|mueble|campana)\b/;
const configCache=new Map();
function storefrontHtml(url){
 return new Promise((resolve,reject)=>{
  const req=get(url,{maxHeaderSize:65536,headers:{'User-Agent':'Mozilla/5.0','Accept-Encoding':'identity'},signal:AbortSignal.timeout(12500)},res=>{
   if(res.statusCode!==200){res.resume();reject(Error('Página de comercio no disponible'));return;}
   let html='';res.setEncoding('utf8');res.on('data',data=>{html+=data;if(html.length>2000000)res.destroy(Error('Página demasiado grande'));});
   res.on('error',reject);res.on('end',()=>resolve(html));
  });req.on('error',reject);
 });
}
async function request(url,options={}){
 const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(12500),...options});
 if(!r.ok)throw Error('Catálogo no disponible');
 return r;
}
async function configuration(store,query){
 const cached=configCache.get(store);
 if(cached&&cached.until>Date.now())return cached.value;
 const host=retailStores[store].host;
 const path=store==='monge'?'/catalogsearch/result/?q='+encodeURIComponent(query):'/search/'+encodeURIComponent(query);
 const value=(async()=>{
  const html=store==='monge'?await storefrontHtml('https://'+host+path):await (await request('https://'+host+path)).text();
  if(store==='monge'){
   const match=html.match(/"applicationId":"([a-z0-9]+)","indexName":"([a-z0-9_-]+)","apiKey":"([^"]+)"/i);
   if(!match)throw Error('Configuración de Monge no disponible');
   return {app:match[1],index:match[2]+'_products',key:match[3]};
  }
  const segment=html.split('window.LiveSearchPLP({storeDetails: {').at(-1)?.split('config:')[0]||'';
  const values=Object.fromEntries([...segment.matchAll(/(\w+): "([^"]+)"/g)].map(([,k,v])=>[k,JSON.parse('"'+v+'"')]));
  if(!values.environmentId||!values.apiKey)throw Error('Configuración de Gollo no disponible');
  return values;
 })();
 configCache.set(store,{value,until:Date.now()+1800000});
 try{return await value;}catch(error){if(configCache.get(store)?.value===value)configCache.delete(store);throw error;}
}
const adobeQuery='query($q:String!){productSearch(phrase:$q,page_size:20,current_page:1){items{productView{sku name url urlKey ... on SimpleProductView{price{final{amount{value currency}} regular{amount{value}}}} ... on ComplexProductView{priceRange{minimum{final{amount{value currency}}}}}}}}}';
function classify(name){
 const value=normalized(name);
 if(accessory.test(value))return '';
 return Object.keys(categoryMatchers).find(key=>categoryMatchers[key].test(value))||'';
}
function safeUrl(raw,host){
 if(typeof raw!=='string'||!raw)return null;
 try{const u=new URL(raw,'https://'+host);if(u.origin==='https://'+host){u.search='';return u.href;}}catch{}
 return null;
}
function detail(name){
 const text=normalized(name);
 const phone=text.match(/\biphone\s*(\d{2})(?:\s*(pro\s*max|pro|max|plus|mini|e))?\b/);
 const storage=[...text.matchAll(/\b(\d{2,4})\s*gb\b/g)].at(-1)?.[1];
 if(phone)return [phone[0].toUpperCase(),storage?storage+' GB':''].filter(Boolean).join(' · ');
 const model=text.match(/\b(?=[a-z0-9-]*\d)(?=[a-z0-9-]*[a-z])[a-z]{1,5}\d[a-z0-9-]{5,}\b/);
 return model?'Modelo '+model[0].toUpperCase():'';
}
async function rawOffers(store,q){
 const host=retailStores[store].host;
 if(store==='walmart'){
  const list=await (await request('https://'+host+'/api/catalog_system/pub/products/search?ft='+encodeURIComponent(q),{headers:{Accept:'application/json'}})).json();
  if(!Array.isArray(list))throw Error('Formato de Walmart no disponible');
  return list.flatMap(p=>(p.items||[]).flatMap(item=>(item.sellers||[]).slice(0,1).map(seller=>({
   sku:item.itemId,name:p.productName,url:'/'+p.linkText+'/p',price:seller.commertialOffer?.Price,regular:seller.commertialOffer?.ListPrice,
   available:seller.commertialOffer?.IsAvailable??seller.commertialOffer?.AvailableQuantity>0
  }))));
 }
 const config=await configuration(store,q);
 if(store==='monge'){
  const result=await (await request('https://'+config.app.toLowerCase()+'-dsn.algolia.net/1/indexes/'+config.index+'/query',{
   method:'POST',headers:{'Content-Type':'application/json','X-Algolia-Application-Id':config.app,'X-Algolia-API-Key':config.key},
   body:JSON.stringify({query:q,hitsPerPage:20})
  })).json();
  if(!Array.isArray(result.hits))throw Error('Formato de Monge no disponible');
  return result.hits.map(hit=>({sku:hit.sku,name:hit.name,url:hit.url,price:hit.price?.CRC?.default,
   regular:Number(hit.price?.CRC?.default_original_formated?.replace(/[^0-9]/g,''))||null,available:hit.in_stock==null?null:!!Number(hit.in_stock)}));
 }
 const params=new URLSearchParams({query:adobeQuery,variables:JSON.stringify({q})});
 const response=await (await request('https://catalog-service.adobe.io/graphql?'+params,{headers:{
  'x-api-key':config.apiKey,'Magento-Environment-Id':config.environmentId,'Magento-Website-Code':config.websiteCode,'Magento-Store-Code':config.storeCode,
  'Magento-Store-View-Code':config.storeViewCode,'Magento-Customer-Group':'b6589fc6ab0dc82cf12099d1c2d40ab994e8410c'
 }})).json();
 const items=response.data?.productSearch?.items;
 if(!Array.isArray(items))throw Error('Formato de Gollo no disponible');
 return items.map(({productView:p})=>{
  const amount=p?.price?.final?.amount??p?.priceRange?.minimum?.final?.amount;
  return {sku:p?.sku,name:p?.name,url:p?.url,price:amount?.currency==='CRC'?amount.value:null,regular:p?.price?.regular?.amount?.value,from:!p?.price&&!!p?.priceRange};
 });
}
export async function retailOffers(store,q,market){
 const raw=await rawOffers(store,q);
 return [...new Map(raw.flatMap(item=>{
  if(!item.sku||typeof item.name!=='string')return [];
  const type=classify(item.name);
  const area=Object.keys(retailTypes).find(key=>Object.hasOwn(retailTypes[key],type));
  if(!area||market&&market!==area)return [];
  const url=safeUrl(item.url,retailStores[store].host);
  if(!url)return [];
  const value=Number(item.price);
  const price=Number.isFinite(value)&&value>0?value:null;
  const regular=Number(item.regular);
  const status=item.available===true?'En stock':item.available===false?'Agotado':'Disponibilidad por confirmar';
  return [[store+'-'+item.sku,{id:store+'-'+item.sku,market:area,type,name:item.name,url,price,regular:price!==null&&regular>value?regular:null,
   available:item.available??null,from:!!item.from,detail:[detail(item.name),status].filter(Boolean).join(' · ')}]];
 })).values()];
}
export function retailMatch(name,q){
 const text=normalized(name),query=normalized(q).replace(/\b(\d+)\s+(gb|kg)\b/g,'$1$2');
 const compact=text.replace(/\b(\d+)\s+(gb|kg)\b/g,'$1$2');
 const qPhone=query.match(/\biphone\s*(\d{2})(?:\s*(pro\s*max|pro|max|plus|mini|e))?\b/);
 const pPhone=text.match(/\biphone\s*(\d{2})(?:\s*(pro\s*max|pro|max|plus|mini|e))?\b/);
 if(qPhone&&(!pPhone||qPhone[1]!==pPhone[1]||(qPhone[2]??'').replace(/\s/g,'')!==(pPhone[2]??'').replace(/\s/g,'')))return false;
 const terms=query.match(/[a-z0-9]+/g)||[];
 const tokens=compact.match(/[a-z0-9]+/g)||[];
 return terms.every(term=>tokens.includes(term)||tokens.includes(term+'s'));
}
export async function retailDiscovery(q,market){
 return Promise.all(retailers.map(async ([key,store])=>{
  try{return {store:store.name,ok:true,items:(await retailOffers(key,q,market)).map(item=>({...item,store:store.name,match:retailMatch(item.name,q)}))};}
  catch{return {store:store.name,ok:false,items:[]};}
 }));
}
export async function captureRetail(store,market){
 const terms=Object.values(retailTypes[market]);
 const rows=await Promise.all(terms.map(term=>retailOffers(store,term,market)));
 const items=[...new Map(rows.flat().filter(item=>item.price!==null).map(row=>[row.id,row])).values()];
 if(!items.length)throw Error('Sin precios publicados en el catálogo');
 return items;
}
