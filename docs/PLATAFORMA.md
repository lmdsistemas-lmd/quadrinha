# Plataforma com três áreas

A versão SaaS inicia com `npm start`. Ela preserva a aplicação anterior, mas não importa automaticamente seus usuários, registros ou o banco operacional. Cada arena começa vazia e pode receber dados reais próprios. Não foram importados dados do sistema de referência.

| Área | Rota | Responsabilidade |
| --- | --- | --- |
| Proprietário da plataforma | `/admin` | Empresas, ativação/desativação dos acessos, recuperação de senha por e-mail, edição/publicação de planos, SMTP e recebimentos das assinaturas |
| Dono das quadras | `/conta` e `/app/{arena}` | Assinatura, gestão da arena, equipe por convites, credenciais Mercado Pago/WhatsApp próprias e configuração da página pública |
| Cliente final | `/reservar/{arena}` | Consulta de disponibilidade, cadastro com verificação de e-mail, login, reservas próprias e pagamento à arena |

As APIs da plataforma, empresa e portal conferem a identidade no servidor. Conhecer o endereço de outra empresa não concede acesso. O superadministrador não recebe acesso implícito à operação de todas as arenas. Usuários finais têm identidades distintas e não entram no painel do dono das quadras.

## Primeira execução

Requer Node 24.18.0. Instale as dependências com o lockfile:

```bash
npm ci
npm run platform:admin
npm start
```

`platform:admin` é um comando local e interativo. Ele solicita nome, e-mail e senha oculta. Não existe administrador padrão nem endpoint público de criação do superadministrador. Use uma senha própria e entre por `/admin`. O administrador criado pelo comando local já possui o e-mail marcado como verificado; os demais cadastros precisam confirmar o endereço por e-mail. Não execute esse comando repetidamente durante a inicialização do servidor.

O servidor usa `127.0.0.1:3000`. Defina `HOST`/`PORT` conforme sua hospedagem. Para desenvolver no próprio computador, deixe `APP_PUBLIC_URL` vazio e mantenha `HOST=127.0.0.1` (ou `::1`). A aplicação usa automaticamente o endereço e a porta reais do servidor local para os links de cadastro, confirmação de e-mail, convite e recuperação de senha. Configure o SMTP para enviar esses e-mails; a verificação continua obrigatória. Abra os links no mesmo computador que executa a aplicação. As arenas podem ser ativadas manualmente em `/admin`, e as reservas locais funcionam sem checkout online.

Ao publicar, coloque o serviço atrás de HTTPS e configure `APP_PUBLIC_URL` com a origem pública, como `https://gestao.seu-dominio.com.br`, sem caminho, consulta ou fragmento. Um endereço HTTPS temporário de hospedagem também serve, sem precisar comprar um domínio próprio. Checkout e webhooks externos continuam exigindo essa origem pública. O endereço local nunca é usado como fallback para pagamentos e não é inferido do cabeçalho Host. Se o serviço estiver vinculado a `0.0.0.0` ou outra interface não local, configure a origem pública para habilitar os links de cadastro. Ao definir uma origem HTTPS em produção, os cookies exigem transporte seguro.

O modo padrão é `PLATFORM_MODE=production`. Credenciais Mercado Pago de homologação ficam bloqueadas nesse banco. Para desenvolvimento financeiro isolado use **outro diretório**, `PLATFORM_MODE=test` e `PLATFORM_DATA_DIR=/caminho/privado/de/testes`. O modo de teste não gera dados fictícios automaticamente. Não altere o mesmo banco de produção para homologação. O marcador operacional impede pagamentos de teste mesmo se a variável for alterada depois.

A execução anterior continua disponível em `npm run start:standalone` e `npm run start:operational`. Elas são instalações de uma única empresa, sem o controle central de três áreas. Use bancos e portas separados; não exponha um servidor standalone junto do banco de uma arena SaaS.

## Banco e chaves privadas

O diretório padrão `data/platform/` contém:

- `platform.sqlite`: contas, permissões, empresas, planos, vigências, tokens de autenticação, auditoria, fila SMTP e configurações criptografadas.
- `platform-billing.sqlite`: apenas cobranças e recebimentos das assinaturas da plataforma.
- `tenants/{uuid}.sqlite`: um banco independente para cada arena, com agenda, cadastros e recebimentos das reservas.
- `platform.key`: chave local de criptografia, criada com permissão `0600` quando não há `PLATFORM_ENCRYPTION_KEY`.

