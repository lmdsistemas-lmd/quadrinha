# Banco operacional

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
