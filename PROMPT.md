# Ralph Loop — Plataforma de Gestão para Estúdio de Tatuagem

## Instruções do Loop

Você é responsável por implementar, fase por fase, a plataforma descrita abaixo.
A cada iteração você deve:
1. Ler este arquivo completamente
2. Verificar o que já existe (`ls`, `git log`, leitura de arquivos)
3. Identificar a próxima tarefa não concluída
4. Implementar — arquivos reais, código funcional, sem placeholders
5. Fazer commit com mensagem descritiva
6. Quando TODAS as fases estiverem concluídas, outputar exatamente: `<promise>PROJETO COMPLETO</promise>`

Nunca pule fases. Nunca sobrescreva código que já funciona. Nunca crie arquivos vazios ou com `# TODO`.

---

## Visão Geral do Projeto

Plataforma web para estúdio de tatuagem com:
- **Portal público mobile-first** (`/book`) para clientes agendarem via link na bio
- **Dashboard admin** com agenda, financeiro e métricas
- **Perfis customizáveis** de tatuadores com temas visuais dinâmicos
- **Automação** via Flow Builder (React Flow) + Celery
- **Agente de IA** consultor de ideias + qualificação de leads
- **CRM de leads** com histórico de interações

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilização | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Flow Builder | React Flow |
| Backend | FastAPI (Python 3.11) |
| Banco de dados | PostgreSQL 15 |
| ORM | SQLAlchemy 2.0 + Alembic |
| Cache / Filas | Redis + Celery |
| Upload de Mídia | Cloudinary |
| Auth | JWT (python-jose) + bcrypt |
| IA | Anthropic SDK (padrão) / OpenAI / Groq |
| Infra | Docker Compose (dev) |

---

## Estrutura de Diretórios (alvo final)

```
tatuagem/
├── docker-compose.yml
├── .env.example
├── PROMPT.md
├── PRD.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── appointment.py
│   │   │   ├── financial.py
│   │   │   ├── lead.py
│   │   │   ├── automation.py
│   │   │   └── ai_conversation.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── appointment.py
│   │   │   ├── financial.py
│   │   │   ├── lead.py
│   │   │   └── metrics.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── appointments.py
│   │   │   ├── financial.py
│   │   │   ├── leads.py
│   │   │   ├── metrics.py
│   │   │   ├── automations.py
│   │   │   └── ai.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── cloudinary.py
│   │   │   ├── whatsapp.py
│   │   │   └── ai_provider.py
│   │   ├── workers/
│   │   │   ├── __init__.py
│   │   │   ├── celery_app.py
│   │   │   └── flow_engine.py
│   │   └── middleware/
│   │       └── rbac.py
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── components.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── agenda/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── financeiro/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── tatuadores/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── leads/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── automacoes/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── configuracoes/
│   │   │   │       └── page.tsx
│   │   │   └── book/
│   │   │       ├── page.tsx
│   │   │       ├── [slug]/
│   │   │       │   ├── page.tsx
│   │   │       │   └── schedule/
│   │   │       │       └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/          (shadcn components)
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── LeadsChart.tsx
│   │   │   │   ├── RevenueChart.tsx
│   │   │   │   ├── SourceDonut.tsx
│   │   │   │   └── BookingHeatmap.tsx
│   │   │   ├── agenda/
│   │   │   │   ├── CalendarView.tsx
│   │   │   │   └── AppointmentModal.tsx
│   │   │   ├── book/
│   │   │   │   ├── ArtistCard.tsx
│   │   │   │   ├── ArtistProfile.tsx
│   │   │   │   └── ScheduleForm.tsx
│   │   │   └── flow-builder/
│   │   │       ├── FlowCanvas.tsx
│   │   │       └── nodes/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts
```

---

## Fases de Implementação

### ✅ Como verificar progresso

Antes de implementar qualquer coisa, execute:
```bash
git log --oneline
ls backend/app/routers/ 2>/dev/null
ls frontend/src/app/ 2>/dev/null
```

Use o git log para saber o que já foi feito. Use `ls` para checar quais arquivos existem.
Implemente apenas o que ainda não existe.

---

### FASE 1 — Infraestrutura e Auth

