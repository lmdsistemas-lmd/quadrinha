# Quadra Fácil — nova versão de desenvolvimento

Aplicação independente criada a partir da observação autorizada do sistema de referência. Usa **banco separado e dados de demonstração**, conforme solicitado. O acesso e os dados do sistema original não são reutilizados pela nova aplicação.

Esta é uma primeira implementação funcional. Ainda não existe equivalência completa com o produto original; a matriz em [docs/ESCOPO.md](docs/ESCOPO.md) distingue o que funciona do que falta reconstruir.

## Executar

Requer Node.js 24.18.0 (fixado em `.nvmrc`) ou outra versão compatível com `node:sqlite`. Não há dependências externas para instalar.

Neste ambiente:

```bash
export PATH=/workspace/.reamy-toolchain/node_modules/.bin:$PATH
cd /workspace/quadrinha
npm start
```

O servidor usa a interface local `127.0.0.1` e a porta `3000`. A primeira tela permite criar um administrador com senha própria e incluir os dados fictícios. Não há senha padrão. Marque **Incluir dados de demonstração** para iniciar com três quadras, seis clientes fictícios, reservas, caixa e produto de exemplo.

Os dados ficam em `data/quadrafacil.sqlite`. O banco, seus arquivos WAL e SHM e os registros do sistema devem ser preservados juntos durante o uso. Para um backup simples, pare o servidor antes de copiar o diretório `data/`; não copie apenas o arquivo principal enquanto houver gravações. Não remova esse diretório para atualizar o código.

Variáveis opcionais:

| Variável | Uso |
| --- | --- |
| `PORT` | Porta HTTP, padrão 3000 |
| `HOST` | Interface de escuta, padrão 127.0.0.1 |
| `QF_DATABASE_PATH` | Caminho de outro banco SQLite, útil para testes |
| `NODE_ENV=production` | Habilita cookies de sessão com atributo Secure; exige publicação atrás de HTTPS |

As sessões duram oito horas e são encerradas quando o processo reinicia. Os usuários e demais registros persistem no banco.

## Verificação

```bash
npm run check
npm test
```

Foram executados oito testes de fluxos pela API: autenticação, CSRF, origem, reservas, conflitos, tarifas, recorrência atômica, recebimentos sem duplicação, estoque de pedidos, matrículas, permissões e persistência após reinício. Oito testes passaram.

Também foram verificados onze fluxos no Chromium, incluindo criação de acesso com demonstração, cadastro de cliente, reserva, apresentação de conflito, recebimento, grade da agenda, navegação de todas as 31 telas de gestão verificadas, pedido, exportação CSV, layout/menu mobile e logout/login. A API de sessão e os processos de demonstração usados nessa verificação foram descartados; nenhum acesso de teste foi deixado no banco principal.

- [Painel de demonstração](docs/painel-demo.png)
- [Agenda de demonstração](docs/agenda-demo.png)
- [Layout no celular](docs/painel-celular.png)
- [Resultado dos testes de interface](docs/validacao-ui.json)

## Organização

- `server.mjs`: servidor HTTP, autenticação, SQLite, regras e operações transacionais.
- `modules.mjs`: contratos dos cadastros e suas relações.
- `public/`: aplicação de navegador, estilos e ícone.
- `tests/workflows.test.mjs`: cenários de comportamento pela API.
- `docs/`: cobertura, limitações e capturas da nova aplicação com dados fictícios.

O repositório do REA em `/workspace/reamy` foi mantido separado. O levantamento de 32 telas principais e 17 formulários do sistema original está em `/workspace/scratch/quadrafacil/levantamento.md`. Evidências autenticadas e capturas originais não foram copiadas para os arquivos públicos desta aplicação.

## Publicação

O código é mantido no repositório `lmdsistemas-lmd/quadrinha`. A aplicação não está publicada em uma hospedagem externa. A publicação definitiva ainda exige definir domínio, hospedagem HTTPS, estratégia de backup, recuperação de senha e monitoramento, além de completar as funções necessárias da matriz de escopo. As integrações de pagamento, emissão fiscal e mensagens precisam de credenciais de homologação e testes específicos. O código atual não deve ser tratado como substituto integral de produção.

## Testar em sua própria máquina

1. Baixe este repositório pelo GitHub em **Code → Download ZIP** e extraia o arquivo.
2. Instale Node.js 24.18.0 e abra um terminal na pasta extraída que contém `package.json` (normalmente `quadrinha-main`).
3. Execute `npm start`. Não é necessário `npm install`, pois o projeto não usa dependências externas.
4. Abra no navegador a aplicação local na porta 3000.
5. Crie seu próprio administrador e mantenha marcada a opção **Incluir dados de demonstração**.
6. Cadastre um cliente, faça uma reserva na agenda e tente outra no mesmo horário para conferir o bloqueio. Registre o recebimento e acompanhe o lançamento no financeiro.

O projeto é uma versão independente para testes. O proprietário tem apenas acesso web ao original; código do servidor original e uma instância de testes dele não são necessários para continuar esta implementação. As diferenças conhecidas estão em `docs/ESCOPO.md`.
