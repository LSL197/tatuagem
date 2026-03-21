# Plataforma de Gestão para Estúdio de Tatuagem

Aplicação web para gestão completa de estúdios de tatuagem, com portal público de agendamento, automações de WhatsApp/Instagram e agente de IA.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python) |
| Banco de dados | PostgreSQL |
| Cache / Filas | Redis + Celery |
| IA | Anthropic / OpenAI / Groq |
| Infra local | Docker Compose |

## Como rodar

```bash
# Subir todos os serviços
docker compose up

# Criar usuários iniciais
docker compose exec backend python seed.py
```

### Acessos locais

| Serviço | URL |
|---|---|
| App (dashboard) | http://localhost:3000 |
| Portal público | http://localhost:3000/book |
| API docs | http://localhost:8000/docs |

### Credenciais de teste

| Usuário | Email | Senha |
|---|---|---|
| Admin | admin@estudio.com | senha123 |
| Tatuador | joao@estudio.com | senha123 |

## Módulos

- **Portal público `/book`** — lista de tatuadores e agendamento mobile-first
- **Dashboard** — agenda (FullCalendar), financeiro, métricas, leads/CRM
- **Automações** — flow builder estilo n8n com gatilhos WhatsApp/Instagram
- **Agente de IA** — consultor de ideias e qualificação de leads
