# Revisão de menus e botões

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

Os formulários extensos e regras não observáveis do servidor original ainda têm diferenças. As opções de relatórios sem implementação completa são identificadas na própria tela. Portal de reservas, aplicativo, mensagens, pagamentos, emissão fiscal e funções comerciais continuam pendentes; veja [ESCOPO.md](ESCOPO.md). Não há simulação de envio, pagamento ou nota emitida.

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
