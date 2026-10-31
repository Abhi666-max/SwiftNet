import { SpeedTestResult } from '@/types/speedtest';

const STORAGE_KEY = 'swiftnet_test_history_v1';
const PRIVACY_SETTINGS_KEY = 'swiftnet_privacy_settings_v1';

export interface PrivacySettings {
  storeIpInHistory: boolean;
}

export function getPrivacySettings(): PrivacySettings {
  if (typeof window === 'undefined') {
    return { storeIpInHistory: false };
  }
  try {
    const raw = localStorage.getItem(PRIVACY_SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return { storeIpInHistory: false };
}

export function savePrivacySettings(settings: PrivacySettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save privacy settings', e);
  }
}

export function loadTestHistory(): SpeedTestResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load test history from localStorage', err);
    return [];
  }
}

export function saveTestToHistory(result: SpeedTestResult): void {
  if (typeof window === 'undefined') return;
  try {
    const history = loadTestHistory();
    const settings = getPrivacySettings();

    // Sanitize network info if user has not opted into saving IP
    const sanitizedResult: SpeedTestResult = {
      ...result,
      networkInfo: settings.storeIpInHistory 
        ? result.networkInfo 
        : (result.networkInfo ? { ...result.networkInfo, ip: 'Redacted (Privacy Opt-out)' } : undefined),
    };

    // Keep up to 50 recent tests, newest first
    const updated = [sanitizedResult, ...history.filter(h => h.id !== result.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save test result to localStorage', err);
  }
}

export function clearTestHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear test history', err);
  }
}

export function deleteTestFromHistory(id: string): SpeedTestResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = loadTestHistory();
    const filtered = current.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}
