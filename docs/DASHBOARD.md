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
