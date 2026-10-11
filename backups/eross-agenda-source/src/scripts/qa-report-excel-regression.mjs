import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ExcelJS=require('exceljs');
const code=fs.readFileSync(new URL('../lib/agenda-report-excel.js',import.meta.url),'utf8').replace("import ExcelJS from 'exceljs';","const ExcelJS=require('exceljs');").replace('export async function','async function');
const context={require,module:{exports:{}},Date};vm.runInNewContext(code+'\nmodule.exports=reportExcel;',context);
const report={company:'QA Sol',from:'2026-11-01',to:'2026-12-01',total:2,rescheduledCount:1,statuses:{confirmed:1,cancelled:1},byDay:{'2026-11-16':1,'2026-11-17':1},byMonth:{'2026-11':2},byResponsible:{'=HYPERLINK("https://example.com")':2},byLocation:{'QA Sede':2},bySource:{TikTok:2},byType:{Reunión:2}};
const buffer=await context.module.exports(report,{responsible:'QA Responsable',location:'QA Sede'});
const book=new ExcelJS.Workbook();await book.xlsx.load(buffer);
assert.deepEqual(book.worksheets.map(x=>x.name),['Resumen','Citas por día','Distribución']);
const s=book.getWorksheet('Resumen');assert.equal(s.getCell('B2').value,'QA Sol');assert.equal(s.getCell('B3').value.toISOString(),'2026-11-01T00:00:00.000Z');assert.equal(s.getCell('B4').value.toISOString(),'2026-11-30T00:00:00.000Z');assert.equal(s.getCell('B5').value,'QA Responsable');assert.equal(s.getCell('B6').value,'QA Sede');assert.equal(s.getCell('B7').value,2);
const d=book.getWorksheet('Citas por día');assert.equal(d.getCell('A2').numFmt,'dd/mm/yyyy');assert.equal(d.getCell('B2').type,ExcelJS.ValueType.Number);assert.equal(d.getCell('B2').value+d.getCell('B3').value,2);
const dist=book.getWorksheet('Distribución');const malicious=[];dist.eachRow(r=>{if(String(r.getCell(2).value).startsWith('='))malicious.push(r.getCell(2))});assert.equal(malicious.length,1);assert.equal(malicious[0].type,ExcelJS.ValueType.String);
for(const ws of book.worksheets){assert.equal(ws.views[0].ySplit,1);assert.ok(ws.autoFilter);}
const empty=new ExcelJS.Workbook();await empty.xlsx.load(await context.module.exports({...report,total:0,statuses:{},byDay:{},byMonth:{},byResponsible:{},byLocation:{},bySource:{},byType:{}}));assert.equal(empty.getWorksheet('Citas por día').rowCount,1);
console.log('PASS: XLSX round-trip, dates, totals, filters, freeze panes, literal formula-like names, empty period');
