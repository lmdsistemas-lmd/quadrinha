# Mercado Pago: cartão e Pix pelo Checkout Pro

O proprietário escolheu cobranças online pelo **Checkout Pro**. Não foi implementada integração com maquininha Point. O cliente abre o checkout hospedado pelo Mercado Pago; a aplicação não recebe nem armazena número de cartão, CVV ou token de cartão.

## Situação desta entrega

Estão implementados: criação e reutilização de preferência, vínculo com a origem da cobrança, consulta de pagamento, validação de assinatura do webhook, conferência de valor/moeda/recebedor/ambiente, baixa integral, taxas do vendedor, estornos recebidos do provedor, histórico e proteção contra duplicações.

**A integração não está ativada em uma conta Mercado Pago real.** O ambiente não possui Access Token nem chave do webhook, e o proprietário ainda fornecerá o domínio HTTPS. Os testes registrados usam um provedor local simulado e não efetuam chamadas de cobrança no Mercado Pago. A disponibilidade de Pix e das modalidades de cartão depende da habilitação da conta no Mercado Pago.

## Preparar credenciais no servidor

Na instalação privada, copie `.env.example` para `.env`, que está ignorado pelo Git, ou use o gerenciador de segredos da hospedagem. Não envie os valores pelo chat nem os coloque no frontend.

| Variável | Valor esperado |
| --- | --- |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token privado da aplicação/conta do vendedor |
| `MERCADOPAGO_WEBHOOK_SECRET` | Chave secreta de assinatura fornecida na configuração de Webhooks |
| `MERCADOPAGO_ENVIRONMENT` | `test` para homologação, `production` para operação |
| `MERCADOPAGO_ENABLED` | `false` inicialmente; `true` depois de configurar e validar |
| `APP_PUBLIC_URL` | Origem pública HTTPS da aplicação, sem caminho, query, fragmento ou credenciais |
| `NODE_ENV` | `production` na hospedagem HTTPS, para cookies Secure |

Reinicie o processo depois de alterar o ambiente. `npm start` e `npm run start:operational` leem o `.env` local e respeitam o proxy do ambiente por meio da opção Node `--use-env-proxy`.

No ambiente de nuvem Codex, foi salvo um requisito de segredo para `MERCADOPAGO_ACCESS_TOKEN`, com destino HTTPS `api.mercadopago.com`. Foram registrados os nomes das demais variáveis e as instruções de inicialização. **A chave do webhook precisa estar disponível diretamente ao processo que valida o HMAC**; um placeholder destinado apenas à substituição de tráfego por proxy não serve para isso. Use o segredo real no ambiente privado do servidor da aplicação. Não o imprima para verificar a configuração.

## Homologação antes de operar

Use contas e credenciais de teste do Mercado Pago e um banco separado, por exemplo `data/homologacao.sqlite`, sem carregar a demonstração. Configure esse caminho no ambiente de uma instalação de homologação e inicie com `npm start`. Use `MERCADOPAGO_ENVIRONMENT=test`.

O banco marcado como operacional recusa checkout em modo `test`. O banco de demonstração também recusa cobranças externas. Esse isolamento evita registrar dinheiro simulado no caixa operacional.

Quando houver um domínio HTTPS, configure no painel Mercado Pago uma notificação do tipo **payment** para:

```text
https://SEU-DOMINIO/api/webhooks/mercadopago
```

O servidor precisa receber `x-signature`, `x-request-id` e o parâmetro `data.id` preservados pelo proxy. A assinatura utiliza o manifesto `id:...;request-id:...;ts:...;`, HMAC SHA-256 e uma janela de dez minutos; mantenha o relógio do servidor sincronizado. Notificações sem assinatura válida são recusadas. Notificações IPN antigas, `merchant_order`, OAuth de vários vendedores e assinaturas recorrentes não fazem parte desta versão.

Em **Financeiro → Configurações Financeiras**:

