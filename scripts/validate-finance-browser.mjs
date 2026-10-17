import assert from 'node:assert/strict';
import {randomBytes,createHmac} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createApp} from '../server.mjs';

const {chromium}=await import(process.env.QF_PLAYWRIGHT_MODULE||'playwright-core');
const provider={preference:null,status:'pending',requests:0};
const secret=randomBytes(24).toString('hex');
const server=await createApp({databasePath:':memory:',paymentOptions:{
 config:{accessToken:'LOCAL-FAKE-TOKEN',webhookSecret:secret,environment:'test',enabled:true,publicUrl:'https://quadra.example.com'},
 fetchImpl:async(url,options)=>{
  provider.requests++;
  if(url.endsWith('/users/me'))return Response.json({id:123456,site_id:'MLB'});
  if(url.endsWith('/checkout/preferences')){provider.preference=JSON.parse(options.body);return Response.json({id:'preference-browser-test',external_reference:provider.preference.external_reference,sandbox_init_point:'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=browser-test'});}
  if(url.endsWith('/v1/payments/90001'))return Response.json({id:90001,collector_id:123456,external_reference:provider.preference.external_reference,transaction_amount:120,currency_id:'BRL',status:provider.status,live_mode:false,payment_method_id:'pix',transaction_amount_refunded:0,fee_details:[{amount:1.2}],date_approved:provider.status==='approved'?'2026-10-17T13:00:00Z':null,date_last_updated:provider.status==='approved'?'2026-10-17T13:00:00Z':'2026-10-17T12:00:00Z'});
  throw new Error('Unexpected mocked provider URL');
 }
}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.QF_BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const result={provider:'simulado localmente; nenhuma chamada ao Mercado Pago real',checks:[],errors:[],passed:false};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'pt-BR'});page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(15000);
 page.on('pageerror',error=>result.errors.push(error.message));
 const origin='http://127.0.0.1:'+server.address().port;
 const setup=await page.request.post(origin+'/api/setup',{data:{name:'Gestor Operacional',email:'gestor@example.com',password:randomBytes(24).toString('hex'),demo:false}});assert.equal(setup.status(),200);const {csrf}=await setup.json();
 const api=async(path,data)=>{const response=await page.request.post(origin+'/api'+path,{headers:{'x-csrf-token':csrf},data});assert.ok(response.ok(),await response.text());return response.json();};
 const visit=async route=>{await page.goto(origin+'/#'+route,{waitUntil:'networkidle'});await page.locator('#view').waitFor();await page.evaluate(()=>document.fonts.ready);};
 const shot=async name=>{await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#toast')).opacity)===0);await page.screenshot({path:fileURLToPath(new URL('../docs/'+name,import.meta.url))});};
 await visit('dashboard');assert.equal(await page.locator('.kpi-value').count(),6);assert.ok(!(await page.locator('#view').textContent()).includes('NaN'));assert.equal(await page.locator('.kpi-value').first().textContent(),'R$ 0,00');result.checks.push('Dashboard vazio usa dados reais do banco, sem valores fictícios');
 const account=await api('/records/contas-bancarias',{name:'Recebimentos Mercado Pago',status:'Ativo'});
 const customer=await api('/records/clientes',{name:'Cliente de homologação'});const court=await api('/records/quadras',{name:'Quadra de homologação'});
 const booking=await api('/records/agenda',{courtId:court.id,customerId:customer.id,date:'2026-11-10',start:'18:00',end:'19:00',value:120,status:'Pendente'});
 await page.reload({waitUntil:'networkidle'});await visit('financeiro-config');await page.locator('#finance-account').selectOption(account.id);await page.locator('#finance-installments').selectOption('3');await page.getByRole('button',{name:'Salvar configurações',exact:true}).click();
 await page.locator('#verify-mercadopago').click();await page.locator('.finance-readiness.ready').waitFor();result.checks.push('Configuração de conta e parcelas; validação da conexão com provedor simulado');
 await shot('financeiro-configuracao-homologacao.png');
 await visit('agenda');await page.locator('[data-checkout="'+booking.id+'"]').click();await page.locator('#generate-checkout').click();await page.locator('#checkout-link').waitFor();
 assert.equal(new URL(await page.locator('#checkout-link').inputValue()).hostname,'sandbox.mercadopago.com.br');assert.equal(provider.preference.items[0].unit_price,120);await page.locator('[data-close-payment]').first().click();result.checks.push('Gerar link de cartão/Pix usando o valor persistido na reserva');
 await visit('pagamentos');assert.ok((await page.locator('.payment-status').textContent()).includes('Aguardando'));
 const ts=String(Date.now()),requestId='browser-webhook-test',digest=createHmac('sha256',secret).update(`id:90001;request-id:${requestId};ts:${ts};`).digest('hex');
 const notification=await page.request.post(origin+'/api/webhooks/mercadopago?data.id=90001',{headers:{'x-request-id':requestId,'x-signature':`ts=${ts},v1=${digest}`},data:{type:'payment',data:{id:'90001'}}});assert.equal(notification.status(),200);
 let boot=await(await page.request.get(origin+'/api/bootstrap')).json();assert.equal(boot.records.agenda[0].status,'Pendente');
 provider.status='approved';await page.locator('#provider-payment-id').fill('90001');await page.getByRole('button',{name:'Consultar status',exact:true}).click();await page.locator('.payment-status-paid').waitFor();
 boot=await(await page.request.get(origin+'/api/bootstrap')).json();assert.equal(boot.records.agenda[0].status,'Recebido');assert.equal(boot.records.lancamentos.filter(row=>row.kind==='Receita').length,1);assert.equal(boot.records.lancamentos.find(row=>row.kind==='Despesa').value,1.2);
 result.checks.push('Webhook pendente não baixa a reserva; consulta aprovada registra receita e taxa uma vez');
 await visit('agenda/editar/'+booking.id);assert.equal(await page.locator('#field-value').isDisabled(),true);await page.locator('#field-notes').fill('Observação sem alterar recebimento');await page.getByRole('button',{name:'Alterar',exact:true}).click();await page.waitForURL('**/#agenda/listar');const afterNote=await(await page.request.get(origin+'/api/bootstrap')).json();assert.equal(afterNote.records.lancamentos.find(row=>row.kind==='Receita').accountId,account.id);result.checks.push('Origem cobrada bloqueia campos financeiros; observação não desfaz a conciliação');
 await page.setViewportSize({width:390,height:844});await visit('dashboard');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('dashboard-celular-atualizado.png');result.checks.push('Dashboard móvel em 390 px, sem transbordamento horizontal');
 await visit('financeiro-config');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));result.checks.push('Configuração financeira acessível no celular');
 assert.deepEqual(result.errors,[]);result.passed=true;result.providerRequests=provider.requests;
 await writeFile(fileURLToPath(new URL('../docs/validacao-financeiro.json',import.meta.url)),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}catch(error){for(const context of browser.contexts())for(const page of context.pages())await page.screenshot({path:'/tmp/quadrinha-finance-failure.png'});throw error;}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
