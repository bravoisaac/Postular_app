# job-backend

Backend mínimo (Express) para alimentar el frontend `job-dashboard` sin FastAPI.

## Requisitos
- Node.js 20+ (tú tienes Node 24)
- Una `OPENAI_API_KEY`

## Setup
1. Copia `.env.example` a `.env` y agrega tu key.
2. Instala dependencias:
   - `npm.cmd install`
3. Levanta el server:
   - `npm.cmd run dev`

Nota: si `node --watch` te falla con `spawn EPERM`, usa `npm.cmd run dev` (sin watch). El script con watch está en `npm.cmd run dev:watch`.

## Problemas comunes

- Si ves `429 insufficient_quota` desde OpenAI, tu cuenta/proyecto no tiene crédito o billing activo.
  - Solución: habilita billing en tu cuenta de OpenAI o usa una key con crédito.
  - Para demo sin crédito: en `.env` agrega `MOCK_ON_QUOTA=1` (hará fallback con resultados mock para `/discover` y `/generate`).
- Si ves `429 Too Many Requests` (rate limit), espera unos segundos/minutos o reduce la frecuencia de llamados.
  - Para demo sin bloqueos: también puedes usar `MOCK_ON_QUOTA=1`.

## Endpoints
- `GET /health`
- `GET /jobs`
- `POST /jobs`
- `PUT /jobs/:id/apply`
- `POST /generate`
- `POST /discover` (usa OpenAI + web search)
