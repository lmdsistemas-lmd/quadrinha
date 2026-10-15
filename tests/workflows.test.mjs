import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,posix,win32} from 'node:path';
import {createApp,isWithinDirectory} from '../server.mjs';
async function fixture(t,{databasePath=':memory:'}={}){
 const server=await createApp({databasePath});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(async()=>{await new Promise(resolve=>server.close(resolve));});
 const origin='http://127.0.0.1:'+server.address().port;let cookie='',csrf='';
 async function request(path,body,method=body?'POST':'GET',extra={}){
  const res=await fetch(origin+'/api'+path,{method,headers:{'content-type':'application/json',cookie,'x-csrf-token':csrf,origin,...extra},body:body?JSON.stringify(body):undefined});
  const data=await res.json();const set=res.headers.get('set-cookie');if(set)cookie=set.split(';')[0];if(data.csrf)csrf=data.csrf;return{status:res.status,data};
 }
 const setup=()=>request('/setup',{name:'Gestor de teste',email:'gestor@example.com',password:'SenhaDeTeste-2026',demo:false});
 const save=(key,data,id)=>request('/records/'+key+(id?'/'+id:''),data,id?'PUT':'POST');
 async function base(){await setup();const c=(await save('quadras',{name:'Quadra teste',floor:'Areia',sport:'Beach Tennis',covered:'Sim',online:'Sim',status:'Ativo'})).data;const customer=(await save('clientes',{name:'Cliente teste',kind:'Pessoa física',email:'cliente@example.com'})).data;return{court:c,customer};}
 return{server,request,setup,save,base,origin};
}
test('página inicial e recursos públicos carregam sem autenticação',async t=>{
 const f=await fixture(t);
 const resources=[['/','text/html'],['/app.js','text/javascript'],['/style.css','text/css'],['/favicon.svg','image/svg+xml'],['/modules.mjs','text/javascript']];
 for(const [path,type] of resources){
  const response=await fetch(f.origin+path);assert.equal(response.status,200,path);assert.ok(response.headers.get('content-type').startsWith(type),path);
  const body=await response.text();assert.ok(body.length>0,path);if(path==='/')assert.match(body,/<script type="module" src="\/app.js"><\/script>/);
 }
 const head=await fetch(f.origin+'/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 for(const path of ['/server.mjs','/nao-existe.js']){const response=await fetch(f.origin+path);assert.equal(response.status,404);await response.text();}
});
test('arquivos públicos são reconhecidos em caminhos Windows e POSIX sem permitir escape',()=>{
 for(const [paths,directory] of [[win32,'C:\\Users\\Teste\\Minha Quadra\\public'],[posix,'/home/teste/Minha Quadra/public']]){
  for(const asset of ['index.html','app.js','style.css','images/logo.svg','..icone.svg'])assert.equal(isWithinDirectory(directory,paths.join(directory,asset),paths),true,asset);
  for(const outside of [directory,paths.resolve(directory,'../server.mjs'),paths.resolve(directory,'../public-backup/index.html')])assert.equal(isWithinDirectory(directory,outside,paths),false,outside);
 }
 assert.equal(isWithinDirectory('C:\\quadrinha\\public','D:\\quadrinha\\public\\index.html',win32),false);
 assert.equal(isWithinDirectory('C:\\Quadrinha\\public','c:\\quadrinha\\public\\index.html',win32),true);
});
test('acesso inicial, sessão, CSRF e restrição de origem',async t=>{
 const f=await fixture(t);assert.equal((await f.request('/bootstrap')).status,401);
 assert.equal((await f.request('/session')).data.needsSetup,true);
 assert.equal((await f.setup()).status,200);assert.equal((await f.setup()).status,409);
 assert.equal((await f.request('/bootstrap')).status,200);
 assert.equal((await f.request('/records/clientes',{name:'Teste'},'POST',{'x-csrf-token':'incorreto'})).status,403);
 assert.equal((await f.request('/records/clientes',{name:'Teste'},'POST',{origin:'https://outro.example'})).status,403);
 assert.equal((await f.request('/logout',{})).status,200);assert.equal((await f.request('/bootstrap')).status,401);
 assert.equal((await f.request('/login',{email:'gestor@example.com',password:'incorreta'})).status,401);
 assert.equal((await f.request('/login',{email:'gestor@example.com',password:'SenhaDeTeste-2026'})).status,200);
});
test('reservas impedem sobreposição, permitem horários adjacentes e calculam a tarifa no servidor',async t=>{
 const f=await fixture(t),{court,customer}=await f.base();
 const rate=(await f.save('tarifas',{name:'Tarifa teste',courtId:court.id,value:160,start:'07:00',end:'23:00',status:'Ativo'})).data;
 const booking={courtId:court.id,customerId:customer.id,date:'2026-10-20',start:'18:00',end:'19:00',tariffId:rate.id,value:1,status:'Pendente'};
 const first=await f.save('agenda',booking);assert.equal(first.status,201);assert.equal(first.data.value,160);
 assert.equal((await f.save('agenda',{...booking,start:'18:30',end:'19:30'})).status,409);
 assert.equal((await f.save('agenda',{...booking,start:'19:00',end:'19:30'})).data.value,80);
 assert.equal((await f.save('agenda',{...booking,date:'2026-02-30'})).status,400);
 assert.equal((await f.save('agenda',{...booking,date:'2026-10-21',start:'06:00',end:'07:00'})).status,400);
 assert.equal((await f.request('/records/quadras/'+court.id,{},'DELETE')).status,409);
});
test('uma recorrência com conflito é revertida integralmente',async t=>{
 const f=await fixture(t),{court,customer}=await f.base();const booking={courtId:court.id,customerId:customer.id,date:'2026-10-27',start:'18:00',end:'19:00',value:120,status:'Pendente'};
 assert.equal((await f.save('agenda',booking)).status,201);
 assert.equal((await f.save('agenda',{...booking,date:'2026-10-20',recurrenceWeeks:3})).status,409);
 assert.equal((await f.request('/records/agenda')).data.length,1);
 const series=await f.save('agenda',{...booking,date:'2026-10-20',start:'20:00',end:'21:00',recurrenceWeeks:3});assert.equal(series.status,201);assert.equal(series.data.records.length,3);
 assert.equal((await f.request('/records/agenda')).data.length,4);
});
test('recebimentos são idempotentes e cobranças de reserva não duplicam receita',async t=>{
 const f=await fixture(t),{court,customer}=await f.base();const booking=(await f.save('agenda',{courtId:court.id,customerId:customer.id,date:'2026-10-20',start:'18:00',end:'19:00',value:150,status:'Pendente'})).data;
 const charge=await f.save('cobrancas-agenda',{bookingId:booking.id,name:'Reserva 20/10',value:150,dueDate:'2026-10-20',status:'Recebido'});assert.equal(charge.status,201);
 assert.equal((await f.save('cobrancas-agenda',{...charge.data,status:'Recebido'},charge.data.id)).status,200);
 assert.equal((await f.save('agenda',{...booking,status:'Recebido',value:151},booking.id)).status,409);
 assert.equal((await f.save('cobrancas-agenda',{bookingId:booking.id,name:'Duplicada',value:150,dueDate:'2026-10-20',status:'Recebido'})).status,409);
 assert.equal((await f.request('/records/agenda/'+booking.id)).data.status,'Recebido');
 const entries=(await f.request('/records/lancamentos')).data;assert.equal(entries.filter(x=>x.status==='Recebido').length,1);assert.equal(entries[0].value,150);
 assert.equal((await f.request('/records/lancamentos/'+entries[0].id,{},'DELETE')).status,409);
});
test('pedidos controlam estoque, não baixam novamente ao receber e cancelamento aberto devolve produtos',async t=>{
 const f=await fixture(t);await f.setup();const product=(await f.save('produtos-lanchonete',{name:'Água',cost:2,value:5,stock:10,status:'Ativo'})).data;
 const order=(await f.save('pedidos-lanchonete',{date:'2026-10-20',items:[{productId:product.id,quantity:3}],status:'Aberto'})).data;
 assert.equal(order.value,15);assert.equal((await f.request('/records/produtos-lanchonete')).data[0].stock,7);
 assert.equal((await f.save('pedidos-lanchonete',{...order,status:'Recebido'},order.id)).status,200);
 assert.equal((await f.request('/records/produtos-lanchonete')).data[0].stock,7);
 assert.equal((await f.save('pedidos-lanchonete',{date:'2026-10-20',items:[{productId:product.id,quantity:99}],status:'Aberto'})).status,409);
 assert.equal((await f.request('/records/produtos-lanchonete')).data[0].stock,7);
 const open=(await f.save('pedidos-lanchonete',{date:'2026-10-20',items:[{productId:product.id,quantity:2}],status:'Aberto'})).data;
 await f.save('pedidos-lanchonete',{...open,status:'Cancelado'},open.id);assert.equal((await f.request('/records/produtos-lanchonete')).data[0].stock,7);
});
test('turmas respeitam vagas e impedem matrícula duplicada',async t=>{
 const f=await fixture(t),{court,customer}=await f.base();const c=(await f.save('escolinha',{name:'Turma teste',teacher:'Professor',courtId:court.id,start:'08:00',end:'09:00',capacity:1,value:200,status:'Ativo'})).data;
 const registration={classId:c.id,customerId:customer.id,date:'2026-10-20',status:'Ativo'};
 assert.equal((await f.save('matriculas',registration)).status,201);assert.equal((await f.save('matriculas',registration)).status,409);
 const other=(await f.save('clientes',{name:'Outro cliente'})).data;assert.equal((await f.save('matriculas',{...registration,customerId:other.id})).status,409);
});
test('usuários de consulta não podem alterar registros e o último administrador é preservado',async t=>{
 const f=await fixture(t);await f.setup();const admin=(await f.request('/session')).data.user;
 assert.equal((await f.save('usuarios',{...admin,role:'Consulta'},admin.id)).status,409);
 const reader=await f.save('usuarios',{name:'Leitor',email:'leitor@example.com',password:'SenhaDeConsulta2026',role:'Consulta'});assert.equal(reader.status,200);assert.ok(!('password'in reader.data));
 await f.request('/logout',{});await f.request('/login',{email:'leitor@example.com',password:'SenhaDeConsulta2026'});
 assert.equal((await f.request('/bootstrap')).status,200);assert.equal((await f.save('clientes',{name:'Tentativa'})).status,403);assert.equal((await f.request('/records/usuarios')).status,403);
});
test('os dados continuam após reiniciar o servidor com o mesmo banco',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'qf-persist-'));t.after(()=>rm(dir,{recursive:true,force:true}));const databasePath=join(dir,'test.sqlite');
 const server1=await createApp({databasePath});server1.listen(0,'127.0.0.1');await once(server1,'listening');const origin='http://127.0.0.1:'+server1.address().port;
 const res=await fetch(origin+'/api/setup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Gestor',email:'persist@example.com',password:'SenhaPersistencia2026',demo:true})});assert.equal(res.status,200);await res.json();await new Promise(resolve=>server1.close(resolve));
 const f=await fixture(t,{databasePath});assert.equal((await f.request('/session')).data.needsSetup,false);assert.equal((await f.request('/login',{email:'persist@example.com',password:'SenhaPersistencia2026'})).status,200);
 const data=(await f.request('/bootstrap')).data;assert.equal(data.records.quadras.length,3);assert.equal(data.records.agenda.length,28);assert.equal(data.settings.demo,true);
});
