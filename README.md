# Job Dashboard (SaaS) — Frontend Angular + Backend OpenAI

Sistema tipo SaaS para gestión de **postulaciones con IA**:
- Dashboard con métricas + gráficos
- Lista de trabajos con score IA, filtros y búsqueda
- Vista detalle tipo LinkedIn
- Generador de postulación (correo + mensaje LinkedIn)
- Descubrimiento de trabajos vía IA (búsqueda web) y “Importar” a la app

Este repo incluye:
- `job-dashboard/` → Frontend Angular (Standalone + Routing + SCSS + Angular Material)
- `job-backend/` → Backend mínimo (Express) con endpoints compatibles con el frontend + integración OpenAI

## Requisitos
- Node.js 20+ (probado con Node 24)
- npm
- Una `OPENAI_API_KEY` **con billing/crédito** (opcional para demo con mock)

## 1) Backend (`job-backend`)

### Configuración
1. Entra al backend:
   - `cd job-backend`
2. Crea el `.env`:
   - `Copy-Item .env.example .env`
3. Edita `job-backend/.env` y agrega:
   - `OPENAI_API_KEY=...`
   - `PORT=8000`

> Importante: **no pongas la API key en el frontend**.

### Instalación y ejecución
- Instalar:
  - `npm.cmd install`
- Ejecutar (sin watch, más estable en Windows):
  - `npm.cmd run dev`

Verifica que esté arriba:
- `curl.exe http://localhost:8000/health`

### Modo demo sin cuota OpenAI
Si tu cuenta/proyecto devuelve `429 insufficient_quota`, puedes demoear sin crédito:
- En `job-backend/.env` activa:
  - `MOCK_ON_QUOTA=1`

Con esto:
- `POST /discover` devuelve resultados mock (links de búsqueda)
- `POST /generate` devuelve texto mock

## 2) Frontend (`job-dashboard`)

### Instalación y ejecución
1. Entra al frontend:
   - `cd job-dashboard`
2. Instala:
   - `npm.cmd install`
3. Ejecuta:
   - `npm.cmd start`

Frontend:
- `http://localhost:4200`

Backend esperado por defecto:
- `http://localhost:8000`

Si cambias el puerto del backend, ajusta:
- `job-dashboard/src/app/core/config/api-base-url.ts`

## Features principales

### Trabajos
- Cards Material con:
  - `titulo`, `empresa`, `ubicacion`, `match_score`
  - Barra de progreso con color por score (verde/amarillo/rojo)
  - Badge “No aplicado / Postulado”
- Acciones:
  - Ver detalle
  - Postular (marca como aplicado)
- Filtros:
  - Búsqueda (debounce RxJS)
  - Tecnología / ubicación / score mínimo

### Descubrir (IA)
En `Trabajos` existe el botón **“Descubrir (IA)”**:
- Llama `POST /discover` en el backend para traer ofertas (links) usando OpenAI + búsqueda web.
- Permite “Importar todo” (persistencia vía `POST /jobs`).
- Incluye filtro personal de **cargos objetivo** (multi-select) + toggles “Junior + remoto / sin experiencia”.

### Dashboard / Stats
KPIs + gráfico (Chart.js / ng2-charts):
- Total trabajos
- Total postulaciones
- Tasa de éxito
- Postulaciones por día (si backend envía `aplicado_at`)

## Endpoints usados por el frontend
- `GET /jobs`
- `POST /jobs`
- `PUT /jobs/{id}/apply`
- `POST /generate`
- `POST /discover`

## Problemas comunes

- Error `chrome-extension://... user_style.js querySelector`
  - Es una **extensión del navegador**, no la app. Prueba en incógnito o desactívala.
- `net::ERR_CONNECTION_REFUSED :8000/...`
  - El backend no está corriendo o el puerto cambió.
- `429 insufficient_quota`
  - Falta crédito/billing en OpenAI. Activa `MOCK_ON_QUOTA=1` o usa una key con crédito.
