import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {readFile,mkdir} from 'node:fs/promises';
import path,{dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {modules,moduleMap,settings,openingHours,summarizeReport} from './modules.mjs';
import {migratePayments,createPaymentService} from './payments.mjs';
const root=dirname(fileURLToPath(import.meta.url));
export function isWithinDirectory(directory,filename,paths=path){
 const relative=paths.relative(paths.resolve(directory),paths.resolve(filename));
 return relative!==''&&relative!=='..'&&!relative.startsWith('..'+paths.sep)&&!paths.isAbsolute(relative);
}
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const money=x=>Math.round(Number(x)*100)/100;
const dayValid=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
const minutes=x=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(x||''))throw fail('Horário inválido.');return Number(x.slice(0,2))*60+Number(x.slice(3));};
const hashPassword=(password,salt=randomBytes(16).toString('hex'))=>salt+':'+scryptSync(password,salt,64).toString('hex');
const verifyPassword=(password,hash)=>{const[salt,expected]=hash.split(':');const bytes=scryptSync(password,salt,64);return timingSafeEqual(bytes,Buffer.from(expected,'hex'));};
export async function createApp({databasePath=join(root,'data','quadrafacil.sqlite'),secureCookies=process.env.NODE_ENV==='production',operationalMode=process.env.QF_MODE==='operational',paymentOptions={},managedAuth=null,managedUsers=null}={}){
 if(databasePath!==':memory:')await mkdir(dirname(databasePath),{recursive:true});
 const db=new DatabaseSync(databasePath);db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 db.exec(`CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,module TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL,deleted_at TEXT);CREATE INDEX IF NOT EXISTS records_module ON records(module,deleted_at);CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL);CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,data TEXT NOT NULL);CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,time TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,module TEXT NOT NULL,record_id TEXT NOT NULL);`);
 db.exec('CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,name TEXT NOT NULL,module TEXT NOT NULL,content BLOB NOT NULL,created_at TEXT NOT NULL,record_count INTEGER NOT NULL)');
 migratePayments(db);
 operationalMode=operationalMode||db.prepare("SELECT data FROM settings WHERE key='deployment'").get()?.data==='"operational"';
 if(operationalMode&&db.prepare("SELECT data FROM settings WHERE key='demo'").get()?.data==='true'){db.close();throw fail('O banco de demonstração não pode iniciar em modo operacional. Use npm run db:operational.');}
 if(operationalMode)db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run('deployment','"operational"');
 const userColumns=new Set(db.prepare('PRAGMA table_info(users)').all().map(x=>x.name));
 for(const column of ['created_at','last_login'])if(!userColumns.has(column))db.exec('ALTER TABLE users ADD COLUMN '+column+' TEXT');
 const sessionHash=token=>createHash('sha256').update(token||'').digest('hex');
 const sessions={get:token=>{const row=db.prepare('SELECT user_id AS userId,csrf,expires_at AS expires FROM sessions WHERE token_hash=?').get(sessionHash(token));return row;},set:(token,row)=>db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(sessionHash(token),row.userId,row.csrf,row.expires),delete:token=>db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sessionHash(token))};
 db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
 const attempts=new Map();
 const rows=key=>db.prepare('SELECT * FROM records WHERE module=? AND deleted_at IS NULL ORDER BY created_at DESC').all(key).map(r=>({id:r.id,...JSON.parse(r.data),createdAt:r.created_at}));
 const publicUsers=()=>managedUsers?managedUsers():db.prepare('SELECT id,name,email,role,created_at AS createdAt,last_login AS lastLogin FROM users ORDER BY name').all();
 const get=(key,id)=>rows(key).find(r=>r.id===id);
 const put=(key,id,data)=>{const{createdAt,...clean}=data;db.prepare('INSERT INTO records(id,module,data,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,deleted_at=NULL').run(id,key,JSON.stringify(clean),createdAt||new Date().toISOString());};
 const audit=(actor,action,key,id)=>db.prepare('INSERT INTO audit(time,actor,action,module,record_id) VALUES(?,?,?,?,?)').run(new Date().toISOString(),actor,action,key,id);
 const transaction=fn=>{db.exec('BEGIN IMMEDIATE');try{const v=fn();db.exec('COMMIT');return v;}catch(e){db.exec('ROLLBACK');throw e;}};
 const adjustStock=(id,amount)=>{const p=get('produtos-lanchonete',id);if(!p)throw fail('Produto não encontrado.');const stock=Number(p.stock||0)+amount;if(stock<0)throw fail('Estoque insuficiente para '+p.name+'.',409);put('produtos-lanchonete',id,{...p,stock});};
 const syncLedger=(key,id,data)=>{
  if(!['agenda','pedidos-lanchonete','cobrancas-avulso','cobrancas-socios','cobrancas-agenda','mensalidades-aulas','cobrancas-aulas'].includes(key))return;
  const ledgerId='recebimento-'+id;
  if(data.status==='Recebido'){
   // Booking charges and the booking itself must not generate duplicate receipts.
   if(key==='agenda'&&data.receivedChargeId)return;
   if(key==='cobrancas-agenda'){
    const booking=get('agenda',data.bookingId);
    if(booking.status==='Cancelado')throw fail('A reserva está cancelada.',409);
    if(booking.status==='Recebido'&&booking.receivedChargeId!==id)throw fail('Esta reserva já foi recebida. Não duplique o recebimento.',409);
    if(rows('cobrancas-agenda').some(x=>x.id!==id&&x.bookingId===data.bookingId&&x.status==='Recebido'))throw fail('Esta reserva já possui uma cobrança recebida.',409);
    if(money(data.value)!==money(booking.value))throw fail('Esta versão aceita apenas o recebimento integral da reserva.');
    put('agenda',booking.id,{...booking,status:'Recebido',receivedChargeId:id});
   }
   if(key==='agenda'&&rows('cobrancas-agenda').some(x=>x.bookingId===id&&x.status==='Recebido'))throw fail('Esta reserva já possui uma cobrança recebida.',409);
   put('lancamentos',ledgerId,{name:data.name||`${moduleMap[key].title} · ${data.date||data.dueDate||''}`,value:data.value,date:data.date||new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}),kind:'Receita',status:'Recebido',sourceModule:key,sourceId:id});
  }else{const old=get('lancamentos',ledgerId);if(old)put('lancamentos',ledgerId,{...old,status:'Cancelado'});
   if(key==='cobrancas-agenda'){const booking=get('agenda',data.bookingId);if(booking?.receivedChargeId===id){const{receivedChargeId,...rest}=booking;put('agenda',booking.id,{...rest,status:'Pendente'});}}
  }
 };
 const validate=(key,input,old)=>{
  const def=moduleMap[key];if(!def)throw fail('Módulo não encontrado.',404);
  const d={};
  for(const f of def.fields){
   let value=input[f.key]??old?.[f.key]??(f.type==='select'?f.options[0]:f.type==='number'?0:'');
   if(f.type==='multi'){
    if(value==='')value=[];
    if(!Array.isArray(value)||value.some(x=>!f.options.includes(x)))throw fail('Seleção inválida para '+f.label+'.');
    d[f.key]=[...new Set(value)];continue;
   }
   if(f.type==='checkbox'){d[f.key]=value===true||value==='on'||value==='true';continue;}
   if(f.type==='items'){
    if(!Array.isArray(value)||!value.length||value.length>100)throw fail('Adicione entre 1 e 100 itens ao pedido.');
    d.items=value.map(item=>{const product=get('produtos-lanchonete',item.productId);if(!product)throw fail('Produto inválido.');const quantity=Number(item.quantity);if(!Number.isInteger(quantity)||quantity<=0||quantity>10000)throw fail('Quantidade de produto inválida.');return{productId:product.id,name:product.name,quantity,unitPrice:old?.items?.find(x=>x.productId===product.id)?.unitPrice??product.value};});continue;
   }
   if(typeof value==='object')throw fail('Formato inválido para '+f.label+'.');
   if(f.type==='money'||f.type==='number'){
    if(value==='')value=0;value=Number(value);
    if(!Number.isFinite(value)||value<0||value>1e9)throw fail('Valor inválido para '+f.label+'.');
    if(f.type==='money')value=money(value);
   }else value=String(value).trim();
   if(f.required&&(value===''||value==null))throw fail(f.label+' é obrigatório.');
   if(typeof value==='string'&&value.length>5000)throw fail('Texto muito longo para '+f.label+'.');
   if(f.type==='date'&&value&&!dayValid(value))throw fail('Data inválida para '+f.label+'.');
   if(f.type==='time'&&value)minutes(value);
   if(f.type==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw fail('E-mail inválido.');
   if(f.type==='select'&&!f.options.includes(value))throw fail('Opção inválida para '+f.label+'.');
   if(f.type==='ref'&&value&&!get(f.ref,value))throw fail('Referência inválida: '+f.label+'.');
   d[f.key]=value;
  }
  if(d.status==='Estornado'&&old?.status!=='Estornado')throw fail('Estornos online são confirmados exclusivamente pela API do provedor.');
  if(d.start&&d.end&&minutes(d.start)>=minutes(d.end))throw fail('O horário final deve ser posterior ao inicial.');
  if(key==='bloqueios-quadras'){
   if(d.primaryCourtId===d.secondaryCourtId)throw fail('Selecione duas quadras diferentes.');
   if(rows(key).some(x=>x.id!==old?.id&&((x.primaryCourtId===d.primaryCourtId&&x.secondaryCourtId===d.secondaryCourtId)||(x.primaryCourtId===d.secondaryCourtId&&x.secondaryCourtId===d.primaryCourtId))))throw fail('Este bloqueio já está cadastrado.',409);
   const bookings=rows('agenda').filter(x=>x.status!=='Cancelado');
   if(bookings.some(a=>a.courtId===d.primaryCourtId&&bookings.some(b=>b.courtId===d.secondaryCourtId&&a.date===b.date&&minutes(a.start)<minutes(b.end)&&minutes(a.end)>minutes(b.start))))throw fail('Existem reservas conflitantes entre essas quadras.',409);
  }
  if(key==='agenda'){
   const hours=openingHours(rows('horarios'),d.date);
   if(hours.closed)throw fail('O centro está fechado neste dia.');
   if(minutes(d.start)%30||minutes(d.end)%30||minutes(d.start)<minutes(hours.start)||minutes(d.end)>minutes(hours.end))throw fail('A reserva deve respeitar o horário de funcionamento e os intervalos de 30 minutos.');
   const court=get('quadras',d.courtId);if(court.status!=='Ativo')throw fail('A quadra está inativa.');
   if(d.tariffId){const rate=get('tarifas',d.tariffId);if(rate.courtId!==d.courtId)throw fail('A tarifa não pertence à quadra selecionada.');if(rate.status!=='Ativo'||minutes(d.start)<minutes(rate.start)||minutes(d.end)>minutes(rate.end))throw fail('A tarifa não está disponível neste horário.');d.value=money(rate.value*(minutes(d.end)-minutes(d.start))/60);}
   const linked=new Set([d.courtId]);for(const block of rows('bloqueios-quadras')){
    if(block.primaryCourtId===d.courtId)linked.add(block.secondaryCourtId);
    if(block.secondaryCourtId===d.courtId)linked.add(block.primaryCourtId);
   }
   if(d.status!=='Cancelado'&&rows('agenda').some(x=>x.id!==old?.id&&x.status!=='Cancelado'&&linked.has(x.courtId)&&x.date===d.date&&minutes(d.start)<minutes(x.end)&&minutes(d.end)>minutes(x.start)))throw fail('Já existe uma reserva para esta quadra nesse horário.',409);
  }
  if(key==='escolinha'&&d.capacity&&!Number.isInteger(d.capacity))throw fail('Vagas devem ser inteiras.');
  if(key==='matriculas'&&d.status==='Ativo'){
   const c=get('escolinha',d.classId),enrolled=rows('matriculas').filter(x=>x.classId===d.classId&&x.status==='Ativo'&&x.id!==old?.id);
   if(enrolled.some(x=>x.customerId===d.customerId))throw fail('O aluno já está matriculado nesta turma.',409);
   if(c.capacity&&enrolled.length>=c.capacity)throw fail('A turma atingiu o limite de vagas.',409);
  }
  if(key==='pedidos-lanchonete')d.value=money(d.items.reduce((s,x)=>s+x.unitPrice*x.quantity,0));
  return d;
 };
 const saveRecord=(key,input,id=randomUUID())=>{
  const old=get(key,id);if(old?.sourceId)throw fail('Recebimento automático: altere o registro de origem.',409);
  const d=validate(key,input,old);
  const onlineLocked=old&&key!=='contas-bancarias'&&payments.protectedRecord(key,id);
  if(key==='cobrancas-agenda'&&!old&&payments.protectedRecord('agenda',d.bookingId))throw fail('A reserva está vinculada a cobrança online. Consulte o financeiro.',409);
  if(onlineLocked&&moduleMap[key].fields.some(field=>field.key!=='notes'&&JSON.stringify(d[field.key])!==JSON.stringify(old[field.key]??d[field.key])))throw fail('Registro vinculado a cobrança online ou conta de recebimento. Consulte o financeiro antes de alterar.',409);
  if(key==='produtos-lanchonete'&&old)d.stock=old.stock;
  if(key==='estoque-lanchonete'){
   if(!Number.isInteger(d.quantity)||d.quantity<1)throw fail('Quantidade deve ser um inteiro positivo.');
   if(old)adjustStock(old.productId,(old.kind==='Entrada'?-1:1)*old.quantity);
   adjustStock(d.productId,(d.kind==='Entrada'?1:-1)*d.quantity);
  }
  if(key==='pedidos-lanchonete'){
   if(old&&old.status!=='Cancelado')for(const item of old.items)adjustStock(item.productId,item.quantity);
   if(d.status!=='Cancelado')for(const item of d.items)adjustStock(item.productId,-item.quantity);
  }
  if(key==='cobrancas-agenda'&&old?.status==='Recebido'&&old.bookingId!==d.bookingId)throw fail('Uma cobrança recebida não pode ser transferida para outra reserva.',409);
  if(key==='agenda'&&old?.status==='Recebido'){
   for(const field of ['courtId','customerId','date','start','end','value','status'])if(d[field]!==old[field])throw fail('A reserva já foi recebida. Alterações financeiras exigem estorno, indisponível nesta versão.',409);
   if(old.receivedChargeId)d.receivedChargeId=old.receivedChargeId;
  }
  put(key,id,{...d,createdAt:old?.createdAt});if(!onlineLocked)syncLedger(key,id,d);return{id,...d};
 };
 const seed=()=>{
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  const courts=['Quadra Areia 1','Quadra Areia 2','Quadra Society'];
  for(const[name,index]of courts.map((n,i)=>[n,i]))put('quadras','demo-quadra-'+index,{name,floor:index===2?'Sintético':'Areia',sport:index===2?'Futebol Society':'Beach Tennis',covered:index===0?'Sim':'Não',position:index+1,online:'Sim',status:'Ativo'});
  for(let i=0;i<6;i++)put('clientes','demo-cliente-'+i,{name:'Cliente Demonstração '+(i+1),kind:'Pessoa física',email:`cliente${i+1}@example.com`,phone:'',city:'Cidade exemplo',state:'SP'});
  put('contas-bancarias','demo-conta',{name:'Caixa do centro',status:'Ativo'});
  put('categorias-produtos-lanchonete','demo-categoria',{name:'Bebidas',status:'Ativo'});
  put('produtos-lanchonete','demo-produto',{name:'Água mineral 500 ml',categoryId:'demo-categoria',cost:2,value:5,stock:30,minimum:5,status:'Ativo'});
  put('mesas-lanchonete','demo-mesa',{name:'Mesa 01',status:'Livre'});
  for(let i=0;i<28;i++){
   const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-i);const day=date.toISOString().slice(0,10);
   const data={courtId:'demo-quadra-'+(i%3),customerId:'demo-cliente-'+(i%6),date:day,start:'18:00',end:'19:00',value:120+i%4*20,kind:'Avulsa',status:i%5?'Recebido':'Pendente'};
   put('agenda','demo-reserva-'+i,data);syncLedger('agenda','demo-reserva-'+i,data);
   if(i%4===0)put('lancamentos','demo-despesa-'+i,{name:'Despesa de demonstração',value:45,date:day,kind:'Despesa',status:'Recebido',accountId:'demo-conta'});
  }
  db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run('preferencias',JSON.stringify({name:'Centro Esportivo Demonstração',defaultDuration:'60'}));
  db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run('demo','true');
 };
 const payments=createPaymentService({db,get,rows,put,syncLedger,transaction,audit,...paymentOptions});
 const readBody=async req=>{let body='';for await(const chunk of req){body+=chunk;if(body.length>256000)throw fail('Requisição muito grande.',413);}try{const value=JSON.parse(body||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw fail('JSON inválido.');return value;}catch{throw fail('JSON inválido.');}};
 const json=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(body));};
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try{
   const url=new URL(req.url,'http://localhost'),path=url.pathname;
   if(path.startsWith('/api/')){
    if(path==='/api/webhooks/mercadopago'&&req.method==='POST'){json(res,200,await payments.webhook(req,url,await readBody(req)));return;}
    if(!['GET','POST','PUT','DELETE'].includes(req.method))throw fail('Método não permitido.',405);
    if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)throw fail('Origem não autorizada.',403);
    const cookie=req.headers.cookie?.match(/(?:^|;\s*)qf_session=([a-f0-9]+)/)?.[1];let session=sessions.get(cookie);
    if(session&&session.expires<Date.now()){sessions.delete(cookie);session=null;}
    let user=session&&publicUsers().find(x=>x.id===session.userId);
    if(managedAuth){const trusted=await managedAuth(req);user=trusted?.user;session=trusted?{csrf:trusted.csrf}:null;}
    if(managedAuth&&['/api/setup','/api/login','/api/logout'].includes(path))throw fail('Use o acesso central da plataforma.',403);
    if(path==='/api/session'&&req.method==='GET'){json(res,200,{user:user||null,csrf:user?session.csrf:null,needsSetup:!managedAuth&&publicUsers().length===0,operationalMode,managed:!!managedAuth});return;}
    if((path==='/api/setup'||path==='/api/login')&&req.method==='POST'){
     const input=await readBody(req),email=String(input.email||'').trim().toLowerCase(),password=String(input.password||'');
     let found;
     if(path==='/api/setup'){
      if(operationalMode&&input.demo===true)throw fail('O modo operacional não permite criar dados fictícios.');
      if(publicUsers().length)throw fail('O acesso inicial já foi criado.',409);
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<10||password.length>200||!String(input.name||'').trim())throw fail('Informe nome, e-mail válido e senha de 10 a 200 caracteres.');
      transaction(()=>{const id=randomUUID();db.prepare('INSERT INTO users(id,name,email,password,role,created_at,last_login) VALUES(?,?,?,?,?,?,?)').run(id,String(input.name).slice(0,100),email,hashPassword(password),'Administrador',new Date().toISOString(),new Date().toISOString());if(input.demo===true)seed();found=publicUsers().find(x=>x.id===id);});
     }else{
      const key=req.socket.remoteAddress;let attempt=attempts.get(key);if(!attempt||attempt.until<Date.now())attempt={count:0,until:Date.now()+15*60*1000};
      if(attempt.count>=10)throw fail('Muitas tentativas. Aguarde 15 minutos.',429);
      const stored=db.prepare('SELECT * FROM users WHERE email=?').get(email);
      if(!stored||password.length>200||!verifyPassword(password,stored.password)){attempt.count++;attempts.set(key,attempt);throw fail('E-mail ou senha incorretos.',401);}
      attempts.delete(key);db.prepare('UPDATE users SET last_login=? WHERE id=?').run(new Date().toISOString(),stored.id);found=publicUsers().find(x=>x.id===stored.id);
     }
     if(cookie)sessions.delete(cookie);
     const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');sessions.set(token,{userId:found.id,csrf,expires:Date.now()+8*60*60*1000});
     res.setHeader('Set-Cookie',`qf_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secureCookies?'; Secure':''}`);json(res,200,{user:found,csrf});return;
    }
    if(!user)throw fail('Entre para continuar.',401);
    if(req.method!=='GET'&&req.headers['x-csrf-token']!==session.csrf)throw fail('Sessão inválida. Atualize a página.',403);
    if(path==='/api/logout'&&req.method==='POST'){sessions.delete(cookie);res.setHeader('Set-Cookie','qf_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');json(res,200,{ok:true});return;}
    if(path==='/api/bootstrap'&&req.method==='GET'){
     const records=Object.fromEntries(modules.map(x=>[x.key,x.key==='usuarios'?(user.role==='Administrador'?publicUsers():[]):rows(x.key)]));
     const preferences=Object.fromEntries(db.prepare('SELECT * FROM settings').all().map(x=>[x.key,JSON.parse(x.data)]));
     json(res,200,{records,settings:preferences,user,operationalMode,paymentConfig:payments.status(),invoices:payments.list(),paymentEvents:user.role==='Administrador'?payments.history():[],reportFiles:db.prepare('SELECT id,name,module,created_at AS createdAt,record_count AS count FROM reports ORDER BY created_at DESC').all()});return;
    }
    if(user.role==='Consulta'&&req.method!=='GET')throw fail('Sua permissão permite apenas consulta.',403);
    if(path==='/api/finance/config'){
     if(req.method==='GET'){json(res,200,payments.status());return;}
     if(req.method!=='PUT')throw fail('Método inválido.',405);
     if(user.role!=='Administrador')throw fail('Apenas administradores podem configurar o financeiro.',403);
     json(res,200,payments.saveSettings(await readBody(req),user.id));return;
    }
    if(path==='/api/finance/verify'&&req.method==='POST'){if(user.role!=='Administrador')throw fail('Apenas administradores podem validar a integração.',403);json(res,200,await payments.verifyConnection(user.id));return;}
    if(path==='/api/payments/checkout'&&req.method==='POST'){const input=await readBody(req);json(res,201,await payments.createCheckout(input.module,input.recordId,user.id));return;}
    if(path==='/api/payments/reconcile'&&req.method==='POST'){const input=await readBody(req);json(res,200,await payments.reconcile(input.paymentId,user.id));return;}
    if(path.startsWith('/api/settings/')&&req.method==='PUT'){
     if(user.role!=='Administrador')throw fail('Apenas administradores podem alterar configurações.',403);
     const key=path.split('/')[3],def=settings.find(x=>x.key===key);if(!def)throw fail('Configuração não encontrada.',404);
     const input=await readBody(req),data={};for(const field of def.fields){const value=String(input[field.key]||'').slice(0,5000);if(field.options&&!field.options.includes(value))throw fail('Opção inválida.');data[field.key]=value;}
     db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run(key,JSON.stringify(data));json(res,200,{ok:true});return;
    }
    if(path==='/api/reports'&&req.method==='POST'){
     const input=await readBody(req),def=moduleMap[input.module];
     if(!def||!['agenda','creditos','socios','escolinha','pedidos-lanchonete'].includes(def.key))throw fail('Selecione um relatório disponível.');
     for(const key of ['from','to'])if(input[key]&&!dayValid(input[key]))throw fail('Período inválido.');
     if(input.from&&input.to&&input.from>input.to)throw fail('Período inválido.');
     for(const key of ['statuses','kinds','origins'])if(input[key]&&(!Array.isArray(input[key])||input[key].some(x=>typeof x!=='string')))throw fail('Filtro inválido.');
     const records=rows(def.key).filter(row=>{const receipt=get('lancamentos','recebimento-'+row.id);const date=input.dateSource==='receipt'?(receipt?.createdAt||row.date||row.dueDate||row.createdAt||'').slice(0,10):(row.date||row.dueDate||row.createdAt||'').slice(0,10);return (!input.from||date>=input.from)&&(!input.to||date<=input.to)&&(!input.statuses||input.statuses.includes(row.status||'Ativo'))&&(!input.kinds||input.kinds.includes(row.kind))&&(!input.origins||input.origins.includes('system'));});
     const quote=value=>{let text=String(value??'');if(/^[=+\-@\t\r]/.test(text))text="'"+text;return '\"'+text.replaceAll('\"','\"\"')+'\"';};
     const fields=def.columns.map(key=>def.fields.find(f=>f.key===key)||{key,label:key});
     const lines=[fields.map(f=>quote(f.label)).join(';'),...records.map(row=>fields.map(f=>{const value=f.type==='ref'?get(f.ref,row[f.key])?.name||'':f.type==='money'?Number(row[f.key]||0).toFixed(2).replace('.',','):row[f.key];return quote(value);}).join(';'))];
     if(input.mode==='summary'){lines.length=0;lines.push(['Situação','Quantidade','Total (R$)'].map(quote).join(';'));for(const group of summarizeReport(records))lines.push([group.status,group.count,group.value.toFixed(2).replace('.',',')].map(quote).join(';'));}
     const content=Buffer.from('\uFEFF'+lines.join('\r\n'),'utf8'),id=randomUUID(),name=def.key+'-'+new Date().toISOString().slice(0,10)+'.csv';
     db.prepare('INSERT INTO reports VALUES(?,?,?,?,?,?)').run(id,name,def.key,content,new Date().toISOString(),records.length);audit(user.id,'generate','reports',id);
     json(res,201,{id,name,count:records.length});return;
    }
    const reportMatch=path.match(/^\/api\/reports\/([a-f0-9-]+)$/);
    if(reportMatch){
     const report=db.prepare('SELECT * FROM reports WHERE id=?').get(reportMatch[1]);if(!report)throw fail('Arquivo não encontrado.',404);
     if(req.method==='GET'){res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="'+report.name+'"','Cache-Control':'no-store'});res.end(Buffer.from(report.content));return;}
     if(req.method==='DELETE'){db.prepare('DELETE FROM reports WHERE id=?').run(report.id);json(res,200,{ok:true});return;}
     throw fail('Método não permitido.',405);
    }
    if(path==='/api/memberships/generate'&&req.method==='POST'){
     const input=await readBody(req),period=String(input.period||'');
     if(!/^\d{4}-\d{2}$/.test(period)||!dayValid(period+'-01'))throw fail('Selecione um mês válido.');
     const result=transaction(()=>{let created=0,skipped=0;
      const maxDay=new Date(Number(period.slice(0,4)),Number(period.slice(5,7)),0).getDate();
      for(const member of rows('socios').filter(x=>x.status==='Ativo')){
       const id='mensalidade-'+member.id+'-'+period;
       if(get('cobrancas-socios',id)){skipped++;continue;}
       const dueDay=Math.min(maxDay,Math.max(1,Math.trunc(Number(member.dueDay)||1)));
       saveRecord('cobrancas-socios',{memberId:member.id,name:'Mensalidade '+period+' · '+member.name,value:member.value,dueDate:period+'-'+String(dueDay).padStart(2,'0'),status:'Pendente'},id);
       audit(user.id,'create','cobrancas-socios',id);created++;
      }return{created,skipped};
     });json(res,200,result);return;
    }
    if(path==='/api/products/import'&&req.method==='POST'){
     const input=await readBody(req);
     if(!Array.isArray(input.records)||!input.records.length||input.records.length>500)throw fail('Importe entre 1 e 500 produtos por arquivo.');
     const result=transaction(()=>input.records.map(record=>{const data=saveRecord('produtos-lanchonete',record);audit(user.id,'import','produtos-lanchonete',data.id);return data.id;}));
     json(res,201,{created:result.length});return;
    }
    const match=path.match(/^\/api\/records\/([a-z-]+)(?:\/([a-zA-Z0-9-]+))?$/);
    if(!match)throw fail('Rota não encontrada.',404);
    const[,key,id]=match;if(!moduleMap[key])throw fail('Módulo não encontrado.',404);
    if(key==='usuarios'){
     if(managedAuth&&req.method!=='GET')throw fail('Gerencie os acessos pela plataforma.',403);
     if(user.role!=='Administrador')throw fail('Apenas administradores podem gerenciar usuários.',403);
     if(req.method==='GET'){json(res,200,publicUsers());return;}
     const input=req.method==='DELETE'?{}:await readBody(req);
     const result=transaction(()=>{
      const old=id&&db.prepare('SELECT * FROM users WHERE id=?').get(id);if(id&&!old)throw fail('Usuário não encontrado.',404);
      if(old?.role==='Administrador'&&(req.method==='DELETE'||input.role!=='Administrador')&&publicUsers().filter(x=>x.role==='Administrador').length===1)throw fail('Mantenha pelo menos um administrador.',409);
      if(req.method==='DELETE'){if(id===user.id)throw fail('Você não pode excluir seu próprio acesso.',409);db.prepare('DELETE FROM users WHERE id=?').run(id);return{ok:true};}
      if(!['POST','PUT'].includes(req.method))throw fail('Método inválido.',405);
      const email=String(input.email||'').trim().toLowerCase();if(!input.name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['Administrador','Atendente','Consulta'].includes(input.role))throw fail('Dados de usuário inválidos.');
      if((!old||input.password)&& (String(input.password||'').length<10||String(input.password).length>200))throw fail('Use uma senha de 10 a 200 caracteres.');
      if(publicUsers().some(x=>x.email===email&&x.id!==id))throw fail('E-mail já cadastrado.',409);
      const userId=id||randomUUID();db.prepare('INSERT INTO users(id,name,email,password,role,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,password=excluded.password,role=excluded.role').run(userId,String(input.name).slice(0,100),email,input.password?hashPassword(String(input.password)):old.password,input.role,new Date().toISOString());audit(user.id,'save',key,userId);return publicUsers().find(x=>x.id===userId);
     });json(res,200,result);return;
    }
    if(req.method==='GET'){json(res,200,id?get(key,id)||null:rows(key));return;}
    if(moduleMap[key].group==='Configuração'&&user.role!=='Administrador')throw fail('Apenas administradores podem alterar configurações.',403);
    if(req.method==='DELETE'){
     const result=transaction(()=>{
      if(payments.protectedRecord(key,id))throw fail('Registro vinculado ao financeiro. A exclusão está bloqueada.',409);
      const old=get(key,id);if(!old)throw fail('Registro não encontrado.',404);if(old.sourceId)throw fail('Recebimento automático: altere o registro de origem.',409);
      if(['agenda','pedidos-lanchonete','cobrancas-avulso','cobrancas-socios','cobrancas-agenda','mensalidades-aulas','cobrancas-aulas'].includes(key)&&old.status==='Recebido')throw fail('Registros recebidos devem ser preservados. Estorno não disponível nesta versão.',409);
      for(const def of modules){for(const field of def.fields.filter(x=>x.ref===key))if(rows(def.key).some(x=>x[field.key]===id))throw fail('Este registro está vinculado a '+def.title+'.',409);}
      if(key==='produtos-lanchonete'&&rows('pedidos-lanchonete').some(x=>x.items.some(y=>y.productId===id)))throw fail('Produto vinculado a pedidos.',409);
      if(key==='estoque-lanchonete')adjustStock(old.productId,(old.kind==='Entrada'?-1:1)*old.quantity);
      if(key==='pedidos-lanchonete'&&old.status!=='Cancelado')for(const item of old.items)adjustStock(item.productId,item.quantity);
      db.prepare('UPDATE records SET deleted_at=? WHERE id=?').run(new Date().toISOString(),id);audit(user.id,'delete',key,id);return{ok:true};
     });json(res,200,result);return;
    }
    if(!['POST','PUT'].includes(req.method))throw fail('Método inválido.',405);
    const input=await readBody(req);
    const result=transaction(()=>{
     if(req.method==='PUT'&&(!id||!get(key,id)))throw fail('Registro não encontrado.',404);
     if(req.method==='POST'&&id)throw fail('Rota inválida.',400);
     const count=key==='agenda'&&req.method==='POST'?Number(input.recurrenceWeeks||1):1;if(!Number.isInteger(count)||count<1||count>52)throw fail('Recorrência deve ter entre 1 e 52 semanas.');
     const result=[];
     for(let i=0;i<count;i++){
      const data={...input};if(i){const d=new Date(input.date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i*7);data.date=d.toISOString().slice(0,10);}
      const saved=saveRecord(key,data,id);audit(user.id,id?'update':'create',key,saved.id);result.push(saved);
     }
     return count>1?{records:result}:result[0];
    });json(res,req.method==='POST'?201:200,result);return;
   }
   if(req.method!=='GET'&&req.method!=='HEAD')throw fail('Método não permitido.',405);
   const sharedFiles=new Set(['/modules.mjs','/dashboard-data.mjs']);
   const staticPath=sharedFiles.has(path)?join(root,path.slice(1)):join(root,'public',path==='/'?'index.html':path.slice(1));
   const publicRoot=resolve(root,'public');let filename=staticPath;
   if(!sharedFiles.has(path)&&!isWithinDirectory(publicRoot,staticPath))throw fail('Arquivo não encontrado.',404);
   if(!/\.(html|js|css|svg|mjs|ico|png|woff2|woff|ttf)$/.test(filename))filename=join(root,'public','index.html');
   let content;try{content=await readFile(filename);}catch{throw fail('Arquivo não encontrado.',404);}
   const ext=filename.split('.').pop(),types={html:'text/html',js:'text/javascript',mjs:'text/javascript',css:'text/css',svg:'image/svg+xml',png:'image/png',woff2:'font/woff2',woff:'font/woff',ttf:'font/ttf'};res.writeHead(200,{'content-type':(types[ext]||'application/octet-stream')+'; charset=utf-8','cache-control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
  }catch(e){json(res,e.status||500,{error:e.status?e.message:'Não foi possível concluir a operação.'});}
 });
 let closed=false;const closeResources=()=>{if(!closed){closed=true;db.close();}};
 server.on('close',closeResources);
 server.business={db,rows,get,put,transaction,audit,saveRecord:(key,input,id)=>transaction(()=>saveRecord(key,input,id)),payments,close:closeResources,
  provisionUser:({id,name,email,role})=>{db.prepare('INSERT INTO users(id,name,email,password,role,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,role=excluded.role').run(id,name,email,'managed',role,new Date().toISOString());return publicUsers().find(x=>x.id===id);}};return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=await createApp({databasePath:process.env.QF_DATABASE_PATH||undefined});const port=Number(process.env.PORT||3000);server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Quadra Fácil iniciado na porta ${port}.`));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
