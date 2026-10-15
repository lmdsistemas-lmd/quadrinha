const f=(key,label,type='text',extra={})=>({key,label,type,...extra});
const req=(key,label,type='text',extra={})=>f(key,label,type,{required:true,...extra});
const ref=(key,label,module,required=true)=>f(key,label,'ref',{ref:module,required});
const sel=(key,label,options)=>f(key,label,'select',{options});
const money=(key='value',label='Valor (R$)')=>req(key,label,'money');
const date=(key='date',label='Data')=>req(key,label,'date');
const notes=f('notes','Observações','textarea');
const active=sel('status','Situação',['Ativo','Inativo']);
const m=(key,title,group,fields,columns)=>({key,title,group,fields,columns:columns||fields.filter(x=>x.type!=='textarea'&&x.type!=='password').slice(0,6).map(x=>x.key)});
export const modules=[
 m('quadras','Quadras','Cadastros',[req('name','Nome'),sel('floor','Piso',['Areia','Sintético','Madeira','Concreto','Saibro']),sel('sport','Esporte principal',['Beach Tennis','Futebol Society','Futsal','Vôlei de Praia','Tênis','Pádel','Futevôlei','Outro']),sel('covered','Coberta',['Sim','Não']),f('position','Posição','number'),sel('online','Exibida na reserva online',['Sim','Não']),active,notes]),
 m('tarifas','Tarifas','Cadastros',[req('name','Nome da tarifa'),ref('courtId','Quadra','quadras'),money('value','Valor por hora (R$)'),sel('kind','Tipo',['Avulsa','Mensalista','Aula']),req('start','Horário inicial','time'),req('end','Horário final','time'),active,notes]),
 m('clientes','Clientes','Cadastros',[req('name','Nome / Razão social'),sel('kind','Tipo',['Pessoa física','Pessoa jurídica']),f('document','CPF / CNPJ'),f('email','E-mail','email'),f('phone','Celular','tel'),f('telephone','Telefone','tel'),f('birth','Nascimento','date'),f('zip','CEP'),f('address','Endereço'),f('number','Número'),f('district','Bairro'),f('city','Cidade'),f('state','Estado'),notes],['name','email','phone','city','state']),
 m('materiais','Materiais','Cadastros',[req('name','Nome'),money(),f('quantity','Quantidade','number'),active,notes]),
 m('socios','Sócios','Cadastros',[ref('customerId','Cliente','clientes'),req('name','Nome'),money('value','Mensalidade (R$)'),f('dueDay','Dia de vencimento','number'),active,notes]),
 m('cobrancas-socios','Cobranças Sócios','Cadastros',[ref('memberId','Sócio','socios'),req('name','Descrição'),money(),date('dueDate','Vencimento'),sel('status','Situação',['Pendente','Recebido','Cancelado']),notes]),
 m('agenda','Agenda / Locações','Agenda',[ref('courtId','Quadra','quadras'),ref('customerId','Cliente','clientes'),date(),req('start','Início','time'),req('end','Fim','time'),ref('tariffId','Tarifa','tarifas',false),money(),sel('kind','Tipo',['Avulsa','Mensalista','Aula']),sel('status','Pagamento',['Pendente','Recebido','Cancelado']),notes],['date','start','end','courtId','customerId','value','kind','status']),
 m('cobrancas-agenda','Cobranças Agenda','Agenda',[ref('bookingId','Reserva','agenda'),req('name','Descrição'),money(),date('dueDate','Vencimento'),sel('status','Situação',['Pendente','Recebido','Cancelado']),notes]),
 m('escolinha','Gestão de Aulas','Aulas / Escolinha',[req('name','Nome da turma'),req('teacher','Professor'),ref('courtId','Quadra','quadras'),sel('sport','Esporte',['Beach Tennis','Futebol','Tênis','Futevôlei','Vôlei','Outro']),sel('day','Dia',['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']),req('start','Início','time'),req('end','Fim','time'),f('capacity','Vagas','number'),money('value','Mensalidade (R$)'),active,notes]),
 m('matriculas','Matrículas','Aulas / Escolinha',[ref('classId','Turma','escolinha'),ref('customerId','Aluno','clientes'),date(),active,notes]),
 m('categorias-produtos-lanchonete','Categorias de Produtos','Lanchonete',[req('name','Nome'),active,notes]),
 m('fornecedores-lanchonete','Fornecedores','Lanchonete',[req('name','Nome'),f('document','CPF / CNPJ'),f('email','E-mail','email'),f('phone','Telefone','tel'),notes]),
 m('produtos-lanchonete','Produtos','Lanchonete',[req('name','Nome do produto'),ref('categoryId','Categoria','categorias-produtos-lanchonete',false),ref('supplierId','Fornecedor','fornecedores-lanchonete',false),f('barcode','Código de barras'),money('cost','Custo (R$)'),money('value','Preço de venda (R$)'),f('stock','Estoque inicial','number'),f('minimum','Estoque mínimo','number'),active,notes],['name','categoryId','cost','value','stock','status']),
 m('estoque-lanchonete','Estoque','Lanchonete',[ref('productId','Produto','produtos-lanchonete'),sel('kind','Movimento',['Entrada','Saída']),req('quantity','Quantidade','number'),date(),notes]),
 m('mesas-lanchonete','Mesas / Comandas','Lanchonete',[req('name','Nome / Número'),sel('status','Situação',['Livre','Ocupada','Inativa']),notes]),
 m('pedidos-lanchonete','Pedidos','Lanchonete',[ref('tableId','Mesa / Comanda','mesas-lanchonete',false),ref('customerId','Cliente','clientes',false),date(),req('items','Produtos','items'),sel('status','Situação',['Aberto','Recebido','Cancelado']),notes],['date','tableId','customerId','value','status']),
 m('contas-bancarias','Contas Bancárias','Financeiro',[req('name','Nome'),f('bank','Banco'),f('agency','Agência'),f('account','Conta'),active,notes]),
 m('categorias-financeiro','Categorias Financeiro','Financeiro',[req('name','Nome'),sel('kind','Tipo',['Receita','Despesa']),active,notes]),
 m('contatos-financeiro','Contatos Financeiro','Financeiro',[req('name','Nome'),f('document','CPF / CNPJ'),f('email','E-mail','email'),f('phone','Telefone'),notes]),
 m('lancamentos','Lançamentos','Financeiro',[req('name','Descrição'),sel('kind','Tipo',['Receita','Despesa']),money(),date(),ref('accountId','Conta bancária','contas-bancarias',false),ref('categoryId','Categoria','categorias-financeiro',false),sel('status','Situação',['Pendente','Recebido','Cancelado']),notes],['date','name','kind','value','accountId','status']),
 m('cobrancas-avulso','Cobranças Avulso','Financeiro',[ref('customerId','Cliente','clientes'),req('name','Descrição'),money(),date('dueDate','Vencimento'),sel('status','Situação',['Pendente','Recebido','Cancelado']),notes]),
 m('usuarios','Usuários','Configuração',[req('name','Nome'),req('email','E-mail','email'),f('password','Senha (mínimo 10 caracteres)','password'),sel('role','Permissão',['Administrador','Atendente','Consulta'])],['name','email','role']),
 m('horarios','Horários','Configuração',[req('name','Descrição'),sel('day','Dia',['Todos os dias','Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']),req('start','Abertura','time'),req('end','Fechamento','time'),active]),
 m('espacos-centro','Espaços','Configuração',[req('name','Nome'),f('capacity','Capacidade','number'),active,notes])
];
export const settings=[
 {key:'preferencias',title:'Preferências',fields:[req('name','Nome do centro esportivo'),f('email','E-mail','email'),f('phone','Telefone'),f('address','Endereço'),f('city','Cidade'),f('state','Estado'),sel('defaultDuration','Duração padrão',['30','60','90','120'])]},
 {key:'reserva-online',title:'Reserva Online',fields:[sel('status','Reservas públicas',['Desativadas']),f('notice','Mensagem para clientes','textarea')]}
];
export const moduleMap=Object.fromEntries(modules.map(x=>[x.key,x]));