1. Cadastre e selecione uma conta bancária/caixa ativa para os lançamentos locais.
2. Defina o limite de parcelas, de 1 a 12.
3. Clique em **Validar conexão** para conferir a conta brasileira pela API `/users/me`.
4. Resolva os itens apresentados em “Configuração pendente”.
5. Abra uma reserva/cobrança pendente e clique em **Cobrar online → Gerar link de pagamento**.
6. Conclua o checkout com os recursos de teste indicados pelo Mercado Pago. Confira pagamento pendente, aprovado, rejeitado e a notificação autenticada.

Para operação, use o banco operacional, credenciais de produção, `MERCADOPAGO_ENVIRONMENT=production` e o domínio definitivo. A configuração continua bloqueada até validar a conexão e definir a conta financeira. A indicação “Integração configurada” confirma somente os requisitos verificados pelo aplicativo; não substitui a homologação de pagamentos, notificações e configuração da conta junto ao Mercado Pago.

## Conciliação e histórico

O valor é lido do registro no servidor, em centavos, e não do navegador. A preferência possui uma referência externa aleatória vinculada à cobrança. O retorno do checkout **não** altera a reserva ou gera receita.

O webhook autenticado ou a ação **Consultar status** busca `/v1/payments/{id}`. Antes de baixar, confere referência, ID, recebedor, valor integral, moeda BRL e `live_mode`. Aprovação gera uma receita na conta selecionada. Taxas informadas para o vendedor geram uma despesa separada; taxas pagas pelo comprador não viram despesa do centro. Os valores são os retornados pelo provedor, sem estimativa de percentual.

Estorno parcial ou total confirmado pela API gera uma despesa de estorno e mantém a receita histórica. Estorno total marca a origem como “Estornado”. Contestação em mediação exige revisão; chargeback confirmado também registra reversão. A reserva não é apagada nem liberada automaticamente quando um pagamento é estornado.

Notificações repetidas, consultas repetidas e mensagens fora de ordem não duplicam os lançamentos. Um segundo pagamento aprovado para a mesma cobrança exige revisão e não cria uma segunda receita automaticamente. Alterações de valor, status e exclusão da origem ficam bloqueadas após criar cobrança online; observações continuam editáveis. O servidor também impede criar uma cobrança manual alternativa para a reserva vinculada.

Se a resposta da criação de preferência for incerta, a cobrança fica em revisão; o aplicativo não cria outra automaticamente. Consulte a conta Mercado Pago e o ID de pagamento em Pagamentos Online. Preferências expiradas não são reemitidas automaticamente enquanto pagamentos pendentes puderem existir. A aplicação não inicia estornos na API: eles devem ser feitos no Mercado Pago e conciliados aqui.

## Referências e limites de validação

- [Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing)
- [Criar preferência](https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post)
- [Consultar pagamento](https://www.mercadopago.com.br/developers/pt/reference/payments/_payments_id/get)
- [Notificações e assinatura](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [SDK Node oficial: tipos de preferência](https://github.com/mercadopago/sdk-nodejs/blob/master/src/clients/preference/commonTypes.ts)
- [SDK Node oficial: tipos de pagamento](https://github.com/mercadopago/sdk-nodejs/blob/master/src/clients/payment/commonTypes.ts)

O acesso aos sites de documentação e à API estava bloqueado pela política de rede desta execução. Os tipos oficiais do SDK foram consultados pelo GitHub. O requisito salvo acrescentou `api.mercadopago.com` ao rascunho de rede; isso não comprova propagação ao processo atual nem conexão com a conta. Se necessário para consultar os guias neste ambiente, acrescente `www.mercadopago.com.br` às configurações de rede sem remover os destinos existentes.

Veja [validacao-financeiro.json](validacao-financeiro.json). Os testes locais não certificam a experiência no checkout hospedado, os meios habilitados da conta, a entrega de notificações pela internet ou o recebimento de dinheiro real.
