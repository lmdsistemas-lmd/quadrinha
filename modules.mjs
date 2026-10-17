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
 m('agenda','Agenda / Locações','Agenda',[ref('courtId','Quadra','quadras'),ref('customerId','Cliente','clientes'),date(),req('start','Início','time'),req('end','Fim','time'),ref('tariffId','Tarifa','tarifas',false),money(),sel('kind','Tipo',['Avulsa','Mensalista','Aula','Evento','Reposição']),sel('status','Pagamento',['Pendente','Recebido','Cancelado']),notes],['date','start','end','courtId','customerId','value','kind','status']),
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

modules.push(
 m('bloqueios-quadras','Bloqueios de Quadras','Cadastros',[ref('primaryCourtId','Quadra Principal','quadras'),ref('secondaryCourtId','Quadra Secundária','quadras')],['primaryCourtId','secondaryCourtId']),
 m('professores','Professores','Aulas / Escolinha',[req('name','Nome'),f('email','E-mail','email'),f('phone','Telefone','tel'),active]),
 m('planos-aulas','Planos','Aulas / Escolinha',[req('name','Nome'),money('value','Mensalidade (R$)'),f('lessons','Aulas por semana','number'),active]),
 m('frequencias','Controle de Frequência','Aulas / Escolinha',[ref('registrationId','Aluno matriculado','matriculas'),date(),sel('status','Presença',['Presente','Falta','Justificada']),notes]),
 m('noticias-centro','Notícias','Configuração',[req('name','Título'),req('content','Conteúdo','textarea'),sel('status','Situação',['Rascunho'])]),
 m('notificacoes-app','Notificações','Configuração',[req('name','Título'),req('content','Mensagem','textarea'),sel('status','Situação',['Rascunho'])])
);
const sports=['Futebol de Campo','Futebol Society','Futsal','Futebol de Areia','Showbol','Tênis','Pádel','Voleibol','Handebol','Basquete','Squash','Bocha','Beach Tennis','Futevôlei','Sinuca (Snooker)','Videogame','Peteca de Areia','Outro','Natação','Patinação','Hóquei no Gelo','Curling','Vôlei de Praia','Cross training','Funcional','Pickleball','Paintball','Câmbio','Handebol de Areia'];
const court=modules.find(x=>x.key==='quadras');
court.fields.find(x=>x.key==='sport').options=sports;
court.fields.push(f('sports','Esportes','multi',{options:sports}),sel('showNotes','Exibir campo de observação na reserva',['Não','Sim']),f('notesTitle','Título do campo de observação'),sel('notesRequired','Observação obrigatória',['Não','Sim']),f('onlineStartLimit','Limitar início das reservas online','checkbox'),f('fullDay','Permitir reserva por período integral','checkbox'),money('fullDayValue','Valor do período integral (R$)'),f('ignoreDailyLimit','Ignorar limite de horas por dia','checkbox'));
for(const key of ['covered','online','showNotes','notesRequired'])court.fields.find(x=>x.key===key).presentation='radio';
court.fields.find(x=>x.key==='status').presentation='radio';
const customer=modules.find(x=>x.key==='clientes');customer.fields.push(active);customer.fields.find(x=>x.key==='kind').presentation='radio';
for(const key of ['fornecedores-lanchonete','contatos-financeiro'])modules.find(x=>x.key===key).fields.push(active);
modules.find(x=>x.key==='lancamentos').fields.push(sel('categoryType','Tipo de despesa',['Variável','Fixa']));


modules.push(
 m('creditos','Créditos','Financeiro',[ref('customerId','Cliente','clientes'),date(),money(),notes]),
 m('planos-socios','Planos','Cadastros',[req('name','Nome do plano'),money('value','Mensalidade (R$)'),f('description','Descrição','textarea'),active]),
 m('mensalidades-aulas','Mensalidades','Aulas / Escolinha',[ref('registrationId','Aluno matriculado','matriculas'),req('name','Descrição'),money(),date('dueDate','Vencimento'),sel('status','Situação',['Pendente','Recebido','Cancelado']),notes]),
 m('cobrancas-aulas','Cobranças','Aulas / Escolinha',[ref('registrationId','Aluno matriculado','matriculas'),req('name','Descrição'),money(),date('dueDate','Vencimento'),sel('status','Situação',['Pendente','Recebido','Cancelado']),notes]),
 m('contratos-aulas','Modelo de Contrato','Aulas / Escolinha',[req('name','Título'),req('content','Conteúdo do contrato','textarea'),active]),
 m('aulas','Aulas','Aulas / Escolinha',[ref('classId','Turma','escolinha'),date(),req('start','Horário inicial','time'),req('end','Horário final','time'),notes])
);
modules.find(x=>x.key==='materiais').fields.push(sel('online','Exibido na Reserva Online',['Sim','Não']));

modules.find(x=>x.key==='tarifas').fields.push(f('days','Dias da semana','multi',{options:['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']}),sel('duration','Duração',['Todas','30 minutos','1 hora','1h30','2 horas']),sel('modality','Modalidade',['Avulsa','Mensalista','Aula']));

for(const key of ['agenda','cobrancas-agenda','cobrancas-avulso','cobrancas-socios','mensalidades-aulas','cobrancas-aulas','pedidos-lanchonete'])modules.find(x=>x.key===key).fields.find(x=>x.key==='status').options.push('Estornado');

export const moduleMap=Object.fromEntries(modules.map(x=>[x.key,x]));
export function openingHours(records,date){
 const days=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
 const day=days[new Date(date+'T12:00:00Z').getUTCDay()];
 const row=records.find(x=>x.day===day)||records.find(x=>x.day==='Todos os dias');
 return row?{start:row.start,end:row.end,closed:row.status==='Inativo'}:{start:'07:00',end:'23:00',closed:false};
}

export function summarizeReport(rows){
 const groups=new Map();
 for(const row of rows){const status=row.status||'Ativo';const group=groups.get(status)||{status,count:0,value:0};group.count++;group.value=Math.round((group.value+Number(row.value||0))*100)/100;groups.set(status,group);}
 return [...groups.values()].sort((a,b)=>a.status.localeCompare(b.status,'pt-BR'));
}
