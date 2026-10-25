# Lumina Sales V1.2 — Refinamento Operacional, Visual e Comercial

Sistema privado de prospecção, CRM com funil estendido, experimentação comercial, biblioteca de scripts reais e gestão financeira para a Lumina Studio.

---

### Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> As seguintes escolhas de arquitetura e operação foram validadas na Fase 1:
> - **Migração de Etapas de Leads**: Mapeamento automático dos leads cadastrados para as 14 novas etapas equivalentes do funil da Lumina Studio sem perda de histórico.
> - **Visualização do CRM Kanban**: Organização por abas de agrupamento de fases (*Prospecção*, *Apresentação*, *Referências*, *Produção*, *Pagamento*, *Pós-venda*) com opção de visualizar todas as colunas de forma fluida.
> - **Biblioteca de Criativos**: Upload direto de arquivos de imagem no navegador com persistência real em IndexedDB (base64/blob) e miniatura otimizada.

---

### 1. Visão Geral e Conceito do Produto

- **O que faz**: O Lumina Sales é o painel de comando comercial e operacional privado da Lumina Studio. Ele centraliza a prospecção ativa de clientes em nichos de alto valor, qualificação de leads, condução das 14 etapas do funil de ensaios com IA, aplicação dos roteiros e objeções documentados, galeria de criativos por nicho e gestão financeira de pacotes e despesas.
- **Público-Alvo**: Operação comercial humana interna da Lumina Studio (atendimento assistido, sem disparadores em massa ou automações não autorizadas).
- **Valor Principal**: Agilidade nas abordagens diárias, consistência na comunicação comercial, eliminação de atrito no cadastro e visão precisa da saúde financeira e da eficácia das abordagens.

---

### 2. Experiência do Usuário e Design Visual

- **Layout e Amplitude**:
  - Transição de layout excessivamente centralizado para um canvas fluido com largura útil aproveitada (até 1440px / `max-w-7xl` responsivo).
  - Títulos principais destacados (26–32px), dados numéricos em `tabular-nums` (24–34px), ícones confortáveis (18–22px) e botões de ação ergonômicos (40–44px de altura mínima).
- **Modo Claro e Modo Escuro**:
  - Tema escuro ativo por padrão (`#111827`, `#15191F`, detalhes em dourado `#C9A46B`, verde financeiro `#16A34A` e alertas em âmbar `#D97706`).
  - Alternância imediata para tema claro com classes semânticas (`bg-white dark:bg-[#111827]`, `text-slate-900 dark:text-slate-100`, bordas suaves `border-slate-200 dark:border-slate-800`).
  - Persistência imediata da preferência em armazenamento local.
- **Fluxos Operacionais Chave**:
  1. **Cadastro Rápido**: Modal com campos essenciais visíveis (Nome, Instagram/WhatsApp, Nicho, Notas) para cadastro contínuo em poucos segundos, com botão expansível "Mais detalhes" (checklist de oportunidade de bio/site, prioridade, canal).
  2. **Central de Atendimento Assistido (Prospecção)**: Seleção do contato, preenchimento dinâmico de variáveis (`{nome}`, `{nicho}`, `{seu nome} = João`), escolha de script/variante, visualização do criativo correspondente, cópia/download de imagem, abertura do WhatsApp com texto pré-formatado e confirmação manual da abordagem.
  3. **CRM Kanban com 14 Etapas**: Abas segmentadas por fase de serviço (reduzindo a sobrecarga cognitiva) com drag-and-drop e status laterais de exclusão (*Sem interesse*, *Não contatar*, *Arquivado*).
  4. **Biblioteca de Criativos**: Upload de arquivos locais com metadados (nicho, proporção 1:1, 4:5, 5:4, com/sem título), galeria responsiva e cópia de imagem para área de transferência.
  5. **Tabelas de Preços 1 e 2**: Exibição comparativa e mensagens de oferta prontas para cópia.

---

### 3. Decisões de Produto e Regras de Negócio

- **13 Nichos Oficiais da Página 22**:
  - *Empresários e empresárias*, *Corretoras de imóveis*, *Arquitetas*, *Cabeleireiras*, *Maquiadoras*, *Pedagogas*, *Psicólogas*, *Nutricionistas*, *Dentistas*, *Advocacia*, *Nail Designer*, *Massoterapeuta*, *Esteticista*.
  - Compartilhados uniformemente entre leads, scripts, criativos e relatórios.
- **Estrutura Completa de Scripts do PDF**:
  - Categorias: Primeira abordagem, Abordagem personalizada, Abordagem curta, Resposta inicial, Demonstração, Validação de interesse, Apresentação do serviço, Dúvidas e objeções, Pacotes, Catálogo, Referências, Produção, Prévia, Revisões, Pagamento, Pós-venda, Indicação, Follow-up, Remarketing.
  - Identificação de modalidade: *Texto para WhatsApp* e *Roteiro para áudio manual* (mantido em texto claro e editável, sem áudio sintetizado).
  - Variantes de abordagem: Modalidade A (saudação transparente) e Modalidade B (apresentação direta com fotos).
