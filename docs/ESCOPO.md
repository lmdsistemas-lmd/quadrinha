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
