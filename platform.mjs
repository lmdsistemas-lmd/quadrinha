import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,join,resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createApp,isWithinDirectory} from './server.mjs';
import {createPlatformStore} from './platform-store.mjs';
import {createPublicBooking} from './public-booking.mjs';
import {fail,readJSON,json,secureHeaders,assertOrigin} from './platform-security.mjs';
const root=dirname(fileURLToPath(import.meta.url));
export async function createPlatform({dataDirectory=process.env.PLATFORM_DATA_DIR||join(root,'data','platform'),publicUrl=process.env.APP_PUBLIC_URL||'',encryptionKey=process.env.PLATFORM_ENCRYPTION_KEY,secureCookies=process.env.NODE_ENV==='production',mode=process.env.PLATFORM_MODE||'production',fetchImpl=fetch,smtpFactory}={}){
 if(!['production','test'].includes(mode))throw fail('PLATFORM_MODE deve ser production ou test.');
 if(publicUrl){let parsed;try{parsed=new URL(publicUrl);}catch{throw fail('APP_PUBLIC_URL inválida.');}if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.hash||parsed.search||parsed.port)throw fail('APP_PUBLIC_URL deve ser a origem HTTPS pública, sem caminho ou parâmetros.');publicUrl=parsed.origin;}
 if(mode==='production'&&publicUrl)secureCookies=true;
 let server;
 const localUrl=()=>{const address=server?.address();return address&&typeof address==='object'&&['127.0.0.1','::1'].includes(address.address)?`http://${address.address==='::1'?'[::1]':address.address}:${address.port}`:'';};
 const store=await createPlatformStore({dataDirectory,publicUrl,localUrl,encryptionKey,fetchImpl,smtpFactory,secureCookies}),{db,integrations}=store;
 const engines=new Map(),trusted=new WeakMap();
 const paymentOptions=scope=>({fetchImpl,config:()=>integrations.paymentConfig(scope,scope==='platform'?'/api/platform/webhooks/mercadopago':'/app/'+store.tenant(scope).slug+'/api/webhooks/mercadopago',scope==='platform'?'/conta?checkout=return':'/reservar/'+store.tenant(scope).slug+'?checkout=return')});
 const billing=await createApp({databasePath:join(dataDirectory,'platform-billing.sqlite'),operationalMode:mode==='production',paymentOptions:paymentOptions('platform'),managedAuth:async()=>null});
 const ledger=billing.business;if(!ledger.get('contas-bancarias','platform-receipts'))ledger.saveRecord('contas-bancarias',{name:'Recebimentos de planos da plataforma',status:'Ativo'},'platform-receipts');
 async function engine(t){if(!engines.has(t.id)){const task=createApp({databasePath:join(dataDirectory,'tenants',t.id+'.sqlite'),operationalMode:mode==='production',paymentOptions:paymentOptions(t.id),managedAuth:async req=>trusted.get(req),managedUsers:()=>store.listMembers(t).filter(member=>member.active)});engines.set(t.id,task);task.catch(()=>engines.delete(t.id));}return engines.get(t.id);}
 function syncSubscriptions(){store.transaction(()=>{
  for(const charge of db.prepare('SELECT * FROM subscription_charges').all()){
   const invoice=ledger.payments.list().find(x=>x.recordId===charge.source_id),status=invoice?.status||'pending';const paid=status==='paid'||status==='partially_refunded';
   if(paid&&!charge.paid_at){db.prepare('UPDATE subscription_charges SET status=?,paid_at=? WHERE id=?').run(status,store.now(),charge.id);}
   else if(status!==charge.status)db.prepare('UPDATE subscription_charges SET status=? WHERE id=?').run(status,charge.id);
  }
  for(const t of db.prepare('SELECT * FROM tenants').all()){
   let until=null;for(const charge of db.prepare("SELECT * FROM subscription_charges WHERE tenant_id=? AND status IN ('paid','partially_refunded') AND paid_at IS NOT NULL ORDER BY paid_at,id").all(t.id)){
    const start=new Date(Math.max(until?Date.parse(until):0,Date.parse(charge.paid_at)));const desired=start.getUTCDate();start.setUTCDate(1);start.setUTCMonth(start.getUTCMonth()+JSON.parse(charge.plan_snapshot).period_months);const last=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate();start.setUTCDate(Math.min(desired,last));until=start.toISOString();
   }db.prepare('UPDATE tenants SET paid_until=? WHERE id=?').run(until,t.id);
  }
 });}
 function subscriptionData(account){syncSubscriptions();const companies=store.memberships(account.id);return {companies,plans:store.plans(true),charges:db.prepare('SELECT * FROM subscription_charges ORDER BY created_at DESC').all().filter(x=>companies.some(t=>t.id===x.tenant_id)).map(x=>({...x,plan:JSON.parse(x.plan_snapshot),invoice:ledger.payments.list().find(i=>i.recordId===x.source_id)||null})),paymentReady:ledger.payments.status().ready};}
 async function subscriptionCheckout(account,input){const t=store.tenant(input.tenantId);if(!t)throw fail('Empresa não encontrada.',404);store.requireMember(account,t,{admin:true,active:false});const plan=db.prepare('SELECT * FROM plans WHERE id=? AND published=1').get(input.planId);if(!plan)throw fail('Plano indisponível.',404);const readiness=ledger.payments.status();if(!readiness.ready)throw fail('O administrador da plataforma precisa concluir a configuração de recebimentos dos planos.',409);
  let charge=db.prepare("SELECT * FROM subscription_charges WHERE tenant_id=? AND status='pending' ORDER BY created_at DESC LIMIT 1").get(t.id);
  if(charge&&JSON.parse(charge.plan_snapshot).id!==plan.id)throw fail('Já existe uma cobrança pendente de outro plano. Consulte a administração antes de criar outra.',409);
  if(!charge){const e=await engine(t);charge=db.prepare("SELECT * FROM subscription_charges WHERE tenant_id=? AND status='pending' ORDER BY created_at DESC LIMIT 1").get(t.id);if(charge){if(JSON.parse(charge.plan_snapshot).id!==plan.id)throw fail('Já existe uma cobrança pendente de outro plano.',409);return ledger.payments.createCheckout('cobrancas-avulso',charge.source_id,account.id);}if(e.business.rows('quadras').length>plan.court_limit)throw fail('O número de quadras excede o limite deste plano.',409);const id=randomUUID(),source='subscription-'+id;const customerId='tenant-'+t.id;if(!ledger.get('clientes',customerId))ledger.saveRecord('clientes',{name:t.name,email:account.email,kind:'Pessoa jurídica'},customerId);ledger.saveRecord('cobrancas-avulso',{customerId,name:plan.name+' · '+t.name,value:plan.amount_cents/100,status:'Pendente',dueDate:store.now().slice(0,10)},source);db.prepare('INSERT INTO subscription_charges VALUES(?,?,?,?,?,NULL,?)').run(id,t.id,source,JSON.stringify(plan),'pending',store.now());charge=db.prepare('SELECT * FROM subscription_charges WHERE id=?').get(id);store.audit(account.id,'subscription_checkout',id);}
  return ledger.payments.createCheckout('cobrancas-avulso',charge.source_id,account.id);
 }
 function csrf(req,session){if(!session)throw fail('Entre para continuar.',401);if(req.method!=='GET'&&req.headers['x-csrf-token']!==session.csrf)throw fail('Sessão inválida. Atualize a página.',403);return session.account;}
 const administrator=account=>{if(!account.superadmin)throw fail('Acesso restrito à administração da plataforma.',403);};
 function tenantSummary(){return db.prepare('SELECT t.*,a.name AS owner_name,a.email AS owner_email,a.verified AS email_verified,a.active AS login_active FROM tenants t JOIN accounts a ON a.id=t.owner_id ORDER BY t.created_at DESC').all().map(t=>({...t,accessible:!!store.accessible(t)}));}
 const invalidateMerchant=(business)=>{const old=JSON.parse(business.db.prepare("SELECT data FROM settings WHERE key='financeiro'").get()?.data||'{}');delete old.merchantId;delete old.verifiedEnvironment;delete old.verifiedAt;business.db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run('financeiro',JSON.stringify(old));};
 async function serveFile(req,res,path){const shared=new Set(['/modules.mjs','/dashboard-data.mjs']);const filename=shared.has(path)?join(root,path.slice(1)):join(root,'public',path.slice(1));if(!shared.has(path)&&!isWithinDirectory(join(root,'public'),filename))throw fail('Arquivo não encontrado.',404);const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.ico':'image/x-icon'};if(!types[extname(filename)])throw fail('Arquivo não encontrado.',404);let bytes;try{bytes=await readFile(filename);}catch{throw fail('Arquivo não encontrado.',404);}res.writeHead(200,{'Content-Type':types[extname(filename)],'Cache-Control':extname(filename)==='.html'?'no-store':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);}
 let timer;
 server=createServer(async(req,res)=>{secureHeaders(res);try{
  const url=new URL(req.url,'http://localhost'),path=url.pathname;
  if(path==='/api/platform/webhooks/mercadopago'&&req.method==='POST'){const result=await ledger.payments.webhook(req,url,await readJSON(req));syncSubscriptions();json(res,200,result);return;}
  const whats=path.match(/^\/api\/whatsapp\/(platform|[a-f0-9-]{36})$/);if(whats){if(req.method==='GET'){res.writeHead(200,{'Content-Type':'text/plain'});res.end(integrations.verifyChallenge(whats[1],url));return;}if(req.method==='POST'){let raw=Buffer.alloc(0);for await(const chunk of req){raw=Buffer.concat([raw,chunk]);if(raw.length>256000)throw fail('Notificação muito grande.',413);}json(res,200,integrations.whatsWebhook(whats[1],raw,req.headers['x-hub-signature-256']));return;}throw fail('Método inválido.',405);}
  const app=path.match(/^\/app\/([a-z0-9-]+)(\/.*)?$/);
  if(app){const t=store.bySlug(app[1]);if(!t)throw fail('Empresa não encontrada.',404);const suffix=app[2]||'/';
   if(suffix==='/api/webhooks/mercadopago'&&req.method==='POST'){const e=await engine(t);json(res,200,await e.business.payments.webhook(req,new URL(req.url,'http://localhost'),await readJSON(req)));return;}
   if(suffix.startsWith('/api/')){
    assertOrigin(req);const session=store.authenticate(req),account=csrf(req,session);const m=store.requireMember(account,t),e=await engine(t);for(const member of store.listMembers(t).filter(x=>x.active))e.business.provisionUser(member);const user=e.business.provisionUser({...account,role:m.role});trusted.set(req,{user,csrf:session.csrf});
    if(suffix==='/api/logout'&&req.method==='POST'){store.logout(res,session);json(res,200,{ok:true});return;}
    if(suffix==='/api/tenant'&&req.method==='GET'){json(res,200,{id:t.id,name:t.name,slug:t.slug,portal:store.portal(t),portalPath:'/reservar/'+t.slug});return;}
    const integration=suffix.match(/^\/api\/integrations\/(mercadopago|whatsapp)(?:\/(verify|send))?$/);
    if(integration){store.requireMember(account,t,{admin:true});const[,provider,action]=integration;if(req.method==='GET'&&!action){json(res,200,integrations.status(t.id,provider));return;}if(req.method==='PUT'&&!action){integrations.save(t.id,provider,await readJSON(req));if(provider==='mercadopago')invalidateMerchant(e.business);store.audit(account.id,'configure_'+provider,t.id);json(res,200,integrations.status(t.id,provider));return;}if(req.method==='POST'&&action==='verify'){json(res,200,provider==='whatsapp'?await integrations.verifyWhatsApp(t.id):await e.business.payments.verifyConnection(account.id));return;}if(req.method==='POST'&&action==='send'&&provider==='whatsapp'){json(res,202,await integrations.sendWhatsApp(t.id,await readJSON(req)));return;}throw fail('Método inválido.',405);}
    if(suffix==='/api/portal'){store.requireMember(account,t,{admin:true});if(req.method==='GET'){json(res,200,{...store.portal(t),path:'/reservar/'+t.slug});return;}if(req.method==='PUT'){json(res,200,store.savePortal(account,t,await readJSON(req)));return;}throw fail('Método inválido.',405);}
    const users=suffix.match(/^\/api\/records\/usuarios(?:\/([a-zA-Z0-9-]+))?$/);if(users){store.requireMember(account,t,{admin:true});if(req.method==='GET'){json(res,200,store.listMembers(t));return;}if(req.method==='POST'&&!users[1]){json(res,201,store.inviteMember(account,t,await readJSON(req)));return;}if(users[1]&&['PUT','DELETE'].includes(req.method)){json(res,200,store.changeMember(account,t,users[1],req.method==='DELETE'?{}:await readJSON(req),req.method==='DELETE'));return;}throw fail('Método inválido.',405);}
    if(suffix==='/api/whatsapp-messages'&&req.method==='GET'){store.requireMember(account,t,{admin:true});json(res,200,db.prepare('SELECT id,status,created_at,updated_at FROM whatsapp_messages WHERE scope=? ORDER BY created_at DESC LIMIT 50').all(t.id));return;}
    if(suffix==='/api/notifications'&&req.method==='GET'){json(res,200,db.prepare('SELECT * FROM notifications WHERE tenant_id=? AND (account_id=? OR account_id=?) ORDER BY created_at DESC LIMIT 100').all(t.id,account.id,''));return;}
    if(suffix==='/api/referrals'&&req.method==='GET'){const code=db.prepare('SELECT code FROM referrals WHERE tenant_id=?').get(t.id)?.code;json(res,200,{code,link:publicUrl?publicUrl+'/cadastro?ref='+code:null,count:db.prepare('SELECT count(*) AS total FROM referrals WHERE referred_by=?').get(t.id).total,rewardEnabled:false});return;}
    if(suffix==='/api/records/quadras'&&req.method==='POST'){const charges=db.prepare("SELECT plan_snapshot FROM subscription_charges WHERE tenant_id=? AND status IN ('paid','partially_refunded') ORDER BY paid_at DESC LIMIT 1").get(t.id);const limit=charges?JSON.parse(charges.plan_snapshot).court_limit:5;if(e.business.rows('quadras').length>=limit)throw fail('O limite de quadras do plano foi atingido.',409);}
    req.url=suffix+url.search;try{await e.listeners('request')[0](req,res);}finally{trusted.delete(req);}return;
   }
   if(!['GET','HEAD'].includes(req.method))throw fail('Método inválido.',405);await serveFile(req,res,'/index.html');return;
  }
  const publicMatch=path.match(/^\/reservar\/([a-z0-9-]+)(\/api(?:\/.*)?)?$/);
  if(publicMatch){const t=store.bySlug(publicMatch[1]);if(!t||!store.portal(t).published||!store.accessible(t))throw fail('Página de reservas indisponível.',404);const suffix=publicMatch[2];if(!suffix){if(!['GET','HEAD'].includes(req.method))throw fail('Método inválido.',405);await serveFile(req,res,'/platform.html');return;}
   assertOrigin(req);const session=store.authenticate(req,t.id),action=suffix.slice(4);if(action==='/session'&&req.method==='GET'){json(res,200,{user:store.safeAccount(session?.account),csrf:session?.csrf||null,portal:store.portal(t),name:t.name});return;}
   if(['/register','/login','/forgot','/resend'].includes(action)&&req.method==='POST'){const input=await readJSON(req);store.rate(req,t.id+action,input.email||'');if(action==='/login'){json(res,200,store.setSession(res,store.login(input,t.id),t.id));return;}if(action==='/register'){json(res,201,store.register(input,t.id));void integrations.flush().catch(()=>{});return;}json(res,200,store.requestToken(input,t.id,action==='/resend'?'verify':'reset'));void integrations.flush().catch(()=>{});return;}
   const e=await engine(t),booking=createPublicBooking({store,engine:e,tenant:t});if(action==='/availability'&&req.method==='GET'){json(res,200,{courts:booking.availability(url.searchParams.get('date')),paymentReady:e.business.payments.status().ready});return;}
   const account=csrf(req,session);
   if(action==='/logout'&&req.method==='POST'){store.logout(res,session,t.id);json(res,200,{ok:true});return;}
   if(action==='/bookings'&&req.method==='GET'){json(res,200,booking.ownBookings(account));return;}
   if(action==='/bookings'&&req.method==='POST'){store.rate(req,t.id+':booking',account.id);const saved=booking.reserve(account,await readJSON(req));json(res,201,saved);return;}
   const payment=action.match(/^\/bookings\/([a-zA-Z0-9-]+)\/(checkout|reconcile)$/);if(payment&&req.method==='POST'){json(res,200,payment[2]==='checkout'?await booking.checkout(account,payment[1]):await booking.reconcile(account,payment[1],(await readJSON(req)).paymentId));return;}
   throw fail('Rota não encontrada.',404);
  }
  if(path.startsWith('/api/')){
   assertOrigin(req);const session=store.authenticate(req);
   if(path==='/api/session'&&req.method==='GET'){json(res,200,{user:store.safeAccount(session?.account),csrf:session?.csrf||null,companies:session?store.memberships(session.account.id):[],smtpConfigured:integrations.status('platform','smtp').configured,domainConfigured:!!publicUrl,localUrl:publicUrl?null:localUrl()||null});return;}
   if(path==='/api/plans'&&req.method==='GET'){json(res,200,store.plans(true));return;}
   if(['/api/auth/register','/api/auth/login','/api/auth/forgot','/api/auth/resend','/api/auth/consume'].includes(path)&&req.method==='POST'){
    const input=await readJSON(req);store.rate(req,path,input.email||'');if(path.endsWith('/login')){json(res,200,store.setSession(res,store.login(input)));return;}if(path.endsWith('/register')){json(res,201,store.register(input));void integrations.flush().catch(()=>{});return;}if(path.endsWith('/consume')){json(res,200,store.consume(input));return;}json(res,200,store.requestToken(input,'',path.endsWith('/resend')?'verify':'reset'));void integrations.flush().catch(()=>{});return;
   }
   const account=csrf(req,session);
   if(path==='/api/auth/logout'&&req.method==='POST'){store.logout(res,session);json(res,200,{ok:true});return;}
   if(path==='/api/subscriptions'&&req.method==='GET'){json(res,200,subscriptionData(account));return;}
   if(path==='/api/subscriptions/checkout'&&req.method==='POST'){json(res,201,await subscriptionCheckout(account,await readJSON(req)));return;}
   if(path.startsWith('/api/admin/')){
    administrator(account);
    if(path==='/api/admin/overview'&&req.method==='GET'){syncSubscriptions();json(res,200,{tenants:tenantSummary(),plans:store.plans(false),charges:db.prepare('SELECT * FROM subscription_charges ORDER BY created_at DESC').all().map(x=>({...x,plan:JSON.parse(x.plan_snapshot)})),finance:ledger.payments.status(),smtp:integrations.status('platform','smtp'),mercadopago:integrations.status('platform','mercadopago'),mail:db.prepare('SELECT status,count(*) AS total FROM mail_outbox GROUP BY status').all(),publicUrl,localUrl:publicUrl?null:localUrl()||null,mode,audit:db.prepare('SELECT * FROM platform_audit ORDER BY id DESC LIMIT 100').all()});return;}
    const plan=path.match(/^\/api\/admin\/plans(?:\/([a-zA-Z0-9-]+))?$/);if(plan&&['POST','PUT'].includes(req.method)){if(req.method==='PUT'&&!store.plans(false).some(p=>p.id===plan[1]))throw fail('Plano não encontrado.',404);json(res,200,store.savePlan(account,await readJSON(req),plan[1]||undefined));return;}
    const company=path.match(/^\/api\/admin\/tenants\/([a-f0-9-]{36})(?:\/(access|reset-owner))?$/);if(company&&req.method==='POST'){const t=store.tenant(company[1]);if(!t)throw fail('Empresa não encontrada.',404);if(company[2]==='access'){const input=await readJSON(req);if(!['manual','disabled','subscription'].includes(input.mode))throw fail('Modo inválido.');db.prepare('UPDATE tenants SET access_mode=? WHERE id=?').run(input.mode,t.id);store.audit(account.id,'set_access_'+input.mode,t.id);json(res,200,{ok:true});return;}if(company[2]==='reset-owner'){store.transaction(()=>store.queueToken(store.accountById(t.owner_id),'reset'));store.audit(account.id,'request_password_reset',t.owner_id);void integrations.flush().catch(()=>{});json(res,200,{ok:true,mailQueued:true});return;}}
    const provider=path.match(/^\/api\/admin\/integrations\/(smtp|mercadopago)(?:\/(verify|flush))?$/);if(provider){const[,name,action]=provider;if(req.method==='GET'&&!action){json(res,200,integrations.status('platform',name));return;}if(req.method==='PUT'&&!action){integrations.save('platform',name,await readJSON(req));if(name==='mercadopago')invalidateMerchant(ledger);store.audit(account.id,'configure_platform_'+name,'platform');json(res,200,integrations.status('platform',name));return;}if(req.method==='POST'&&action==='verify'){json(res,200,name==='smtp'?await integrations.verifySmtp():await ledger.payments.verifyConnection(account.id));return;}if(req.method==='POST'&&action==='flush'&&name==='smtp'){await integrations.flush();json(res,200,{ok:true});return;}throw fail('Método inválido.',405);}
    if(path==='/api/admin/finance'&&req.method==='PUT'){const input=await readJSON(req);if(input.accountName)ledger.saveRecord('contas-bancarias',{name:input.accountName,status:'Ativo'},'platform-receipts');json(res,200,ledger.payments.saveSettings({accountId:'platform-receipts',installments:input.installments||1},account.id));return;}
    if(path==='/api/admin/payments/reconcile'&&req.method==='POST'){const input=await readJSON(req);const result=await ledger.payments.reconcile(input.paymentId,account.id);syncSubscriptions();json(res,200,result);return;}
    if(path==='/api/admin/payments'&&req.method==='GET'){json(res,200,{invoices:ledger.payments.list(),events:ledger.payments.history()});return;}
    throw fail('Rota não encontrada.',404);
   }
   throw fail('Rota não encontrada.',404);
  }
  if(!['GET','HEAD'].includes(req.method))throw fail('Método inválido.',405);
  if(['/','/admin','/conta','/cadastro','/entrar','/acesso','/recuperar-senha','/planos'].includes(path)){await serveFile(req,res,'/platform.html');return;}
  if(path.startsWith('/data/')||path.startsWith('/.'))throw fail('Arquivo não encontrado.',404);await serveFile(req,res,path);
 }catch(error){if(!res.headersSent)json(res,error.status||500,{error:error.status?error.message:'Não foi possível concluir a operação.'});else res.end();}});
 timer=setInterval(()=>{void integrations.flush().catch(()=>{});},60000);timer.unref();
 server.on('close',()=>{clearInterval(timer);for(const value of engines.values())void value.then(e=>e.business.close());ledger.close();store.close();});
 server.platform={store,engine,billing,syncSubscriptions,initializeAdmin:store.initializeAdmin};return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=await createPlatform();server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Plataforma iniciada. Administração: /admin. Empresas: /conta. Reservas: /reservar/{empresa}.'));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
