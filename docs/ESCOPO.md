# Cobertura da nova versão

A interface segue a estrutura observada no Quadra Fácil: cabeçalho branco, menu azul, cadastros em tabelas, cartões de indicadores, gráficos e agenda por quadra. Não foi realizado teste de igualdade de pixels, nem foi reconstruído todo o comportamento do servidor original.

## Implementado e validado

| Área | Comportamento disponível | Limites |
| --- | --- | --- |
| Acesso | Primeiro administrador, login/logout, senhas com scrypt e salt, sessão HttpOnly/SameSite, CSRF, limite de tentativas, usuários e papéis | Sem recuperação de senha, MFA ou trilha de login administrativa |
| Cadastros | Clientes, quadras, tarifas, materiais, sócios, fornecedores, categorias, produtos, contas e contatos | Formulários são uma seleção dos campos observados, não uma cópia integral de todos os campos do original |
| Agenda | Grade diária, reservas por cliente/quadra, conflitos, horários adjacentes, repetição semanal e tarifa por hora calculada no servidor | Das 07h às 23h, intervalos de 30 minutos; não aplica o cadastro de horários à grade; sem feriados, franquias, pacote de dias, rateios ou séries editáveis em lote |
| Recebimentos | Reserva recebida gera um lançamento; repetição do recebimento não duplica; cobrança da reserva sincroniza o status e não gera segunda receita | Apenas recebimento integral, sem pagamentos parciais e sem estorno bancário. Não processa cartão, Pix ou boleto |
| Financeiro | Lançamentos, receitas/despesas, filtro por período, fluxo de caixa, cobranças e resumo | Datas seguem o registro de origem. Sem conciliação bancária, parcelamentos, recorrência de cobranças, fechamento ou contabilidade fiscal |
| Lanchonete | Produtos, movimentações de estoque, mesas/comandas e pedidos com itens e total no servidor | Pedido aberto reserva estoque; cancelar o pedido devolve itens. Receber gera lançamento. Sem impressão de cozinha, NFC-e ou divisão de comanda |
| Aulas | Turmas, matrículas, capacidade e prevenção de matrícula duplicada | Não agenda automaticamente horários da turma, não registra presença e não gera mensalidades |
| Sócios | Cadastro com valor de mensalidade e cobranças manuais | Sem planos avançados, geração automática de mensalidades ou benefícios por associado |
| Relatórios | Exportação CSV dos registros com neutralização de fórmulas de planilha | Sem os PDFs, agendamento e arquivos gerados do sistema original |
| Configuração | Usuários, preferências, cadastro de horários e espaços | Algumas configurações são apenas cadastro e não controlam todos os comportamentos da aplicação; ver limites de Agenda |
| Dashboard | Indicadores a partir do banco próprio, receitas/despesas por dia, composição de receitas e próximas reservas | Métricas e fórmulas não foram comparadas com o backend original. Não há comparação automática com o período anterior |

Todos os cadastros têm persistência real, busca e exportação. Referências são verificadas no servidor. Exclusões com vínculos são bloqueadas; a exclusão de registros comuns é lógica. Registros financeiros gerados a partir de outro módulo não podem ser alterados diretamente.

## Pendente para equivalência com o original

- Paridade visual detalhada de todas as telas, formulários, modais, estados vazios, erros e permissões.
- Regras completas de tarifas, planos, sócios, recorrência e pagamentos parciais.
- Recuperação de senha e administração/auditoria operacional.
- Aulas com reserva de quadra, frequência e mensalidades.
- Portal público de reserva online, aplicativo e comunicações.
- WhatsApp, SMS, Pagar.me, Pix, boleto, cartão e emissão fiscal.
- Notificações, documentos, arquivos de relatórios, compras, cartões e recursos comerciais do sistema original.
- Homologação com os responsáveis pelas regras do negócio e revisão antes de usar dados reais.

Os serviços externos estão identificados como pendentes na interface. Não são simulados como pagamentos, mensagens ou notas fiscais efetivamente emitidos.

## Desenvolvimento da versão de testes

O proprietário informou que possui somente acesso web ao sistema original e quer sua própria versão de testes. O trabalho continuará com o comportamento observável pela web como referência, implementação independente e validação em nosso banco com dados fictícios. Código do servidor original ou uma instância de homologação dele não são pré-requisitos para continuar. Regras que não possam ser observadas serão definidas para a nova versão e identificadas como próprias, sem afirmar equivalência não verificada. A observação feita até aqui abriu telas e formulários; não cadastrou nem cancelou reservas no sistema original.

Para integrações, usar credenciais próprias de homologação e documentação oficial, mantidas nos segredos do ambiente e nunca no código. A nova versão não reutiliza as credenciais de acesso ao sistema original para essas integrações.
