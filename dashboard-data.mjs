import {openingHours} from './modules.mjs';

export const revenueSeries=[
 {key:'bookings',label:'Reservas',color:'#2e4b82'},
 {key:'snack',label:'Lanchonete',color:'#f3ae31'},
 {key:'school',label:'Mensalidades e Aulas de Escolinha',color:'#65bfd4'},
 {key:'manual',label:'Lançamentos',color:'#777777'},
 {key:'members',label:'Mensalidades de Sócios',color:'#ec7777'},
 {key:'charges',label:'Cobranças Avulso',color:'#ee7f18'},
 {key:'credits',label:'Créditos de Cliente',color:'#b18de0'},
 {key:'dayuse',label:'Day Use',color:'#b49ad8'}
];
const rounded=value=>Math.round(value*100)/100;
const sum=rows=>rounded(rows.reduce((value,row)=>value+Number(row.value||0),0));
const minutes=time=>Number(time.slice(0,2))*60+Number(time.slice(3));
const duration=row=>(minutes(row.end)-minutes(row.start))/60;
const addDays=(day,offset)=>new Date(Date.parse(day+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10);

export function dashboardModel(records,{from,to,today}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to)throw new Error('Período inválido.');
 for(const date of [from,to])if(new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw new Error('Período inválido.');
 const days=Math.round((Date.parse(to)-Date.parse(from))/86400000)+1;if(days>366)throw new Error('Selecione até 366 dias.');
 const all=key=>records[key]||[],byId=(key,id)=>all(key).find(row=>row.id===id);
 const sourceSeries=row=>{
  if(['agenda','cobrancas-agenda'].includes(row.sourceModule)){
   const charge=row.sourceModule==='cobrancas-agenda'?byId('cobrancas-agenda',row.sourceId):null;
   const booking=byId('agenda',charge?.bookingId||row.sourceId);return booking?.kind==='Day Use'?'dayuse':'bookings';
  }
  return ({'pedidos-lanchonete':'snack','mensalidades-aulas':'school','cobrancas-aulas':'school','cobrancas-socios':'members','cobrancas-avulso':'charges',creditos:'credits'})[row.sourceModule]||'manual';
 };
 const calculate=(start,end)=>{
  const within=row=>row.date>=start&&row.date<=end;
  const bookings=all('agenda').filter(row=>within(row)&&!['Cancelado','Estornado'].includes(row.status));
  const entries=all('lancamentos').filter(row=>within(row)&&row.status==='Recebido');
  const income=entries.filter(row=>row.kind==='Receita'),expenses=entries.filter(row=>row.kind==='Despesa');
  const revenue=sum(income),profit=rounded(revenue-sum(expenses));
  const courts=all('quadras').filter(row=>row.status==='Ativo');let capacity=0;
  for(let day=start;day<=end;day=addDays(day,1)){const hours=openingHours(all('horarios'),day);if(!hours.closed)capacity+=(minutes(hours.end)-minutes(hours.start))/60*courts.length;}
  const hours=bookings.reduce((value,row)=>value+duration(row),0);
  // Booking-linked charges are represented once, by their booking.
  const receivables=[...bookings.map(row=>({...row,dueDate:row.date})),...['cobrancas-avulso','cobrancas-socios','mensalidades-aulas','cobrancas-aulas'].flatMap(key=>all(key).filter(row=>row.dueDate>=start&&row.dueDate<=end&&!['Cancelado','Estornado'].includes(row.status)))];
  const overdue=receivables.filter(row=>row.status==='Pendente'&&row.dueDate<today),totalBillable=sum(receivables);
  const customers=new Set(overdue.map(row=>row.customerId||byId('socios',row.memberId)?.customerId||byId('matriculas',row.registrationId)?.customerId).filter(Boolean));
  const newCustomers=all('clientes').filter(row=>{if(!row.createdAt)return false;const date=new Date(row.createdAt).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});return date>=start&&date<=end;}).length;
  return {bookings,income,expenses,revenue,profit,hours,capacity,occupancy:capacity?hours/capacity*100:0,
   overdue:sum(overdue),overdueCustomers:customers.size,delinquency:totalBillable?sum(overdue)/totalBillable*100:0,
   ticket:income.length?revenue/income.length:0,newCustomers,margin:revenue?profit/revenue*100:0};
 };
 const current=calculate(from,to),previous=calculate(addDays(from,-days),addDays(from,-1));
 const series=revenueSeries.map(def=>({...def,value:sum(current.income.filter(row=>sourceSeries(row)===def.key))}));
 const daily=[];
 for(let day=from;day<=to;day=addDays(day,1)){
  const income=current.income.filter(row=>row.date===day);daily.push({date:day,total:sum(income),...Object.fromEntries(series.map(def=>[def.key,sum(income.filter(row=>sourceSeries(row)===def.key))]))});
 }
 const courtTotals=all('quadras').map(court=>({name:court.name,value:sum(current.bookings.filter(row=>row.courtId===court.id&&row.kind!=='Aula'))})).sort((a,b)=>b.value-a.value);
 const hourTotals=new Map(),weekdayTotals=new Map();
 for(const row of current.bookings){hourTotals.set(row.start,(hourTotals.get(row.start)||0)+1);const day=new Date(row.date+'T12:00:00Z').getUTCDay();weekdayTotals.set(day,(weekdayTotals.get(day)||0)+1);}
 const popularHour=[...hourTotals].sort((a,b)=>b[1]-a[1])[0],popularDay=[...weekdayTotals].sort((a,b)=>b[1]-a[1])[0];
 return {current,previous,daily,series:series.filter(def=>def.value>0),allSeries:series,topCourt:courtTotals[0]?.value?courtTotals[0]:null,popularHour,popularDay,
  change:key=>previous[key]===0?null:(current[key]-previous[key])/Math.abs(previous[key])*100};
}
