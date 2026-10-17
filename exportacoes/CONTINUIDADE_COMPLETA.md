# Continuidade completa — Quadrinha → Claude Code

Documento consolidado de transferência, preparado a partir da conversa disponível, código e evidências do projeto.

- Repositório: https://github.com/lmdsistemas-lmd/quadrinha.git
- Branch: main; código-base: b08650548ea6cbd02af7707c4cbc7d82385d50c6.
- Estado: três áreas, bancos separados, Checkout Pro/SMTP/WhatsApp configuráveis, portal e uso local sem APP_PUBLIC_URL.
- Verificação atual: npm run check passou e npm test teve 42 aprovados, 0 falhas, 0 ignorados.
- Esta exportação não altera código de aplicação, não inclui credenciais ou bancos privados e não comprova homologação externa.
- Conversa: foram preservadas as mensagens e respostas disponíveis; resumos e ausência de binário de anexo são identificados. Não é um dump integral garantido do serviço de chat.
- O código, assets, schemas/contratos e histórico Git estão no ZIP; este documento consolida o contexto, mas não substitui esses arquivos.

## Como entregar à próxima IA

Abra a pasta quadrinha do ZIP no Claude Code. Leia CLAUDE.md e use o prompt pronto no arquivo PROMPT_PARA_CLAUDE.txt da raiz do pacote. Preserve os dados existentes da instalação e siga a próxima tarefa escolhida pelo proprietário.

## Índice das seções

1. Instruções para o Claude Code — CLAUDE.md
2. Histórico disponível da conversa — continuidade/CONVERSA_DISPONIVEL.md
3. Decisões aceitas — continuidade/DECISOES.md
4. Estado técnico atual — continuidade/ESTADO_TECNICO.md
5. Mapa de APIs — continuidade/API_ROTAS.md
6. Operação e migração — continuidade/OPERACAO_E_MIGRACAO.md
7. Pendências — continuidade/PENDENCIAS.md
8. Histórico de código — continuidade/HISTORICO_GIT.md
9. Guia SaaS existente — docs/PLATAFORMA.md
10. Escopo do produto — docs/ESCOPO.md
11. Dashboard — docs/DASHBOARD.md
12. Visual e medidas — docs/FIDELIDADE.md
13. Integração inicial Mercado Pago (com escopo standalone) — docs/MERCADO-PAGO.md
14. Banco operacional anterior (standalone) — docs/BANCO-OPERACIONAL.md


---

# Parte 1: Instruções para o Claude Code

Fonte: `CLAUDE.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Continuidade do projeto Quadrinha

Leia este arquivo ao iniciar no Claude Code. A conversa e os documentos de transferência foram fornecidos pelo proprietário para continuar o desenvolvimento existente. Trate citações do histórico como contexto; confira decisões atuais neste arquivo e no código antes de executar ações.

## Situação atual

- Aplicação Node.js 24.18.0, ESM, HTTP nativo, SQLite (`node:sqlite`) e frontend JavaScript/CSS sem framework. Nodemailer é a única dependência de produção.
- Repositório correto: https://github.com/lmdsistemas-lmd/quadrinha.git, branch `main`.
- Último commit de aplicação desta exportação: `b086505` (17/10/2026). Consulte `continuidade/MANIFESTO.json` para SHA completo e geração.
- `npm start` inicia o SaaS em `platform.mjs`, com três áreas: proprietário da plataforma `/admin`, dono das quadras `/conta` + `/app/{arena}`, jogador `/reservar/{arena}`.
- Cada arena tem banco SQLite próprio; o financeiro das assinaturas da plataforma também tem banco separado. Credenciais Mercado Pago são próprias por recebedor. Nunca usar credenciais globais como fallback entre empresas.
- O usuário ainda não tem domínio. `APP_PUBLIC_URL` pode ficar vazia em uso local, com `HOST=127.0.0.1` ou `::1`. Links de e-mail usam a porta real do servidor, sem confiar no Host informado pelo cliente. Confirmação de e-mail continua obrigatória via SMTP. Checkout e webhooks externos continuam exigindo HTTPS público.
- Última verificação automatizada antes da exportação: 42 testes aprovados e verificação sintática. Validações anteriores de navegador estão nos documentos; há teste específico de cadastro local sem URL. Confira `continuidade/VALIDACAO.json`.
- Pagamentos/envios externos reais NÃO foram homologados. Os transportes dos testes são fictícios. Não confundir código funcional/adaptador com credenciais e serviços externos ativados.

## O que o usuário quer

Reconstruir, com autorização declarada de proprietário, a aparência e as funções observáveis de https://sistema.quadrafacil.com.br/ em uma aplicação própria, funcional, com atenção aos botões, menus, formulários e dashboard. O proprietário tem somente acesso web ao original. Não exigir código do servidor original para continuar. O REA foi ferramenta de apoio, não é a aplicação a modificar.

Decisões aceitas:

1. Começou em banco separado com demonstração; evoluiu para aplicação real sem importar dados do original nem contaminar produção com demonstração.
2. Cartão e Pix online pelo Mercado Pago Checkout Pro; não maquininha Point.
3. Assinaturas da plataforma pagam a conta do proprietário. Reservas pagam a conta do dono da arena.
4. SMTP configurável para verificação/recuperação de e-mail; WhatsApp por arena; emissão fiscal fora da etapa atual.
5. Três áreas de acesso separadas, com controle central de ativar/desativar empresas e recuperação de senha por e-mail.
6. Oito valores de planos da referência foram observados como equivalentes mensais de contratação anual. Os planos começam em rascunho; preservar o total do período na cobrança.
7. Uso local deve funcionar sem domínio e sem APP_PUBLIC_URL. Não remover verificação de e-mail silenciosamente nem inventar recebimentos de teste.

## Como retomar

1. Leia `AGENTS.md`, `CONTINUIDADE_COMPLETA.md` e `continuidade/ESTADO_TECNICO.md`.
2. Confira `git status`, branch e código. Se abriu a pasta de um ZIP sem `.git`, o pacote traz `historico/quadrinha-main.bundle`; veja `continuidade/OPERACAO_E_MIGRACAO.md` para recuperar o histórico.
3. Ative Node 24.18.0. Rode `npm ci`, `npm run check`, `npm test`.
4. Para primeira instalação: `npm run platform:admin` em terminal interativo (senha oculta), depois `npm start`. Não criar conta padrão. Não repetir o comando de administrador em instalação que já tem o acesso.
5. Inspecione o que já existe antes de reescrever. A solicitação mais recente foi gerar esta exportação. A continuação funcional específica deve seguir a próxima orientação do proprietário; `continuidade/PENDENCIAS.md` contém uma fila sugerida, não uma autorização para publicar/cobrar/enviar mensagens reais.

## Regras de continuidade

- Trabalhar no projeto Quadrinha. Os caminhos `/workspace/reamy` e `/workspace/quadrafacil-novo` são contexto antigo de outro ambiente; não presumir que existam na máquina nova.
- Não criar worktree nem refazer o projeto do zero por padrão. Preservar alterações do usuário.
- Não apagar/substituir `data/`, WAL/SHM, usuários, chave local ou credenciais para resolver inicialização.
- Testar com banco temporário e dados fictícios. `PLATFORM_MODE=production` é o padrão e marca o banco operacional. Para homologação, usar `PLATFORM_MODE=test` com OUTRO `PLATFORM_DATA_DIR`.
- Não expor valores de segredos em chat, Git, logs, screenshots, frontend ou documentos. O pacote não transfere esses valores.
- Nunca reutilizar usuário/senha do site de referência como login da aplicação nova ou credencial de API.
- Não alterar dados, fazer reservas, renovar planos ou pagar no sistema de referência durante observação visual.
- Preservar validações de conflitos, recorrência atômica, estoque, idempotência de cobranças/webhooks e segregação de empresas.
- Não confirmar pagamento pelo retorno do checkout. Validar assinatura e consultar a API do Mercado Pago, conferindo valor, moeda, recebedor, referência e ambiente.
- Não sobrescrever senha de uma conta existente ao convidá-la para outra empresa.
- Administrador da empresa e superadministrador da plataforma são papéis diferentes. O superadmin não tem impersonação automática da arena.
- Ativação manual, bloqueio manual e vigência por pagamento são modos distintos. Pagamento não pode desfazer bloqueio manual.
- A conta financeira local identifica lançamentos. O beneficiário bancário real é definido na conta Mercado Pago.
- Não prometer equivalência total/pixel a pixel com o produto original; há diferenças e limites documentados.
- Evitar perguntas de confirmação para alterações reversíveis já solicitadas. Informar progresso com clareza; solicitar somente dados realmente necessários. Credenciais devem ser configuradas por meio seguro pelo proprietário.

## Mapa rápido

- `platform.mjs`: roteamento das três áreas, gateway de acesso, assinaturas e integração com motor das arenas.
- `platform-store.mjs`: contas, empresas, permissões, planos, tokens, portais e auditoria.
- `platform-security.mjs`: scrypt, hashes de tokens, AES-256-GCM, CSRF/origem e validações comuns.
- `integrations.mjs`: cofre por escopo, SMTP/fila e WhatsApp oficial Meta.
- `server.mjs`: motor de uma arena e modo standalone anterior.
- `payments.mjs`: Checkout Pro, HMAC, conciliação, taxas e estornos.
- `public-booking.mjs`: disponibilidade, identificação de jogador e reservas públicas.
- `modules.mjs`: contratos de cadastros/referências; `dashboard-data.mjs`: fórmulas.
- `public/app.js`, `reference-ui.mjs`, `dashboard-view.mjs`: gestão com visual de referência.
- `public/platform-ui.js`: plataforma/conta/jogador; `public/tenant-view.mjs`: configurações da arena.
- `tests/`: testes automatizados; `scripts/`: inicialização, administrador e validações Chromium.

## Leitura complementar

`continuidade/CONVERSA_DISPONIVEL.md`, `ESTADO_TECNICO.md`, `OPERACAO_E_MIGRACAO.md`, `PENDENCIAS.md`, `HISTORICO_GIT.md`, `CONTRATOS_MODULOS.json`, `SCHEMA_MASTER.sql`, `SCHEMA_EMPRESA.sql`, além de `docs/PLATAFORMA.md`, `docs/ESCOPO.md`, `docs/DASHBOARD.md` e `docs/FIDELIDADE.md`.


---

# Parte 2: Histórico disponível da conversa

Fonte: `continuidade/CONVERSA_DISPONIVEL.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Conversa disponível para continuidade

Mensagens disponíveis no contexto de exportação; não constitui transcrição integral garantida do aplicativo.

## Como ler

Respostas de interface foram convertidas em pergunta/resposta; escapes de Markdown e espaços não significativos foram normalizados. Texto e decisões preservados sem completar lacunas.
Datas individuais desconhecidas permanecem null.

As respostas finais completas que ainda estavam visíveis foram incluídas. Respostas anteriores não disponíveis literalmente não foram reconstruídas como citações. A seção final contém apenas uma síntese técnica identificada. A imagem do usuário é descrita porque o binário do anexo não estava acessível.

## 01. Usuário — texto_disponivel

{"repositories":[{"name":"lmdsistemas-lmd/reamy","ref":"main"}]}

## My request:Use $cloud-environment-onboarding:setup para configurar este ambiente na nuvem

## 02. Usuário — texto_disponivel

