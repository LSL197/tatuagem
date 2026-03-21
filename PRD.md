# PRD — Plataforma de Gestão e Automação para Estúdio de Tatuagem

**Versão:** 1.0
**Data:** 2026-03-18
**Status:** Em planejamento

---

## 1. Visão Geral

### 1.1 Problema

Estúdios de tatuagem gerenciam a maioria dos seus processos de forma manual e fragmentada: agendamentos por WhatsApp, controle financeiro em planilhas, portfólio dos artistas espalhado no Instagram, e nenhum processo estruturado para qualificar clientes que não sabem o que querem tatuar.

### 1.2 Solução

Uma aplicação web dedicada ao estúdio que unifica em um único produto:
- **Gestão operacional:** agendamentos, tatuadores, financeiro
- **Portal público mobile-first:** link na bio → cliente agenda sem fricção
- **Automação de redes sociais:** fluxos automáticos no Instagram e WhatsApp
- **Agente de IA:** consultor que ajuda clientes indecisos a construir uma ideia de tatuagem

### 1.3 Objetivos de Negócio

- Reduzir tempo gasto em atendimento manual no Instagram/WhatsApp
- Aumentar taxa de conversão de seguidores em clientes agendados
- Centralizar informações financeiras e de agenda em um painel único
- Melhorar comunicação artista↔cliente antes da sessão via brief de IA

### 1.4 Fora de Escopo (v1)

- Pagamento online integrado (cliente paga na sessão)
- App nativo iOS/Android (web responsiva substitui no MVP)
- Multi-estúdio / SaaS para terceiros

---

## 2. Usuários e Personas

### 2.1 Admin (Dono / Gerente)

**Quem é:** responsável pelo estúdio, cuida do financeiro, contrata tatuadores e define operação.
**Necessidades:** visão completa da agenda, faturamento, comissões, leads gerados. Quer personalizar como o estúdio aparece para o público.
**Acesso:** total — financeiro, agenda de todos, usuários, automações, configurações, métricas.

### 2.2 Artist (Tatuador / Profissional)

**Quem é:** tatuador com sua própria base de seguidores no Instagram.
**Necessidades:** gerenciar sua agenda, mostrar portfólio de forma atraente, receber informações detalhadas sobre o que o cliente quer antes da sessão.
**Acesso:** própria agenda, edição do próprio perfil público, visualização de comissões.

### 2.3 Receptionist (Atendente)

**Quem é:** funcionário que gerencia agendamentos presencialmente ou por telefone.
**Necessidades:** criar e editar agendamentos para qualquer tatuador, ver disponibilidade geral.
**Acesso:** agenda de todos, criar/editar agendamentos. Sem acesso financeiro.

### 2.4 Client (Cliente Final)

**Quem é:** seguidor no Instagram ou cliente indicado que quer agendar uma sessão.
**Necessidades:** ver o trabalho dos tatuadores, agendar de forma rápida pelo celular, receber confirmação.
**Acesso:** cadastro com nome + WhatsApp, histórico de seus agendamentos.

---

## 3. Funcionalidades

### 3.1 Portal Público (mobile-first) — `/book`

**Prioridade:** Alta

Acessado via link na bio do Instagram do estúdio. Otimizado para mobile. Fluxo do cliente:

1. Entra no link → vê home com logo do estúdio e lista de tatuadores
2. Clica em um tatuador → vê perfil completo customizado
3. Clica em "Agendar" → escolhe serviço → seleciona data e horário disponível
4. Preenche nome + WhatsApp (lead coletado automaticamente)
5. Recebe confirmação na tela + notificação via WhatsApp

**Telas:**
- `/book` — lista de tatuadores (cards: foto, nome, estilos)
- `/book/[slug]` — perfil público do tatuador (banner, portfólio, redes sociais, botão agendar)
- `/book/[slug]/schedule` — calendário de disponibilidade + formulário de dados

---

### 3.2 Perfis de Tatuadores (Customizáveis)

**Prioridade:** Alta

