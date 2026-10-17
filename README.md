# Quadra Fácil — nova versão de desenvolvimento

Aplicação independente criada a partir da observação autorizada do sistema de referência. A versão atual inclui o dashboard revisado, um banco operacional separado e integração inicial de cartão/Pix pelo Checkout Pro.

**O Mercado Pago ainda não está ativado em uma conta real:** faltam as credenciais e o domínio HTTPS, que será fornecido pelo proprietário. Os testes de pagamentos usam um provedor local simulado. Veja [configuração e limites do Mercado Pago](docs/MERCADO-PAGO.md), [banco operacional](docs/BANCO-OPERACIONAL.md) e [dashboard](docs/DASHBOARD.md).

Ainda não existe equivalência completa com o produto original. A matriz em [docs/ESCOPO.md](docs/ESCOPO.md) distingue as funcionalidades disponíveis das pendências.

## Executar

Requer Node.js 24.18.0 (fixado em `.nvmrc`) ou outra versão compatível com `node:sqlite`. Não há dependências externas para instalar.

Neste ambiente:

```bash
export PATH=/workspace/.reamy-toolchain/node_modules/.bin:$PATH
cd /workspace/quadrinha
npm run db:operational
npm run start:operational
```

O servidor usa a interface local `127.0.0.1` e a porta `3000`. Execute `db:operational` somente se `data/operacional.sqlite` ainda não existir. Esse comando preserva o banco anterior e copia somente as contas de acesso próprias, quando presentes. A primeira tela pede um administrador com senha própria se não houver contas. Não há senha padrão nem inclusão de dados fictícios no modo operacional.

Para continuar desenvolvendo em um banco de demonstração, use `npm start`; na criação de acesso, a opção de incluir dados fictícios é opcional e começa desmarcada. Nunca use o banco operacional para pagamentos de homologação.

O modo operacional usa `data/operacional.sqlite`; `npm start` mantém o caminho anterior `data/quadrafacil.sqlite`. O banco, seus arquivos WAL e SHM e os registros do sistema devem ser preservados juntos durante o uso. Para um backup simples, pare o servidor antes de copiar o diretório `data/`; não copie apenas o arquivo principal enquanto houver gravações. Não remova esse diretório para atualizar o código.

Variáveis opcionais:

| Variável | Uso |
| --- | --- |
| `PORT` | Porta HTTP, padrão 3000 |
| `HOST` | Interface de escuta, padrão 127.0.0.1 |
| `QF_DATABASE_PATH` | Caminho de outro banco SQLite, útil para testes |
| `NODE_ENV=production` | Habilita cookies de sessão com atributo Secure; exige publicação atrás de HTTPS |

As sessões duram oito horas, persistem nos reinícios e são revogadas no logout. Os usuários e demais registros persistem no banco.

## Verificação

```bash
npm run check
npm test
```

A suíte cobre recursos públicos e fontes locais, caminhos Windows/POSIX, autenticação, CSRF, reservas, tarifas, recorrência atômica, recebimentos sem duplicação, estoque, matrículas, permissões, persistência, bloqueios entre quadras, horários configurados, importação CSV atômica, mensalidades sem duplicação, arquivos de relatórios e migração do banco anterior. Os caminhos Windows são exercitados com `node:path.win32`; isso não equivale a executar o navegador em uma máquina Windows real.

A validação no Chromium confere o dashboard, a hierarquia dos menus, as medidas dos botões em Quadras, cadastro/edição de cliente, cadastro de quadra, importação, geração de mensalidades, relatórios, abas da escolinha, 34 telas e menu móvel. Usa um banco temporário com dados fictícios. Para repetir, veja [docs/FIDELIDADE.md](docs/FIDELIDADE.md).

- [Dashboard atualizado](docs/dashboard-atualizado.png)
- [Configuração financeira de homologação com provedor simulado](docs/financeiro-configuracao-homologacao.png)
- [Lista de quadras atualizada](docs/quadras-atualizado.png)
- [Cadastro de cliente atualizado](docs/cliente-cadastro-atualizado.png)
- [Agenda atualizada](docs/agenda-atualizada.png)
- [Layout no celular](docs/clientes-celular-atualizado.png)
- [Resultado da validação atual](docs/validacao-fidelidade.json)

## Organização

- `server.mjs`: servidor HTTP, autenticação, SQLite, regras e operações transacionais.
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
