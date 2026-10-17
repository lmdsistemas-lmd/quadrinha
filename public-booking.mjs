import {randomUUID} from 'node:crypto';
import {openingHours} from './modules.mjs';
import {fail} from './platform-security.mjs';
const dayNames=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const minutes=value=>Number(value.slice(0,2))*60+Number(value.slice(3));
const clock=value=>String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
const dayValid=value=>{try{return /^\d{4}-\d{2}-\d{2}$/.test(value)&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}catch{return false;}};
export function createPublicBooking({store,engine,tenant}){
 const b=engine.business;
 function availability(date){
  if(!dayValid(date)||date<today()||Date.parse(date+'T12:00:00Z')>Date.parse(today()+'T12:00:00Z')+90*86400000)throw fail('Escolha uma data entre hoje e os próximos 90 dias.');
  const config=store.portal(tenant),hours=openingHours(b.rows('horarios'),date),weekday=dayNames[new Date(date+'T12:00:00Z').getUTCDay()];
  if(hours.closed)return [];
  const current=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
  const bookings=b.rows('agenda').filter(x=>x.date===date&&x.status!=='Cancelado'),blocks=b.rows('bloqueios-quadras');
  return b.rows('quadras').filter(c=>c.status==='Ativo'&&c.online==='Sim').map(court=>{
   const linked=new Set([court.id]);for(const block of blocks){if(block.primaryCourtId===court.id)linked.add(block.secondaryCourtId);if(block.secondaryCourtId===court.id)linked.add(block.primaryCourtId);}
   const rates=b.rows('tarifas').filter(rate=>rate.status==='Ativo'&&rate.courtId===court.id&&rate.kind==='Avulsa'&&(!rate.modality||rate.modality==='Avulsa')&&(!rate.days?.length||rate.days.includes(weekday))&&(!rate.duration||rate.duration==='Todas'||{'30 minutos':30,'1 hora':60,'1h30':90,'2 horas':120}[rate.duration]===config.duration));
   const slots=[];for(let start=minutes(hours.start);start+(config.duration||60)<=minutes(hours.end);start+=30){const end=start+(config.duration||60);if(date===today()&&start<=minutes(current))continue;if(bookings.some(row=>linked.has(row.courtId)&&start<minutes(row.end)&&end>minutes(row.start)))continue;const rate=rates.filter(row=>start>=minutes(row.start)&&end<=minutes(row.end)&&Number(row.value)>0).sort((a,b)=>a.id.localeCompare(b.id))[0];if(rate)slots.push({start:clock(start),end:clock(end),tariffId:rate.id,amountCents:Math.round(rate.value*(end-start)/60*100)});}
   return {id:court.id,name:court.name,sport:court.sport,covered:court.covered,notes:court.notes||'',showNotes:court.showNotes==='Sim',notesTitle:court.notesTitle||'Observações',notesRequired:court.notesRequired==='Sim',slots};
  });
 }
 const ownBookings=account=>store.db.prepare('SELECT booking_id FROM public_bookings WHERE tenant_id=? AND account_id=? ORDER BY created_at DESC').all(tenant.id,account.id).map(row=>{const booking=b.get('agenda',row.booking_id);if(!booking)return null;const invoice=b.payments.list().find(x=>x.sourceModule==='agenda'&&x.sourceId===booking.id);return {id:booking.id,court:b.get('quadras',booking.courtId)?.name,date:booking.date,start:booking.start,end:booking.end,value:booking.value,status:booking.status,invoice:invoice?{id:invoice.id,status:invoice.status,checkoutUrl:invoice.status==='pending'&&Date.parse(invoice.expiresAt)>Date.now()?invoice.checkoutUrl:null,payments:invoice.payments.map(p=>({id:p.id,status:p.status,method:p.method}))}:null};}).filter(Boolean);
 function reserve(account,input){
  if(!/^[a-f0-9-]{16,80}$/.test(input.idempotencyKey||''))throw fail('Atualize a página e tente novamente.');
  const previous=store.db.prepare('SELECT booking_id FROM public_bookings WHERE tenant_id=? AND account_id=? AND idempotency_key=?').get(tenant.id,account.id,input.idempotencyKey);if(previous)return ownBookings(account).find(x=>x.id===previous.booking_id);
  const id='portal-'+account.id+'-'+input.idempotencyKey;const recovered=b.get('agenda',id);if(recovered){store.db.prepare('INSERT OR IGNORE INTO public_bookings VALUES(?,?,?,?,?)').run(tenant.id,account.id,id,input.idempotencyKey,store.now());return ownBookings(account).find(x=>x.id===id);}
  const court=availability(input.date).find(x=>x.id===input.courtId),slot=court?.slots.find(x=>x.start===input.start&&x.tariffId===input.tariffId);if(!slot)throw fail('O horário não está mais disponível. Atualize a agenda.',409);
  const notes=typeof input.notes==='string'?input.notes.trim().slice(0,1000):'';if(court.showNotes&&court.notesRequired&&!notes)throw fail('Preencha as observações exigidas pela quadra.');
  // Link and reservation are durable in the business database; a recovery lookup prevents an orphan on an interrupted master write.
  let link=store.db.prepare('SELECT local_id FROM customer_links WHERE tenant_id=? AND account_id=?').get(tenant.id,account.id);
  if(!link){const localId='portal-'+account.id;if(!b.get('clientes',localId))b.saveRecord('clientes',{name:account.name,email:account.email,kind:'Pessoa física',status:'Ativo'},localId);store.db.prepare('INSERT OR IGNORE INTO customer_links VALUES(?,?,?)').run(tenant.id,account.id,localId);link={local_id:localId};}
  let booking=b.get('agenda',id);if(!booking)booking=b.saveRecord('agenda',{courtId:court.id,customerId:link.local_id,date:input.date,start:slot.start,end:slot.end,tariffId:slot.tariffId,kind:'Avulsa',status:'Pendente',notes:notes?'Reserva online · '+notes:'Reserva online'},id);
  store.db.prepare('INSERT OR IGNORE INTO public_bookings VALUES(?,?,?,?,?)').run(tenant.id,account.id,id,input.idempotencyKey,store.now());
  const notification='booking-'+id;store.db.prepare('INSERT OR IGNORE INTO notifications VALUES(?,?,?,?,?,NULL,?)').run(notification,tenant.id,'','Nova reserva online',court.name+' · '+input.date+' · '+slot.start+'–'+slot.end,store.now());
  return ownBookings(account).find(x=>x.id===id);
 }
 function owned(account,id){const booking=ownBookings(account).find(x=>x.id===id);if(!booking)throw fail('Reserva não encontrada.',404);return booking;}
 async function checkout(account,id){owned(account,id);return b.payments.createCheckout('agenda',id,account.id);}
 async function reconcile(account,id,paymentId){const booking=owned(account,id);if(!/^\d{1,30}$/.test(String(paymentId||'')))throw fail('Pagamento inválido.');const invoice=b.payments.list().find(x=>x.sourceModule==='agenda'&&x.sourceId===id);if(!invoice)throw fail('A reserva não possui cobrança online.',409);
  // Do not let a public customer query arbitrary payments. Stored IDs or a payment whose external reference matches this invoice are required.
  if(!invoice.payments.some(x=>x.id===String(paymentId)))throw fail('Aguarde a notificação do Mercado Pago. A consulta estará disponível após o primeiro retorno confirmado.',409);
  await b.payments.reconcile(String(paymentId),account.id);return ownBookings(account).find(x=>x.id===booking.id);
 }
 return {availability,ownBookings,reserve,checkout,reconcile};
}