Cada tatuador pode editar seu perfil com total liberdade visual via editor com preview ao vivo.

**Dados do perfil:**
- Foto/vídeo de banner (upload via Cloudinary)
- Bio e especialidades/estilos (badges selecionáveis)
- Galeria de portfólio com categorias, reordenável via drag-and-drop
- Links de redes sociais (Instagram, TikTok, Pinterest, etc.)

**Customização visual:**
- Paleta de cores: cor primária, secundária e de destaque
- Fonte (escolha entre 8 opções pré-selecionadas)
- Efeitos visuais: glass morphism, gradiente, grain texture, neon glow, fade-in
- Fundo: imagem ou vídeo com overlay

**Implementação:** tema salvo como JSON no banco → CSS Custom Properties injetadas dinamicamente no carregamento do perfil.

---

### 3.3 Agendamentos

**Prioridade:** Alta

**Para o cliente (público):**
- Ver disponibilidade por tatuador (calendário com slots livres)
- Agendar sem conta, usando apenas nome + WhatsApp
- Receber confirmação via WhatsApp automático

**Para o admin/recepcionista (dashboard):**
- Visão de agenda geral (calendário semanal/mensal com todos os tatuadores)
- Criar, editar, confirmar, cancelar agendamentos
- Filtrar por tatuador

**Para o artista (dashboard):**
- Visão da própria agenda
- Configurar disponibilidade semanal (dias e horários por dia)
- Receber notificação de novo agendamento

**Status de agendamento:** `pendente` → `confirmado` → `concluído` → `cancelado`

---

### 3.4 Financeiro e Comissões

**Prioridade:** Alta — acesso exclusivo do admin

- Registrar valor cobrado ao encerrar cada sessão
- Cálculo automático de comissão do tatuador (% configurado no perfil)
- Registro de despesas do estúdio (materiais, aluguel, etc.)
- Relatório mensal: receita bruta, comissões pagas, despesas, lucro líquido
- Visão individual por tatuador: sessões realizadas e comissão a receber

---

### 3.5 Dashboard de Métricas

**Prioridade:** Alta — acesso exclusivo do admin

Filtro de período global: `Hoje | Semana | Mês | Trimestre | Personalizado`

**KPI Cards (topo):**

| Métrica | Descrição |
|---|---|
| Total de Leads | Leads capturados no período |
| Agendamentos | Sessões confirmadas |
| Ticket Médio | Valor médio por sessão |
| Fluxos Disparados | Automações executadas |

**Gráficos:**
- **Linha** — crescimento de leads por canal ao longo do tempo (Instagram / WhatsApp / Link Bio)
- **Barras** — faturamento por semana/mês com linha de lucro líquido sobreposta
- **Donut** — distribuição de origem dos leads por canal
- **Heatmap** — dias da semana × horários com intensidade de agendamentos

**Ranking:** top tatuadores por faturamento, sessões e ticket médio no período.

---

### 3.6 Automação Instagram/WhatsApp (Flow Builder)

**Prioridade:** Média

**Gatilhos disponíveis:**
- Palavra-chave recebida no Instagram DM
- Palavra-chave recebida no WhatsApp

**Editor visual (React Flow) com nós:**

| Nó | Função |
|---|---|
| `TriggerNode` | Define o gatilho do fluxo |
| `MessageNode` | Envia texto, imagem ou opções de resposta |
| `ConditionNode` | Ramifica o fluxo com base em resposta do usuário |
| `DelayNode` | Aguarda X minutos/horas antes do próximo passo |
| `ActionNode` | Salva lead, cria agendamento, envia notificação |
| `AIAgentNode` | Aciona o agente de IA (qualificação ou consultor de ideias) |

Toggle para editor JSON para quem prefere escrever o fluxo manualmente.

---

### 3.7 Módulo de IA

**Prioridade:** Média

**Agente Consultor de Ideias (canal interno, acionado via brief no agendamento):**

