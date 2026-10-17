import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dashboardModel} from '../dashboard-data.mjs';

test('dashboard calcula valores atuais, período anterior e capacidade pelos horários reais',()=>{
 const data={
  quadras:[{id:'q1',name:'Quadra 1',status:'Ativo'}],
  horarios:[{day:'Todos os dias',start:'08:00',end:'20:00',status:'Ativo'}],
  agenda:[{id:'r1',courtId:'q1',customerId:'c1',date:'2026-10-17',start:'10:00',end:'12:00',value:100,status:'Recebido'},
   {id:'r2',courtId:'q1',customerId:'c2',date:'2026-10-17',start:'12:00',end:'13:00',value:50,status:'Pendente'}],
  clientes:[{id:'c1',createdAt:'2026-10-17T12:00:00Z'}],
  lancamentos:[{id:'l1',date:'2026-10-17',value:100,kind:'Receita',status:'Recebido',sourceModule:'agenda',sourceId:'r1'},
   {id:'l2',date:'2026-10-17',value:10,kind:'Despesa',status:'Recebido',sourceModule:'mercadopago-taxas'},
   {id:'l3',date:'2026-10-16',value:50,kind:'Receita',status:'Recebido'}]
 };
 const model=dashboardModel(data,{from:'2026-10-17',to:'2026-10-17',today:'2026-10-18'});
 assert.equal(model.current.revenue,100);assert.equal(model.current.profit,90);assert.equal(model.current.occupancy,25);
 assert.equal(model.current.newCustomers,1);assert.equal(model.current.ticket,100);assert.equal(model.change('revenue'),100);
 assert.equal(model.current.overdue,50);assert.equal(model.current.overdueCustomers,1);assert.equal(model.current.delinquency,50/150*100);
 assert.equal(model.series.find(row=>row.key==='bookings').value,100);assert.equal(model.daily[0].total,100);
 assert.equal(model.topCourt.name,'Quadra 1');
});

test('indicadores vazios não inventam crescimento nem geram NaN e estornos reduzem lucro',()=>{
 const empty=dashboardModel({},{from:'2026-10-17',to:'2026-10-17',today:'2026-10-17'});
 for(const key of ['revenue','profit','occupancy','ticket','delinquency','newCustomers'])assert.equal(empty.current[key],0);
 assert.equal(empty.change('revenue'),null);assert.equal(empty.topCourt,null);assert.equal(empty.series.length,0);
 const paid=dashboardModel({lancamentos:[{date:'2026-10-17',value:100,kind:'Receita',status:'Recebido'},{date:'2026-10-17',value:25,kind:'Despesa',status:'Recebido',sourceModule:'mercadopago-estornos'}]},{from:'2026-10-17',to:'2026-10-17',today:'2026-10-17'});
 assert.equal(paid.current.profit,75);
 assert.throws(()=>dashboardModel({},{from:'2026-10-18',to:'2026-10-17',today:'2026-10-17'}),/Período/);
});

test('cobrança da agenda não duplica a inadimplência e dias fechados não geram capacidade',()=>{
 const data={quadras:[{id:'q1',status:'Ativo'}],horarios:[{day:'Sábado',start:'08:00',end:'20:00',status:'Inativo'}],agenda:[{id:'b1',courtId:'q1',customerId:'c1',date:'2026-10-17',start:'10:00',end:'11:00',value:100,status:'Pendente'}],'cobrancas-agenda':[{bookingId:'b1',value:100,dueDate:'2026-10-17',status:'Pendente'}]};
 const model=dashboardModel(data,{from:'2026-10-17',to:'2026-10-17',today:'2026-10-18'});
 assert.equal(model.current.capacity,0);assert.equal(model.current.occupancy,0);assert.equal(model.current.overdue,100);
});
