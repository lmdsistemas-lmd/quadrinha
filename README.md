# Quadra Fácil — nova versão de desenvolvimento

Aplicação independente criada a partir da observação autorizada do sistema de referência. A versão atual inclui três áreas: administração da plataforma, gestão de cada arena e portal do jogador. Há planos editáveis, ativação de empresas, verificação/recuperação de e-mail por SMTP, configurações Mercado Pago e WhatsApp por arena e reservas com Checkout Pro. Veja [guia da plataforma](docs/PLATAFORMA.md).

**O Mercado Pago ainda não está ativado em uma conta real:** faltam as credenciais e o domínio HTTPS, que será fornecido pelo proprietário. Os testes de pagamentos usam um provedor local simulado. Veja [configuração e limites do Mercado Pago](docs/MERCADO-PAGO.md), [banco operacional](docs/BANCO-OPERACIONAL.md) e [dashboard](docs/DASHBOARD.md).

Ainda não existe equivalência completa com o produto original. A matriz em [docs/ESCOPO.md](docs/ESCOPO.md) distingue as funcionalidades disponíveis das pendências.

## Executar

Requer Node.js 24.18.0 (fixado em `.nvmrc`) ou outra versão compatível com `node:sqlite`. Instale as dependências fixadas com `npm ci` (Nodemailer para SMTP).

Neste ambiente:

```bash
export PATH=/workspace/.reamy-toolchain/node_modules/.bin:$PATH
cd /workspace/quadrinha
npm ci
npm run platform:admin
npm start
```

O comando interativo `platform:admin` cria seu acesso com senha oculta, sem administrador padrão. Entre pela rota `/admin`. O servidor usa `127.0.0.1:3000`. Para usar no próprio computador, deixe `APP_PUBLIC_URL` vazio e mantenha `HOST=127.0.0.1`: os links de confirmação e recuperação usam automaticamente o endereço local. Configure o SMTP pelo painel para enviar os e-mails. Checkout e webhooks externos dependem de uma origem pública HTTPS, que pode ser um endereço temporário da hospedagem. Os oito planos da referência começam como rascunhos anuais para você revisar e publicar.

| Área | Caminho |
| --- | --- |
| Proprietário da plataforma | `/admin` |
| Dono da arena | `/conta` e `/app/{arena}` |
| Cliente que reserva | `/reservar/{arena}` |

As mensalidades vão para a conta Mercado Pago configurada em `/admin`; as reservas vão para a conta configurada pelo dono da arena. As chaves ficam criptografadas no servidor. O banco SaaS fica em `data/platform/`, com um banco mestre, financeiro de assinaturas e um banco por empresa. Preserve também `platform.key` ou a chave estável `PLATFORM_ENCRYPTION_KEY`. Veja [configuração, segurança, preços e limitações](docs/PLATAFORMA.md).

A aplicação anterior de uma única arena continua em `npm run start:standalone` (banco anterior) e `npm run start:operational` (banco operacional separado). Não houve migração automática das contas ou dos dados anteriores para o SaaS. Para preparar o banco standalone operacional, use `npm run db:operational` somente se o destino ainda não existir; veja [banco operacional](docs/BANCO-OPERACIONAL.md).

Variáveis do SaaS: `PORT`, `HOST`, `APP_PUBLIC_URL`, `PLATFORM_DATA_DIR`, `PLATFORM_ENCRYPTION_KEY`, `PLATFORM_MODE` (padrão `production`) e `NODE_ENV`. Para homologação financeira use `PLATFORM_MODE=test` com outro diretório de dados. A versão SaaS não usa tokens globais Mercado Pago: cada conta cadastra suas próprias chaves na interface correspondente.

## Verificação

```bash
npm run check
npm test
```

A suíte inclui isolamento de empresas, verificação de e-mail, recuperação e convites, controle de acesso, reservas públicas e separação financeira dos planos/arenas. Também cobre recursos públicos e fontes locais, caminhos Windows/POSIX, autenticação, CSRF, reservas, tarifas, recorrência atômica, recebimentos sem duplicação, estoque, matrículas, permissões, persistência, bloqueios entre quadras, horários configurados, importação CSV atômica, mensalidades sem duplicação, arquivos de relatórios e migração do banco anterior. Os caminhos Windows são exercitados com `node:path.win32`; isso não equivale a executar o navegador em uma máquina Windows real.

Execute `npm run test:platform-browser` para validar as três áreas com dados fictícios e provedores substituídos localmente.

