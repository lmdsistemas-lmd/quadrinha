import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createApp} from '../server.mjs';
import {verifyWebhook} from '../payments.mjs';
import {createOperationalDatabase} from '../scripts/operational-database.mjs';

const fakeToken='TOKEN-ONLY-IN-TESTS',fakeSecret='WEBHOOK-SECRET-ONLY-IN-TESTS';
function signature(id,{ts=String(Date.now()),requestId='request-test'}={}){
 const digest=createHmac('sha256',fakeSecret).update(`id:${id};request-id:${requestId};ts:${ts};`).digest('hex');
 return {'x-signature':`ts=${ts},v1=${digest}`,'x-request-id':requestId};
}
async function fixture(t,{demo=false,operationalMode=false,databasePath=':memory:',failPreference=false}={}){
 const provider={preferences:[],payments:new Map(),calls:[],failPreference};
 const fetchImpl=async(url,options)=>{
  assert.ok(url.startsWith('https://api.mercadopago.com/'));assert.equal(options.headers.Authorization,'Bearer '+fakeToken);
  provider.calls.push({url,method:options.method});
  if(url.endsWith('/users/me'))return Response.json({id:123456,site_id:'MLB',email:'private-merchant@example.invalid'});
  if(url.endsWith('/checkout/preferences')){
   const body=JSON.parse(options.body);provider.preferences.push(body);
   assert.ok(options.headers['X-Idempotency-Key']);
   if(provider.failPreference)throw new Error('Transport error containing '+fakeToken);
   return Response.json({id:'pref-'+body.external_reference,external_reference:body.external_reference,init_point:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=live',sandbox_init_point:'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=test'});
  }
  const payment=provider.payments.get(url.split('/').at(-1));return payment?Response.json(payment):Response.json({error:'not_found'}, {status:404});
 };
 const server=await createApp({databasePath,operationalMode,paymentOptions:{config:{accessToken:fakeToken,webhookSecret:fakeSecret,environment:'test',enabled:true,publicUrl:'https://quadra.example.com'},fetchImpl}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const origin='http://127.0.0.1:'+server.address().port;let cookie='',csrf='';
 const request=async(path,body,method=body?'POST':'GET',headers={})=>{
  const response=await fetch(origin+'/api'+path,{method,headers:{'content-type':'application/json',cookie,'x-csrf-token':csrf,...headers},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];if(data.csrf)csrf=data.csrf;return {status:response.status,data};
 };
 const save=(module,data,id)=>request('/records/'+module+(id?'/'+id:''),data,id?'PUT':'POST');
 const setup=await request('/setup',{name:'Gestor',email:'gestor@example.com',password:'SenhaOperacionalTeste2026',demo});assert.equal(setup.status,200);
 const account=(await save('contas-bancarias',{name:'Conta de recebimento',status:'Ativo'})).data;
 assert.equal((await request('/finance/config',{accountId:account.id,installments:3},'PUT')).status,200);
 assert.equal((await request('/finance/verify',{})).status,200);
 const customer=(await save('clientes',{name:'Cliente teste',email:'cliente@example.com'})).data;
 const court=(await save('quadras',{name:'Quadra de teste'})).data;
 const booking=(await save('agenda',{courtId:court.id,customerId:customer.id,date:'2026-11-10',start:'18:00',end:'19:00',value:100,status:'Pendente'})).data;
 const checkout=()=>request('/payments/checkout',{module:'agenda',recordId:booking.id,amount:0.01});
 const payment=(overrides={})=>({id:90001,collector_id:123456,external_reference:provider.preferences.at(-1)?.external_reference,transaction_amount:100,currency_id:'BRL',status:'approved',live_mode:false,payment_method_id:'pix',date_approved:'2026-10-17T10:00:00.000-03:00',date_last_updated:'2026-10-17T13:00:00.000Z',transaction_amount_refunded:0,fee_details:[{amount:3.5}],...overrides});
 const webhook=(id='90001',headers=signature(id))=>request('/webhooks/mercadopago?data.id='+id,{type:'payment',data:{id}},'POST',{cookie:'','x-csrf-token':'',...headers});
 return {request,save,checkout,provider,payment,webhook,booking,account,customer,server,origin};
}

test('checkout usa valor do servidor, reutiliza preferência e não expõe credenciais',async t=>{
 const f=await fixture(t);const [first,second]=await Promise.all([f.checkout(),f.checkout()]);
 assert.equal(first.status,201);assert.equal(second.status,201);assert.equal(first.data.id,second.data.id);assert.equal(f.provider.preferences.length,1);
 const body=f.provider.preferences[0];assert.equal(body.items[0].unit_price,100);assert.equal(body.items[0].currency_id,'BRL');assert.equal(body.notification_url,'https://quadra.example.com/api/webhooks/mercadopago');
 assert.equal(first.data.checkoutUrl.startsWith('https://sandbox.mercadopago.com.br/'),true);
 const state=await f.request('/bootstrap');assert.ok(!JSON.stringify(state).includes(fakeToken));assert.ok(!JSON.stringify(state).includes(fakeSecret));assert.ok(!JSON.stringify(state).includes('private-merchant'));
 assert.equal((await f.request('/records/agenda/'+f.booking.id)).data.status,'Pendente');
 assert.equal((await f.save('agenda',{...f.booking,value:0.01},f.booking.id)).status,409);
 assert.equal((await f.request('/records/agenda/'+f.booking.id,{},'DELETE')).status,409);
 assert.equal((await f.save('cobrancas-agenda',{bookingId:f.booking.id,name:'Não duplicar',value:100,dueDate:'2026-11-10',status:'Recebido'})).status,409);
});

test('notificação inválida e retorno do checkout não confirmam recebimento',async t=>{
 const f=await fixture(t);await f.checkout();f.provider.payments.set('90001',f.payment());
 const before=f.provider.calls.length;
 assert.equal((await f.webhook('90001',{'x-signature':'ts=0,v1=bad','x-request-id':'invalid'})).status,401);
 assert.equal(f.provider.calls.length,before);
 await fetch(f.origin+'/?payment_id=90001&status=approved#pagamentos');
 assert.equal((await f.request('/records/agenda/'+f.booking.id)).data.status,'Pendente');
 assert.equal((await f.webhook()).status,200);
 assert.equal((await f.request('/records/agenda/'+f.booking.id)).data.status,'Recebido');
});

test('aprovação via webhook é idempotente, lança receita e taxa sem duplicação',async t=>{
 const f=await fixture(t);await f.checkout();f.provider.payments.set('90001',f.payment());
 assert.equal((await f.webhook()).status,200);assert.equal((await f.webhook()).status,200);
 assert.equal((await f.request('/payments/reconcile',{paymentId:'90001'})).status,200);
 const entries=(await f.request('/records/lancamentos')).data;
 assert.equal(entries.filter(row=>row.kind==='Receita'&&row.status==='Recebido').length,1);
 assert.equal(entries.find(row=>row.kind==='Receita').value,100);assert.equal(entries.find(row=>row.kind==='Receita').accountId,f.account.id);
 assert.equal(entries.find(row=>row.sourceModule==='mercadopago-taxas').value,3.5);
 assert.equal((await f.request('/bootstrap')).data.invoices[0].status,'paid');
});

test('conciliação recusa valor, moeda, recebedor e ambiente divergentes',async t=>{
 const f=await fixture(t);await f.checkout();
 for(const override of [{transaction_amount:1},{currency_id:'USD'},{collector_id:999},{live_mode:true}]){
  f.provider.payments.set('90001',f.payment(override));assert.equal((await f.request('/payments/reconcile',{paymentId:'90001'})).status,409);
 }
 assert.equal((await f.request('/records/agenda/'+f.booking.id)).data.status,'Pendente');
 assert.equal((await f.request('/records/lancamentos')).data.length,0);
 f.provider.payments.set('90001',f.payment({external_reference:'foreign-app'}));assert.equal((await f.webhook()).status,404);
});

test('pagamento pendente não gera receita; atualização atrasada não desfaz aprovação',async t=>{
 const f=await fixture(t);await f.checkout();f.provider.payments.set('90001',f.payment({status:'pending'}));
 assert.equal((await f.webhook()).status,200);assert.equal((await f.request('/records/lancamentos')).data.length,0);
 f.provider.payments.set('90001',f.payment({date_last_updated:'2026-10-17T14:00:00.000Z'}));await f.request('/payments/reconcile',{paymentId:'90001'});
 f.provider.payments.set('90001',f.payment({status:'pending',date_last_updated:'2026-10-17T12:00:00.000Z'}));await f.request('/payments/reconcile',{paymentId:'90001'});
 assert.equal((await f.request('/bootstrap')).data.invoices[0].status,'paid');
});

test('estorno parcial e total preservam histórico e não duplicam despesas',async t=>{
 const f=await fixture(t);await f.checkout();f.provider.payments.set('90001',f.payment());await f.webhook();
 f.provider.payments.set('90001',f.payment({transaction_amount_refunded:25,date_last_updated:'2026-10-17T15:00:00.000Z'}));await f.request('/payments/reconcile',{paymentId:'90001'});
 assert.equal((await f.request('/bootstrap')).data.invoices[0].status,'partially_refunded');
 f.provider.payments.set('90001',f.payment({status:'refunded',transaction_amount_refunded:100,date_last_updated:'2026-10-17T16:00:00.000Z'}));await f.request('/payments/reconcile',{paymentId:'90001'});await f.request('/payments/reconcile',{paymentId:'90001'});
 const snapshots=(await f.request('/bootstrap')).data.paymentEvents.filter(event=>event.type.startsWith('payment_')).map(event=>JSON.parse(event.snapshot));assert.ok(snapshots.some(snapshot=>snapshot.refundedCents===2500));assert.ok(snapshots.some(snapshot=>snapshot.refundedCents===10000));
 const entries=(await f.request('/records/lancamentos')).data;assert.equal(entries.filter(row=>row.sourceModule==='mercadopago-estornos').length,1);assert.equal(entries.find(row=>row.sourceModule==='mercadopago-estornos').value,100);
 assert.equal((await f.request('/records/agenda/'+f.booking.id)).data.status,'Estornado');assert.equal((await f.request('/bootstrap')).data.invoices[0].status,'refunded');
 assert.equal((await f.save('agenda',{...f.booking,status:'Pendente'},f.booking.id)).status,409);
 const refunded=(await f.request('/records/agenda/'+f.booking.id)).data;
 assert.equal((await f.save('agenda',{...refunded,notes:'Observação após estorno'},refunded.id)).status,200);
 assert.equal((await f.request('/records/lancamentos')).data.find(row=>row.kind==='Receita').status,'Recebido');
});

test('dois pagamentos aprovados exigem revisão sem segunda receita',async t=>{
 const f=await fixture(t);await f.checkout();f.provider.payments.set('90001',f.payment());await f.webhook();
 f.provider.payments.set('90002',f.payment({id:90002}));await f.request('/payments/reconcile',{paymentId:'90002'});
 assert.equal((await f.request('/bootstrap')).data.invoices[0].status,'review');
 assert.equal((await f.request('/records/lancamentos')).data.filter(row=>row.kind==='Receita'&&row.status==='Recebido').length,1);
});

test('resposta incerta não é repetida como nova cobrança e não vaza erro do provedor',async t=>{
 const f=await fixture(t,{failPreference:true});const first=await f.checkout();assert.equal(first.status,502);assert.ok(!JSON.stringify(first).includes(fakeToken));
 assert.equal((await f.checkout()).status,409);assert.equal(f.provider.preferences.length,1);assert.equal((await f.request('/bootstrap')).data.invoices[0].status,'review');
});

test('banco demonstrativo e homologação no banco operacional não geram checkout externo',async t=>{
 for(const options of [{demo:true},{operationalMode:true}]){
  const f=await fixture(t,options);assert.equal((await f.checkout()).status,409);assert.equal(f.provider.preferences.length,0);
 }
});

test('assinatura aceita o manifesto correto e recusa modificação e replay expirado',()=>{
 const id='90001',now=Date.now(),ts=String(now),headers=signature(id,{ts});
 const input={secret:fakeSecret,signature:headers['x-signature'],requestId:headers['x-request-id'],dataId:id,now};
 assert.equal(verifyWebhook(input),true);assert.equal(verifyWebhook({...input,dataId:'90002'}),false);assert.equal(verifyWebhook({...input,now:now+11*60000}),false);assert.equal(verifyWebhook({...input,requestId:'changed'}),false);
});

test('permissões financeiras impedem consulta de gravar e atendente de configurar credenciais',async t=>{
 const f=await fixture(t);
 await f.save('usuarios',{name:'Consulta',email:'consulta@example.com',password:'SenhaConsultaTeste2026',role:'Consulta'});
 await f.save('usuarios',{name:'Atendente',email:'atendente@example.com',password:'SenhaAtendenteTeste2026',role:'Atendente'});
 await f.request('/logout',{});await f.request('/login',{email:'consulta@example.com',password:'SenhaConsultaTeste2026'});
 assert.equal((await f.checkout()).status,403);assert.equal((await f.request('/payments/reconcile',{paymentId:'90001'})).status,403);
 await f.request('/logout',{});await f.request('/login',{email:'atendente@example.com',password:'SenhaAtendenteTeste2026'});
 assert.equal((await f.request('/finance/verify',{})).status,403);assert.equal((await f.request('/finance/config',{accountId:f.account.id,installments:12},'PUT')).status,403);
 assert.equal((await f.checkout()).status,201);
});

test('sessões persistem no reinício e logout revoga a sessão no banco',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'qf-session-'));t.after(()=>rm(dir,{recursive:true,force:true}));const databasePath=join(dir,'sessions.sqlite');
 const first=await createApp({databasePath});await new Promise(resolve=>first.listen(0,'127.0.0.1',resolve));
 const response=await fetch('http://127.0.0.1:'+first.address().port+'/api/setup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Gestor',email:'session@example.com',password:'SenhaSessaoTeste2026',demo:false})});
 const cookie=response.headers.get('set-cookie').split(';')[0],{csrf}=await response.json();await new Promise(resolve=>first.close(resolve));
 const db=new DatabaseSync(databasePath,{readOnly:true});assert.notEqual(db.prepare('SELECT token_hash FROM sessions').get().token_hash,cookie.split('=')[1]);db.close();
 const second=await createApp({databasePath});await new Promise(resolve=>second.listen(0,'127.0.0.1',resolve));
 try{
  const origin='http://127.0.0.1:'+second.address().port;
  assert.equal((await fetch(origin+'/api/bootstrap',{headers:{cookie}})).status,200);
  assert.equal((await fetch(origin+'/api/logout',{method:'POST',headers:{cookie,'x-csrf-token':csrf,'content-type':'application/json'},body:'{}'})).status,200);
  assert.equal((await fetch(origin+'/api/bootstrap',{headers:{cookie}})).status,401);
 }finally{await new Promise(resolve=>second.close(resolve));}
});

test('banco operacional novo preserva contas, mantém origem e não copia dados fictícios',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'qf-operation-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const source=join(dir,'demo.sqlite'),destination=join(dir,'operational.sqlite');
 const f=await fixture(t,{databasePath:source,demo:true});
 const result=await createOperationalDatabase({source,destination});assert.equal(result.accounts,1);
 const target=new DatabaseSync(destination,{readOnly:true});try{
  assert.equal(target.prepare('SELECT count(*) AS count FROM records').get().count,0);
  assert.equal(target.prepare('SELECT count(*) AS count FROM invoices').get().count,0);
  assert.equal(target.prepare('SELECT count(*) AS count FROM users').get().count,1);
  assert.equal(target.prepare("SELECT data FROM settings WHERE key='demo'").get().data,'false');
 }finally{target.close();}
 assert.ok((await f.request('/records/agenda')).data.length>=28);
 await assert.rejects(createOperationalDatabase({source,destination}),/já existe/);
 const server=await createApp({databasePath:destination});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'gestor@example.com',password:'SenhaOperacionalTeste2026'})});assert.equal(response.status,200);}finally{await new Promise(resolve=>server.close(resolve));}
});
