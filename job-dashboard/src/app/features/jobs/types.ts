export interface Job {
  id: number;
  titulo: string;
  empresa: string;
  descripcion: string;
  link: string;
  ubicacion: string;
  aplicado: boolean;
  match_score: number;

  // Opcionales para enriquecer la UI si tu backend los expone
  tecnologias?: string[];
  ia_razones?: string[];
  aplicado_at?: string;
}

export interface Application {
  id: number;
  job_id: number;
  correo: string;
  mensaje_linkedin: string;
}

export type CreateJobRequest = Omit<Job, 'id'>;

export interface GenerateRequest {
  job_id: number;
}

export interface GenerateResponse {
  correo: string;
  mensaje_linkedin: string;
}

export interface DiscoverJobsRequest {
  query: string;
  technologies?: string[];
  location?: string;
  limit?: number;
}

export interface DiscoveredJob {
  titulo: string;
  empresa: string;
  descripcion?: string;
  link: string;
  ubicacion?: string;
  match_score?: number;
  tecnologias?: string[];
  ia_razones?: string[];
}

export interface DiscoverJobsResponse {
  jobs: DiscoveredJob[];
}
