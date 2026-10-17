import nodemailer from 'nodemailer';
import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {fail,textField} from './platform-security.mjs';
export function createIntegrations({db,vault,publicUrl,fetchImpl=fetch,smtpFactory=nodemailer.createTransport}){
 db.exec(`CREATE TABLE IF NOT EXISTS integrations(scope TEXT NOT NULL,provider TEXT NOT NULL,encrypted TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(scope,provider));CREATE TABLE IF NOT EXISTS mail_outbox(id TEXT PRIMARY KEY,encrypted TEXT NOT NULL,status TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,last_attempt TEXT);CREATE TABLE IF NOT EXISTS whatsapp_messages(id TEXT PRIMARY KEY,scope TEXT NOT NULL,provider_id TEXT UNIQUE,status TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);`);
 const get=(scope,provider)=>{const row=db.prepare('SELECT encrypted FROM integrations WHERE scope=? AND provider=?').get(scope,provider);return row?vault.open(row.encrypted,scope+':'+provider):{};};
 const save=(scope,provider,input)=>{
  const old=get(scope,provider);let result;
  if(provider==='mercadopago'){
   if(!['test','production'].includes(input.environment))throw fail('Selecione homologação ou produção.');
   result={environment:input.environment,enabled:input.enabled===true,accessToken:input.accessToken?textField(input.accessToken,500):old.accessToken||'',webhookSecret:input.webhookSecret?textField(input.webhookSecret,500):old.webhookSecret||''};
  }else if(provider==='smtp'){
   const host=textField(input.host,253),port=Number(input.port);if(!/^[a-zA-Z0-9.-]+$/.test(host)||![465,587,2525].includes(port))throw fail('Use um servidor SMTP e porta 465, 587 ou 2525.');
   const from=textField(input.from,254);if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from))throw fail('Remetente inválido.');
   result={host,port,secure:port===465,user:textField(input.user,254),password:input.password?textField(input.password,500):old.password||'',from};
  }else if(provider==='whatsapp'){
   if(!/^\d{5,30}$/.test(input.phoneNumberId||''))throw fail('Informe o ID do número na WhatsApp Business Platform.');
   result={phoneNumberId:input.phoneNumberId,accessToken:input.accessToken?textField(input.accessToken,2000):old.accessToken||'',appSecret:input.appSecret?textField(input.appSecret,500):old.appSecret||'',verifyToken:input.verifyToken?textField(input.verifyToken,200):old.verifyToken||'',template:textField(input.template||'',100,false),language:textField(input.language||'pt_BR',15),enabled:input.enabled===true};
   if(!/^[a-z_0-9]*$/.test(result.template)||!/^[A-Za-z_]{2,15}$/.test(result.language))throw fail('Nome do modelo ou idioma inválido.');
  }else throw fail('Integração não disponível.',404);
  db.prepare('INSERT OR REPLACE INTO integrations VALUES(?,?,?,?)').run(scope,provider,vault.seal(result,scope+':'+provider),new Date().toISOString());return status(scope,provider);
 };
 const status=(scope,provider)=>{
  const c=get(scope,provider);
  if(provider==='mercadopago')return {environment:c.environment||'test',enabled:!!c.enabled,tokenConfigured:!!c.accessToken,webhookConfigured:!!c.webhookSecret};
  if(provider==='smtp')return {host:c.host||'',port:c.port||587,user:c.user||'',from:c.from||'',passwordConfigured:!!c.password,configured:!!(c.host&&c.password&&c.from)};
  if(provider==='whatsapp')return {phoneNumberId:c.phoneNumberId||'',template:c.template||'',language:c.language||'pt_BR',enabled:!!c.enabled,tokenConfigured:!!c.accessToken,appSecretConfigured:!!c.appSecret,verifyTokenConfigured:!!c.verifyToken,webhookUrl:publicUrl?publicUrl+'/api/whatsapp/'+scope:null};
  throw fail('Integração não encontrada.',404);
 };
 const paymentConfig=(scope,webhookPath,returnPath)=>({...get(scope,'mercadopago'),environment:get(scope,'mercadopago').environment||'test',publicUrl,webhookPath,returnPath});
 const transport=()=>{const c=get('platform','smtp');if(!c.host||!c.password)throw fail('Configure o SMTP da plataforma antes de enviar e-mails.',409);return smtpFactory({host:c.host,port:c.port,secure:c.secure,requireTLS:true,auth:{user:c.user,pass:c.password},tls:{minVersion:'TLSv1.2'},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000});};
 const enqueue=(to,subject,text)=>{const id=randomUUID();db.prepare('INSERT INTO mail_outbox(id,encrypted,status,created_at) VALUES(?,?,?,?)').run(id,vault.seal({to,subject,text},'mail:'+id),'pending',new Date().toISOString());return id;};
 let sending=false,stopped=false;
 async function flush(){if(sending||stopped)return;sending=true;try{if(!status('platform','smtp').configured)return;for(const row of db.prepare("SELECT * FROM mail_outbox WHERE status IN ('pending','retry') AND attempts<5 AND (last_attempt IS NULL OR last_attempt<?) ORDER BY created_at LIMIT 10").all(new Date(Date.now()-60000).toISOString())){if(stopped)break;db.prepare("UPDATE mail_outbox SET attempts=attempts+1,last_attempt=? WHERE id=?").run(new Date().toISOString(),row.id);try{await transport().sendMail({from:get('platform','smtp').from,...vault.open(row.encrypted,'mail:'+row.id),disableFileAccess:true,disableUrlAccess:true});if(stopped)return;db.prepare("UPDATE mail_outbox SET status='sent',encrypted='' WHERE id=?").run(row.id);}catch{if(stopped)return;db.prepare("UPDATE mail_outbox SET status='retry' WHERE id=?").run(row.id);}}}finally{sending=false;}}
 async function verifySmtp(){await transport().verify().catch(()=>{throw fail('Falha ao validar o SMTP. Confira host, autenticação, TLS e liberação de rede.',502);});return {ok:true};}
 async function whatsApi(scope,path,options={}){const c=get(scope,'whatsapp');if(!c.accessToken)throw fail('Configure o token da WhatsApp Business Platform.',409);let response;try{response=await fetchImpl('https://graph.facebook.com/v23.0/'+path,{...options,redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:'Bearer '+c.accessToken,'Content-Type':'application/json'}});}catch{throw fail('Não foi possível consultar a WhatsApp Business Platform.',502);}if(!response.ok)throw fail('WhatsApp recusou a solicitação (HTTP '+response.status+'). Confira a configuração e o modelo aprovado.',502);return response.json();}
 async function verifyWhatsApp(scope){const c=get(scope,'whatsapp');const result=await whatsApi(scope,c.phoneNumberId+'?fields=id,display_phone_number,verified_name');if(String(result.id)!==c.phoneNumberId)throw fail('Conta WhatsApp inválida.',502);return {ok:true,number:result.display_phone_number||'',name:result.verified_name||''};}
 async function sendWhatsApp(scope,{phone,consent}){
  const c=get(scope,'whatsapp');if(!c.enabled||!c.template)throw fail('Ative a integração e configure um modelo aprovado sem variáveis para o envio manual.',409);
  if(consent!==true||!/^\d{10,15}$/.test(phone||''))throw fail('Informe DDI + DDD + número e confirme o consentimento do destinatário.');
  const id=randomUUID(),now=new Date().toISOString();db.prepare('INSERT INTO whatsapp_messages VALUES(?,?,?,?,?,?)').run(id,scope,null,'sending',now,now);
  try{const result=await whatsApi(scope,c.phoneNumberId+'/messages',{method:'POST',body:JSON.stringify({messaging_product:'whatsapp',to:phone,type:'template',template:{name:c.template,language:{code:c.language}}})});const providerId=result.messages?.[0]?.id;if(typeof providerId!=='string')throw fail('Resposta inválida do WhatsApp.',502);db.prepare('UPDATE whatsapp_messages SET provider_id=?,status=?,updated_at=? WHERE id=?').run(providerId,'accepted',new Date().toISOString(),id);return {id,status:'accepted'};}catch(error){db.prepare("UPDATE whatsapp_messages SET status='review' WHERE id=?").run(id);throw error;}
 }
 function verifyChallenge(scope,url){const c=get(scope,'whatsapp');if(!c.verifyToken||url.searchParams.get('hub.mode')!=='subscribe'||url.searchParams.get('hub.verify_token')!==c.verifyToken)throw fail('Verificação inválida.',403);return url.searchParams.get('hub.challenge')||'';}
 function whatsWebhook(scope,raw,signature){const c=get(scope,'whatsapp');const expected=createHmac('sha256',c.appSecret||'').update(raw).digest('hex');if(!c.appSecret||!/^sha256=[a-f0-9]{64}$/.test(signature||'')||!timingSafeEqual(Buffer.from(expected),Buffer.from(signature.slice(7))))throw fail('Assinatura WhatsApp inválida.',401);let data;try{data=JSON.parse(raw);}catch{throw fail('JSON inválido.');}for(const entry of data.entry||[])for(const change of entry.changes||[]){if(String(change.value?.metadata?.phone_number_id)!==c.phoneNumberId)continue;for(const item of change.value?.statuses||[])if(['sent','delivered','read','failed'].includes(item.status)){const row=db.prepare('SELECT status FROM whatsapp_messages WHERE scope=? AND provider_id=?').get(scope,item.id);const order={sending:0,accepted:1,sent:2,delivered:3,read:4,failed:5};if(row&&order[item.status]>order[row.status])db.prepare('UPDATE whatsapp_messages SET status=?,updated_at=? WHERE scope=? AND provider_id=?').run(item.status,new Date().toISOString(),scope,item.id);}}return {ok:true};}
 return {stop:()=>{stopped=true;},get,save,status,paymentConfig,enqueue,flush,verifySmtp,verifyWhatsApp,sendWhatsApp,verifyChallenge,whatsWebhook};
}