Fluxo da conversa:
1. Pergunta sobre estilo preferido (mostra exemplos: blackwork, realismo, aquarela...)
2. Pergunta sobre tema/inspiração
3. Pergunta sobre local no corpo e tamanho estimado
4. Solicita referências (links ou upload de imagens)
5. IA mostra exemplos de cada estilo

Ao finalizar, gera brief estruturado:
```json
{
  "estilo": "blackwork geométrico",
  "tema": "mandala com elementos da natureza",
  "local": "antebraço, ~15cm",
  "tamanho": "médio",
  "referencias": ["url1", "url2"],
  "observacoes": "cliente já tem sleeve no braço esquerdo"
}
```

Brief salvo no agendamento → tatuador recebe notificação antes da sessão.

**Agente de Qualificação (redes sociais):**
- Responde perguntas sobre o estúdio e os artistas
- Apresenta tatuadores por estilo de interesse
- Direciona lead qualificado para `/book`

**Provedor de IA — Configurável pelo Admin:**
- Padrão: Claude (Anthropic)
- Disponível: OpenAI (GPT-4o), Groq (Llama)
- Admin configura provedor + API key nas configurações
- Abstração via interface `AIProvider` no backend — troca de modelo sem mudar código

---

### 3.8 CRM de Leads

**Prioridade:** Média

- Todo cadastro de cliente vira um lead automaticamente
- Tags customizáveis (ex: "interesse realismo", "retorno")
- Histórico de interações (mensagens via automação, agendamentos)
- Origem do lead registrada (Instagram, WhatsApp, link bio)
- Exportação CSV

---

## 4. Requisitos Não-Funcionais

| Requisito | Detalhe |
|---|---|
| Performance mobile | Portal `/book` deve carregar em < 2s em 4G |
| Disponibilidade | Mínimo 99% uptime (Railway/Render com auto-restart) |
| Escalabilidade | Celery + Redis para processar fluxos assincronamente sem travar o app |
| Segurança | JWT com expiração + refresh token; API keys de IA criptografadas no banco |
| SEO | Perfis públicos com meta tags OG para compartilhamento no Instagram |

---

## 5. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilização | Tailwind CSS + shadcn/ui + CSS Variables (theming dinâmico) |
| Gráficos | Recharts |
| Flow Builder | React Flow |
| Backend | FastAPI (Python) |
| Banco de dados | PostgreSQL |
| Cache / Filas | Redis + Celery |
| Upload de Mídia | Cloudinary |
| Auth | JWT (python-jose) + OAuth Instagram |
| IA | Anthropic SDK / OpenAI SDK / Groq SDK |
| Infra local | Docker Compose |
| Infra produção | Railway ou Render |

---

## 6. Modelo de Dados — Tabelas Principais

```
users              — id, name, email, password_hash, role, slug, theme_json, commission_pct, created_at
appointments       — id, artist_id, client_id, service, datetime, status, price, notes
financial_records  — id, appointment_id, type (income|expense|commission), amount, date
leads              — id, name, phone, source, tags[], appointment_id, created_at
ai_conversations   — id, lead_id, channel, messages (JSONB[]), brief (JSONB), status
appointment_briefs — id, appointment_id, ai_conversation_id, brief (JSONB), viewed_by_artist
automations        — id, name, trigger_type, trigger_config (JSONB), flow_json, active
studio_settings    — id, name, logo_url, theme (JSONB), ai_provider, ai_api_key
instagram_accounts — id, ig_user_id, access_token, connected_at
whatsapp_accounts  — id, phone_number, waba_id, access_token
```

---

## 7. Controle de Acesso (RBAC)