**Arquivos de controle:** `docker-compose.yml`, `backend/app/routers/auth.py`, `frontend/src/app/page.tsx`

**Tarefas (nesta ordem):**

1. **`docker-compose.yml`** na raiz com serviços:
   - `db`: postgres:15, porta 5432, volume `pgdata`
   - `redis`: redis:7-alpine, porta 6379
   - `backend`: build `./backend`, porta 8000, depends_on db+redis, env_file .env
   - `frontend`: build `./frontend`, porta 3000, depends_on backend
   - `celery`: mesmo build do backend, command `celery -A app.workers.celery_app worker`

2. **`.env.example`** na raiz:
   ```
   DATABASE_URL=postgresql://postgres:postgres@db:5432/tatuagem
   REDIS_URL=redis://redis:6379/0
   SECRET_KEY=change-me-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   REFRESH_TOKEN_EXPIRE_DAYS=30
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ANTHROPIC_API_KEY=
   OPENAI_API_KEY=
   GROQ_API_KEY=
   WHATSAPP_TOKEN=
   WHATSAPP_PHONE_ID=
   META_VERIFY_TOKEN=
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **`backend/requirements.txt`**:
   ```
   fastapi==0.111.0
   uvicorn[standard]==0.29.0
   sqlalchemy==2.0.30
   alembic==1.13.1
   psycopg2-binary==2.9.9
   python-jose[cryptography]==3.3.0
   passlib[bcrypt]==1.7.4
   python-multipart==0.0.9
   pydantic-settings==2.2.1
   celery==5.3.6
   redis==5.0.4
   cloudinary==1.40.0
   anthropic==0.25.0
   openai==1.30.0
   httpx==0.27.0
   python-dotenv==1.0.1
   ```

4. **`backend/Dockerfile`**: Python 3.11-slim, instala requirements, CMD uvicorn

5. **`backend/app/config.py`**: `Settings` com pydantic-settings lendo `.env`

6. **`backend/app/database.py`**: engine SQLAlchemy + SessionLocal + `get_db` dependency

7. **`backend/app/models/user.py`**: Model `User` com campos:
   - `id` (UUID), `email`, `password_hash`, `name`, `role` (enum: admin/artist/receptionist/client)
   - `slug` (único, para URL pública), `commission_pct` (float, default 0.5)
   - `theme_json` (JSON), `bio`, `styles` (ARRAY), `avatar_url`, `banner_url`
   - `social_links` (JSON), `is_active`, `created_at`

8. **`backend/app/schemas/user.py`**: Pydantic schemas: `UserCreate`, `UserOut`, `UserUpdate`, `Token`, `TokenData`

9. **`backend/app/services/auth.py`**: funções `hash_password`, `verify_password`, `create_access_token`, `create_refresh_token`, `decode_token`

10. **`backend/app/middleware/rbac.py`**: dependency `get_current_user` + `require_role(*roles)` factory

11. **`backend/app/routers/auth.py`**: endpoints:
    - `POST /api/v1/auth/register` — cria user (role=client por padrão)
    - `POST /api/v1/auth/login` — retorna access + refresh token
    - `POST /api/v1/auth/refresh` — renova access token
    - `GET /api/v1/auth/me` — retorna user autenticado

12. **`backend/app/routers/users.py`**: endpoints:
    - `GET /api/v1/users/` — lista users (admin only)
    - `GET /api/v1/users/{id}` — detalhe
    - `PUT /api/v1/users/{id}` — editar (admin ou próprio user)
    - `DELETE /api/v1/users/{id}` — desativar (admin only)
    - `GET /api/v1/artists/` — lista tatuadores públicos (sem auth)
    - `GET /api/v1/artists/{slug}` — perfil público (sem auth)

13. **`backend/app/main.py`**: FastAPI app com CORS, inclui routers auth + users, lifespan cria tabelas

14. **Alembic**: `alembic init alembic` + `alembic.ini` apontando para DATABASE_URL + primeira migration com tabela users

15. **Frontend `package.json`**: Next.js 14, TypeScript, Tailwind, shadcn/ui, axios, react-hook-form, zod, zustand, recharts, @xyflow/react, react-big-calendar, date-fns

16. **`frontend/src/app/page.tsx`**: redirect para `/book` se não autenticado, ou `/dashboard` se autenticado

17. **`frontend/src/app/(auth)/login/page.tsx`**: formulário login com react-hook-form + zod, chama `/api/v1/auth/login`, salva token no localStorage, redireciona para `/dashboard`

18. **`frontend/src/lib/api.ts`**: axios instance com baseURL `NEXT_PUBLIC_API_URL`, interceptor adiciona Bearer token, interceptor de resposta renova token no 401

**Commit da fase:** `feat: fase 1 - infraestrutura, auth e RBAC`

---

### FASE 2 — Perfis de Tatuadores e Portal Público

**Arquivos de controle:** `frontend/src/app/book/page.tsx`, `frontend/src/app/book/[slug]/page.tsx`

**Tarefas:**

1. **`backend/app/models/`** — adicionar ao modelo User:
   - Relação com `portfolio_items` (tabela separada: id, user_id, image_url, category, order_index, created_at)

2. **`backend/app/routers/users.py`** — adicionar endpoints:
   - `POST /api/v1/artists/{id}/portfolio` — upload item (Cloudinary)
   - `DELETE /api/v1/artists/{id}/portfolio/{item_id}`
   - `PUT /api/v1/artists/{id}/portfolio/reorder` — body: `[{id, order_index}]`
   - `PUT /api/v1/artists/{id}/theme` — salva theme_json completo
   - `POST /api/v1/upload/image` — upload genérico para Cloudinary

3. **`backend/app/services/cloudinary.py`**: funções `upload_image(file)` e `delete_image(public_id)`

4. **`frontend/src/app/book/page.tsx`**: página pública listando todos os artists ativos
   - Cards com: avatar, nome, estilos (badges), botão "Ver Perfil"
   - Header com logo do estúdio
   - Totalmente responsivo (mobile-first)

5. **`frontend/src/app/book/[slug]/page.tsx`**: perfil público do tatuador
   - Banner (imagem/vídeo com overlay)
   - Bio, estilos, redes sociais
   - Galeria de portfólio com categorias filtrável
   - Botão "Agendar" fixo no mobile
   - Tema dinâmico: lê `theme_json` e injeta CSS custom properties no `<style>` da página

6. **`frontend/src/app/(dashboard)/tatuadores/page.tsx`**: lista de artists no dashboard (admin only)
   - Tabela com nome, email, comissão, status
   - Botão criar novo tatuador (modal com formulário)

7. **`frontend/src/app/(dashboard)/tatuadores/[id]/page.tsx`**: editor de perfil do tatuador
   - Painel esquerdo: formulário (bio, estilos, links sociais, comissão%)
   - Painel direito: preview ao vivo do perfil público
   - Seção de tema: seletor de cores (primária/secundária/destaque), seletor de fonte (8 opções), toggles de efeitos (glass morphism, gradiente, grain, neon, fade-in)
   - Upload de portfólio com drag-and-drop para reordenar

8. **`frontend/src/components/layout/Sidebar.tsx`**: sidebar do dashboard
   - Itens visíveis por role (admin vê tudo, artist vê só agenda+perfil+comissões, receptionist vê agenda)
   - Lê role do JWT decodificado

**Commit da fase:** `feat: fase 2 - perfis customizáveis e portal público /book`

---

### FASE 3 — Agendamentos

**Arquivos de controle:** `backend/app/routers/appointments.py`, `frontend/src/app/book/[slug]/schedule/page.tsx`

**Tarefas:**

1. **`backend/app/models/appointment.py`**:
   ```
   Appointment: id (UUID), artist_id, client_name, client_phone, service,
   datetime, duration_minutes, status (pending/confirmed/completed/cancelled),
   notes, price, created_at

   Availability: id, artist_id, day_of_week (0-6), start_time, end_time, slot_duration_minutes
   ```

2. **`backend/app/models/lead.py`**:
   ```
   Lead: id, name, phone, email, source (instagram/whatsapp/link_bio/manual),
   tags (ARRAY), appointment_id (FK nullable), created_at, updated_at
   ```

3. **Migration Alembic** para as novas tabelas

4. **`backend/app/routers/appointments.py`**:
   - `GET /api/v1/appointments/` — lista (admin/receptionist: todos; artist: próprios)
   - `POST /api/v1/appointments/` — criar (autenticados ou público com nome+phone)
   - `GET /api/v1/appointments/{id}` — detalhe
   - `PUT /api/v1/appointments/{id}` — editar (status, notas, preço)
   - `DELETE /api/v1/appointments/{id}` — cancelar
   - `GET /api/v1/appointments/availability/{artist_id}?date=YYYY-MM` — slots disponíveis
   - `PUT /api/v1/artists/{id}/availability` — configurar disponibilidade semanal

5. **`backend/app/routers/leads.py`**:
   - `GET /api/v1/leads/` — lista (admin only), filtros: source, tag, período
   - `POST /api/v1/leads/` — criar (interno)
   - `PUT /api/v1/leads/{id}` — editar tags, notas
   - `GET /api/v1/leads/{id}` — detalhe com histórico

6. **`backend/app/services/whatsapp.py`**: função `send_message(phone, text)` via WhatsApp Business API (httpx POST para graph.facebook.com)
   - Ao criar agendamento: dispara mensagem de confirmação automática

7. **`frontend/src/app/book/[slug]/schedule/page.tsx`**: fluxo público de agendamento
   - Passo 1: lista de serviços disponíveis
   - Passo 2: calendário mensal mostrando dias disponíveis, ao clicar exibe slots de horário
   - Passo 3: formulário com nome + WhatsApp (obrigatórios) + notas opcionais
   - Passo 4: tela de confirmação com resumo + aviso "você receberá confirmação no WhatsApp"
   - Sem necessidade de conta/login

8. **`frontend/src/app/(dashboard)/agenda/page.tsx`**: painel de agenda
   - Calendário semanal/mensal usando `react-big-calendar`
   - Cores por status (pendente=amarelo, confirmado=verde, cancelado=vermelho)
   - Filtro por tatuador (dropdown)
   - Ao clicar num agendamento: modal com detalhes + botões de ação (confirmar, cancelar, concluir)
   - Botão "Novo Agendamento" → modal com formulário completo

9. **`frontend/src/components/agenda/AppointmentModal.tsx`**: modal de detalhes do agendamento
   - Editar status, preço, notas
   - Exibir nome/phone do cliente

**Commit da fase:** `feat: fase 3 - agendamentos, disponibilidade e agenda visual`

---

### FASE 4 — Financeiro e Métricas

**Arquivos de controle:** `backend/app/routers/financial.py`, `frontend/src/app/(dashboard)/dashboard/page.tsx`

**Tarefas:**

1. **`backend/app/models/financial.py`**:
   ```
   FinancialRecord: id, appointment_id (FK nullable), type (income/expense/commission),
   amount, description, date, artist_id (FK nullable), created_at
   ```

2. **Migration Alembic** para FinancialRecord

3. **`backend/app/routers/financial.py`** (admin only):
   - `GET /api/v1/financial/` — lista registros com filtros (tipo, período, artist_id)
   - `POST /api/v1/financial/` — criar registro de despesa manual
   - `PUT /api/v1/financial/{id}` — editar
   - `GET /api/v1/financial/report?period=month&date=2026-03` — relatório mensal:
     ```json
     {
       "revenue": 0, "commissions": 0, "expenses": 0, "profit": 0,
       "by_artist": [{"artist_id": "", "name": "", "sessions": 0, "revenue": 0, "commission": 0}]
     }
     ```
   - Ao marcar appointment como `completed` (via PUT /appointments/{id}): auto-criar FinancialRecord type=income e type=commission

4. **`backend/app/routers/metrics.py`** (admin only):
   - `GET /api/v1/metrics/kpis?period=week` → `{leads, appointments, avg_ticket, flows_triggered}`
   - `GET /api/v1/metrics/leads-over-time?period=month` → série temporal por canal
   - `GET /api/v1/metrics/revenue?period=month` → faturamento por semana com lucro líquido
   - `GET /api/v1/metrics/leads-by-source` → contagem por canal (para donut)
   - `GET /api/v1/metrics/booking-heatmap` → matriz dia_semana × hora com contagem
   - `GET /api/v1/metrics/top-artists?period=month` → ranking por faturamento

5. **`frontend/src/app/(dashboard)/dashboard/page.tsx`**: dashboard de métricas (admin only)
   - Seletor de período: Hoje / Semana / Mês / Trimestre / Personalizado (date picker)
   - 4 KPI Cards: Total Leads, Agendamentos, Ticket Médio, Fluxos Disparados
   - Gráfico de linha: Leads por canal ao longo do tempo
   - Gráfico de barras: Faturamento semanal + linha de lucro líquido
   - Gráfico donut: Origem dos leads
   - Heatmap: dias da semana × horários (usando CSS grid ou Recharts ScatterChart)
   - Tabela ranking: top tatuadores por faturamento

6. **`frontend/src/app/(dashboard)/financeiro/page.tsx`** (admin only):
   - Filtro de período + filtro por tatuador
   - Cards: receita bruta, comissões, despesas, lucro
   - Tabela de registros com paginação
   - Botão "Registrar Despesa" (modal)
   - Visão por tatuador: accordion com sessões + comissão a receber

**Commit da fase:** `feat: fase 4 - financeiro, comissões e dashboard de métricas`

---

### FASE 5 — Automação e Flow Builder

**Arquivos de controle:** `backend/app/workers/flow_engine.py`, `frontend/src/app/(dashboard)/automacoes/page.tsx`

**Tarefas:**

1. **`backend/app/models/automation.py`**:
   ```
   Automation: id, name, trigger_type (keyword_instagram/keyword_whatsapp),
   trigger_config (JSON: {keyword, channel}), flow_json (JSON), active, created_at

   FlowExecution: id, automation_id, triggered_by, started_at, status, logs (JSON[])
   ```

2. **Migration Alembic**

3. **`backend/app/workers/celery_app.py`**: configuração Celery com Redis broker

4. **`backend/app/workers/flow_engine.py`**: executor de fluxos JSON
   - Função `execute_flow(flow_json, context)` — processa nós em sequência
   - Suporte a nós: `TriggerNode`, `MessageNode`, `ConditionNode`, `DelayNode`, `ActionNode`, `AIAgentNode`
   - Task Celery `run_flow.delay(automation_id, context)`

5. **`backend/app/routers/automations.py`**:
   - `GET /api/v1/automations/` — lista (admin only)
   - `POST /api/v1/automations/` — criar
   - `PUT /api/v1/automations/{id}` — editar (incluindo flow_json)
   - `DELETE /api/v1/automations/{id}`
   - `POST /api/v1/automations/{id}/toggle` — ativar/desativar
   - `POST /api/v1/webhooks/whatsapp` — recebe webhook Meta, dispara flow_engine
   - `GET /api/v1/webhooks/whatsapp` — verificação do webhook (challenge)

6. **`frontend/src/app/(dashboard)/automacoes/page.tsx`**:
   - Lista de automações com status (ativo/inativo), tipo de gatilho, última execução
   - Botão "Nova Automação" → abre Flow Builder em modal fullscreen

7. **`frontend/src/components/flow-builder/FlowCanvas.tsx`**: editor visual com React Flow
   - Nós disponíveis no painel lateral: TriggerNode, MessageNode, ConditionNode, DelayNode, ActionNode, AIAgentNode
   - Cada nó tem painel de configuração ao clicar
   - Toggle para modo JSON (textarea com o flow_json bruto)
   - Botão Salvar → PUT /api/v1/automations/{id}

8. **`frontend/src/components/flow-builder/nodes/`**: componentes para cada tipo de nó
   - Visual distinto por tipo (cores, ícones)
   - Handles de entrada/saída para conexões

**Commit da fase:** `feat: fase 5 - flow builder e automação WhatsApp`

---

### FASE 6 — Módulo de IA

**Arquivos de controle:** `backend/app/services/ai_provider.py`, `backend/app/routers/ai.py`

**Tarefas:**

1. **`backend/app/models/ai_conversation.py`**:
   ```
   AIConversation: id, lead_id, channel (instagram/whatsapp/web),
   messages (JSON[]), brief (JSON nullable), status (active/completed/abandoned), created_at

   AppointmentBrief: id, appointment_id, ai_conversation_id, brief (JSON), viewed_by_artist (bool)
   ```

2. **Migration Alembic**

3. **`backend/app/services/ai_provider.py`**: abstração de provedores de IA
   - Classe base `AIProvider` com método `chat(messages, system_prompt) -> str`
   - `AnthropicProvider`: usa `anthropic` SDK, modelo `claude-3-5-haiku-20241022`
   - `OpenAIProvider`: usa `openai` SDK, modelo `gpt-4o-mini`
   - `GroqProvider`: usa openai SDK com base_url groq, modelo `llama3-70b-8192`
   - Factory `get_ai_provider(provider_name, api_key) -> AIProvider`

4. **`backend/app/routers/ai.py`**:
   - `POST /api/v1/ai/conversations/` — inicia conversa de qualificação/consultoria
   - `POST /api/v1/ai/conversations/{id}/message` — envia mensagem, recebe resposta da IA
   - `GET /api/v1/ai/conversations/{id}` — histórico da conversa
   - `POST /api/v1/ai/conversations/{id}/generate-brief` — força geração do brief estruturado
   - `GET /api/v1/appointments/{id}/brief` — retorna brief do agendamento

5. **System prompts** em `backend/app/services/prompts.py`:
   - `CONSULTANT_PROMPT`: guia a IA para perguntar sobre estilo, tema, local, tamanho, referências e gerar brief JSON ao final
   - `QUALIFICATION_PROMPT`: IA responde perguntas sobre o estúdio, apresenta artistas por estilo, direciona para /book

6. **`backend/app/models/studio_settings.py`**:
   ```
   StudioSettings: id, name, logo_url, theme (JSON),
   ai_provider (anthropic/openai/groq), ai_api_key (criptografado), updated_at
   ```

7. **`backend/app/routers/`** — adicionar em users.py:
   - `GET /api/v1/settings/` — retorna config do estúdio (admin only)
   - `PUT /api/v1/settings/` — atualiza (nome, logo, ai_provider, ai_api_key)

8. **`frontend/src/app/(dashboard)/configuracoes/page.tsx`** (admin only):
   - Seção "Estúdio": nome, upload de logo
   - Seção "Provedor de IA": dropdown (Claude / GPT-4o / Groq), campo API key (masked), botão testar conexão
   - Botão salvar

9. **`frontend/src/app/(dashboard)/leads/page.tsx`**:
   - Tabela de leads: nome, telefone, origem (badge colorido), tags, data
   - Filtros: origem, tag, período
   - Ao clicar: drawer lateral com histórico de interações + conversas de IA + agendamentos vinculados
   - Botão "Exportar CSV"

10. **Integrar AIAgentNode no flow_engine**: quando o nó é do tipo `AIAgentNode`, inicia conversa via `ai_provider.chat()` usando o prompt configurado no nó

**Commit da fase:** `feat: fase 6 - módulo de IA, agente consultor e CRM de leads`

---

## Regras de Implementação

1. **Sem mocks**: todo código deve ser real e funcional
2. **Sem placeholders**: nunca deixar `pass`, `TODO`, `...` ou funções vazias
3. **Erros tratados**: FastAPI com HTTPException adequado, Frontend com toast de erro
4. **TypeScript estrito**: sem `any`, usar tipos do `src/types/index.ts`
5. **Mobile-first**: toda página do `/book` deve funcionar perfeitamente em 375px
6. **Migrations sempre**: a cada novo model, criar migration Alembic correspondente
7. **Variáveis de ambiente**: nunca hardcodar secrets, sempre usar `config.py` / `.env`
8. **CORS configurado**: FastAPI deve aceitar requests do frontend em desenvolvimento

---

## Verificação de Conclusão

Ao final de cada iteração, verifique:

```bash
# Backend responde?
curl http://localhost:8000/docs

# Frontend carrega?
curl http://localhost:3000

# Testes básicos (se existirem)
cd backend && python -m pytest 2>/dev/null || echo "sem testes ainda"
```

Quando todas as 6 fases estiverem implementadas (todos os arquivos existirem e o projeto subir com `docker-compose up`), output:

`<promise>PROJETO COMPLETO</promise>`