Credenciais SMTP, Mercado Pago e WhatsApp e os links privados da fila SMTP usam AES-256-GCM, com contexto da empresa e do provedor. A API retorna somente indicadores de configuração e campos públicos. Um campo secreto vazio mantém o valor anterior. Senhas de login usam scrypt com salt; sessões e tokens de confirmação/recuperação ficam somente como hashes. Tokens de confirmação duram 24 horas; recuperação/convite, uma hora, com uso único. Trocar a senha revoga as sessões anteriores. A fila elimina o conteúdo privado após o aceite pelo SMTP.

Em produção, forneça uma chave estável de 32 bytes em hexadecimal por um gerenciador de segredos **diretamente ao processo** como `PLATFORM_ENCRYPTION_KEY`, ou preserve com segurança `platform.key`. Ela é usada localmente e não deve ser um placeholder de substituição do proxy HTTP. Não troque nem perca essa chave sem uma migração das credenciais. Não a inclua em Git ou logs.

Mantenha esse diretório em volume persistente. Para um backup simples, pare o servidor e copie o diretório completo, com todos os bancos, WAL/SHM existentes e a chave correspondente. Teste a restauração. Esta entrega não configura hospedagem, backup automático, cluster ou alta disponibilidade; SQLite e os arquivos separados são destinados a uma instância do processo.

## E-mail e acessos

Em `/admin`, configure o SMTP com host, porta 465 (TLS implícito) ou 587/2525 (STARTTLS obrigatório), usuário, senha e remetente autorizado. Use “Validar SMTP” e “Processar fila”. A fila persiste no banco, tenta novamente a cada minuto e limita cada mensagem a cinco tentativas. Falhas não são apresentadas como mensagens enviadas. “Aceito pelo SMTP” não garante entrega na caixa de entrada: SPF, DKIM, DMARC, limites e reputação são administrados no provedor.

O cadastro do dono cria a arena e solicita confirmação de e-mail. O acesso à gestão começa após ativação manual pela plataforma ou pagamento do plano. `/conta` continua disponível para contratar/renovar enquanto a gestão está bloqueada. “Desativar” aplica bloqueio manual imediato e não é desfeito por um webhook de pagamento. “Usar vigência do plano” libera o acesso conforme os períodos pagos. Recuperação envia link ao proprietário, nunca devolve uma senha ao administrador.

A equipe é adicionada pelo módulo Usuários da arena. Um novo usuário recebe convite para definir sua senha. Se já possui uma conta verificada na plataforma, o convite apenas concede a associação à empresa; não substitui a senha existente. Administrador, Atendente e Consulta são permissões da empresa, diferentes do superadministrador.

## Planos e pagamentos da plataforma

Os oito planos da tela de referência foram cadastrados como **rascunhos anuais**, para revisão antes da venda. Não são anunciados recursos que esta implementação ainda não oferece, como apps próprios nas lojas ou emissão fiscal.

| Plano | Equivalente mensal observado | Total de 12 meses |
| --- | ---: | ---: |
| Quadra Start | R$ 116,91 | R$ 1.402,92 |
| Quadra Premium | R$ 325,41 | R$ 3.904,92 |
| Quadra Performance | R$ 288,21 | R$ 3.458,52 |
| Quadra Digital | R$ 278,91 | R$ 3.346,92 |
| Quadra Smart | R$ 278,91 | R$ 3.346,92 |
| Quadra Mobile | R$ 269,61 | R$ 3.235,32 |
| Quadra Connect | R$ 269,61 | R$ 3.235,32 |
| Quadra Web | R$ 213,81 | R$ 2.565,72 |

O total anual é o que se cobra, não o equivalente de um mês. O administrador pode criar planos e editar preço, período (1, 3, 6 ou 12 meses), limite de quadras, descrição e publicação. Cada compra preserva a versão do plano e o preço no momento da contratação. Alterações posteriores não reescrevem compras anteriores. A criação de quadras respeita o limite do último plano pago; contas ativadas manualmente começam com limite de cinco quadras.

Configure **sua própria conta Mercado Pago** em `/admin`, valide a conexão e salve a conta financeira de recebimentos. O webhook da plataforma é `/api/platform/webhooks/mercadopago`. Os planos usam Checkout Pro com cartão e Pix, mediante habilitação da conta. O modo de produção exige credenciais de produção, assinatura do webhook e HTTPS.

