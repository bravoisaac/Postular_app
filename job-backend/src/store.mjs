import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DB_PATH = join(process.cwd(), 'data', 'jobs.json');

export async function loadJobs() {
  try {
    const raw = await readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveJobs(jobs) {
  await writeFile(DB_PATH, JSON.stringify(jobs, null, 2), 'utf8');
}

export function nextId(jobs) {
  return (jobs.reduce((max, j) => Math.max(max, Number(j?.id) || 0), 0) || 0) + 1;
}
