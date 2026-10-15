// Navigation and page actions observed on the authorized reference site. No account data.
export const navigation=[
  {
    "label": "Dashboard",
    "route": "dashboard",
    "icon": "fa fa-tachometer"
  },
  {
    "label": "Agenda",
    "route": "home-agenda",
    "icon": "fa fa-calendar"
  },
  {
    "label": "Cadastros",
    "route": "javascript:void(0)",
    "icon": "fa fa-book",
    "children": [
      {
        "label": "Quadras",
        "route": "quadras",
        "icon": ""
      },
      {
        "label": "Tarifas",
        "route": "tarifas",
        "icon": ""
      },
      {
        "label": "Clientes",
        "route": "clientes",
        "icon": ""
      },
      {
        "label": "Materiais",
        "route": "materiais",
        "icon": ""
      },
      {
        "label": "Enviar SMS",
        "route": "enviar-sms",
        "icon": ""
      },
      {
        "label": "Sócios",
        "route": "socios",
        "icon": "",
        "children": [
          {
            "label": "Cobranças Sócios",
            "route": "cobrancas-socios",
            "icon": ""
          }
        ]
      },
      {
        "label": "Agenda/Locações",
        "route": "agenda",
        "icon": "",
        "children": [
          {
            "label": "Cobranças Agenda",
            "route": "cobrancas-agenda",
            "icon": ""
          }
        ]
      }
    ]
  },
  {
    "label": "Aulas / Escolinha",
    "route": "javascript:void(0)",
    "icon": "fa fa-child",
    "children": [
      {
        "label": "Gestão de Aulas",
        "route": "escolinha",
        "icon": ""
      }
    ]
  },
  {
    "label": "Lanchonete",
    "route": "javascript:void(0)",
    "icon": "fa fa-cutlery",
    "children": [
      {
        "label": "Cadastros",
        "route": "javascript:void(0)",
        "icon": "",
        "children": [
          {
            "label": "Categorias de Produtos",
            "route": "categorias-produtos-lanchonete",
            "icon": ""
          },
          {
            "label": "Fornecedores",
            "route": "fornecedores-lanchonete",
            "icon": ""
          },
          {
            "label": "Produtos",
            "route": "produtos-lanchonete",
            "icon": ""
          },
          {
            "label": "Estoque",
            "route": "estoque-lanchonete",
            "icon": ""
          },
          {
            "label": "Mesas / Comandas",
            "route": "mesas-lanchonete",
            "icon": ""
          }
        ]
      },
      {
        "label": "Pedidos",
        "route": "pedidos-lanchonete",
        "icon": ""
      }
    ]
  },
  {
    "label": "Financeiro",
    "route": "javascript:void(0)",
    "icon": "fa fa-usd",
    "children": [
      {
        "label": "Fluxo de Caixa",
        "route": "fluxo-de-caixa",
        "icon": ""
      },
      {
        "label": "Minhas Compras",
        "route": "minhas-compras",
        "icon": ""
      },
      {
        "label": "Meus Cartões",
        "route": "meus-cartoes",
        "icon": ""
      },
      {
        "label": "Transações Financeiras",
        "route": "javascript:void(0)",
        "icon": "",
        "children": [
          {
            "label": "Contas Bancárias",
            "route": "contas-bancarias",
            "icon": ""
          },
          {
            "label": "Categorias Financeiro",
            "route": "categorias-financeiro",
            "icon": ""
          },
          {
            "label": "Contatos Financeiro",
            "route": "contatos-financeiro",
            "icon": ""
          },
          {
            "label": "Lançamentos",
            "route": "lancamentos",
            "icon": ""
          }
        ]
      },
      {
        "label": "Cobranças Avulso",
        "route": "cobrancas-avulso",
        "icon": ""
      },
      {
        "label": "Resumo de Cobranças",
        "route": "resumo-cobrancas",
        "icon": ""
      },
      {
        "label": "Movimentações Financeiras",
        "route": "movimentacoes-financeiras",
        "icon": ""
      },
      {
        "label": "Indique e Ganhe",
        "route": "indique-e-ganhe",
        "icon": ""
      },
      {
        "label": "Renovar Plano",
        "route": "marketplace",
        "icon": ""
      }
    ]
  },
  {
    "label": "Relatórios",
    "route": "javascript:void(0)",
    "icon": "fa fa-bar-chart",
    "children": [
      {
        "label": "Gerar Relatório",
        "route": "relatorios",
        "icon": ""
      },
      {
        "label": "Arquivos Gerados",
        "route": "arquivos-gerados",
        "icon": ""
      }
    ]
  },
  {
    "label": "Configuração",
    "route": "javascript:void(0)",
    "icon": "fa fa-cog",
    "children": [
      {
        "label": "Meus Dados",
        "route": "meus-dados",
        "icon": ""
      },
      {
        "label": "Usuários",
        "route": "usuarios",
        "icon": ""
      },
      {
        "label": "Horários",
        "route": "horarios",
        "icon": ""
      },
      {
        "label": "Preferências",
        "route": "preferencias",
        "icon": ""
      },
      {
        "label": "Reserva Online",
        "route": "reserva-online",
        "icon": ""
      },
      {
        "label": "Aplicativo",
        "route": "aplicativo",
        "icon": "",
        "children": [
          {
            "label": "Notícias",
            "route": "noticias-centro",
            "icon": ""
          },
          {
            "label": "Espaços",
            "route": "espacos-centro",
            "icon": ""
          },
          {
            "label": "Notificações",
            "route": "notificacoes-app",
            "icon": ""
          }
        ]
      },
      {
        "label": "Configurações de Pagamento",
        "route": "javascript:void(0)",
        "icon": "",
        "children": [
          {
            "label": "Pagar.me",
            "route": "configuracoes-pagarme",
            "icon": ""
          },
          {
            "label": "Definições",
            "route": "configuracoes-definicoes",
            "icon": ""
          }
        ]
      },
      {
        "label": "Configuração de Nota fiscal",
        "route": "configuracao-nota-fiscal",
        "icon": ""
      },
      {
        "label": "Integrações",
        "route": "javascript:void(0)",
        "icon": "",
        "children": [
          {
            "label": "Integração WhatsApp",
            "route": "integracao-whatsapp",
            "icon": ""
          }
        ]
      },
      {
        "label": "Notificações",
        "route": "notificacoes",
        "icon": ""
      }
    ]
  },
  {
    "label": "Sair",
    "route": "sair",
    "icon": "fa fa-sign-out"
  }
];
export const pageProfiles={
  "quadras": {
    "title": "Lista de Quadras",
    "description": "Gerencie e visualize todas as quadras cadastradas.",
    "actions": [
      {
        "label": "Bloqueios",
        "icon": "fas fa-lock",
        "route": "quadras/bloqueios",
        "primary": false
      },
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "quadras/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "quadras/listar",
        "primary": true
      }
    ],
    "createTitle": "Cadastro de Quadras",
    "createActions": [
      {
        "label": "Bloqueios",
        "icon": "fas fa-lock",
        "route": "quadras/bloqueios",
        "primary": false
      },
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "quadras/cadastrar",
        "primary": true
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "quadras/listar",
        "primary": false
      }
    ],
    "icon": "fas fa-th-large"
  },
  "clientes": {
    "title": "Lista de Clientes",
    "description": "Gerencie seus clientes e informações de contato.",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "clientes/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "clientes/listar",
        "primary": true
      }
    ],
    "createTitle": "Cadastro de Clientes",
    "createActions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "clientes/cadastrar",
        "primary": true
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "clientes/listar",
        "primary": false
      }
    ],
    "icon": "fas fa-users"
  },
  "materiais": {
    "title": "Lista de Materiais",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "materiais/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "materiais/listar",
        "primary": true
      }
    ],
    "createTitle": "Cadastro de Material",
    "createActions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "materiais/cadastrar",
        "primary": true
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "materiais/listar",
        "primary": false
      }
    ],
    "icon": "fas fa-cog"
  },
  "tarifas": {
    "title": "Lista de Tarifas",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "tarifas/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "tarifas/listar",
        "primary": true
      }
    ],
    "createTitle": "Cadastro de Tarifas",
    "createActions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "tarifas/cadastrar",
        "primary": true
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "tarifas/listar",
        "primary": false
      }
    ],
    "icon": "fas fa-cog"
  },
  "socios": {
    "title": "Sócios",
    "description": "",
    "actions": [],
    "icon": "fas fa-cog"
  },
  "cobrancas-socios": {
    "title": "Cobranças de Secios",
    "description": "Gerencie cobranças dos sócios.",
    "actions": [
      {
        "label": "Histórico",
        "icon": "fas fa-history",
        "route": "cobrancas-socios/visualizar-historico",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "cobrancas-socios/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "agenda": {
    "title": "Agenda de Horários",
    "description": "Visualize e gerencie suas reservas e horários.",
    "actions": [],
    "icon": "fas fa-calendar-days"
  },
  "home-agenda": {
    "title": "Quadras a Visualizar: 1 2 3 4 5 6 7 8 9 10",
    "description": "",
    "actions": [],
    "icon": "fas fa-calendar-days"
  },
  "cobrancas-agenda": {
    "title": "Cobranças Agenda",
    "description": "Gerencie cobranças e acompanhe pagamentos.",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "cobrancas-agenda/cadastrar",
        "primary": false
      },
      {
        "label": "Histórico",
        "icon": "fas fa-history",
        "route": "cobrancas-agenda/visualizar-historico",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "cobrancas-agenda/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "escolinha": {
    "title": "Gestão de Aulas",
    "description": "Gerencie a escolinha e seus alunos.",
    "actions": [],
    "icon": "fas fa-graduation-cap"
  },
  "categorias-produtos-lanchonete": {
    "title": "Categorias de Produtos",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "categorias-produtos-lanchonete/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "categorias-produtos-lanchonete/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "fornecedores-lanchonete": {
    "title": "Fornecedores",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "fornecedores-lanchonete/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "fornecedores-lanchonete/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "produtos-lanchonete": {
    "title": "Produtos",
    "description": "",
    "actions": [
      {
        "label": "Importação",
        "icon": "fas fa-file-import",
        "route": "produtos-lanchonete/importacao",
        "primary": false
      },
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "produtos-lanchonete/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "produtos-lanchonete/listar",
        "primary": true
      }
    ],
    "createTitle": "Cadastro de Produto",
    "createActions": [
      {
        "label": "Importação",
        "icon": "fas fa-file-import",
        "route": "produtos-lanchonete/importacao",
        "primary": false
      },
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "produtos-lanchonete/cadastrar",
        "primary": true
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "produtos-lanchonete/listar",
        "primary": false
      }
    ],
    "icon": "fas fa-cog"
  },
  "estoque-lanchonete": {
    "title": "Estoque",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "estoque-lanchonete/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "estoque-lanchonete/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "mesas-lanchonete": {
    "title": "Lista de Mesas / Comandas",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "mesas-lanchonete/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "mesas-lanchonete/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "pedidos-lanchonete": {
    "title": "Lista de Pedidos",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "pedidos-lanchonete/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "pedidos-lanchonete/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "fluxo-de-caixa": {
    "title": "Fluxo de Caixa",
    "description": "",
    "actions": [],
    "icon": "fas fa-money-bill-transfer"
  },
  "contas-bancarias": {
    "title": "Contas Bancárias",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "contas-bancarias/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "contas-bancarias/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "categorias-financeiro": {
    "title": "Categorias",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "categorias-financeiro/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "categorias-financeiro/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "contatos-financeiro": {
    "title": "Contatos",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "contatos-financeiro/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "contatos-financeiro/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "lancamentos": {
    "title": "Lançamentos",
    "description": "",
    "actions": [],
    "icon": "fas fa-book"
  },
  "cobrancas-avulso": {
    "title": "Cobranças Avulso",
    "description": "Gerencie cobranças e acompanhe pagamentos.",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "cobrancas-avulso/cadastrar",
        "primary": false
      },
      {
        "label": "Histórico",
        "icon": "fas fa-history",
        "route": "cobrancas-avulso/visualizar-historico",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "cobrancas-avulso/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "resumo-cobrancas": {
    "title": "Resumo de Cobranças",
    "description": "",
    "actions": [],
    "icon": "fas fa-coins"
  },
  "movimentacoes-financeiras": {
    "title": "Movimentações Financeiras",
    "description": "",
    "actions": [],
    "icon": "fas fa-cog"
  },
  "relatorios": {
    "title": "Gerar Relatorios",
    "description": "Visualize relatórios e indicadores.",
    "actions": [],
    "icon": "fas fa-chart-bar"
  },
  "arquivos-gerados": {
    "title": "Arquivos Gerados",
    "description": "",
    "actions": [
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "arquivos-gerados/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  },
  "usuarios": {
    "title": "Lista de Usuários",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "usuarios/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "usuarios/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-users"
  },
  "horarios": {
    "title": "Horários",
    "description": "",
    "actions": [],
    "icon": "fas fa-cog"
  },
  "preferencias": {
    "title": "Preferências",
    "description": "",
    "actions": [],
    "icon": "fas fa-cog"
  },
  "reserva-online": {
    "title": "Reserva Online",
    "description": "",
    "actions": [],
    "icon": "fas fa-cog"
  },
  "espacos-centro": {
    "title": "Espaços do Centro",
    "description": "",
    "actions": [
      {
        "label": "Cadastrar",
        "icon": "fas fa-plus-circle",
        "route": "espacos-centro/cadastrar",
        "primary": false
      },
      {
        "label": "Listar",
        "icon": "fas fa-list",
        "route": "espacos-centro/listar",
        "primary": true
      }
    ],
    "icon": "fas fa-cog"
  }
};