| Funcionalidade | admin | artist | receptionist | client |
|---|:---:|:---:|:---:|:---:|
| Dashboard de métricas | ✅ | ❌ | ❌ | ❌ |
| Financeiro / Comissões | ✅ | ❌ | ❌ | ❌ |
| Agenda de todos | ✅ | ❌ | ✅ | ❌ |
| Própria agenda | ✅ | ✅ | ✅ | ❌ |
| Gerenciar tatuadores | ✅ | ❌ | ❌ | ❌ |
| Editar próprio perfil | ✅ | ✅ | ❌ | ❌ |
| Ver próprias comissões | ✅ | ✅ | ❌ | ❌ |
| Automações / Flow Builder | ✅ | ❌ | ❌ | ❌ |
| CRM de leads | ✅ | ❌ | ❌ | ❌ |
| Configurações do sistema | ✅ | ❌ | ❌ | ❌ |
| Agendar sessão | ✅ | ✅ | ✅ | ✅ |
| Ver histórico próprio | ✅ | ✅ | ✅ | ✅ |

**Implementação:** `role` na tabela `users` → JWT inclui role → `require_role()` decorator no FastAPI → sidebar/rotas condicionais no Next.js.

---

## 8. Roadmap de Implementação

### Fase 1 — Fundação (semana 1)

- Setup do repositório monorepo (backend + frontend)
- Docker Compose: PostgreSQL + Redis + FastAPI + Next.js
- Autenticação: registro, login, JWT, refresh token
- CRUD de usuários com roles (admin, artist, receptionist, client)
- Estrutura base do dashboard (sidebar com rotas por role)

### Fase 2 — Perfis e Portal Público (semana 2)

- Editor de perfil do tatuador: cores, fontes, banner, efeitos, portfólio
- Upload de imagens/vídeos via Cloudinary
- Portal público `/book` e `/book/[slug]` com tema aplicado dinamicamente

### Fase 3 — Agendamento (semana 3)

- Configuração de disponibilidade por artista
- Fluxo de agendamento mobile (`/book/[slug]/schedule`)
- Cadastro simplificado: nome + WhatsApp → lead criado automaticamente
- Notificação WhatsApp de confirmação
- Painel de agenda (calendário) para admin, receptionist e artist

### Fase 4 — Financeiro + Métricas (semana 4)

- Registrar sessões com valor e comissão
- Relatório mensal e visão de comissões
- Endpoints `/api/v1/metrics/*` com filtro de período
- Dashboard de métricas no frontend: KPI cards, 4 gráficos (Recharts), ranking

### Fase 5 — Automação Instagram/WhatsApp (semanas 5-6)

- OAuth Instagram + webhook receiver (Meta Graph API)
- Flow Engine via Celery (executor de fluxos JSON)
- Flow Builder visual (React Flow) + editor JSON + `AIAgentNode`
- Integração WhatsApp Business API: envio de mensagens e templates

### Fase 6 — Módulo de IA (semanas 7-8)

- Abstração `AIProvider` (Anthropic / OpenAI / Groq)
- Configuração de provedor e API key no painel admin
- Agente consultor de ideias (prompt engineering + fluxo de perguntas)
- Geração automática de brief estruturado ao final da conversa
- Notificação para tatuador com brief antes da sessão
- Agente de qualificação de leads no Instagram DM e WhatsApp
- Histórico de conversas no CRM

---

## 9. Dependências Externas

| Serviço | Uso | Onde configurar |
|---|---|---|
| Cloudinary | Upload de fotos e vídeos | cloudinary.com |
| Anthropic API | Agente de IA (padrão) | console.anthropic.com |
| OpenAI API | Agente de IA (opcional) | platform.openai.com |
| Groq API | Agente de IA (opcional, mais rápido) | console.groq.com |
| Meta Graph API | Instagram OAuth + DM webhook | developers.facebook.com |
| WhatsApp Business API | Envio de mensagens e templates | developers.facebook.com |
| Redis | Filas Celery | Docker local / Railway Redis |

---

## 10. Critérios de Aceitação (MVP)

- Cliente acessa pelo celular, escolhe tatuador, agenda e recebe confirmação no WhatsApp
- Lead é criado automaticamente com nome + WhatsApp ao agendar
- Admin vê métricas de leads, faturamento e agendamentos com filtro de período
- Fluxo de auto-reply no Instagram funciona após configurar palavra-chave no Flow Builder
- Agente de IA consegue conduzir entrevista completa e gerar brief para o tatuador
