import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'job-dashboard.settings.v1';

export interface AppSettings {
  hideAppliedByDefault: boolean;
  minScoreDefault: number;
  preferredTechnology: string;
  preferredLocation: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  hideAppliedByDefault: true,
  minScoreDefault: 0,
  preferredTechnology: '',
  preferredLocation: ''
};

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  readonly settings = signal<AppSettings>(this.load());

  snapshot() {
    return this.settings();
  }

  save(settings: AppSettings) {
    const cleanSettings = normalizeSettings(settings);
    this.settings.set(cleanSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanSettings));
  }

  reset() {
    this.settings.set(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  }

  private load(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      return normalizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
}

function normalizeSettings(settings: AppSettings): AppSettings {
  const minScore = Number(settings.minScoreDefault ?? 0);
  return {
    hideAppliedByDefault: Boolean(settings.hideAppliedByDefault),
    minScoreDefault: Math.max(0, Math.min(100, Number.isFinite(minScore) ? minScore : 0)),
    preferredTechnology: String(settings.preferredTechnology ?? '').trim(),
    preferredLocation: String(settings.preferredLocation ?? '').trim()
  };
}
