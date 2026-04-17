import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { loadJobs, nextId, saveJobs } from './store.mjs';
import { extractJson, getModel, getOpenAIClient } from './openai.mjs';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

function isInsufficientQuota(err) {
  const code = err?.code ?? err?.error?.code;
  return code === 'insufficient_quota';
}

function mockDiscoveredJobs({ query, location, technologies, limit }) {
  const q = encodeURIComponent(query);
  const loc = (location || '').trim();
  const tech = Array.isArray(technologies) ? technologies.filter(Boolean).join(', ') : '';
  const base = [
    {
      titulo: `Resultados en Get on Board: ${query}`,
      empresa: 'Get on Board',
      link: `https://www.getonbrd.com/empleos?query=${q}`,
      ubicacion: loc || 'LatAm / Remoto',
      descripcion: `Búsqueda de ofertas para “${query}”.`,
      match_score: 75,
      tecnologias: technologies ?? [],
      ia_razones: ['Fallback mock', 'Sin cuota OpenAI', 'Usa links de búsqueda']
    },
    {
      titulo: `Resultados en LinkedIn: ${query}`,
      empresa: 'LinkedIn',
      link: `https://www.linkedin.com/jobs/search/?keywords=${q}`,
      ubicacion: loc || 'Global',
      descripcion: 'Búsqueda en LinkedIn Jobs (requiere sesión en algunos casos).',
      match_score: 70,
      tecnologias: technologies ?? [],
      ia_razones: ['Fallback mock', 'Sin cuota OpenAI', 'Usa links de búsqueda']
    },
    {
      titulo: `Remote OK: ${query}`,
      empresa: 'Remote OK',
      link: `https://remoteok.com/remote-${q}-jobs`,
      ubicacion: 'Remoto',
      descripcion: 'Búsqueda en Remote OK.',
      match_score: 65,
      tecnologias: technologies ?? [],
      ia_razones: ['Fallback mock', 'Sin cuota OpenAI', 'Usa links de búsqueda']
    },
    {
      titulo: `Indeed: ${query}`,
      empresa: 'Indeed',
      link: `https://www.indeed.com/jobs?q=${q}`,
      ubicacion: loc || '—',
      descripcion: 'Búsqueda en Indeed.',
      match_score: 60,
      tecnologias: technologies ?? [],
      ia_razones: ['Fallback mock', 'Sin cuota OpenAI', 'Usa links de búsqueda']
    }
  ];

  const filled = [];
  while (filled.length < Math.max(1, limit)) filled.push(base[filled.length % base.length]);

  // Pequeña pista en descripción para el usuario
  if (tech || loc) {
    filled[0] = {
      ...filled[0],
      descripcion: `Búsqueda “${query}”${loc ? ` en ${loc}` : ''}${tech ? ` (${tech})` : ''}.`
    };
  }

  return filled.slice(0, limit);
}

const asyncRoute =
  (handler) =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'job-backend', time: new Date().toISOString() });
});

app.get(
  '/jobs',
  asyncRoute(async (req, res) => {
  const jobs = await loadJobs();
  res.json(jobs);
  })
);

app.post(
  '/jobs',
  asyncRoute(async (req, res) => {
  const jobs = await loadJobs();
  const payload = req.body ?? {};

  const job = {
    id: nextId(jobs),
    titulo: String(payload.titulo ?? ''),
    empresa: String(payload.empresa ?? ''),
    descripcion: String(payload.descripcion ?? ''),
    link: String(payload.link ?? ''),
    ubicacion: String(payload.ubicacion ?? ''),
    aplicado: Boolean(payload.aplicado ?? false),
    match_score: Number(payload.match_score ?? 0),
    tecnologias: Array.isArray(payload.tecnologias) ? payload.tecnologias.map(String) : [],
    ia_razones: Array.isArray(payload.ia_razones) ? payload.ia_razones.map(String) : []
  };

  if (!job.titulo || !job.empresa || !job.link) {
    return res.status(400).json({ detail: 'titulo, empresa y link son requeridos' });
  }

  jobs.push(job);
  await saveJobs(jobs);
  res.status(201).json(job);
  })
);

app.put(
  '/jobs/:id/apply',
  asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const jobs = await loadJobs();
  const idx = jobs.findIndex((j) => Number(j.id) === id);
  if (idx === -1) return res.status(404).json({ detail: 'Job no encontrado' });

  jobs[idx] = { ...jobs[idx], aplicado: true, aplicado_at: new Date().toISOString() };
  await saveJobs(jobs);
  res.json(jobs[idx]);
  })
);