A validação anterior no Chromium confere o dashboard, a hierarquia dos menus, as medidas dos botões em Quadras, cadastro/edição de cliente, cadastro de quadra, importação, geração de mensalidades, relatórios, abas da escolinha, 34 telas e menu móvel. Usa um banco temporário com dados fictícios. Para repetir, veja [docs/FIDELIDADE.md](docs/FIDELIDADE.md).

- [Dashboard atualizado](docs/dashboard-atualizado.png)
- [Configuração financeira de homologação com provedor simulado](docs/financeiro-configuracao-homologacao.png)
- [Lista de quadras atualizada](docs/quadras-atualizado.png)
- [Cadastro de cliente atualizado](docs/cliente-cadastro-atualizado.png)
- [Agenda atualizada](docs/agenda-atualizada.png)
- [Layout no celular](docs/clientes-celular-atualizado.png)
- [Resultado da validação atual](docs/validacao-fidelidade.json)

## Organização

- `platform.mjs` e `platform-store.mjs`: três áreas, autenticação central, empresas, planos, assinaturas e isolamento.
- `integrations.mjs` e `platform-security.mjs`: cofre de credenciais, SMTP, WhatsApp e segurança.
- `public-booking.mjs`: disponibilidade e reservas do jogador.
- `server.mjs`: motor de uma arena, SQLite, regras e operações transacionais.
- `payments.mjs`: Checkout Pro, notificações e conciliação financeira.
- `dashboard-data.mjs`: fórmulas e agrupamentos do painel.
- `modules.mjs`: contratos dos cadastros e suas relações.
- `public/`: aplicação de navegador, estilos e ícone.
- `tests/`: cenários de API, pagamentos, banco operacional e indicadores.
- `scripts/`: preparação do banco, inicialização e verificações de navegador.
- `docs/`: cobertura, limitações e capturas da nova aplicação com dados fictícios.

O repositório do REA em `/workspace/reamy` foi mantido separado. O levantamento de 32 telas principais e 17 formulários do sistema original está em `/workspace/scratch/quadrafacil/levantamento.md`. Evidências autenticadas e capturas originais não foram copiadas para os arquivos públicos desta aplicação.

## Publicação

O código é mantido no repositório `lmdsistemas-lmd/quadrinha`. A aplicação não está publicada em uma hospedagem externa. A publicação definitiva ainda exige definir domínio, hospedagem HTTPS, estratégia de backup, recuperação de senha e monitoramento, além de completar as funções necessárias da matriz de escopo. O Checkout Pro precisa de credenciais próprias e homologação com a conta Mercado Pago; emissão fiscal e mensagens continuam pendentes. O código atual não deve ser tratado como substituto integral de produção.

## Testar em sua própria máquina

1. Baixe este repositório pelo GitHub em **Code → Download ZIP** e extraia o arquivo.
2. Instale Node.js 24.18.0 e abra um terminal na pasta extraída que contém `package.json` (normalmente `quadrinha-main`).
3. Para operação, execute `npm run db:operational` uma única vez e depois `npm run start:operational`. Não é necessário `npm install`. Se o banco operacional já existir, apenas inicie o serviço.
4. Abra no navegador a aplicação local na porta 3000.
5. Entre com sua conta preservada ou crie seu administrador quando solicitado. O banco operacional começa sem dados fictícios.
6. Cadastre o centro, uma conta/caixa, quadras e clientes. Faça uma reserva e confira o financeiro. Configure Mercado Pago conforme `docs/MERCADO-PAGO.md`; sem credenciais/domínio, cobranças externas ficam bloqueadas.

O projeto é uma aplicação independente em evolução para operação. O proprietário tem apenas acesso web ao original; código do servidor original e uma instância de testes dele não são necessários para continuar esta implementação. As diferenças conhecidas estão em `docs/ESCOPO.md`.

## Atualizar uma instalação existente

Pare o servidor com `Ctrl+C`. Faça uma cópia de segurança da pasta `data/` com o processo parado. Baixe a versão atual pelo GitHub e substitua os arquivos de código da instalação, incluindo `public/`, `scripts/`, `modules.mjs`, `server.mjs`, `payments.mjs`, `dashboard-data.mjs` e `package.json`. **Preserve a pasta `data/` e seu `.env` privado existentes**; não a apague nem a substitua por um banco de demonstração. Se ainda não houver banco operacional, prepare-o com `npm run db:operational`. Inicie com `npm run start:operational` e atualize o navegador com `Ctrl+F5`. A atualização adiciona as tabelas/colunas necessárias. O banco operacional novo recebe as contas de acesso; os cadastros antigos permanecem no banco anterior.
