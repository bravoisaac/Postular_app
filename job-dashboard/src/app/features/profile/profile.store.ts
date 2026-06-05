import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'job-dashboard.profile.v1';

export interface CandidateProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  targetRoles: string;
  skills: string;
  experience: string;
  education: string;
  languages: string;
  cvFileName: string;
  cvText: string;
}

export const EMPTY_PROFILE: CandidateProfile = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  portfolio: '',
  summary: '',
  targetRoles: '',
  skills: '',
  experience: '',
  education: '',
  languages: '',
  cvFileName: '',
  cvText: ''
};

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  readonly profile = signal<CandidateProfile>(this.load());

  save(profile: CandidateProfile) {
    const cleanProfile = normalizeProfile(profile);
    this.profile.set(cleanProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanProfile));
  }

  clear() {
    this.profile.set(EMPTY_PROFILE);
    localStorage.removeItem(STORAGE_KEY);
  }

  snapshot() {
    return this.profile();
  }

  hasPersonalData() {
    const profile = this.profile();
    return Boolean(profile.fullName.trim() && profile.email.trim());
  }

  private load(): CandidateProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return EMPTY_PROFILE;
      return normalizeProfile({ ...EMPTY_PROFILE, ...JSON.parse(raw) });
    } catch {
      return EMPTY_PROFILE;
    }
  }
}

function normalizeProfile(profile: CandidateProfile): CandidateProfile {
  return {
    fullName: String(profile.fullName ?? '').trim(),
    email: String(profile.email ?? '').trim(),
    phone: String(profile.phone ?? '').trim(),
    location: String(profile.location ?? '').trim(),
    linkedin: String(profile.linkedin ?? '').trim(),
    portfolio: String(profile.portfolio ?? '').trim(),
    summary: String(profile.summary ?? '').trim(),
    targetRoles: String(profile.targetRoles ?? '').trim(),
    skills: String(profile.skills ?? '').trim(),
    experience: String(profile.experience ?? '').trim(),
    education: String(profile.education ?? '').trim(),
    languages: String(profile.languages ?? '').trim(),
    cvFileName: String(profile.cvFileName ?? '').trim(),
    cvText: String(profile.cvText ?? '').trim()
  };
}
