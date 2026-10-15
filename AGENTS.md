# Desenvolvimento

Esta é a nova aplicação independente no repositório lmdsistemas-lmd/quadrinha. Trabalhe neste checkout (/workspace/quadrinha no ambiente atual). O REA é uma ferramenta separada em /workspace/reamy; não modifique seu código para desenvolver este sistema. Use o checkout/workspace existente; não crie Git worktrees sem pedido explícito.

Use Node 24.18.0. Não há dependências externas. Comandos: npm start; npm run check; npm test. O servidor padrão escuta em 127.0.0.1:3000 e usa data/quadrafacil.sqlite. Não apague nem substitua o banco principal para testes; use QF_DATABASE_PATH ou createApp({databasePath}) apontando para um banco temporário.

O usuário escolheu banco separado com dados de demonstração. Não migre dados, grave no sistema original nem copie credenciais para a nova aplicação. Nunca exiba ou salve valores dos segredos. Capturas originais autenticadas ficam em /workspace/scratch/quadrafacil e não devem ser incluídas em public/.

Consulte docs/ESCOPO.md para distinguir implementação local e equivalência ao original. Mantenha limitações visíveis e não simule pagamento, nota fiscal, envio de mensagens ou integração como concluídos. Preserve as regras de conflitos e atomicidade das recorrências, estoque e recebimentos sem duplicação. Execute testes relevantes após mudanças. A validação visual inicial fica em docs/ e usa apenas dados fictícios.

A criação do primeiro administrador é feita pela tela inicial, sem senha padrão. Publicação externa exige definir destino e parâmetros próprios de hospedagem; não trate um processo local como aplicação publicada.

O proprietário tem somente acesso web ao original e quer sua própria instância de testes. Continue a reconstrução independente com dados fictícios. Não bloqueie o desenvolvimento pedindo código de servidor original ou homologação do original; use a referência observável e registre diferenças e regras próprias.
