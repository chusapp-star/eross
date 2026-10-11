// Server-only export of the same authorized, filtered statistics used by CSV.
import ExcelJS from 'exceljs';
export async function reportExcel(report,{responsible='',location=''}={}){
 const workbook=new ExcelJS.Workbook();
 workbook.creator='EROSS Agenda';
 const sheet=(name,headers,widths)=>{
  const ws=workbook.addWorksheet(name,{views:[{state:'frozen',ySplit:1}]});
  ws.columns=headers.map((header,i)=>({header,key:String(i),width:widths[i]}));
  ws.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};
  ws.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF223D55'}};
  ws.getRow(1).height=24;
  return ws;
 };
 const date=value=>new Date(value+'T00:00:00Z');
 const end=date(report.to);end.setUTCDate(end.getUTCDate()-1);
 const summary=sheet('Resumen',['Indicador','Valor'],[34,48]);
 summary.addRows([['Empresa',report.company],['Desde',date(report.from)],['Hasta',end],['Responsable',responsible||'Todos'],['Sede',location||'Todas'],['Total de citas',report.total],['Reprogramadas (historial)',report.rescheduledCount||0]]);
 summary.getCell('B3').numFmt='dd/mm/yyyy';summary.getCell('B4').numFmt='dd/mm/yyyy';
 const daily=sheet('Citas por día',['Fecha','Cantidad de citas'],[20,24]);
 daily.addRows(Object.entries(report.byDay||{}).sort(([a],[b])=>a.localeCompare(b)).map(([d,n])=>[date(d),n]));
 daily.getColumn(1).numFmt='dd/mm/yyyy';daily.getColumn(2).numFmt='#,##0';
 const distribution=sheet('Distribución',['Dimensión','Categoría','Cantidad de citas'],[24,48,24]);
 const labels={pending:'Pendiente',confirmed:'Confirmada',attended:'Atendida',no_show:'No asistió',cancelled:'Cancelada',rescheduled:'Reprogramada (estado heredado)'};
 for(const [dimension,values] of [['Estado',report.statuses],['Mes',report.byMonth],['Responsable',report.byResponsible],['Sede',report.byLocation],['Origen',report.bySource],['Tipo de cita',report.byType]]){
  distribution.addRows(Object.entries(values||{}).sort(([a],[b])=>a.localeCompare(b)).map(([key,n])=>[dimension,dimension==='Estado'?labels[key]||key:key,n]));
 }
 distribution.getColumn(3).numFmt='#,##0';
 for(const ws of workbook.worksheets){ws.autoFilter={from:{row:1,column:1},to:{row:ws.rowCount,column:ws.columnCount}};ws.eachRow(row=>{row.alignment={vertical:'middle',wrapText:true};});}
 return workbook.xlsx.writeBuffer();
}