- **As Duas Tabelas Comerciais**:
  - Tabela 1: Experimental (R$ 29,30), Básico (R$ 69,90), Ouro (R$ 119,90), Diamante (R$ 139,90).
  - Tabela 2: Experimental (R$ 34,90), Básico + 1 brinde (R$ 69,90), Essencial + Instabio + 3 brindes (R$ 148,90), Ouro + Instabio + 5 brindes (R$ 297,90), Diamante + Instabio + 7 brindes + site (R$ 547,90).

---

### 4. Arquitetura do Sistema e Estratégia de Dados

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Lumina Sales V1.2                             │
│                  (Next.js 15 App Router - Port 3000)                   │
├────────────────────────────────────────────────────────────────────────┤
│  Top Navbar                                                            │
│  [Logo Lumina] [7 Guias: Dash, Leads, CRM, Atendimento, Lab, $, Rel]  │
│  [Timer de Foco] [Busca ⌘K] [Alternador Claro/Escuro] [Novo Lead +]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   LuminaContext       │  │             Visualizações             │  │
│  │   - State & Filters   │  │  - DashboardView (KPIs & Metas)       │  │
│  │   - IndexedDB Engine  │──▶  - LeadsView (Tabela & Ações em Massa)│  │
│  │   - Theme Controller  │  │  - CrmKanbanView (14 Etapas em Abas)  │  │
│  │   - Scripts/Creatives │  │  - ProspectingView (Atendimento)      │  │
│  │   - Timer Session     │  │  - CommercialLabView (Testes A/B)     │  │
│  │   - Duplication Guard │  │  - FinancialView (Tabelas 1 & 2)      │  │
│  └───────────────────────┘  │  - ReportsAndTasksView (Backup & Rel) │  │
│              │              └───────────────────────────────────────┘  │
│              ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Camada de Persistência                      │  │
│  │   IndexedDB (banco 'lumina_sales_db_v1')                         │  │
│  │   + LocalStorage fallback                                        │  │
│  │   + Exportação/Importação JSON de Backup completo com imagens    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Plano de Execução em Fases

1. **Fase 1: Atualização dos Modelos de Dados e Persistência (`lib/types.ts`, `lib/storage.ts`)**:
   - Adicionar as 14 novas etapas do funil com mapeamento retrocompatível.
   - Atualizar a lista oficial dos 13 nichos da página 22.
   - Modelar campos completos para criativos com suporte a imagens base64/blob em IndexedDB.
   - Modelar scripts com código identificador, modalidade (*Texto* / *Áudio transcrito*), versão e página de referência.
2. **Fase 2: Acervo Comercial Completo (`lib/seed-data.ts`)**:
   - Cadastrar todo o acervo de scripts detalhados do PDF (abordagens, variantes A/B, respostas a "Amei", "Quanto custa?", "Achei caro", fluxo de produção, follow-ups de 24h/48h/7d e remarketing).
   - Inserir as Tabelas de Preços 1 e 2 completas com seus brindes e descrições.
3. **Fase 3: Refinamento Visual e Alternância de Tema (`app/globals.css`, `components/Navbar.tsx`, `components/LuminaApp.tsx`)**:
   - Expandir a largura dos containers (`max-w-7xl` e padding equilibrado).
   - Ajustar variáveis e classes para que o modo claro tenha alto contraste e acabamento profissional sem áreas escuras indesejadas.
   - Persistir o estado do tema na raiz do documento (`html.dark` vs `html.light`).
4. **Fase 4: Cadastro Rápido e Completo de Leads (`components/LeadDrawerModal.tsx`)**:
   - Implementar visão padrão simplificada (Nome, Contato, Nicho, Notas) com botão "Adicionar outro lead".
   - Manter seção retrátil de detalhes avançados e checklist de oportunidades (bio, link, site).
5. **Fase 5: CRM Funil Renovado com 14 Etapas (`components/views/CrmKanbanView.tsx`)**:
   - Criar abas superiores por agrupamento: *Prospecção*, *Apresentação*, *Referências*, *Produção*, *Pagamento*, *Pós-venda* e *Visão Completa*.
   - Ações rápidas de mover etapa e abas de exclusão rápida (*Sem interesse*, *Não contatar*, *Arquivado*).
6. **Fase 6: Central de Atendimento e Criativos (`components/views/ProspectingView.tsx`)**:
   - Personalização de texto com `{nome}` e atendente `{seu nome} = João`.
   - Gerenciamento de criativos com upload de imagens (PNG/JPG/WEBP), visualização ampliada e cópia rápida.
   - Ações integradas de abertura no WhatsApp e registro imediato de retorno.
7. **Fase 7: Financeiro, Testes A/B e Relatórios (`components/views/FinancialView.tsx`, `components/views/CommercialLabView.tsx`)**:
   - Apresentador e comparador das Tabelas 1 e 2 de preços.
   - Análise de conversão A/B considerando volumes e taxas reais.
8. **Fase 8: Verificação e Build (`compile_applet`, `lint_applet`)**:
   - Compilação sem erros TypeScript, validação de responsividade e teste no navegador.
