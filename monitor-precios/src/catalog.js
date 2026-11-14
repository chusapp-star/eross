export const sources={
 medical:{name:'Medical Óptica',market:'optica',url:'https://medicaloptica.cr/'},
 vision:{name:'Ópticas Visión',market:'optica',url:'https://www.opticasvision.co.cr/pages/promociones'},
 max:{name:'Ópticas Dr. Max',market:'optica',url:'https://drmaxcr.com/catalogo?category=1'},
 disfarma:{name:'Disfarma',market:'ortopedia',url:'https://disfarmacr.com/product-category/ortopedia-y-soporte/'},
 epa:{name:'EPA',market:'ortopedia',url:'https://cr.epaenlinea.com/es-cr/collections/equipo-medico-auxiliar'},
 isel:{name:'IS Electromédica',market:'ortopedia',url:'https://iselectromedica.com/costarica/'}
};
const clean=s=>s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const price=s=>Number(s?.replace(/\D/g,''));
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
function link(raw,base) {
 if (!raw) return '';
 const url=new URL(raw.replaceAll('&amp;','&'),base);
 return url.origin===new URL(base).origin?url.href:'';
}
export function parse(key,html) {
 const url=sources[key].url;
 if(key==='medical') return [...clean(html).matchAll(/COMBO (SENCILLO|BIFOCAL|PROGRESIVO)\s+(desde\s+)?[₡¢]\s*([\d.]+)\s+(.{15,150}?)(?=\s+COMBO (?:BIFOCAL|PROGRESIVO)|\s+Aros con|$)/gi)]
  .map(([,type,from,p,detail])=>({id:'medical-'+slug(type),type:slug(type),name:'Combo '+type.toLowerCase(),from:!!from,price:price(p),detail:detail.replace(/ Agendar cita.*/i,''),url}));
 if(key==='vision') return [...html.matchAll(/<p\b[^>]*>\s*(COMBO [^<]+)<\/p>([\s\S]*?)(?=<\/div>\s*(?:<\/div>|<a))/gi)].flatMap(([,group,section])=>{
  const body=clean(section);
  if(!/hasta diciembre\s+2026/i.test(body)||!/aro/i.test(body)) return [];
  return [...body.matchAll(/((?:Visión Sencilla|Bifocal Kriptok|Progresivo)\s+(?!\|)[^|]{2,150})\|\s*Precio Combo:\s*([\d.]+)/gi)].map(([,raw,p])=>{
   const name=raw.trim();
   return {id:'vision-'+slug(group+' '+name),type:/^Visión/i.test(name)?'sencillo':/^Bifocal/i.test(name)?'bifocal':'progresivo',name:clean(group).slice(6)+' · '+name,price:price(p),detail:'Aro, lentes, examen, estuche y franela. Tiendas físicas, hasta diciembre de 2026.',url};
  });
 });
 return [...html.matchAll(/<article class="product-card">([\s\S]*?)<\/article>/g)].flatMap(([,card])=>{
  const get=re=>card.match(re)?.[1];
  const product=card.match(/<a href="([^"]+)" data-product="([^"]+)"/);
  const model=get(/class="product-model">([^<]+)/);
  const p=get(/class="card-price-desktop">([₡¢][\d.]+)/);
  if(!product||!model||!p)return [];
  const name=[get(/class="product-brand-logo"[^>]+alt="([^"]+)"/),model,get(/class="product-color">([^<]+)/)].filter(Boolean).map(clean).join(' · ');
  return [{id:'max-'+product[2],type:'aro',name,price:price(p),regular:price(get(/<del><span class="card-price-desktop">([₡¢][\d.]+)/))||null,
    detail:clean(get(/class="product-availability">([^<]+)/)||''),url:link(product[1],url),photo:link(get(/class="product-photo"[^>]+src="([^"]+)"/),url)}];
 });
}
async function fetchPage(url,fetcher) {
 const r=await fetcher(url,{headers:{'User-Agent':'EROSS Price Monitor/1.0',Accept:'text/html'},signal:AbortSignal.timeout(9000),redirect:'manual'});
 if(!r.ok) throw new Error('La fuente respondió HTTP '+r.status);
 return await r.text();
}
export async function capture(key,fetcher=fetch) {
 if(key==='epa')return await captureEpa(fetcher);
 if(key==='disfarma')return await captureDisfarma(fetcher);
 if(key==='isel')return await captureIsel(fetcher);
 const url=sources[key].url;
 const first=await fetchPage(url,fetcher);
 const rows=parse(key,first);
 if(key==='max'){
  const pages=Math.max(1,...[...first.matchAll(/href="[^"]*category=1&amp;page=(\d+)"/g)].map(x=>Number(x[1])));
  if(pages>32)throw new Error('El catálogo supera el límite de páginas');
  for(let i=2;i<=pages;i+=4){
   const batch=await Promise.all(Array.from({length:Math.min(4,pages-i+1)},(_,n)=>fetchPage(url+'&page='+(i+n),fetcher)));
   for(const html of batch){const part=parse(key,html);if(!part.length)throw new Error('Página de catálogo incompleta');rows.push(...part);}
  }
 }
 if(rows.length<(key==='max'?5:3)||rows.some(x=>!x.url||!Number.isSafeInteger(x.price)||x.price<=0)||new Set(rows.map(x=>x.id)).size!==rows.length) throw new Error('Formato inesperado o datos incompletos');
 return rows;
}

const iselCategories=[
 ['termoterapia','1326-agentes_fisicos_e_insumos'],
 ['electroterapia','1332-electroterapia'],
 ['rehabilitacion','1337-rehabilitacion__terapia_ocupac']
];
const orthopedicType=name=>{
 const value=slug(name);
 if(/andadera|baston|muleta|silla|caminador|inodoro|orinal/.test(value))return 'movilidad';
 if(/cojin|almohada|dona-de/.test(value))return 'posicionamiento';
 return 'soportes';
};

async function shopProducts(query,fetcher){
 const url='https://disfarmacr.com/wp-json/wc/store/v1/products?per_page=30&'+query;
 const get=async page=>{
  const r=await fetcher(url+'&page='+page,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000),redirect:'manual'});
  if(!r.ok)throw new Error('Disfarma respondió HTTP '+r.status);
  const items=await r.json(),pages=Number(r.headers.get('X-WP-TotalPages'));
  if(!Array.isArray(items)||!items.length||!Number.isInteger(pages)||pages<1||pages>8)throw new Error('Catálogo de Disfarma incompleto');
  return {items,pages};
 };
 const first=await get(1);
 const later=await Promise.all(Array.from({length:first.pages-1},(_,i)=>get(i+2)));
 return [first,...later].flatMap(page=>page.items);
}

async function captureDisfarma(fetcher){
 const [support,lifepro]=await Promise.all([shopProducts('category=2167',fetcher),shopProducts('search=Lifepro',fetcher)]);
 const mobility=lifepro.filter(item=>/^(andadera|bast[oó]n|muleta|silla|inodoro|orinal|coj[ií]n|almohada|dona)/i.test(item.name));
 const products=new Map([...support,...mobility].map(item=>[item.id,item]));
 const rows=[];
 for(const item of products.values()){
  const p=item.prices;
  if(p?.currency_code!=='CRC'||!/^\d+$/.test(p.price))continue;
  const denominator=10**p.currency_minor_unit;
  const current=Number(p.price)/denominator;
  if(!Number.isFinite(current)||current<=0)continue;
  const regular=Number(p.regular_price)/denominator;
  const name=clean(item.name);
  const url=link(item.permalink,sources.disfarma.url);
  if(!url)continue;
  rows.push({id:'disfarma-'+item.id,name,type:orthopedicType(name),price:current,regular:regular>current?regular:null,
   from:p.price_range!==null&&p.price_range!==undefined,
   detail:[item.is_in_stock?'En stock':'Agotado',item.type==='variable'?'Consultar talla o variante':'',item.sku?'Ref. '+clean(item.sku):''].filter(Boolean).join(' · '),
   url});
 }
 if(rows.length<10)throw new Error('Catálogo de Disfarma incompleto');
 return rows;
}

export function parseIsel(html,type){
 const base=sources.isel.url;
 return [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)].flatMap(([,header,card])=>{
  const id=header.match(/data-id-product="([^"]+)"/)?.[1];
  const name=clean(card.match(/<h3\b[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/h3>/i)?.[1]??'');
  const product=link(card.match(/itemprop="url" content="([^"]+)"/)?.[1],base);
  const raw=card.match(/<span class="price"[^>]*>\s*<span[^>]*data-currency-crc="([^"]+)"/)?.[1];
  const current=raw?.match(/[₡¢]\s*(\d[\d.]*)(?:,(\d{2}))?$/);
  if(!id||!name||!product||!current)return [];
  const amount=Number(current[1].replaceAll('.',''))+Number(current[2]??0)/100;
  if(!Number.isFinite(amount)||amount<=0)return [];
  const stock=card.match(/itemprop="availability" href="[^"]*\/(InStock|OutOfStock)"/)?.[1];
  const brand=clean(card.match(/<meta itemprop="name" content="([^"]+)"/)?.[1]??'');
  const summary=clean(card.match(/class="an_short_description[^"]*"[^>]*>([\s\S]*?)<\/p>/)?.[1]??'').replaceAll('&quot;', '"').slice(0,160);
  return [{id:'isel-'+id,name,type,price:amount,detail:[brand,stock==='InStock'?'En stock':stock==='OutOfStock'?'Agotado':'Disponibilidad por confirmar','Ref. '+id,summary].filter(Boolean).join(' · '),
   url:product,photo:link(card.match(/itemprop="image" content="([^"]+)"/)?.[1],base)}];
 });
}

async function captureIsel(fetcher){
 const groups=await Promise.all(iselCategories.map(async ([type,path])=>{
  const url=new URL(path,sources.isel.url).href;
  const first=await fetchPage(url,fetcher);
  const escaped=url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pages=Math.max(1,...[...first.matchAll(new RegExp(escaped+'\\?page=(\\d+)','g'))].map(m=>Number(m[1])));
  if(pages>8)throw new Error('La categoría supera el límite de páginas');
  const items=parseIsel(first,type);
  for(let index=2;index<=pages;index+=3){
   const later=await Promise.all(Array.from({length:Math.min(3,pages-index+1)},(_,n)=>fetchPage(url+'?page='+(index+n),fetcher)));
   for(const html of later){
    if(!/data-id-product="/.test(html))throw new Error('Página de IS Electromédica incompleta');
    items.push(...parseIsel(html,type));
   }
  }
  if(items.length<3)throw new Error('Categoría de IS Electromédica incompleta');
  return items;
 }));
 return [...new Map(groups.flat().reverse().map(item=>[item.id,item])).values()];
}

export function parseEpa(html){
 const base=sources.epa.url;
 return [...html.matchAll(/<h3\b[^>]*class="[^"]*product-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<\/product-card>|<quick-view-modal|<h3\b|$)/gi)].flatMap(([,title,body])=>{
  const target=title.match(/href="([^"]+)"/)?.[1];
  const url=link(target,base);
  const name=clean(title).replace('Silla de reudas','Silla de ruedas');
  const shelf=body.match(/f-price-item--regular">\s*[₡¢]([\d.]+)</)?.[1];
  const promo=body.match(/f-price-item--sale">\s*[₡¢]([\d.]+)</)?.[1];
  const value=price(promo||shelf);
  if(!url||!/(silla de ruedas|bast[oó]n|andadera)/i.test(name)||!Number.isSafeInteger(value)||value<=0)return [];
  return [{id:'epa-'+new URL(url).pathname.split('/').at(-1),name,type:'movilidad',price:value,regular:promo?price(shelf)||null:null,
   detail:'Precio en línea · consultar retiro y existencias por sucursal',url}];
 });
}
async function captureEpa(fetcher){
 const items=parseEpa(await fetchPage(sources.epa.url,fetcher));
 const rows=[...new Map(items.map(item=>[item.id,item])).values()];
 if(rows.length<3)throw new Error('Catálogo de EPA incompleto');
 return rows;
}
