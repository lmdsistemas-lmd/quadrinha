import {createHmac,randomUUID,timingSafeEqual,createHash} from 'node:crypto';

const failure=(message,status=400)=>Object.assign(new Error(message),{status});
const cents=value=>Math.round(Number(value)*100);
const sources=new Set(['agenda','cobrancas-agenda','cobrancas-avulso','cobrancas-socios','mensalidades-aulas','cobrancas-aulas','pedidos-lanchonete']);
const paymentIdPattern=/^[0-9]{1,30}$/;

export function migratePayments(db){
 db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS invoices(
   id TEXT PRIMARY KEY,source_module TEXT NOT NULL,source_id TEXT NOT NULL,
   billing_module TEXT NOT NULL,billing_id TEXT NOT NULL,description TEXT NOT NULL,
   amount_cents INTEGER NOT NULL CHECK(amount_cents>0),currency TEXT NOT NULL CHECK(currency='BRL'),
   account_id TEXT NOT NULL,environment TEXT NOT NULL CHECK(environment IN ('test','production')),
   merchant_id TEXT NOT NULL,status TEXT NOT NULL,preference_id TEXT,checkout_url TEXT,idempotency_key TEXT NOT NULL UNIQUE,
   created_at TEXT NOT NULL,updated_at TEXT NOT NULL,expires_at TEXT NOT NULL,created_by TEXT NOT NULL,
   UNIQUE(source_module,source_id)
  );
  CREATE TABLE IF NOT EXISTS provider_payments(
   id TEXT PRIMARY KEY,invoice_id TEXT NOT NULL REFERENCES invoices(id),status TEXT NOT NULL,
   amount_cents INTEGER NOT NULL,refunded_cents INTEGER NOT NULL DEFAULT 0,fee_cents INTEGER,
   method TEXT NOT NULL,approved_at TEXT,provider_updated_at TEXT NOT NULL,updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS provider_payments_invoice ON provider_payments(invoice_id);
  CREATE TABLE IF NOT EXISTS payment_events(
   id TEXT PRIMARY KEY,invoice_id TEXT REFERENCES invoices(id),payment_id TEXT,
   event_type TEXT NOT NULL,detail TEXT NOT NULL,created_at TEXT NOT NULL,snapshot TEXT NOT NULL DEFAULT '{}'
  );
  CREATE TABLE IF NOT EXISTS webhook_receipts(
   fingerprint TEXT PRIMARY KEY,payment_id TEXT NOT NULL,received_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions(
   token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   csrf TEXT NOT NULL,expires_at INTEGER NOT NULL
  );
 `);
 const eventColumns=new Set(db.prepare('PRAGMA table_info(payment_events)').all().map(row=>row.name));
 if(!eventColumns.has('snapshot'))db.exec("ALTER TABLE payment_events ADD COLUMN snapshot TEXT NOT NULL DEFAULT '{}'");
 db.prepare('INSERT OR IGNORE INTO schema_migrations VALUES(?,?)').run(1,new Date().toISOString());
}

export function verifyWebhook({secret,signature,requestId,dataId,now=Date.now()}){
 if(!secret||typeof signature!=='string'||typeof requestId!=='string'||requestId.length>200||!paymentIdPattern.test(dataId||''))return false;
 const parts=Object.fromEntries(signature.split(',').map(part=>part.trim().split('=')));
 if(!/^\d{10}(?:\d{3})?$/.test(parts.ts||'')||!/^([a-f0-9]{64})$/i.test(parts.v1||''))return false;
 const timestamp=Number(parts.ts)*(parts.ts.length===10?1000:1);
 if(Math.abs(now-timestamp)>10*60*1000)return false;
 const manifest=`id:${dataId};request-id:${requestId};ts:${parts.ts};`;
 const expected=createHmac('sha256',secret).update(manifest).digest();
 return timingSafeEqual(expected,Buffer.from(parts.v1,'hex'));
}

export function paymentConfiguration(env=process.env){
 return {accessToken:env.MERCADOPAGO_ACCESS_TOKEN||'',webhookSecret:env.MERCADOPAGO_WEBHOOK_SECRET||'',
  environment:env.MERCADOPAGO_ENVIRONMENT||'test',enabled:env.MERCADOPAGO_ENABLED==='true',publicUrl:env.APP_PUBLIC_URL||''};
}

export function createPaymentService({db,get,rows,put,syncLedger,transaction,audit,config=paymentConfiguration(),fetchImpl=fetch,now=()=>Date.now()}){
 const active=new Map();
 const businessDay=value=>new Date(value).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 const timestamp=()=>new Date(now()).toISOString();
 const event=(invoiceId,paymentId,type,detail,id=randomUUID(),snapshot={})=>db.prepare('INSERT OR IGNORE INTO payment_events(id,invoice_id,payment_id,event_type,detail,created_at,snapshot) VALUES(?,?,?,?,?,?,?)').run(id,invoiceId,paymentId,type,detail,timestamp(),JSON.stringify(snapshot));
 const settings=()=>JSON.parse(db.prepare("SELECT data FROM settings WHERE key='financeiro'").get()?.data||'{"accountId":"","installments":1}');
 const demo=()=>JSON.parse(db.prepare("SELECT data FROM settings WHERE key='demo'").get()?.data||'false')===true;
 const publicUrl=()=>{try{const url=new URL(config.publicUrl);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')return null;return url.origin;}catch{return null;}};
 const status=()=>{
  const financial=settings(),reasons=[];
  if(!config.enabled)reasons.push('Integração desativada no servidor.');
  if(!config.accessToken)reasons.push('Access Token ausente no servidor.');
  if(!financial.merchantId||financial.verifiedEnvironment!==config.environment)reasons.push('Valide a conexão com a conta Mercado Pago.');
  if(!config.webhookSecret)reasons.push('Chave de assinatura do webhook ausente no servidor.');
  if(!publicUrl())reasons.push('Configure o domínio público HTTPS da aplicação.');
  if(!['test','production'].includes(config.environment))reasons.push('Ambiente Mercado Pago inválido.');
  if(db.prepare("SELECT data FROM settings WHERE key='deployment'").get()?.data==='"operational"'&&config.environment!=='production')reasons.push('O banco operacional exige Mercado Pago em produção. Use um banco separado para homologação.');
  if(demo())reasons.push('Cobranças externas ficam bloqueadas no banco de demonstração.');
  const account=get('contas-bancarias',financial.accountId);
  if(!account||account.status!=='Ativo')reasons.push('Selecione uma conta financeira ativa.');
  return {...financial,enabled:config.enabled,environment:config.environment,tokenConfigured:!!config.accessToken,
   webhookConfigured:!!config.webhookSecret,publicUrl:publicUrl(),ready:reasons.length===0,reasons};
 };
 const saveSettings=(input,actor)=>{
  const account=get('contas-bancarias',input.accountId),installments=Number(input.installments);
  if(!account||account.status!=='Ativo')throw failure('Selecione uma conta financeira ativa.');
  if(!Number.isInteger(installments)||installments<1||installments>12)throw failure('Informe de 1 a 12 parcelas.');
  db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run('financeiro',JSON.stringify({...settings(),accountId:account.id,installments}));
  audit(actor,'configure','financeiro',account.id);return status();
 };
 const verifyConnection=async actor=>{
  if(!config.accessToken)throw failure('Access Token ausente no servidor.',409);
  const merchant=await api('/users/me');if(!/^\d+$/.test(String(merchant.id||''))||(merchant.site_id&&merchant.site_id!=='MLB'))throw failure('Conta Mercado Pago brasileira inválida.',409);
  const data={...settings(),merchantId:String(merchant.id),verifiedEnvironment:config.environment,verifiedAt:timestamp()};
  db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run('financeiro',JSON.stringify(data));audit(actor,'verify','financeiro',data.merchantId);return status();
 };
 const canonical=(module,id)=>{
  if(!sources.has(module))throw failure('Este módulo não permite cobrança online.');
  const record=get(module,id);if(!record)throw failure('Registro não encontrado.',404);
  if(module==='cobrancas-agenda')return {module:'agenda',id:record.bookingId};
  return {module,id};
 };
 const findInvoice=(module,id)=>{const source=canonical(module,id);return db.prepare('SELECT * FROM invoices WHERE source_module=? AND source_id=?').get(source.module,source.id);};
 const protectedRecord=(module,id)=>{
  if(module==='contas-bancarias')return settings().accountId===id||!!db.prepare('SELECT id FROM invoices WHERE account_id=? LIMIT 1').get(id);
  return sources.has(module)&&!!findInvoice(module,id);
 };
 const api=async(path,{method='GET',body,key}={})=>{
  let response;
  try{response=await fetchImpl('https://api.mercadopago.com'+path,{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:'Bearer '+config.accessToken,'Content-Type':'application/json',...(key?{'X-Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});}
  catch{throw failure('Não foi possível consultar o Mercado Pago. Tente consultar o status mais tarde.',502);}
  if(!response.ok)throw failure('O Mercado Pago não concluiu a solicitação (HTTP '+response.status+'). Confira a configuração e consulte o histórico.',502);
  try{return await response.json();}catch{throw failure('Resposta inválida do Mercado Pago.',502);}
 };
 const checkoutUrl=value=>{try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password&&['www.mercadopago.com.br','sandbox.mercadopago.com.br','www.mercadopago.com','sandbox.mercadopago.com'].includes(url.hostname)&&!url.port)return url.href;}catch{}throw failure('Endereço de checkout inválido na resposta do Mercado Pago.',502);};
 const publicInvoice=row=>({id:row.id,module:row.billing_module,recordId:row.billing_id,description:row.description,amount:row.amount_cents/100,
  currency:row.currency,environment:row.environment,status:row.status,checkoutUrl:row.checkout_url,preferenceId:row.preference_id,
  createdAt:row.created_at,updatedAt:row.updated_at,expiresAt:row.expires_at,
  payments:db.prepare('SELECT id,status,amount_cents AS amountCents,refunded_cents AS refundedCents,fee_cents AS feeCents,method,approved_at AS approvedAt FROM provider_payments WHERE invoice_id=?').all(row.id)});
 const list=()=>db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all().map(publicInvoice);

 async function createCheckout(module,id,actor){
  const readiness=status();if(!readiness.ready)throw failure(readiness.reasons.join(' '),409);
  const source=canonical(module,id),lock=source.module+':'+source.id;
  if(active.has(lock))return active.get(lock);
  const task=(async()=>{
   let invoice=findInvoice(module,id);
   if(invoice){
    if(invoice.environment!==config.environment)throw failure('Esta cobrança pertence a outro ambiente Mercado Pago.',409);
    if(invoice.status==='pending'&&invoice.checkout_url&&Date.parse(invoice.expires_at)>now())return publicInvoice(invoice);
    throw failure('Já existe uma cobrança vinculada a este registro. Consulte o histórico antes de qualquer nova cobrança.',409);
   }
   const record=get(module,id),canonicalRecord=get(source.module,source.id);
   if(!canonicalRecord||!['Pendente','Aberto'].includes(record.status)||!['Pendente','Aberto'].includes(canonicalRecord.status))throw failure('Somente registros pendentes podem gerar cobrança.',409);
   if(source.module==='agenda'&&rows('cobrancas-agenda').some(row=>row.bookingId===source.id&&row.status==='Recebido'))throw failure('A reserva já está recebida.',409);
   const amount=cents(record.value);
   if(!Number.isSafeInteger(amount)||amount<=0||amount>100000000)throw failure('Valor de cobrança inválido.');
   if(cents(canonicalRecord.value)!==amount)throw failure('A cobrança deve corresponder ao valor integral da reserva.');
   const invoiceId=randomUUID(),key=randomUUID(),createdAt=timestamp(),expiresAt=new Date(now()+24*60*60*1000).toISOString();
   const description=(record.name||(record.date?'Reserva de quadra · '+record.date:'Cobrança')).slice(0,180);
   transaction(()=>{db.prepare('INSERT INTO invoices VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(invoiceId,source.module,source.id,module,id,description,amount,'BRL',readiness.accountId,config.environment,readiness.merchantId,'creating',null,null,key,createdAt,createdAt,expiresAt,actor);});
   // Persist the attempt before the network call. An uncertain response is never retried as a new charge.
   invoice=db.prepare('SELECT * FROM invoices WHERE id=?').get(invoiceId);
   try{
    const url=publicUrl(),back=url+'/?checkout=return#pagamentos';
    const preference=await api('/checkout/preferences',{method:'POST',key,body:{
     items:[{id:invoiceId,title:description,quantity:1,currency_id:'BRL',unit_price:amount/100}],
     external_reference:invoiceId,metadata:{invoice_id:invoiceId},notification_url:url+'/api/webhooks/mercadopago',
     back_urls:{success:back,pending:back,failure:back},auto_return:'approved',
     payment_methods:{installments:readiness.installments,excluded_payment_types:[{id:'ticket'},{id:'atm'}]},
     expires:true,expiration_date_to:expiresAt
    }});
    if(typeof preference.id!=='string'||preference.external_reference&&preference.external_reference!==invoiceId)throw failure('Preferência inválida retornada pelo Mercado Pago.',502);
    const link=checkoutUrl(config.environment==='test'?preference.sandbox_init_point:preference.init_point);
    transaction(()=>{db.prepare("UPDATE invoices SET status='pending',preference_id=?,checkout_url=?,updated_at=? WHERE id=?").run(preference.id,link,timestamp(),invoiceId);event(invoiceId,null,'checkout_created','Preferência criada; pagamento ainda não confirmado.');audit(actor,'checkout','invoices',invoiceId);});
   }catch(error){db.prepare("UPDATE invoices SET status='review',updated_at=? WHERE id=?").run(timestamp(),invoiceId);event(invoiceId,null,'checkout_uncertain','Resposta ausente ou inválida; é necessária conciliação antes de nova tentativa.');throw error;}
   return publicInvoice(db.prepare('SELECT * FROM invoices WHERE id=?').get(invoiceId));
  })();active.set(lock,task);try{return await task;}finally{active.delete(lock);}
 }

 async function reconcile(paymentId,actor='mercadopago'){
  if(!paymentIdPattern.test(String(paymentId)))throw failure('Identificador de pagamento inválido.');
  if(!config.accessToken)throw failure('Access Token ausente no servidor.',409);
  const payment=await api('/v1/payments/'+paymentId);
  let invoice=db.prepare('SELECT * FROM invoices WHERE id=?').get(String(payment.external_reference||''));
  if(!invoice)throw failure('Pagamento sem vínculo com esta aplicação.',404);
  if(String(payment.id)!==String(paymentId)||String(payment.collector_id)!==invoice.merchant_id||payment.currency_id!=='BRL'||cents(payment.transaction_amount)!==invoice.amount_cents||payment.live_mode!==(invoice.environment==='production')||invoice.environment!==config.environment)throw failure('O pagamento não corresponde ao valor, moeda ou ambiente da cobrança.',409);
  if(['approved','refunded','charged_back'].includes(payment.status)&&!payment.date_approved)throw failure('A confirmação está sem data de aprovação.',502);
  if(payment.date_approved&&!Number.isFinite(Date.parse(payment.date_approved)))throw failure('Data de aprovação do pagamento inválida.',502);
  if(!Number.isFinite(Date.parse(payment.date_last_updated)))throw failure('Data de atualização do pagamento inválida.',502);
  const fee=Array.isArray(payment.fee_details)?payment.fee_details.filter(item=>!item.fee_payer||item.fee_payer==='collector').reduce((sum,item)=>sum+cents(item.amount),0):null;
  if(fee!==null&&(!Number.isSafeInteger(fee)||fee<0||fee>invoice.amount_cents))throw failure('Taxas inválidas na resposta do Mercado Pago.',502);
  const refunded=['refunded','charged_back'].includes(payment.status)?invoice.amount_cents:cents(payment.transaction_amount_refunded||0);
  if(!Number.isSafeInteger(refunded)||refunded<0||refunded>invoice.amount_cents)throw failure('Valor de estorno inválido.',502);
  return transaction(()=>{
   invoice=db.prepare('SELECT * FROM invoices WHERE id=?').get(invoice.id);
   const old=db.prepare('SELECT * FROM provider_payments WHERE id=?').get(String(paymentId));
   if(old&&Date.parse(old.provider_updated_at)>Date.parse(payment.date_last_updated))return publicInvoice(invoice);
   if(old&&['approved','refunded','charged_back'].includes(old.status)&&!['approved','refunded','charged_back'].includes(payment.status))return publicInvoice(invoice);
   if(old&&refunded<old.refunded_cents)throw failure('O estorno informado diverge do histórico conciliado.',409);
   if(old&&old.invoice_id!==invoice.id)throw failure('Pagamento já vinculado a outra cobrança.',409);
   const eventId=createHash('sha256').update(JSON.stringify([paymentId,payment.status,payment.date_last_updated,refunded,fee])).digest('hex');
   if(db.prepare('SELECT id FROM payment_events WHERE id=?').get(eventId))return publicInvoice(db.prepare('SELECT * FROM invoices WHERE id=?').get(invoice.id));
   const alreadyPaid=db.prepare("SELECT id FROM provider_payments WHERE invoice_id=? AND status IN ('approved','refunded','charged_back','in_mediation') AND id<>?").all(invoice.id,String(paymentId));
   db.prepare('INSERT INTO provider_payments VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,refunded_cents=excluded.refunded_cents,fee_cents=COALESCE(excluded.fee_cents,provider_payments.fee_cents),method=excluded.method,approved_at=excluded.approved_at,provider_updated_at=excluded.provider_updated_at,updated_at=excluded.updated_at').run(String(paymentId),invoice.id,String(payment.status),invoice.amount_cents,refunded,fee,String(payment.payment_method_id||''),payment.date_approved||null,payment.date_last_updated,timestamp());
   let state=invoice.status;
   if(['approved','refunded','charged_back'].includes(payment.status)){
    if(alreadyPaid.length){state='review';event(invoice.id,String(paymentId),'overpayment','Outro pagamento desta cobrança já foi conciliado. Revisão manual necessária.');}
    else{
     const record=get(invoice.billing_module,invoice.billing_id);if(!record)throw failure('Registro de origem não encontrado.',409);
     // All changes and event deduplication share the same SQLite transaction.
     const received={...record,status:'Recebido'};put(invoice.billing_module,record.id,received);syncLedger(invoice.billing_module,record.id,received);
     const ledger=get('lancamentos','recebimento-'+record.id);if(ledger)put('lancamentos',ledger.id,{...ledger,accountId:invoice.account_id,paymentId:String(paymentId),paymentProvider:'mercadopago',date:businessDay(payment.date_approved||timestamp())});
     if(fee!==null){const id='taxa-mp-'+paymentId;put('lancamentos',id,{name:'Taxa Mercado Pago · '+paymentId,value:fee/100,date:businessDay(payment.date_approved||timestamp()),kind:'Despesa',status:fee>0?'Recebido':'Cancelado',accountId:invoice.account_id,sourceId:String(paymentId),sourceModule:'mercadopago-taxas'});}
     if(refunded>0){put('lancamentos','estorno-mp-'+paymentId,{name:'Estorno Mercado Pago · '+paymentId,value:refunded/100,date:businessDay(payment.date_last_updated),kind:'Despesa',status:'Recebido',accountId:invoice.account_id,sourceId:String(paymentId),sourceModule:'mercadopago-estornos'});}
     state=payment.status==='charged_back'?'charged_back':refunded===invoice.amount_cents?'refunded':refunded>0?'partially_refunded':'paid';
     if(refunded===invoice.amount_cents){put(invoice.billing_module,record.id,{...received,status:'Estornado'});if(invoice.billing_module==='cobrancas-agenda'){const booking=get('agenda',record.bookingId);put('agenda',booking.id,{...booking,status:'Estornado'});}}
    }
   }
   if(payment.status==='in_mediation')state='review';
   db.prepare('UPDATE invoices SET status=?,updated_at=? WHERE id=?').run(state,timestamp(),invoice.id);
   event(invoice.id,String(paymentId),'payment_'+payment.status,'Estado confirmado pela API do Mercado Pago.',eventId,{status:payment.status,amountCents:invoice.amount_cents,refundedCents:refunded,feeCents:fee,method:payment.payment_method_id||'',providerUpdatedAt:payment.date_last_updated});audit(actor,'reconcile','invoices',invoice.id);
   return publicInvoice(db.prepare('SELECT * FROM invoices WHERE id=?').get(invoice.id));
  });
 }

 async function webhook(req,url,input){
  const id=url.searchParams.get('data.id');
  if(!verifyWebhook({secret:config.webhookSecret,signature:req.headers['x-signature'],requestId:req.headers['x-request-id'],dataId:id,now:now()}))throw failure('Assinatura de notificação inválida.',401);
  if(input.type!=='payment'||String(input.data?.id)!==id)throw failure('Notificação de pagamento inválida.');
  const fingerprint=createHash('sha256').update(req.headers['x-request-id']+':'+req.headers['x-signature']+':'+id).digest('hex');
  if(db.prepare('SELECT fingerprint FROM webhook_receipts WHERE fingerprint=?').get(fingerprint))return {ok:true};
  await reconcile(id);
  db.prepare('INSERT OR IGNORE INTO webhook_receipts VALUES(?,?,?)').run(fingerprint,id,timestamp());return {ok:true};
 }
 const history=()=>db.prepare('SELECT id,invoice_id AS invoiceId,payment_id AS paymentId,event_type AS type,detail,created_at AS createdAt,snapshot FROM payment_events ORDER BY created_at DESC LIMIT 200').all();
 return {status,saveSettings,verifyConnection,createCheckout,reconcile,webhook,list,history,protectedRecord};
}