app.post(
  '/generate',
  asyncRoute(async (req, res) => {
  const { job_id } = req.body ?? {};
  const id = Number(job_id);
  if (!id) return res.status(400).json({ detail: 'job_id requerido' });

  const jobs = await loadJobs();
  const job = jobs.find((j) => Number(j.id) === id);
  if (!job) return res.status(404).json({ detail: 'Job no encontrado' });

  const client = getOpenAIClient();
  const model = getModel();

  const prompt = [
    'Genera una postulación profesional en español para este trabajo.',
    'Devuelve SOLO JSON con el formato:',
    '{ "correo": "...", "mensaje_linkedin": "..." }',
    '',
    'Trabajo:',
    `Titulo: ${job.titulo}`,
    `Empresa: ${job.empresa}`,
    `Ubicacion: ${job.ubicacion}`,
    `Descripcion: ${job.descripcion}`
  ].join('\n');

  try {
    const response = await client.responses.create({
      model,
      input: prompt
    });

    const data = extractJson(response.output_text);
    res.json({
      correo: String(data.correo ?? ''),
      mensaje_linkedin: String(data.mensaje_linkedin ?? '')
    });
  } catch (err) {
    if (process.env.MOCK_ON_QUOTA === '1' && isInsufficientQuota(err)) {
      const correo = [
        `Asunto: Postulación — ${job.titulo} (${job.empresa})`,
        '',
        `Hola equipo de ${job.empresa},`,
        '',
        `Me gustaría postular al cargo “${job.titulo}”. He revisado la descripción y creo que puedo aportar desde mi experiencia.`,
        '',
        'Quedo atento/a para coordinar una entrevista.',
        '',
        'Saludos,',
        'Tu Nombre'
      ].join('\n');

      const mensaje_linkedin = `Hola ${job.empresa}, ¿cómo estás? Me interesa el rol “${job.titulo}”. ¿Podrías indicarme el mejor canal para postular? Gracias!`;

      return res.json({ correo, mensaje_linkedin, mock: true });
    }
    throw err;
  }
  })
);

app.post(
  '/discover',
  asyncRoute(async (req, res) => {
  const { query, technologies, location, limit } = req.body ?? {};
  const q = String(query ?? '').trim();
  if (!q) return res.status(400).json({ detail: 'query requerido' });

  const tech = Array.isArray(technologies) ? technologies.map(String) : [];
  const loc = String(location ?? '').trim();
  const lim = Math.max(1, Math.min(Number(limit ?? 10), 50));

  const client = getOpenAIClient();
  const model = getModel();

  const prompt = [
    'Encuentra ofertas de trabajo reales en la web usando búsqueda.',
    'Objetivo: devolver URLs (links) de postings de trabajo.',
    '',
    'Devuelve SOLO JSON válido con el formato:',
    '{ "jobs": [ { "titulo": "...", "empresa": "...", "link": "https://...", "ubicacion": "...", "descripcion": "...", "match_score": 0-100, "tecnologias": ["..."], "ia_razones": ["..."] } ] }',
    '',
    'Reglas:',
    `- Máximo ${lim} resultados.`,
    '- links deben ser URLs directas al aviso (no home genérico si es posible).',
    '- descripcion corta (1-2 frases).',
    '- match_score: qué tan bien calza con la búsqueda y tecnologías (0-100).',
    '- ia_razones: 3 bullets cortos (strings) justificando el score.',
    '',
    `Búsqueda: ${q}`,
    loc ? `Ubicación preferida: ${loc}` : '',
    tech.length ? `Tecnologías: ${tech.join(', ')}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const response = await client.responses.create({
      model,
      tools: [{ type: 'web_search' }],
      input: prompt
    });

    const data = extractJson(response.output_text);
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];

    res.json({
      jobs: jobs.slice(0, lim).map((j) => ({
        titulo: String(j.titulo ?? ''),
        empresa: String(j.empresa ?? ''),
        link: String(j.link ?? ''),
        ubicacion: String(j.ubicacion ?? ''),
        descripcion: String(j.descripcion ?? ''),
        match_score: Number(j.match_score ?? 0),
        tecnologias: Array.isArray(j.tecnologias) ? j.tecnologias.map(String) : [],
        ia_razones: Array.isArray(j.ia_razones) ? j.ia_razones.map(String) : []
      }))
    });
  } catch (err) {
    if (process.env.MOCK_ON_QUOTA === '1' && isInsufficientQuota(err)) {
      return res.json({
        jobs: mockDiscoveredJobs({
          query: q,
          location: loc,
          technologies: tech,
          limit: lim
        }),
        mock: true
      });
    }
    throw err;
  }
  })
);

// Error handler
app.use((err, req, res, next) => {
  const status = Number(err?.status) || 500;
  res.status(status).json({ detail: err?.message ?? 'Internal server error' });
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[job-backend] listening on http://localhost:${port}`);
});