A renovação é uma **nova compra do período**, sem débito automático ou tokenização própria de cartão. Pagamentos aprovados e conferidos pela API geram a vigência; repetição do webhook não duplica o período. Estornos totais/chargebacks retiram a concessão correspondente e recalculam a vigência. Estornos parciais preservam a concessão. Mudanças bancárias de liquidação são feitas na conta Mercado Pago; trocar o nome da conta financeira local não altera o beneficiário bancário.

## Mercado Pago de cada arena

Em `/app/{arena}#financeiro-config`, cada administrador grava **seu** Access Token, assinatura do webhook, ambiente e ativação. Depois cadastra uma conta financeira, define parcelas e valida a conexão. O webhook é `/app/{arena}/api/webhooks/mercadopago`. A conta verificada recebe os pagamentos das reservas dessa arena; os tokens globais do modo standalone não são usados como fallback no SaaS.

A notificação confere assinatura HMAC, consulta a API e valida referência, valor, moeda, ambiente e recebedor. O retorno do navegador não confirma pagamento. As receitas, taxas, estornos e histórico são preservados no banco financeiro correto. Uma resposta incerta ao criar checkout exige conciliação, sem repetir cegamente a cobrança. Configure o evento de pagamentos e a assinatura no aplicativo Mercado Pago de cada conta.

## Portal público

A arena configura título, texto, endereço, contato, cor, duração e publicação em Reserva Online. O portal lista apenas quadras ativas marcadas para reserva online e tarifas avulsas ativas compatíveis com dia, horário e duração. Considera horários de funcionamento, reservas existentes e bloqueios entre quadras. Preços e conflitos são conferidos no servidor; o navegador não define o valor a cobrar.

O jogador cria um cadastro daquela arena, confirma seu e-mail e pode reservar e pagar apenas suas próprias reservas. Uma reserva pendente ocupa o horário. **Não há liberação automática por abandono do checkout**: o dono deve acompanhar pendências. Registros vinculados a checkout não podem ser apagados ou alterados financeiramente sem análise. Não foram implementados cancelamento com estorno automático, fila de espera, pacotes públicos, eventos que atravessam meia-noite ou aplicativos nativos. Reservas recebidas por esta página geram notificações no painel da arena.

## WhatsApp

Cada arena configura a **WhatsApp Business Platform da Meta**, com ID do número, Access Token, App Secret, token de verificação, modelo aprovado e idioma. O webhook é exibido na própria tela e fica em `/api/whatsapp/{uuid}`; configure a inscrição no evento `messages`. A API usa `graph.facebook.com/v23.0`. O envio manual exige confirmação do consentimento, telefone internacional e um modelo aprovado **sem variáveis**. Mensagens aceitas só mudam para enviadas/entregues/lidas mediante webhook assinado e vinculado ao número correto.

Ter apenas um número de WhatsApp comum não fornece essas credenciais. É necessário configurar a conta comercial e o aplicativo na Meta. Esta etapa não implementa robô de conversação, reservas automáticas pelo WhatsApp, agendamento de lembretes nem cobrança por créditos de mensagem. SMS, Pagar.me e emissão fiscal não foram ativados; o usuário optou por e-mail e WhatsApp, sem emissão fiscal nesta etapa.

## Validação e publicação

`npm test` cobre os fluxos de isolamento, confirmação de e-mail, recuperação de senha, convites, bloqueio imediato, disponibilidade e privacidade das reservas, contas Mercado Pago separadas, vigência sem duplicação e assinatura do WhatsApp, além das regras anteriores. Os provedores externos são substituídos apenas nos testes.

`npm run test:platform-browser` exercita as três áreas no Chromium com banco temporário e transportes de teste. Veja `docs/validacao-plataforma.json` e as capturas com dados fictícios. Não são comprovantes de homologação externa.

Ainda faltam domínio HTTPS, SMTP real e credenciais próprias Mercado Pago/Meta. Nenhuma cobrança, envio de e-mail ou mensagem real foi realizado nesta entrega. Antes de operar, valide no ambiente publicado o recebimento de e-mails e webhooks e a liquidação no beneficiário correto. Abra também as portas de saída para o host SMTP escolhido (465/587/2525) na hospedagem; o proxy HTTP deste ambiente não substitui uma conexão SMTP.