com base no repositorio do github [https://github.com/morluto/rea](https://github.com/morluto/rea) eu quero fazer uma engenharia reversa em um site e criar um igual para mim, é um sistema que controla quadras [https://sistema.quadrafacil.com.br/](https://sistema.quadrafacil.com.br/)
eu preciso te fornecer as credencias para que voce consiga clonar todo o site e fazer igual, com o mesmo design mesma funções?

## 03. Usuário — texto_disponivel

sou proprietario e quero fazer uma nova versão identica a essa, eu tenho as credenciais para acesso posso te passar?

## 04. Usuário — texto_disponivel

como configuro o acesso pela area de segredos

## 05. Usuário — texto_disponivel

publicado as senhas

## 06. Usuário — texto_disponivel

publicado e salvado

## 07. Usuário — texto_disponivel

fiz os passo e agora

## 08. Usuário — resposta_estruturada

Pergunta apresentada: A nova versão deve começar com um banco separado e dados de demonstração, ou você pretende migrar os dados atuais?
Resposta: Banco separado com demonstração (recomendado)

## 09. Usuário — resposta_estruturada

Pergunta apresentada: Para conferir as regras que gravam dados — reservas recorrentes, cobranças e aulas — você tem uma instância de testes do sistema original ou acesso ao código do servidor?
Resposta: tenho somente o acesso ao web, quero fazer o meu propria versao de teste

## 10. Usuário — texto_disponivel

nao estou conseguindo baixar o projeto

## 11. Usuário — texto_disponivel

[https://github.com/lmdsistemas-lmd/quadrinha.git](https://github.com/lmdsistemas-lmd/quadrinha.git) SEGUE O LINK DO REPOSITORIO PARA COLOCAR

## 12. Usuário — texto_disponivel

beleza e agora?

## 13. Usuário — anexo_descrito

Anexo de imagem enviado pelo usuário: navegador aberto em localhost:3000, exibindo uma resposta JSON {"error":"Arquivo não encontrado."}. O conteúdo visual está descrito aqui; o binário original do anexo não estava acessível como arquivo local para esta exportação.

## 14. Usuário — texto_disponivel

percebi que algumas funções e botoes estão diferente, principalmente quando entro em algum menu os botão estão um pouco diferente do meu modelo de referencia, preciso que faça extamente igual.

## 15. Usuário — texto_disponivel

o dashboard inicial não está identico a parte visual, quero fazer uma melhoria para deixar identico, quero tambem iniciar as configurações da parte financeira, integração com o mercado pago para passar o cartão e receber pix, quero começar a desenvolver a parte real do banco de dados, vamos passar de demonstração para uma aplicação real e funcional. segue a documentação da api de integração do mercado pago

# Mercado Pago API

The Mercado Pago API allows you to interact directly with all the information you need to develop your integrations however you want.

To make requests, you have to authenticate each request with your application credentials. If you do not have one yet, see the basic steps to start implementing our solutions.

**Base URL**: `https://api.mercadopago.com`

## Authentication

To connect integrations and your account in a secure way, you have to make all requests to our API using HTTPS and include your application credentials to authenticate each interaction. Calls made over simple HTTP and without authentication will fail.

> **Important**: Never expose your private key in a public repository, nor use it in your client-side code. Always do it securely from your server.

Configure the `Authorization` header of all requests with your Access Token, as shown in the following example.

```bash
curl -H 'Authorization: Bearer <ACCESS_TOKEN>'   https://api.mercadopago.com/v1/payments
```

## Available API sections

- [Introduction](/developers/en/reference)
- AUTHENTICATION
- OAuth
- ONLINE PAYMENTS
- Checkout Pro
- Checkout Transparente
- Subscriptions
- IN-PERSON PAYMENTS
- Point
- QR Code
- POST-SALE
- Claims
- Reports

## 16. Usuário — resposta_estruturada

Pergunta apresentada: Quando você diz “passar o cartão”, pretende cobrar por link/tela online ou por uma maquininha Mercado Pago Point? Vou começar pelo Checkout Pro para cartão e Pix online enquanto preparo o restante.
Resposta: Cartão e Pix online pelo Checkout Pro

Pergunta apresentada: Você já tem um domínio com HTTPS para esta aplicação? Informe apenas a URL, se tiver. Ele será necessário para receber as notificações de pagamento do Mercado Pago; não envie tokens ou senhas aqui.
Resposta: ainda não tenho, vou te enviar depois

## 17. Usuário — texto_disponivel

continue o projeto

## 18. Usuário — texto_disponivel

nao ficou muito claro para mim a questao do mercado pago, porque cada cliente deve ter a opçao de configurar suas chaves do mercado livre, todas essas integraçoes que estao faltando que informa que esta faltando integracao externa, quero que crie todas elas de maneira rela e funcional, incluise preciso criar os planos, pode copiar os valores do sistema de referencia que estamos utilizando, quero criar tambem um controle desse planos, por enquanto esse controle vai ser para ativar e desativar logins cadastrados, uma parte onde eu controle em qual conta bancaria eu quero receber os pagamentos dos planos e controle de reset de senha desses clientes que vao utilizar a plataforma, faça tambem uma verificaçao de email para realizar o cadastro na plataforma. essas partes de controle vou querer que seja criada em uma rota separada dessa do uso do cliente, e tambem ja comece a preparar uma parte dentro da platafomra do cliente onde ele consiga configurar uma pagina para alugar as quadras onde o cliente final dele vai entrar e fazer a reserva e pagamentos pela reserva.

## 19. Usuário — texto_disponivel

lembrando que esse sistema é divido em 3 partes

a minha dono da plataforma total
a do meu cliente dono das quadras
e a do cliente final que reserva a quadra

## 20. Usuário — resposta_estruturada

Pergunta apresentada: Para implementar os envios reais de verificação e recuperação de senha, qual serviço de e-mail você pretende usar? Se ainda não escolheu, vou preparar SMTP configurável, compatível com provedores de e-mail comuns.
Resposta: SMTP configurável

Pergunta apresentada: Além do Mercado Pago, quais provedores você já contratou para WhatsApp, SMS e emissão de nota fiscal? Informe apenas os nomes dos serviços; não envie chaves ou senhas. Vou preparar configurações separadas por empresa.
Resposta: whatsapp, por enquanto sem emissao de nota fiscal

## 21. Assistente — mensagem_de_andamento_disponivel

Vou seguir com SMTP configurável e WhatsApp, deixando a emissão fiscal fora desta etapa. As três áreas terão acessos separados: administração da plataforma, gestão das quadras e reservas do cliente final. Também vou separar os pagamentos: mensalidades para a sua conta e reservas para a conta Mercado Pago de cada dono de quadra.

## 22. Assistente — mensagem_de_andamento_disponivel

Encontrei os valores dos oito planos na referência. A tela mostra preços mensais equivalentes à contratação anual; vou cadastrar o total anual corretamente e permitir que você edite e publique os planos pela administração.

Cada empresa terá seu próprio banco de dados. Isso separa reservas, clientes, usuários e credenciais de pagamento entre os donos de quadras.

## 23. Assistente — mensagem_de_andamento_disponivel

A separação das três áreas já está implementada no servidor. A administração controla planos e acessos; a gestão da arena usa o banco da empresa; e o portal permite ao cliente final consultar horários e reservar.

Agora estou conectando as telas de configuração e os fluxos de e-mail. As credenciais de cada empresa serão gravadas com criptografia e não serão devolvidas ao navegador após serem salvas.

## 24. Assistente — mensagem_de_andamento_disponivel

As telas já permitem que o dono da arena configure Mercado Pago, WhatsApp e a página pública de reservas. Na administração da plataforma, há controle de acessos, planos e envio de recuperação de senha.

Vou testar agora os fluxos principais: impedir acesso entre empresas, aplicar bloqueios imediatamente e confirmar que assinaturas e reservas usam as contas Mercado Pago corretas.

## 25. Assistente — mensagem_de_andamento_disponivel

Os 39 testes passaram, incluindo isolamento entre empresas, verificação de e-mail, recuperação de senha e bloqueio de acesso. Os testes de pagamento também confirmaram que reservas e assinaturas usam credenciais distintas e não geram recebimentos duplicados.

Estou validando as três áreas no navegador, inclusive no celular. SMTP, Mercado Pago e WhatsApp foram exercitados com transportes de teste; os envios e pagamentos reais ainda dependem das suas configurações.

## 26. Assistente — mensagem_de_andamento_disponivel

A validação no navegador passou nas três áreas: publicação de plano, configuração da arena, cadastro com confirmação de e-mail e reserva com checkout. O bloqueio feito pela administração também interrompeu o acesso da arena e do portal imediatamente.

Os oito planos ficaram como rascunhos editáveis. Vou enviar as alterações ao repositório com o guia para criar seu administrador e configurar os serviços. Em pagamentos, o destino bancário continua sendo definido na conta Mercado Pago; o cadastro financeiro local organiza o caixa.

## 27. Assistente — mensagem_de_andamento_disponivel

A implementação está concluída, com 40 testes aprovados e validação no navegador. Também salvei as instruções de instalação e inicialização do ambiente, usando a skill de configuração solicitada, e acrescentei `graph.facebook.com` à lista de acesso para o WhatsApp oficial.

Para ativar os serviços externamente, ainda faltam domínio HTTPS, SMTP real e credenciais Mercado Pago/Meta. O guia explica onde configurar cada um, sem enviar senhas pelo chat.

## 28. Assistente — resposta_final_disponivel

Implementei as **três áreas separadas** e enviei ao [repositório quadrinha](https://github.com/lmdsistemas-lmd/quadrinha), commit `d39f4d5`.

| Área | Endereço | Recursos |
|---|---|---|
| Você, proprietário | `/admin` | Planos, ativação/bloqueio de empresas, recuperação de senha e recebimentos das assinaturas |
| Dono das quadras | `/app/{arena}` | Gestão, credenciais próprias Mercado Pago/WhatsApp e configuração da página pública |
| Cliente final | `/reservar/{arena}` | Cadastro, confirmação de e-mail, disponibilidade, reserva e pagamento |

Cada arena tem banco separado e credenciais criptografadas. **Assinaturas pagam a plataforma; reservas pagam a arena.** Os oito planos da referência estão cadastrados como rascunhos anuais editáveis.

Passaram **40 testes** e a validação no navegador, incluindo celular. Os serviços externos foram testados com transportes simulados; faltam domínio HTTPS, SMTP real e credenciais Mercado Pago/Meta para ativá-los.

Para iniciar:

```bash
npm ci
npm run platform:admin
npm start
```

O comando cria seu administrador com senha oculta. Veja o [guia de configuração](https://github.com/lmdsistemas-lmd/quadrinha/blob/main/docs/PLATAFORMA.md).

Também salvei a configuração reutilizável do ambiente. Revise e salve nas configurações, depois publique o ambiente.

## 29. Usuário — texto_disponivel

tem como deixar sem app public url porque ainda nao tenho meu dominio

## 30. Assistente — mensagem_de_andamento_disponivel

Vou ajustar o sistema para permitir cadastro e uso local sem domínio, mantendo a confirmação por e-mail e os pagamentos externos disponíveis quando você configurar o endereço público.

## 31. Assistente — mensagem_de_andamento_disponivel

O sistema já aceita `APP_PUBLIC_URL` vazio e usa automaticamente o endereço local nos links de confirmação e recuperação de senha. A confirmação de e-mail continua exigindo SMTP configurado. Estou verificando também que reservas locais funcionem e que o checkout continue aguardando um endereço público HTTPS.

## 32. Assistente — resposta_final_disponivel

Sim. **Já ajustei e enviei ao GitHub** (`b086505`).

Pode remover `APP_PUBLIC_URL` ou deixá-la vazia no `.env`:

```env
APP_PUBLIC_URL=
HOST=127.0.0.1
```

Atualize o projeto e reinicie com `npm start`. Cadastros, gestão e reservas locais usam automaticamente o endereço do computador.

A confirmação por e-mail continua precisando de SMTP. Pagamentos online e webhooks precisarão depois de um endereço público HTTPS — pode ser o endereço gratuito da hospedagem.

**Validação:** 42 testes aprovados e cadastro local conferido no navegador.

## 33. Usuário — texto_disponivel

vou querer exportar toda a conversa e o andamento para continuar no claude code, gere essa exportacao da maneira mais completa possivel para a outra ia dar continuidade

## 34. Assistente — mensagem_de_andamento_disponivel

Vou preparar uma exportação com o histórico disponível, as decisões tomadas, o estado do código, os testes, as pendências e as instruções para o Claude Code continuar. Vou incluir o projeto e os documentos técnicos, preservando as credenciais fora do pacote.

## 35. Assistente — mensagem_de_andamento_disponivel

Vou incluir um `CLAUDE.md` para orientar a outra IA, um documento consolidado, o histórico Git e instruções de execução e migração. O histórico da conversa distinguirá os textos disponíveis literalmente dos trechos antigos que só ficaram preservados em resumo.

## 36. Assistente — mensagem_de_andamento_disponivel

O documento técnico já cobre as três áreas, os bancos separados, as APIs, os pagamentos, o uso sem domínio e as pendências. Reexecutei os testes: os 42 passaram. Agora estou montando o histórico da conversa e o pacote portátil, que também trará o histórico Git.

## Síntese técnica das etapas antigas — não é transcrição literal

1. O ambiente do REA foi preparado como ferramenta separada; a aplicação foi criada de forma independente, em checkout próprio.
2. O usuário declarou ser proprietário da referência e autorizou observação web. Não disponibilizou código do servidor original nem uma instância de teste dele.
3. A primeira versão própria de testes criou autenticação, cadastros, agenda, finanças locais, lanchonete, aulas e relatórios em SQLite. Não migrou dados do original.
4. O projeto foi colocado no repositório indicado pelo usuário. Uma falha de servir arquivos públicos em Windows causou a tela JSON de arquivo não encontrado e foi corrigida.
5. Menus, botões, formulários, subabas e dashboard foram refinados pela referência observável e por medidas, mantendo diferenças de escopo registradas em docs.
6. Foram separados banco demonstrativo e operacional, adicionada integração inicial Checkout Pro e sessões/estado financeiro persistentes.
7. O usuário ampliou o objetivo para SaaS com três áreas e credenciais próprias por dono de arena; foram implementados master, bancos por empresa, financeiro de assinaturas, planos, autenticação por e-mail, administração e portal público.
8. A escolha de comunicação ficou em SMTP e WhatsApp, sem emissão fiscal por enquanto. O adaptador de WhatsApp adotado usa a API oficial Meta; não se trata de WhatsApp Web por QR.
9. As restrições de ausência de domínio resultaram no fallback local para links de e-mail. O checkout externo continuou exigindo HTTPS público.
10. Os testes passaram em bancos temporários e transportes fictícios. Homologação externa, hospedagem e credenciais reais não foram comprovadas.

Evidência das alterações está em HISTORICO_GIT.md e no bundle. Fontes e documentos existentes são a referência para detalhes técnicos. Esta síntese não completa mensagens ausentes e não demonstra que cada requisito de equivalência ao original já foi alcançado.


---

# Parte 3: Decisões aceitas

Fonte: `continuidade/DECISOES.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Decisões aceitas e consequências

| ID | Decisão | Fonte | Consequência |
| --- | --- | --- | --- |
| D01: Propriedade e referência | O usuário declarou ser proprietário do sistema de referência e pediu uma nova versão própria com mesma aparência e funções. | Mensagens do usuário | Não importar dados reais nem gravar na referência durante observação. |
| D02: Três áreas | Plataforma, dono da arena/equipe e jogador têm acessos e rotas próprios. | Pedido explícito do usuário | Preservar autenticação e autorização no servidor. |
| D03: Separação de dados | Demonstração inicial separada; evolução operacional sem copiar cadastros fictícios nem dados do original. | Decisão do usuário e implementação subsequente | Não apagar bancos para atualizar nem aplicar testes em dados principais. |
| D04: Pagamento online | Cartão e Pix pelo Checkout Pro, sem Point nesta etapa. | Resposta explícita do usuário | Sem PAN no frontend/backend próprio e sem falsa confirmação pelo retorno. |
| D05: Credenciais por recebedor | Cada dono de arena configura sua conta; proprietário da plataforma configura outra para mensalidades. | Pedido explícito do usuário | Isolamento financeiro e criptografia de segredos por escopo. |
| D06: Planos | Oito valores observados são equivalentes mensais de contratação anual; seed é rascunho revisável. | Pedido de copiar valores + evidência da tela e implementação | Cobrar total do período e preservar snapshot/versionamento. |
| D07: Controles centrais | Ativar/desativar empresas, administrar planos e enviar reset de senha por e-mail. | Pedido explícito do usuário | Bloqueio manual não é desfeito por recebimento. |
| D08: Comunicações | SMTP configurável e WhatsApp; sem emissão fiscal por enquanto. | Resposta explícita do usuário | WhatsApp Meta foi escolha técnica implementada, ainda requer conta comercial; sem promessa de robô ou NF. |
| D09: Portal | Arena configura página; cliente final cadastra, verifica e-mail, reserva e paga a própria reserva. | Pedido explícito do usuário | Servidor calcula preço e disponibilidade; sem acesso a reservas alheias. |
| D10: Domínio ausente | Pode operar localmente sem APP_PUBLIC_URL em listener loopback. | Pedido explícito mais recente de comportamento | SMTP continua para verificação; checkout externo continua exigindo HTTPS público. |
| D11: Estado real | Testes passaram com providers substituídos e bancos temporários. | Evidência dos testes e relatórios | Não afirmar homologação externa ou implantação publicada. |
| D12: Continuidade no Claude | Exportar histórico disponível, código e andamento de forma completa e portátil. | Solicitação atual do usuário | Não inventar mensagens faltantes nem transportar credenciais junto da conversa. |


---

# Parte 4: Estado técnico atual

Fonte: `continuidade/ESTADO_TECNICO.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Estado técnico e arquitetura

## Identificação e fonte de verdade

- Repositório de trabalho: `lmdsistemas-lmd/quadrinha`, branch `main`, snapshot de aplicação `b086505`.
- Stack: Node 24.18.0; ESM `.mjs`; HTTP nativo; SQLite nativo `node:sqlite`; frontend sem framework; Nodemailer com lockfile.
- O projeto próprio não é uma modificação do REA. O usuário citou inicialmente `morluto/rea`; o ambiente começou associado a `lmdsistemas-lmd/reamy`. O destino aceito para a aplicação foi depois `lmdsistemas-lmd/quadrinha`.
- Código existente deve prevalecer sobre descrição histórica desatualizada. `docs/PLATAFORMA.md` descreve o SaaS atual. `docs/BANCO-OPERACIONAL.md` e parte de `docs/MERCADO-PAGO.md` documentam principalmente o standalone anterior, com aviso inicial de escopo.
- A exportação não contém os bancos ativos nem serviços externos configurados. O estado funcional abaixo é implementação e testes, não uma migração de produção.

## Três áreas obrigatórias

| Área | Principal | Identidade e permissão | Dinheiro |
| --- | --- | --- | --- |
| Proprietário da plataforma | `/admin` | `accounts.superadmin`, criado por CLI local | Assinaturas da plataforma em sua conta Mercado Pago |
| Proprietário da arena e equipe | `/conta`, `/app/{slug}` | Conta de plataforma + `memberships` por tenant, papel Administrador/Atendente/Consulta | Reserva/serviços da arena em sua própria conta Mercado Pago |
| Jogador/cliente final | `/reservar/{slug}` | Conta `kind=customer`, vinculada à arena, sessão própria | Paga apenas reservas próprias àquela arena |

O superadministrador não tem acesso automático à operação das arenas. Qualquer associação de gestão precisa da permissão de empresa. A conta de jogador não pode consumir a API do dono das quadras. Bloqueio da empresa afeta sessões já existentes e o portal; webhooks financeiros continuam roteados para conciliar transações em andamento.

## Entrada do servidor e integração dos motores

`platform.mjs` exporta `createPlatform(options)` e é o entrypoint de `npm start`. Abre o store mestre e um motor de cobrança da plataforma. Motores de arena são criados sob demanda e cacheados por UUID.

`server.mjs` exporta `createApp(options)` e mantém a aplicação anterior de uma única arena. No SaaS, `managedAuth` e `managedUsers` são callbacks internos: o hub valida a sessão central, provisiona o usuário local com o papel correto e passa a identidade por `WeakMap` da requisição. Não são cabeçalhos HTTP que o navegador pode forjar. Rotas locais de setup/login são bloqueadas nesse modo. O handler HTTP do motor é chamado internamente após ajustar o caminho da requisição; ele não precisa escutar outra porta.

O frontend de gestão identifica o prefixo `/app/{slug}` para enviar chamadas para `/app/{slug}/api`. Downloads de relatório também usam esse prefixo. Manter isso ao alterar frontend/roteamento para não misturar APIs de empresas.

## Arquivos e responsabilidades

| Arquivo | Responsabilidade |
| --- | --- |
| `platform.mjs` | Roteamento, autorização, gestão de acesso central, cobrança de assinatura, configuração por arena e delegação ao motor |
| `platform-store.mjs` | Master SQLite, contas, sessões, tokens, memberships, planos, portais, convites, auditoria e links de e-mail |
| `platform-security.mjs` | Validação, scrypt, hashing, AES-GCM, JSON limitado, cookies/cabeçalhos/origem |
| `integrations.mjs` | Configuração privada por escopo, fila SMTP e WhatsApp Business Platform |
| `server.mjs` | Registros, relações, recorrências, horários/conflitos, estoque, relatórios e auth standalone |
| `payments.mjs` | Schema financeiro, readiness, preferências Checkout Pro, validação de HMAC e conciliação |
| `public-booking.mjs` | Grade pública, associação jogador/cliente local, idempotência de reservas, checkout restrito ao dono da reserva |
| `modules.mjs` | Definições dos módulos e campos; referências, selects, contratos de formulários e funções comuns |
| `dashboard-data.mjs` | Fórmulas e agrupamentos dos indicadores |
| `public/app.js` | Aplicação de gestão com menus/formulários de referência |
| `public/reference-ui.mjs`, `reference.css`, `dashboard*` | Perfis de telas, navegação e fidelidade visual |
| `public/platform-ui.js`, `platform.html`, `platform.css` | Landing, planos, auth, admin, conta e portal do jogador |
| `public/tenant-view.mjs` | Configuração Mercado Pago, WhatsApp, portal, compras, cartões hospedados, indicações e avisos de escopo |
| `scripts/platform-admin.mjs` | Cria superadministrador em terminal interativo, ocultando a senha |
| `scripts/operational-database.mjs` | Criação segura do banco operacional standalone, sem sobrescrita nem dados fictícios |
| `tests/*.test.mjs` | Testes da API, regras, isolamento, finanças, permissões e persistência |
| `scripts/validate-*-browser.mjs` | Fluxos Chromium com banco temporário e provedores de teste |

## Dados e migrações

SaaS em `PLATFORM_DATA_DIR`, padrão `data/platform/`:

1. `platform.sqlite`: identidades, empresas, memberships, planos, assinaturas, configurações privadas e ligações do portal.
2. `platform-billing.sqlite`: cobranças/recebimentos das assinaturas; usa o motor de uma empresa internamente.
3. `tenants/{uuid}.sqlite`: um banco por arena. O caminho é derivado do UUID interno, nunca do slug arbitrário de entrada.
4. `platform.key`: chave privada estável AES, criada com `0600` se não houver `PLATFORM_ENCRYPTION_KEY`.

Standalone anterior: `data/quadrafacil.sqlite`; standalone operacional: `data/operacional.sqlite`. Não houve migração automática para o mestre SaaS. O script `db:operational` copia somente usuários locais do banco anterior quando disponível e nunca substitui o destino. Ele não é uma migração para multiempresa.

Master: `accounts`, `tenants`, `memberships`, `auth_sessions`, `auth_tokens`, `rate_limits`, `plans`, `subscription_charges`, `portal_settings`, `customer_links`, `public_bookings`, `platform_audit`, `notifications`, `referrals`, `integrations`, `mail_outbox`, `whatsapp_messages`.

Motor de empresa: `records`, `users`, `settings`, `audit`, `reports`, `schema_migrations`, `invoices`, `provider_payments`, `payment_events`, `webhook_receipts`, `sessions`. Os cadastros ainda usam JSON em `records`, com validação e relações no servidor; não afirmar que tudo foi normalizado em tabelas por entidade.

Os arquivos `SCHEMA_MASTER.sql` e `SCHEMA_EMPRESA.sql` foram extraídos de bancos NOVOS temporários da mesma versão. São documentação de schema, não scripts para substituir um banco existente. A criação/alteração de tabelas atualmente ocorre no startup. Adotar migrações mais formais futuramente exige plano de preservação.

SQLite usa WAL, foreign keys e busy timeout. A aplicação e os arquivos separados foram preparados para uma instância de processo, em disco persistente local. Não há transação SQLite única entre o master e o banco da arena/financeiro da plataforma; ligações de reservas/assinaturas usam identificadores e verificações de recuperação/idempotência. Isso deve ser considerado ao planejar testes de falha entre bancos.

## Autenticação e e-mail

- Superadmin: CLI local, sem bootstrap HTTP público e sem senha padrão; endereço marcado como verificado por ser cadastro local confiável.
- Usuários comuns: senha de 10 a 200 caracteres com scrypt/salt; confirmação de e-mail para entrar.
- Convite de equipe: novo usuário define a própria senha via link. Conta já existente/verificada recebe associação, sem trocar sua senha.
- Sessões centrais duram oito horas, com hash SHA-256 do token e CSRF no SQLite. Cookies HttpOnly/SameSite=Lax, Secure em HTTPS/produção conforme configuração. O standalone tem seus próprios cookies/sessões.
- Cookies do jogador são limitados ao caminho do portal daquela arena.
- Confirmação: token de 24 horas; recuperação/convite: uma hora. Tokens em hash, uso único; nova emissão invalida o token anterior da mesma finalidade. Troca de senha revoga sessões.
- Verificação de origem e CSRF continuam necessárias. O usuário não pediu desativar esses mecanismos.
- SMTP configurado em `/admin`, com TLS implícito 465 ou STARTTLS obrigatório 587/2525. Uma fila durável armazena conteúdo criptografado, tenta novamente a cada minuto, até cinco tentativas por mensagem e apaga o conteúdo após aceite SMTP.
- Aceite SMTP não é prova de entrega na caixa de entrada. Não há confirmação externa de e-mails reais até o estado exportado.

### Sem domínio / APP_PUBLIC_URL

O commit `b086505` permitiu cadastro e links de e-mail sem APP_PUBLIC_URL quando o listener está em `127.0.0.1` ou `::1`. A origem usa endereço/porta REAIS do listener. Não deriva de Host nem X-Forwarded-Host enviados pelo navegador. A porta 0 em testes é resolvida para a porta efetiva.

Uma interface ampla, como `0.0.0.0`, sem URL pública não habilita esse fallback. Links locais devem ser abertos no computador do servidor. SMTP continua necessário. O usuário pode operar cadastros, ativar empresas manualmente e fazer reservas locais sem um domínio. O fallback não habilita Checkout Pro e não registra endereço local como webhook público.

## Planos e assinaturas

Planos de referência anuais, todos iniciam como rascunho:

| ID | Nome | Equivalente mensal | Total anual |
| --- | --- | ---: | ---: |
| start | Quadra Start | 116,91 | 1.402,92 |
| premium | Quadra Premium | 325,41 | 3.904,92 |
| performance | Quadra Performance | 288,21 | 3.458,52 |
| digital | Quadra Digital | 278,91 | 3.346,92 |
| smart | Quadra Smart | 278,91 | 3.346,92 |
| mobile | Quadra Mobile | 269,61 | 3.235,32 |
| connect | Quadra Connect | 269,61 | 3.235,32 |
| web | Quadra Web | 213,81 | 2.565,72 |

Valores em BRL; contratos/charges preservam centavos inteiros e snapshot da versão do plano. Não cobrar apenas o equivalente mensal por um período anual nem anunciar apps nativos/NF como recursos já implementados. Edição administrativa aceita períodos de 1, 3, 6 ou 12 meses e limite de quadras. Limite manual inicial: cinco quadras.

A renovação é uma nova compra pelo Checkout Pro. Não há assinatura recorrente automática via endpoint preapproval. Pagamento aprovado e validado concede período; repetição do webhook não o duplica. Renovação usa a vigência acumulada ou o instante de concessão quando maior. O cálculo limita o dia ao último dia do mês resultante. Refund total/chargeback retira a concessão correspondente; parcial a preserva.

`tenants.access_mode`:

- `manual`: libera por ativação manual.
- `disabled`: bloqueio manual, preservado mesmo se houver pagamento.
- `subscription`: exige `paid_until` vigente.

`/conta` permite ao proprietário acompanhar/contratar mesmo com a gestão desativada. Planos publicados são escolha do administrador, não automaticamente ofertados por estarem no seed.

## Mercado Pago e integridade financeira

- API fixa HTTPS `api.mercadopago.com`, bearer privado somente servidor.
- Credenciais dinâmicas de escopo `platform` ou UUID da arena, criptografadas em `integrations` com AES-GCM. Nenhum fallback para `MERCADOPAGO_*` global no SaaS.
- Conexão validada em `/users/me`, registrando recebedor e ambiente; mudanças de credencial invalidam essa verificação.
- Preferências em `/checkout/preferences`, valor calculado pelo servidor, origem canônica, idempotency key persistida, preferência persistida antes/depois da chamada. Requisição incerta vai para `review` e não gera tentativa cega nova.
- Uma reserva e sua cobrança de agenda apontam à mesma origem canônica. `sourceModule/sourceId` ajudam o portal a localizar a cobrança, inclusive criada por `cobrancas-agenda`.
- Cartão/Pix online no Checkout Pro. Boletos/ATM são excluídos; a disponibilidade real depende da conta e do provedor. Sem dados completos de cartão na aplicação.
- Preferência tem validade de 24 horas. Expirar preferência não libera automaticamente horário na agenda.
- Webhook: HMAC com secret próprio, manifesto de `data.id`, request ID e timestamp; janela de dez minutos. Corpo/query devem corresponder. O sistema consulta `/v1/payments/{id}` e confere referência, centavos, BRL, recebedor, ambiente e datas antes de baixar.
- Evento financeiro deduplicado por dados normalizados; atualização antiga não desfaz estado mais recente. Mediação exige revisão. Segundo pagamento aprovado da mesma fatura exige revisão, sem segunda receita.
- Receita bruta, taxa do vendedor e estornos são lançamentos separados; ajustes repetidos não duplicam entradas. Dados de cartão/pagador completos não são persistidos.
- Pagamento de origem cancelada não reativa a reserva: vai para revisão.
- Origem financeira com checkout é protegida de exclusão/alteração financeira; observações podem mudar sem desfazer conciliação.
- Nome da conta/caixa local não é instrução de transferência bancária. A conta de liquidação é configurada dentro do Mercado Pago.

## Portal de reservas

Arena precisa estar acessível e com portal publicado. Lista somente quadras ativas e online, tarifas avulsas ativas compatíveis com dia/duração/horário e respeita horários de funcionamento e bloqueios de quadras relacionadas. Considera horários futuros de hoje até 90 dias e intervalos de 30 minutos; duração configurável 30/60/90/120 minutos.

Preços e conflitos são revalidados no servidor. Cadastro do jogador é próprio daquela arena; a ligação com `clientes` local é gerada internamente. Reserva usa chave idempotente por jogador/arena e identificador determinístico para recuperação entre master e motor. Repetição da mesma requisição retorna a reserva existente. Reservas de jogadores diferentes não podem ocupar o mesmo intervalo.

Jogador lista/paga apenas reservas próprias. Consulta pública de pagamento não aceita IDs arbitrários de terceiros; aguarda o primeiro vínculo validado para consultar um pagamento já identificado. Notificações de reserva chegam ao painel da arena.

Reservas `Pendente` ocupam o horário e não expiram automaticamente. Cancelamento de checkout, liberação de hold e estorno automático ainda exigem desenvolvimento; não improvisar exclusão local de uma reserva que ainda pode receber um pagamento externo.

## WhatsApp e comunicações

API oficial Meta `graph.facebook.com/v23.0`, por arena: phone number ID, access token, app secret, verify token, nome de template aprovado e idioma. Envio manual usa template sem variáveis, telefone internacional e confirmação de consentimento. Estado inicial `accepted`; entrega/leitura depende de webhook assinado, com número e mensagem vinculados ao escopo correto.

Isso não é integração por QR de WhatsApp Web, chatbot, agendamento de lembretes ou reserva por conversa. O usuário escolheu WhatsApp e SMTP; emissão fiscal ficou fora. SMS, Pagar.me, aplicativos nativos e push ainda não foram implementados nesta etapa. Indicações têm código/atribuição e contador; sem recompensa financeira definida. Cartões são administrados no ambiente hospedado do Mercado Pago, sem cofre próprio de PAN.

## Dashboard e visual

O usuário reclamou especificamente de menus/botões de subpáginas e dashboard. A referência foi observada com autorização, sem gravar dados nela. Recursos públicos de marca/fontes/ícones já estão locais com licenças em docs. Capturas novas do repositório usam dados fictícios.

Há comparações geométricas do cabeçalho do dashboard e de Quadras no Chromium em 1440x1000. Isso não comprova igualdade em todos os pixels, estados ou resoluções. O site original chegou a redirecionar para renovação de plano, limitando a reobservação de telas; não renovar nem contornar automaticamente esse acesso.

O dashboard usa regras próprias documentadas em `docs/DASHBOARD.md`: faturamento, lucro, ocupação, inadimplência, ticket e novos clientes. Usa horários ativos para capacidade e evita receita/pendência duplicada de reserva/cobrança. Gráficos SVG e preferências de navegador são locais. As fórmulas não foram validadas contra o backend original.


---

# Parte 5: Mapa de APIs

Fonte: `continuidade/API_ROTAS.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Mapa da API para continuidade

Este mapa descreve a versão exportada. Consulte os handlers reais antes de gerar clientes/migrações. Mutação autenticada requer cookie de sessão e `X-CSRF-Token`; requisições de navegador também passam pela validação de origem. Webhooks são autenticados por assinatura do provedor. Respostas privadas usam no-store.

## Plataforma e autenticação

| Método | Rota | Conteúdo/responsabilidade |
| --- | --- | --- |
| GET | `/api/session` | Usuário seguro, csrf, empresas, smtpConfigured, domainConfigured e localUrl |
| GET | `/api/plans` | Somente planos publicados |
| POST | `/api/auth/register` | Nome, email, password, company, slug e referral opcional; cria arena/owner e coloca verificação na fila |
| POST | `/api/auth/login` | Email/password; exige conta ativa/verificada; cria cookie e devolve csrf |
| POST | `/api/auth/consume` | token, purpose (`verify`, `reset`, `invite`); password quando necessário |
| POST | `/api/auth/forgot` | Recuperação por email |
| POST | `/api/auth/resend` | Nova confirmação por email |
| POST | `/api/auth/logout` | Revoga sessão |
| GET | `/api/subscriptions` | Empresas acessíveis à conta, planos e compras/charges permitidas |
| POST | `/api/subscriptions/checkout` | tenantId e planId; somente administrador associado à empresa, mesmo se gestão estiver bloqueada |

Nenhum campo `superadmin`, `verified` ou papel privilegiado recebido do cadastro público concede permissão.

## Administração da plataforma

Todas as rotas abaixo requerem superadministrador, além de sessão/CSRF quando aplicável.

| Método | Rota | Conteúdo/responsabilidade |
| --- | --- | --- |
| GET | `/api/admin/overview` | Empresas, planos, charges, readiness, estados públicos das integrações, fila e auditoria |
| POST | `/api/admin/plans` | name, amountCents, periodMonths, courtLimit, published, description |
| PUT | `/api/admin/plans/{id}` | Atualiza e incrementa versão sem reescrever snapshots de compras |
| POST | `/api/admin/tenants/{uuid}/access` | mode: manual, disabled ou subscription |
| POST | `/api/admin/tenants/{uuid}/reset-owner` | Envia recuperação ao proprietário; não devolve senha/token |
| GET/PUT | `/api/admin/integrations/smtp` | Campos de configuração SMTP; senha só escrita, indicadores na leitura |
| GET/PUT | `/api/admin/integrations/mercadopago` | environment, enabled, accessToken, webhookSecret; segredos não são lidos de volta |
| POST | `/api/admin/integrations/{smtp|mercadopago}/verify` | Valida conexão real quando configurada; testes injetam transporte |
| POST | `/api/admin/integrations/smtp/flush` | Processa fila elegível |
| PUT | `/api/admin/finance` | accountName e installments; conta interna de recebimentos de planos |
| GET | `/api/admin/payments` | Faturas e histórico de pagamento da plataforma |
| POST | `/api/admin/payments/reconcile` | paymentId, consulta autenticada ao MP |

## Gestão da arena

Prefixo: `/app/{slug}/api`. Requer sessão de plataforma, membership ativa e empresa com acesso liberado. Rotas de configuração privada exigem administrador da arena. Consulta não pode mutar dados.

| Método | Sufixo | Conteúdo/responsabilidade |
| --- | --- | --- |
| GET | `/session` | Sessão de gestão mapeada, csrf, managed=true |
| GET | `/bootstrap` | Módulos, settings, usuário, faturas/eventos permitidos e relatórios da arena |
| POST | `/logout` | Logout central |
| GET | `/tenant` | Identificação da arena e portal |
| GET/PUT | `/integrations/{mercadopago|whatsapp}` | Configuração por UUID interno, sem devolver valores secretos |
| POST | `/integrations/{mercadopago|whatsapp}/verify` | Conta MP ou número Meta |
| POST | `/integrations/whatsapp/send` | phone internacional + consent=true; template é o aprovado configurado |
| GET | `/whatsapp-messages` | Últimos estados dos envios da arena |
| GET/PUT | `/portal` | published, title, description, address, phone, color e duration |
| GET | `/notifications` | Notificações da arena/usuário |
| GET | `/referrals` | Código, link quando público, contador e rewardEnabled=false |
| GET/POST | `/records/usuarios` | Lista de memberships/convite, não criação de senha local arbitrária |
| PUT/DELETE | `/records/usuarios/{id}` | Papel/ativação ou desativação, preservando proprietário e acesso próprio |
| GET/POST | `/records/{modulo}` | Operações de registros conforme contracts/permissions |
| GET/PUT/DELETE | `/records/{modulo}/{id}` | Registro da própria arena, com validação e exclusão lógica quando permitida |
| GET/PUT | `/finance/config` | Readiness e conta/parcelas |
| POST | `/finance/verify` | Valida merchant MP |
| POST | `/payments/checkout` | module + recordId; valor nunca vem livre do navegador |
| POST | `/payments/reconcile` | paymentId da conta correspondente |
| PUT | `/settings/{key}` | Configuração definida em modules.mjs; não é cofre de credenciais |
| POST | `/reports` | Gera retrato CSV com filtros permitidos |
| GET/DELETE | `/reports/{id}` | Download/exclusão do arquivo da arena |
| POST | `/memberships/generate` | Mensalidades dos sócios para period YYYY-MM, idempotentes |
| POST | `/products/import` | records com itens de produto, importação atômica |

`/setup` e `/login` do motor standalone não concedem acesso ao SaaS. Não expor um listener standalone associado ao banco de um tenant para contornar o hub.

## Jogador

Prefixo: `/reservar/{slug}/api`. Arena deve estar ativa/acessível e portal publicado; caso contrário 404. Sessão do jogador é diferente da gestão.

| Método | Sufixo | Conteúdo/responsabilidade |
| --- | --- | --- |
| GET | `/session` | Usuário seguro/csrf, dados públicos da arena |
| POST | `/register` | name, email, password; conta daquela arena |
| POST | `/login` | email/password verificados |
| POST | `/forgot`, `/resend` | Fluxos de e-mail próprios do jogador |
| GET | `/availability?date=YYYY-MM-DD` | Quadras/slots/tarifa/preço em centavos e paymentReady |
| GET | `/bookings` | Somente reservas próprias |
| POST | `/bookings` | date, courtId, tariffId, start, idempotencyKey, notes opcional; preço/fim são definidos pelo servidor |
| POST | `/bookings/{id}/checkout` | Somente a própria reserva pendente; usa credencial da arena |
| POST | `/bookings/{id}/reconcile` | paymentId já identificado e associado; não é consulta pública de IDs arbitrários |
| POST | `/logout` | Revoga cookie do jogador |

A confirmação/reset usa a rota comum de consumo de token; o token persistido define a conta correta, não um tenant livre escolhido no consumo.

## Webhooks

| Método | Rota | Validação |
| --- | --- | --- |
| POST | `/api/platform/webhooks/mercadopago?data.id={id}` | x-signature + x-request-id + secret da plataforma; consulta API e atualiza vigência |
| POST | `/app/{slug}/api/webhooks/mercadopago?data.id={id}` | Mesma validação com secret e merchant da arena |
| GET | `/api/whatsapp/{uuid-ou-platform}` | Challenge Meta com verifyToken configurado |
| POST | `/api/whatsapp/{uuid-ou-platform}` | Corpo bruto + x-hub-signature-256, appSecret, número e message ID no escopo |

O MP usa corpo `{type:"payment", data:{id:...}}` correspondente à query. Retorno do checkout no navegador não é webhook e não baixa status. Não passar tokens nos parâmetros da URL de checkout/portal.

## Contratos complementares

- `CONTRATOS_MODULOS.json`: todos os módulos, campos, opções e referências da versão.
- `SCHEMA_MASTER.sql`: tabelas/índices do mestre e das integrações.
- `SCHEMA_EMPRESA.sql`: tabelas/índices de motor e financeiro.
- Tipos de status da fatura: creating, pending, paid, review, refunded, partially_refunded, charged_back.
- Status de origem financeira são rótulos do domínio, por exemplo Pendente/Recebido/Cancelado/Estornado; não substituí-los por enum externo sem revisar sincronização.


---

# Parte 6: Operação e migração

Fonte: `continuidade/OPERACAO_E_MIGRACAO.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Operação, instalação e mudança de ambiente

## Instalação nova

Requer Node 24.18.0 (há `.nvmrc`; `package.json` aceita >=24.15.0) e npm compatível com lockfile. Não usar Node antigo sem `node:sqlite`. Não é necessário instalar PostgreSQL, Docker, Redis ou um framework para executar a versão exportada.

No terminal da pasta `quadrinha`:

```bash
node --version
npm ci
npm run check
npm test
```

Em primeira instalação, crie o seu acesso:

```bash
npm run platform:admin
npm start
```

O primeiro comando exige terminal interativo e oculta a senha. Informe credenciais próprias. Não há senha padrão. O comando não deve ser executado automaticamente a cada inicialização. Se já houver acesso, use o fluxo de login/recuperação da instalação correspondente.

Para configuração local, copie `.env.example` para um `.env` privado somente se precisar de ajustes. Este conjunto é suficiente para uso no próprio computador:

```dotenv
APP_PUBLIC_URL=
HOST=127.0.0.1
PORT=3000
NODE_ENV=development
PLATFORM_MODE=production
```

O uso local sem URL não desliga confirmação de e-mail: configure SMTP em `/admin`. Não marque contas comuns como verificadas por SQL para contornar esse requisito. Para testes automatizados, use os transportes/fixtures existentes com bancos temporários.

O modo de produção é padrão e usa banco operacional vazio; isso não significa que cobrança externa já esteja ativada. O painel cria cadastros reais da instalação. Quando houver HTTPS/credenciais, o mesmo conjunto poderá evoluir conforme regras do banco operacional.

Para testes financeiros de homologação, usar OUTRO diretório de dados:

```dotenv
PLATFORM_MODE=test
PLATFORM_DATA_DIR=/caminho/privado/quadrinha-homologacao
```

Não mudar o banco de operação para teste. O marcador operacional impede pagamentos de teste no banco já marcado, mesmo se uma variável for alterada.

## URLs de uso

| Finalidade | Rota relativa |
| --- | --- |
| Landing/planos | `/` e `/planos` |
| Cadastro de dono | `/cadastro` |
| Login da plataforma | `/entrar` |
| Administração central | `/admin` |
| Minhas empresas/assinaturas | `/conta` |
| Gestão da arena | `/app/{slug}` |
| Portal do jogador | `/reservar/{slug}` |
| Consumir link de e-mail | `/acesso` |
| Recuperar senha da plataforma | `/recuperar-senha` |

Acesse usando o host/porta da instalação. Links locais de e-mail devem ser abertos no mesmo computador do servidor. Se o e-mail for aberto pelo celular, o endereço local aponta para o celular e não para o servidor.

## Depois de criar o administrador

1. Configure SMTP no painel central e valide a conexão. Confira a fila.
2. Crie o cadastro do dono de uma arena e confirme seu e-mail.
3. Na administração, ative a empresa manualmente enquanto não usa cobrança online.
4. Na empresa, cadastre quadras, horários, tarifas avulsas e uma conta/caixa.
5. Publique a página em Reserva Online.
6. No portal, o jogador faz cadastro próprio, confirma e-mail e reserva. Sem checkout habilitado, a reserva fica pendente para acompanhamento da arena.
7. Revise preço e recursos e publique os planos que deseja oferecer. Os oito seeds são rascunhos anuais.
8. Ao configurar uma URL pública HTTPS e serviços externos, valide cada recebedor separadamente e o retorno dos webhooks.

## Variáveis e escopos

| Nome | Leitura/uso | Observação |
| --- | --- | --- |
| `APP_PUBLIC_URL` | Origem pública HTTPS | Opcional em listener local; checkout/webhooks exigem origem pública, sem caminho/query/fragmento |
| `HOST` | Interface do listener | Padrão 127.0.0.1; fallback local aceita apenas 127.0.0.1/::1 |
| `PORT` | Porta HTTP | Padrão 3000; links locais usam porta efetiva |
| `PLATFORM_MODE` | production ou test | Padrão production; testes em diretório distinto |
| `PLATFORM_DATA_DIR` | Diretório de dados SaaS | Padrão data/platform; pode conter caminho absoluto |
| `PLATFORM_ENCRYPTION_KEY` | 32 bytes em hexadecimal | Chave privada estável, entregue diretamente ao processo, sem placeholder HTTP |
| `NODE_ENV` | Cookies seguros/configuração | Em HTTPS/produção os cookies devem permanecer seguros |
| `QF_DATABASE_PATH` | Banco standalone | Não é o diretório de dados SaaS |
| `MERCADOPAGO_*` | Apenas fluxo standalone anterior | Não são credenciais globais para todas as arenas SaaS |
| `QF_PLAYWRIGHT_MODULE` | Ferramenta opcional de navegador | Caminho/import do Playwright Core |
| `QF_BROWSER_PATH` | Executável de Chromium/Chrome | Padrão Linux /usr/bin/chromium |

A configuração privada por empresa (MP, WhatsApp) é feita pela interface e armazenada criptografada no master. SMTP é da plataforma. Não inserir valores em `CLAUDE.md`, prompts, arquivos versionados ou `CONTINUIDADE_COMPLETA.md`.

## Testes de navegador

Não são necessários para `npm start` nem `npm test`. O runtime da aplicação só precisa da dependência do lockfile. Para os testes Chromium, instale Playwright Core em diretório de ferramentas separado e use navegador compatível já instalado:

```bash
QF_PLAYWRIGHT_MODULE=/caminho/ferramentas/node_modules/playwright-core/index.mjs QF_BROWSER_PATH=/caminho/chromium npm run test:platform-browser
```

Outras suítes:

```bash
npm run test:browser
npm run test:finance-browser
```

Esses scripts geram/atualizam capturas e resultados em `docs/`. Conferir o diff após rodá-los; uma captura gerada não é comparação automática de todos os pixels. Na máquina original havia Playwright Core em `/workspace/reamy/node_modules/playwright-core/index.mjs` e Chromium em `/usr/bin/chromium`; não presumir esses caminhos em outra máquina.

Windows PowerShell, com ferramentas já instaladas:

```powershell
$env:QF_PLAYWRIGHT_MODULE = 'C:/caminho/ferramentas/node_modules/playwright-core/index.mjs'
$env:QF_BROWSER_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
npm run test:platform-browser
```

O caminho real do navegador deve ser conferido. As validações disponíveis não certificam execução do produto em Windows real.

## Recuperar o histórico Git portátil

O ZIP inclui o snapshot legível em `quadrinha/` e o bundle `historico/quadrinha-main.bundle`. Não é necessário usar o bundle para abrir/ler o código no Claude Code, mas ele preserva os commits anteriores.

Para ter um clone local com histórico sem depender da rede, a partir da pasta extraída do pacote:

```bash
git clone --branch main historico/quadrinha-main.bundle quadrinha-com-historico
cd quadrinha-com-historico
git remote set-url origin https://github.com/lmdsistemas-lmd/quadrinha.git
git log --oneline
```

Depois copie os documentos de continuidade do snapshot `quadrinha/` para o clone, preservando o `.git` do clone e quaisquer alterações que você tenha feito. O bundle contém somente arquivos versionados até o commit-base, não os novos documentos da exportação nem dados ignorados.

Alternativa online:

```bash
git clone https://github.com/lmdsistemas-lmd/quadrinha.git
```

O projeto pode ter avançado depois da exportação. Antes de sobrepor arquivos do snapshot, confira commits e alterações. A exportação contém um estado datado, não uma sincronização futura automática. Não usar `reset --hard`, `git clean` ou sobrescrita cega para igualar os arquivos.

## Migrar os dados de uma instalação existente

O ZIP não inclui seus bancos, chave local, segredos ou contas de acesso. Para transferir uma instalação com registros:

1. Identifique qual modo e diretório a instalação realmente usa: SaaS `PLATFORM_DATA_DIR` ou standalone `QF_DATABASE_PATH`/padrões.
2. Pare de forma controlada apenas o processo que usa esses bancos. Não encerre aplicações alheias por uma porta coincidente.
3. Faça backup privado de TODO o diretório de dados relevante, incluindo bancos, WAL/SHM existentes e `platform.key` correspondente, se for o caso.
4. Se a chave vier de `PLATFORM_ENCRYPTION_KEY`, preserve seu valor por canal privado/gerenciador de segredos. Uma chave diferente torna as credenciais existentes ilegíveis.
5. Transfira `.env` privado apenas por meio seguro, separado do pacote de conversa/código. Adapte caminhos e endereço público ao novo host.
6. Restaure numa cópia, inicie com a mesma modalidade e confira autenticação, acesso por empresa, quantidades e histórico financeiro antes de usar como instalação principal.
7. Guarde o backup anterior até verificar restauração e integridade. Não excluir o original por causa de erro de inicialização.

Não copie apenas o arquivo principal de SQLite com o serviço gravando. Não interprete ausência de cadastros numa instalação nova como perda do código: dados e código são artefatos diferentes. Não há migração automática standalone → SaaS no snapshot.

## Referência visual e material externo

Origem autorizada: https://sistema.quadrafacil.com.br/. O proprietário informou ter somente acesso web. Observações anteriores foram read-only. O código novo e os testes não precisam de login no original para instalar/rodar.

No ambiente antigo, o material autenticado ficava em `/workspace/scratch/quadrafacil`. Ele não foi copiado para a exportação. Documentos como `levantamento.md`, `audit-reference-ui.mjs` e capturas/DOM privados podem não estar disponíveis na nova máquina. O que foi preservado de modo portátil: perfis de UI, assets públicos locais, medidas e documentos de fidelidade e screenshots da nova aplicação com dados fictícios.

Se precisar de nova comparação, combinar acesso autorizado seguro com o proprietário. Não pedir senha no prompt. O original já redirecionou para renovação, portanto nem toda tela pode estar acessível atualmente; não tentar renovar ou gravar dados para obter acesso.

## Ambiente em nuvem anterior

- O checkout da aplicação era `/workspace/quadrinha`; REA separado em `/workspace/reamy`; um checkout antigo independente ficava em `/workspace/quadrafacil-novo`.
- Toolchain preparada em `/workspace/.reamy-toolchain/node_modules/.bin` com Node 24.18.0/npm 11.16.0; cache npm em `/workspace/.npm-cache`.
- Configuração de instalação/inicialização do ambiente havia sido salva em rascunho para revisão/publicação. Isso não significa que a aplicação foi hospedada nem que a configuração foi publicada posteriormente.
- O rascunho de egress personalizado incluía api.mercadopago.com, graph.facebook.com, sistema.quadrafacil.com.br, cdnjs.cloudflare.com, www.google.com e www.gstatic.com, mais o preset de gerenciadores de pacotes; a publicação dessa lista não foi confirmada.
- Credenciais de acesso ao original eram identificadas como QUADRAFACIL_EMAIL e QUADRAFACIL_SENHA; seus valores/bindings não foram exportados e não são necessários para iniciar a nova aplicação.
- Nenhum token/secret de provedor real ou domínio público foi confirmado como funcional. Não transportar placeholders de proxy como se fossem valores de criptografia/HMAC.
- Scripts e a preparação local substituem a necessidade de ferramentas proprietárias do ambiente anterior. Para destino novo, configurar HTTPS, persistência, segredos e rede na hospedagem escolhida.


---

# Parte 7: Pendências

Fonte: `continuidade/PENDENCIAS.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Pendências, limites e próximos passos sugeridos

## Solicitação atual e prioridade

A última solicitação foi exportar conversa e andamento para continuar no Claude Code. A última alteração funcional foi habilitar uso local sem APP_PUBLIC_URL. Não há outra tarefa funcional nova explicitamente escolhida depois disso. A fila abaixo orienta a próxima conversa; não autoriza cobranças reais, envios, publicação ou mudança da arquitetura por iniciativa automática.

## Pronto no código e validado localmente

- Três áreas de acesso, banco por arena e financeiro central separado.
- CRUDs e regras existentes da gestão, dashboard revisado, menus e botões ajustados à referência observada.
- Administração central de empresas, modos de acesso, planos editáveis/publicáveis e recuperação de senha do proprietário.
- Confirmação de e-mail e convites, com tokens de uso único e fila SMTP.
- Mercado Pago Checkout Pro, credenciais por recebedor, preferência, webhook e conciliação financeira.
- Compra/renovação de plano com snapshot e concessão idempotente de período; preservação de bloqueio manual.
- Portal básico, disponibilidade, cadastro do jogador, reserva e checkout próprios.
- Configuração e adaptador de WhatsApp Meta com template manual e confirmação por webhook.
- Uso local sem domínio e sem APP_PUBLIC_URL; preservação de confirmação de e-mail e bloqueio de checkout externo sem HTTPS.

## Implementado, mas falta configuração/homologação externa

| Item | O que falta | Não confundir com |
| --- | --- | --- |
| SMTP | Provedor/host, usuário, senha, remetente, liberação de porta e testes de caixa de entrada | Mensagem aceita por transporte fictício não é e-mail real |
| HTTPS público | Hospedagem ou URL temporária e APP_PUBLIC_URL na publicação | Processo local não é aplicação publicada |
| Mercado Pago da plataforma | Credenciais próprias, assinatura, validação de conta, configuração financeira e webhook | Token de uma arena não recebe assinaturas da plataforma |
| Mercado Pago de cada arena | Credenciais e webhook independentes para cada recebedor | Chave global de ambiente não é fallback SaaS |
| WhatsApp Meta | Conta comercial/app, número/ID, token, app secret, verify token e template aprovado | Número comum de WhatsApp não fornece acesso à API |
| Produção | Volume persistente, gestão/backup de chave, restauração, domínio/proxy e monitoramento | Suíte de testes não certifica operação externa |

Não há confirmação de cobranças, e-mails ou mensagens reais nesta exportação. Os dados de acesso ao site de referência não substituem qualquer requisito acima.

## Melhorias funcionais ainda em aberto

1. **Fidelidade visual completa**: revisar por tela, modal, subaba, estados vazios/erro e dispositivo. O pedido original de aparência idêntica permanece uma meta; as comparações existentes são parciais.
2. **Reservas pendentes/abandono**: definir política de hold, expiração e cancelamento coordenado com preferências/pagamentos. Não liberar o horário enquanto um pagamento pendente ainda puder aprovar sem tratamento de pagamento tardio.
3. **Operação financeira avançada**: cancelamento/estorno iniciado pela aplicação, pagamentos parciais, fechamento, conciliação bancária, parcelamentos e recuperação de respostas incertas. Não basta mudar status no SQLite.
4. **Assinaturas avançadas**: se solicitado, cobrança recorrente automática real, avisos de vencimento, upgrade/downgrade/prorrata, limites de recursos por plano e regras comerciais. Hoje a renovação é compra do período.
5. **Tarifas e agenda**: feriados, pacotes, franquias, rateios, séries editáveis em lote e regras completas não observadas no original.
6. **Aulas**: reserva automática da quadra da turma, geração escolar em lote e assinatura de contratos.
7. **WhatsApp avançado**: templates com variáveis, lembretes agendados, automação de reserva/conversação e controles de custos. Hoje envio manual sem variáveis.
8. **Notificações**: canais push e fluxo avançado de notícias; cadastros de rascunhos não são publicação automática em app nativo.
9. **Relatórios**: PDF/exports adicionais, agendamento e filtros/detalhamentos ainda identificados como pendentes.
10. **Indicações**: definir se haverá recompensa e regras. Não atribuir bônus financeiro ao contador atual.
11. **Apps nativos/SMS/Pagar.me/fiscal**: fora da implementação atual; o usuário escolheu sem emissão fiscal por enquanto. Não reintroduzir fiscal automaticamente por planos da referência citarem NF.

## Evolução técnica a avaliar antes de operação maior

- Planejar migrações versionadas e possíveis tabelas por domínio; cadastros continuam em JSON `records`.
- Considerar falhas entre bancos distintos e recuperação da associação reserva/master e assinatura/financeiro; não há transação distribuída única.
- SQLite/uma instância: avaliar concorrência, cache de motores por arena e custo de varrer listas de registros/faturas antes de escalar.
- Definir monitoramento de fila SMTP e mensagens em revisão, rastreio de conciliação e processo operacional de atendimento.
- Testar backup e restauração incluindo todos os bancos e a chave correta. A exportação não inclui backup privado.
- Revisar gestão/rotação de credenciais com faturas pendentes. Hoje editar credenciais invalida verificação do merchant; conciliação histórica precisa da conta/ambiente corretos.
- Validar no Windows real se esse for o ambiente de destino. Existem testes de caminhos Windows e um reparo do servidor de arquivos, mas as validações de navegador registradas foram Linux/Chromium.
- Uma migração para PostgreSQL, framework de frontend ou ORM deve ser uma decisão explícita de evolução, não pressuposto para retomar no Claude Code.

## Critérios práticos de aceite da próxima entrega

Preservar isolamento e fluxo de dinheiro, cobrir o comportamento novo com testes relevantes, diferenciar mocks de serviços externos e documentar como operar/voltar atrás sem apagar dados. Para mudanças visuais, produzir evidência com dados fictícios e indicar a referência usada. Para publicação, entregar configuração concreta e aguardar os requisitos/autorização correspondentes.


---

# Parte 8: Histórico de código

Fonte: `continuidade/HISTORICO_GIT.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Histórico Git da aplicação

Extraído do repositório, da criação até o commit-base da exportação. Datas locais em America/Sao_Paulo; mensagens de conversa sem timestamp não receberam essas datas por inferência. O bundle da branch main acompanha o pacote.

## 4cccc76 — feat: add independent Quadra Fácil test application

SHA: `4cccc76daa3fbe7070225d50e44756e27788348a`
Data local: 2026-10-15T18:22:58-03:00

Arquivos modificados:

```text
A	.gitignore
A	.nvmrc
A	AGENTS.md
A	README.md
A	docs/ESCOPO.md
A	docs/agenda-demo.png
A	docs/painel-celular.png
A	docs/painel-demo.png
A	docs/validacao-ui.json
A	modules.mjs
A	package.json
A	public/app.js
A	public/favicon.svg
A	public/index.html
A	public/style.css
A	server.mjs
A	tests/workflows.test.mjs
```

## 39049e9 — fix: serve public files correctly on Windows

SHA: `39049e96d2ccb44276a1b6db495e4285e15f0964`
Data local: 2026-10-15T18:30:42-03:00

Arquivos modificados:

```text
M	README.md
M	server.mjs
M	tests/workflows.test.mjs
```

## cb3729c — feat: align menus, buttons and registration pages with reference

SHA: `cb3729cdf3af0f300b72df3b626dd8261ebffd5b`
Data local: 2026-10-15T19:28:49-03:00

Arquivos modificados:

```text
M	README.md
M	docs/ESCOPO.md
A	docs/FIDELIDADE.md
A	docs/FONT-AWESOME-LICENSE.txt
A	docs/OPEN-SANS-LICENSE.txt
A	docs/agenda-atualizada.png
A	docs/cliente-cadastro-atualizado.png
A	docs/clientes-celular-atualizado.png
A	docs/quadras-atualizado.png
A	docs/validacao-fidelidade.json
M	modules.mjs
M	package.json
M	public/app.js
A	public/assets/ativo.png
A	public/assets/editar.png
A	public/assets/fa-brands-400.woff2
A	public/assets/fa-regular-400.woff2
A	public/assets/fa-solid-900.woff2
A	public/assets/inativo.png
A	public/assets/lixeira.png
A	public/assets/logo-rodape.png
A	public/assets/logo.png
A	public/assets/open-sans-latin-400-normal.woff2
A	public/assets/open-sans-latin-600-normal.woff2
A	public/assets/open-sans-latin-700-normal.woff2
A	public/assets/open-sans-latin-800-normal.woff2
A	public/fontawesome-shims.css
A	public/fontawesome.css
M	public/index.html
A	public/reference-ui.mjs
A	public/reference.css
A	scripts/validate-browser.mjs
M	server.mjs
M	tests/workflows.test.mjs
```

## 3516999 — feat: rebuild dashboard and add operational database with Mercado Pago checkout

SHA: `3516999d95fa701667c0135f34c8dff18efaa7a4`
Data local: 2026-10-17T13:01:18-03:00

Arquivos modificados:

```text
A	.env.example
M	AGENTS.md
M	README.md
A	dashboard-data.mjs
A	docs/BANCO-OPERACIONAL.md
A	docs/DASHBOARD.md
M	docs/ESCOPO.md
M	docs/FIDELIDADE.md
A	docs/MERCADO-PAGO.md
M	docs/agenda-atualizada.png
M	docs/cliente-cadastro-atualizado.png
A	docs/dashboard-atualizado.png
A	docs/dashboard-celular-atualizado.png
A	docs/financeiro-configuracao-homologacao.png
M	docs/quadras-atualizado.png
M	docs/validacao-fidelidade.json
A	docs/validacao-financeiro.json
M	modules.mjs
M	package.json
A	payments.mjs
M	public/app.js
A	public/dashboard-view.mjs
A	public/dashboard.css
A	public/finance-view.mjs
A	public/finance.css
M	public/index.html
M	public/reference-ui.mjs
A	scripts/operational-database.mjs
A	scripts/start-operational.mjs
M	scripts/validate-browser.mjs
A	scripts/validate-finance-browser.mjs
M	server.mjs
A	tests/dashboard.test.mjs
A	tests/payments.test.mjs
```

## d39f4d5 — feat: separate platform, arena management and public booking areas

SHA: `d39f4d559c401c6a93d2621bd8b472dd945aee12`
Data local: 2026-10-17T13:55:51-03:00

Arquivos modificados:

```text
M	.env.example
M	AGENTS.md
M	README.md
M	docs/BANCO-OPERACIONAL.md
M	docs/ESCOPO.md
M	docs/MERCADO-PAGO.md
A	docs/PLATAFORMA.md
A	docs/plataforma-admin.png
A	docs/plataforma-mercadopago-arena.png
A	docs/plataforma-portal-celular.png
A	docs/plataforma-portal-reservas.png
A	docs/validacao-plataforma.json
A	integrations.mjs
A	package-lock.json
M	package.json
M	payments.mjs
A	platform-security.mjs
A	platform-store.mjs
A	platform.mjs
A	public-booking.mjs
M	public/app.js
M	public/finance.css
A	public/platform-ui.js
A	public/platform.css
A	public/platform.html
A	public/tenant-view.mjs
A	scripts/platform-admin.mjs
A	scripts/validate-platform-browser.mjs
M	server.mjs
A	tests/platform.test.mjs
```

## b086505 — fix: allow local registration without a public application URL

SHA: `b08650548ea6cbd02af7707c4cbc7d82385d50c6`
Data local: 2026-10-17T16:10:04-03:00

Arquivos modificados:

```text
M	.env.example
M	README.md
M	docs/PLATAFORMA.md
M	platform-store.mjs
M	platform.mjs
M	public/platform-ui.js
M	tests/platform.test.mjs
```


---

# Parte 9: Guia SaaS existente

Fonte: `docs/PLATAFORMA.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

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


---

# Parte 10: Escopo do produto

Fonte: `docs/ESCOPO.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Cobertura da nova versão

A evolução SaaS com três áreas, SMTP, Mercado Pago/WhatsApp por arena, planos e portal público está detalhada em [PLATAFORMA.md](PLATAFORMA.md). A matriz abaixo também documenta o motor standalone reutilizado; os limites de autenticação e integrações anteriores são substituídos pelo guia SaaS quando a aplicação inicia por `npm start`.

A interface foi revisada a partir de 36 telas autenticadas da referência, incluindo menus, ações de cabeçalho, formulários e abas. O cabeçalho de Quadras foi comparado por medidas no Chromium em 1440 px; veja [FIDELIDADE.md](FIDELIDADE.md). Isso não certifica igualdade de pixels de todas as telas nem equivalência completa com o servidor original.

## Implementado e validado

| Área | Comportamento disponível | Limites |
| --- | --- | --- |
| Acesso | Primeiro administrador, login/logout, senhas com scrypt e salt, sessão HttpOnly/SameSite, CSRF, limite de tentativas, usuários e papéis | Sessões persistem após reinício. SaaS possui recuperação por SMTP, confirmação de e-mail e auditoria administrativa; sem MFA |
| Cadastros | Clientes, quadras, tarifas, materiais, sócios, fornecedores, categorias, produtos, contas e contatos | Formulários são uma seleção dos campos observados, não uma cópia integral de todos os campos do original |
| Agenda | Grade diária, reservas por cliente/quadra, conflitos, bloqueios entre quadras vinculadas, horários adjacentes, repetição semanal e tarifa por hora calculada no servidor | Aplica o cadastro de horários por dia, com padrão de 07h às 23h e intervalos de 30 minutos; sem feriados, franquias, pacote de dias, rateios ou séries editáveis em lote |
| Recebimentos | Reserva recebida gera um lançamento; repetição do recebimento não duplica; cobrança da reserva sincroniza o status e não gera segunda receita | Apenas recebimento integral, sem pagamentos parciais e sem estorno bancário. Checkout Pro para cartão/Pix implementado, mas sem homologação externa; boleto não é oferecido |
| Financeiro | Lançamentos, receitas/despesas, filtro por período, fluxo de caixa, cobranças, resumo e configuração de conta/parcelas; receita, taxas do vendedor e estornos conciliados pelo Mercado Pago | Datas seguem o registro de origem. Sem conciliação bancária, parcelamentos, recorrência de cobranças, fechamento ou contabilidade fiscal |
| Lanchonete | Produtos, importação CSV atômica, movimentações de estoque, mesas/comandas e pedidos com itens e total no servidor | Pedido aberto reserva estoque; cancelar o pedido devolve itens. Receber gera lançamento. Sem impressão de cozinha, NFC-e ou divisão de comanda |
| Aulas | Professores, turmas, planos, matrículas, capacidade, frequência, aulas, modelos de contrato e cobranças/mensalidades manuais | Não agenda automaticamente horários da turma nem gera suas mensalidades em lote; sem assinatura de contratos |
| Sócios | Cadastro, planos, cobranças e geração de mensalidades por mês sem duplicação | A geração usa o valor e o dia de vencimento do associado. Sem benefícios ou regras avançadas de planos |
| Relatórios | Busca por módulo/período; filtros de status/tipo/origem na agenda; relatório detalhado/resumido e CSV preservado em Arquivos Gerados, com neutralização de fórmulas | Resumo por situação. Sem PDF, agendamento, filtro por usuário/cliente ou todos os detalhamentos de impressão do original; esses controles são identificados como pendentes |
| Configuração | Usuários, preferências, cadastro de horários e espaços | Algumas configurações são apenas cadastro e não controlam todos os comportamentos da aplicação; ver limites de Agenda |
| Dashboard | Visual revisado, seis indicadores, comparação com período anterior, capacidade por horários configurados, receitas por módulo e resumo; configurações de exibição e legenda interativa | Fórmulas próprias documentadas em DASHBOARD.md; não foram comparadas com o backend original. Não há histórico de alterações da capacidade de quadras |

Os cadastros têm persistência real e busca. A exportação está nos relatórios dos módulos disponíveis. Referências são verificadas no servidor. Exclusões com vínculos são bloqueadas; a exclusão de registros comuns é lógica. Registros financeiros gerados a partir de outro módulo não podem ser alterados diretamente.

## Pendente para equivalência com o original

- Paridade visual detalhada de todas as telas, formulários, modais, estados vazios, erros e permissões.
- Regras completas de tarifas, planos, sócios, recorrência e pagamentos parciais.
- Reserva automática de quadra para aulas e geração em lote das mensalidades escolares.
- Apps nativos e automação de comunicações; portal público básico e SMTP/WhatsApp estão implementados no SaaS.
- Homologação real do Checkout Pro e notificações com credenciais próprias e domínio HTTPS; WhatsApp oficial possui adaptador/configuração por arena, ainda sem conta externa validada; SMS, Pagar.me, boleto e emissão fiscal não foram incluídos nesta etapa.
- Notificações push, documentos oficiais, cartões próprios tokenizados e demais regras comerciais avançadas. Compras de planos usam Checkout Pro; indicações são rastreadas, sem recompensa financeira automática.
- Homologação com os responsáveis pelas regras do negócio e revisão antes de usar dados reais.

Os serviços externos estão identificados como pendentes na interface. Não são simulados como pagamentos, mensagens ou notas fiscais efetivamente emitidos.

## Desenvolvimento e início da operação

O proprietário possui somente acesso web ao sistema original. Após a versão de demonstração, solicitou iniciar uma aplicação operacional com Checkout Pro. A transição usa banco separado, preservando contas de acesso locais e o banco anterior, sem copiar os registros fictícios. O comportamento observável pela web continua como referência e os testes usam bancos temporários e dados fictícios. Código do servidor original ou uma instância de homologação dele não são pré-requisitos para continuar. Regras que não possam ser observadas serão definidas para a nova versão e identificadas como próprias, sem afirmar equivalência não verificada. A observação feita até aqui abriu telas e formulários; não cadastrou nem cancelou reservas no sistema original.

Para integrações, usar credenciais próprias de homologação e documentação oficial, mantidas nos segredos do ambiente e nunca no código. A nova versão não reutiliza as credenciais de acesso ao sistema original para essas integrações.

A estrutura e preparação do banco estão em [BANCO-OPERACIONAL.md](BANCO-OPERACIONAL.md). A integração, validação local e pendências de homologação estão em [MERCADO-PAGO.md](MERCADO-PAGO.md). Nenhuma transação real foi feita nesta entrega.


---

# Parte 11: Dashboard

Fonte: `docs/DASHBOARD.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Dashboard: visual e dados

O dashboard foi reconstruído a partir da captura autenticada autorizada anterior e do CSS público `css/dashboard.css` da referência. Na consulta de 17/10/2026, o site original redirecionou a rota para renovação de plano. Não houve alteração da conta, tentativa de contornar a restrição ou publicação de dados/capturas autenticadas.

Foram refeitos o cabeçalho azul, datas em formato brasileiro com seletor, engrenagem de configurações, atualização, seis cartões, ícones, comparação com período anterior, gráfico de receitas por módulo, gráfico em rosca e resumo do período. A tipografia acompanha a aparência renderizada na captura de referência, inclusive o fallback sans-serif observado. Os gráficos usam SVG local e não dependem de serviços externos.

O teste no Chromium compara o cabeçalho de dashboard em 1440 × 1000 px com a região observada: X=43, Y=258, largura=1354, altura=118, aceitando até 2 px por arredondamento. A aparência geral, os dados e a fonte podem variar com resolução e navegador; não é uma certificação de igualdade de todos os pixels ou das regras internas do servidor original.

- [Dashboard com dados fictícios da nova aplicação](dashboard-atualizado.png)
- [Dashboard no celular](dashboard-celular-atualizado.png)
- [Resultado da comparação e navegação](validacao-fidelidade.json)
- [Resultado do fluxo financeiro local simulado](validacao-financeiro.json)

As preferências da engrenagem permitem ocultar indicadores, gráficos e resumo, e ficam no navegador por usuário. A legenda do gráfico permite ocultar séries. O botão de atualização recarrega os dados do servidor e aplica o período. Sem dados no período anterior, o painel informa “Sem base no período anterior”, sem inventar crescimento.

## Fórmulas da aplicação

| Indicador | Cálculo |
| --- | --- |
| Faturamento do Período | Soma das receitas com situação Recebido na data financeira selecionada |
| Lucro Líquido | Receitas recebidas menos despesas recebidas, incluindo taxas e estornos conciliados |
| Margem | Lucro líquido / faturamento; zero quando não há faturamento |
| Taxa de Ocupação | Horas de reservas não canceladas/estornadas divididas pela capacidade das quadras atualmente ativas, segundo os horários de cada dia |
| Inadimplência | Valor vencido e pendente no período / valor das obrigações não canceladas do período; cobranças vinculadas à agenda não duplicam a reserva |
| Clientes inadimplentes | Clientes distintos identificados nas obrigações vencidas e pendentes do período |
| Ticket Médio | Receita recebida / quantidade de lançamentos de receita recebida |
| Novos Clientes | Cadastros criados no período, convertendo o instante para America/Sao_Paulo |
| Comparativo | Período imediatamente anterior com o mesmo número de dias; variação relativa ao valor absoluto anterior |

A capacidade usa os horários configurados e considera zero nos dias fechados. Não há histórico de mudanças na quantidade de quadras ativas; a capacidade histórica usa o cadastro atual. O comparativo de inadimplência usa a data atual como referência de vencimento em ambos os períodos, não uma reconstrução da dívida em cada data passada.

A receita do gráfico é bruta; taxas e estornos entram no lucro como despesas. A quadra mais rentável usa o valor das reservas, excluindo aulas. Esses critérios são próprios da aplicação e estão cobertos por testes; não foi possível confirmar as fórmulas no backend do sistema original.


---

# Parte 12: Visual e medidas

Fonte: `docs/FIDELIDADE.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Revisão de menus e botões

Veja também a [revisão do dashboard](DASHBOARD.md) e a [integração financeira](MERCADO-PAGO.md).

A revisão usa a interface autenticada de `sistema.quadrafacil.com.br` como referência, com autorização do proprietário. Foram observadas 36 telas, incluindo cinco cadastros. As consultas ao original não gravaram dados. Todas as gravações de validação foram feitas em um banco temporário da nova aplicação, com dados fictícios.

## Alterações

| Área | Ajuste |
| --- | --- |
| Navegação | Mesma ordem dos nove grupos, Agenda como acesso direto, submenus e níveis de Financeiro, Lanchonete e Configuração; navegação móvel com Voltar |
| Cabeçalhos | Títulos, descrições, ícones e ações específicos por página; Cadastrar/Listar e destaque correspondente à tela atual |
| Quadras | Bloqueios/Cadastrar/Listar, ícones de linha, formulário em página, opções Sim/Não, campos condicionais e Gravar |
| Clientes | Cadastrar/Listar, abas Cadastro Simples/Completo/Cliente do App, formulário em página e Gravar/Alterar |
| Listagens | Filtros, títulos azuis, separadores laranja, ações por ícone, paginação e mensagens de lista vazia |
| Escolinha e sócios | Abas próprias; cadastro do módulo selecionado; geração local de mensalidades de sócios |
| Produtos | Importação CSV e modelo para baixar; gravação atômica |
| Agenda | Controles de data, seleção de quadras/página, legendas, cores por tipo e marcação de pagamento; horários configuráveis e bloqueios entre quadras |
| Relatórios | Filtros de módulo/período, busca, resumo por situação, impressão pelo navegador, geração de CSV e Arquivos Gerados |

## Medidas conferidas

No Chromium com viewport de 1440 × 1000 px, o cabeçalho de Quadras e seus botões foram comparados com as seguintes medidas observadas. A verificação automática aceita diferença de até 1 px por arredondamento de fontes.

| Elemento | X | Y | Largura | Altura |
| --- | ---: | ---: | ---: | ---: |
| Cartão do cabeçalho | 56 | 198 | 1328 | 98 |
| Bloqueios | 974 | 229 | 129 | 36 |
| Cadastrar | 1113 | 229 | 130 | 36 |
| Listar | 1253 | 229 | 102 | 36 |

Veja os resultados em [validacao-fidelidade.json](validacao-fidelidade.json), a [lista de quadras](quadras-atualizado.png), o [cadastro de cliente](cliente-cadastro-atualizado.png), a [agenda](agenda-atualizada.png) e a [versão móvel](clientes-celular-atualizado.png). Essas capturas contêm somente dados fictícios da nova aplicação.

## Limites

Essa comparação não certifica igualdade de pixels em todas as resoluções, telas ou estados. O conteúdo das tabelas varia com o banco próprio. A identificação do usuário, relógio e indicação de ambiente de testes usam dados locais. Não são reproduzidos contadores de notificações, contratos de assinatura ou dados particulares da conta original.

Os formulários extensos e regras não observáveis do servidor original ainda têm diferenças. As opções de relatórios sem implementação completa são identificadas na própria tela. Portal de reservas, aplicativo, mensagens, emissão fiscal e funções comerciais continuam pendentes. O Checkout Pro foi implementado e ainda depende da homologação real; veja [ESCOPO.md](ESCOPO.md). Não há simulação de envio, pagamento ou nota emitida.

## Repetir a validação

`npm run check` e `npm test` não exigem dependências externas. Para a validação opcional de navegador, instale Playwright Core em um diretório de ferramentas separado e use Chromium compatível:

```bash
QF_PLAYWRIGHT_MODULE=/caminho/playwright-core/index.mjs QF_BROWSER_PATH=/caminho/chromium npm run test:browser
```

O script usa SQLite em memória e não modifica `data/`. As capturas e o resultado são gravados em `docs/`. Os resultados registrados foram obtidos no Chromium/Linux; não representam uma execução em Windows real.

## Recursos visuais

- Logo, logo de rodapé e imagens de ativar/inativar/editar/excluir: recursos públicos do site de referência, usados na reconstrução autorizada pelo proprietário.
- Font Awesome 6.5.1: fontes e CSS oficiais distribuídos pelo cdnjs; licença em [FONT-AWESOME-LICENSE.txt](FONT-AWESOME-LICENSE.txt).
- Open Sans 5.3.0: arquivos Latin 400/600/700/800 do pacote oficial `@fontsource/open-sans`, com integridade do pacote conferida contra o registro npm; licença em [OPEN-SANS-LICENSE.txt](OPEN-SANS-LICENSE.txt).

As fontes e imagens ficam em `public/assets/` e são servidas localmente. Capturas autenticadas, dados da conta original e credenciais não fazem parte do repositório.


---

# Parte 13: Integração inicial Mercado Pago (com escopo standalone)

Fonte: `docs/MERCADO-PAGO.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Mercado Pago: cartão e Pix pelo Checkout Pro

> O modo SaaS de três áreas usa bancos e credenciais próprios por empresa. Consulte [PLATAFORMA.md](PLATAFORMA.md). As instruções abaixo sobre variáveis globais e banco operacional se referem ao modo standalone anterior.

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


---

# Parte 14: Banco operacional anterior (standalone)

Fonte: `docs/BANCO-OPERACIONAL.md`. Caminhos relativos de documentos incorporados referem-se à pasta original indicada.

# Banco operacional

> O modo SaaS de três áreas usa bancos e credenciais próprios por empresa. Consulte [PLATAFORMA.md](PLATAFORMA.md). As instruções abaixo sobre variáveis globais e banco operacional se referem ao modo standalone anterior.

O armazenamento já era persistente em SQLite. Esta atualização adiciona estrutura relacional para cobranças online, pagamentos do provedor, eventos financeiros, notificações processadas e sessões. Os cadastros existentes continuam em `records`, com as validações e transações no servidor; ainda não foram convertidos integralmente para tabelas específicas por entidade.

## Separar demonstração e operação

Pare a aplicação e faça uma cópia de segurança de `data/` com o servidor parado. Na pasta do projeto, execute:

```bash
npm run db:operational
npm run start:operational
```

O primeiro comando cria **`data/operacional.sqlite`**, sem substituir arquivos existentes. Copia somente as contas de acesso de `data/quadrafacil.sqlite`, incluindo as senhas já protegidas por hash. Não copia sessões, cadastros, preferências do centro de demonstração, reservas, produtos, cobranças ou lançamentos. O arquivo anterior é preservado. Se não existir banco anterior, o novo banco começa sem usuários e a interface pede a criação do primeiro administrador.

Se `data/operacional.sqlite` já existir, inicie diretamente com `npm run start:operational`. Não o apague para repetir a preparação. Para escolher outros caminhos:

```bash
node scripts/operational-database.mjs caminho/banco-anterior.sqlite caminho/novo-operacional.sqlite
```

Para iniciar um destino personalizado, configure `QF_DATABASE_PATH` no `.env` privado do servidor. O banco é marcado como operacional; não aceita inclusão de dados fictícios na criação de acesso nem pagamentos de homologação. A aplicação também recusa iniciar um banco de demonstração com o comando operacional.

Na instalação local, o primeiro acesso continua pela porta 3000. Cadastre os dados do centro em Preferências e sua conta/caixa em **Financeiro → Configurações Financeiras**. O script não migra dados do sistema original nem altera o banco da instalação antiga do REA.

## Tabelas e integridade

| Tabela | Finalidade |
| --- | --- |
| `records` | Cadastros e lançamentos, com exclusão lógica e validação de vínculos pelo servidor |
| `users` | Contas de acesso, papel, senha com scrypt/salt e datas de criação/acesso |
| `settings` | Preferências locais, modo operacional e configuração financeira sem credenciais |
| `sessions` | Hash SHA-256 do token, usuário, CSRF e validade; sessões persistem após reinício |
| `invoices` | Origem única da cobrança, valor em centavos, conta, recebedor, ambiente, preferência e chave idempotente |
| `provider_payments` | Pagamentos conciliados, situação, valores, taxas e estornos, vinculados à cobrança |
| `payment_events` | Histórico imutável dos eventos e retrato normalizado dos valores confirmados |
| `webhook_receipts` | Notificações já processadas, identificadas por impressão criptográfica |
| `reports` | Arquivos CSV gerados como retratos dos dados da época |
| `audit` | Ator, operação, módulo, registro e instante |
| `schema_migrations` | Registro da instalação do esquema financeiro |

As alterações de pagamento, lançamentos e eventos são aplicadas na mesma transação SQLite. A origem da cobrança é única; uma cobrança vinculada à reserva impede baixar a mesma reserva por outro caminho. Os pagamentos são identificados pelo ID do Mercado Pago e não dependem da memória do processo para impedir duplicação.

As sessões duram oito horas, persistem em reinícios e são revogadas no logout. Sessões antigas da versão que as mantinha somente em memória não podem ser recuperadas; nessa primeira atualização será necessário entrar novamente. As contas e senhas permanecem.

## Backup e execução

Use um único processo da aplicação para esse banco e mantenha o arquivo em armazenamento local persistente. Não coloque SQLite em uma pasta compartilhada de rede. Para backup manual, pare o processo e copie a pasta `data/` completa; não copie apenas o arquivo principal enquanto houver gravações. Confirme a restauração em uma cópia antes de depender do backup.

Não é necessário instalar PostgreSQL para operar esta versão. Migração para outro banco, múltiplas instâncias, isolamento de várias empresas, recuperação de senha, backups automáticos e hospedagem continuam sendo etapas próprias. Nenhuma hospedagem foi publicada por esta atualização.
