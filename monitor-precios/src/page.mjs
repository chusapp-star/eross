import { readFileSync } from 'node:fs';
const file=name=>readFileSync(new URL(name,import.meta.url),'utf8');
export const catalogPage=file('index.html').replace('/* REGIONAL_DIRECTORY */',()=> 'const regionalDirectory='+file('directory.json').trim().replaceAll('<','\\u003c')+';');
export const seed=JSON.parse(file('seed.json'));
export const createPage=file('account.html');
const samples={
 medical:[['Combo de visión sencilla',24000,'sencillo'],['Combo progresivo',64500,'progresivo']],
 vision:[['Combo bifocal',39500,'bifocal'],['Combo progresivo con antirreflejo',69500,'progresivo']],
 max:[['Aro modelo DEMO-A40',34500,'aro']],
 disfarma:[['Andadera de aluminio plegable DEMO-A100',35900,'movilidad'],['Rodillera de neopreno',11000,'soportes']],
 epa:[['Andadera de aluminio plegable DEMO-A100',38900,'movilidad'],['Bastón ajustable',9500,'movilidad']],
 isel:[['Compresa térmica de 30 cm',21000,'termoterapia'],['Equipo TENS de dos canales',61000,'electroterapia']]
};
const exampleNames={medical:'Óptica Horizonte',vision:'Óptica Prisma',max:'Óptica Central',disfarma:'Ortopedia Norte',epa:'Tienda Movilidad',isel:'Rehab Central'};
export function demoCatalog(sources){
 return Object.entries(sources).map(([key,source])=>({key,market:source.market,name:exampleNames[key],date:'2026-11-14T15:00:00Z',
  items:samples[key].map(([name,price,type],i)=>({name,price,type,id:key+i,detail:'Producto ficticio',change:i===0?-1000:null})),history:[{date:'2026-11-14T15:00:00Z',count:samples[key].length},{date:'2026-11-13T15:00:00Z',count:samples[key].length}]}));
}
export const demoDirectory=[
 {name:'Ortopedia Norte',province:'Alajuela',zone:'San Ramón',source:'disfarma'},
 {name:'Tienda Movilidad',province:'San José',zone:'Curridabat',source:'epa'},
 {name:'Rehab Central',province:'Limón',zone:'Guápiles',source:'isel'}
];
