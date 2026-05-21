import type { AuthResponse } from '../types/auth';

const SESSION_KEY = 'neohw_session';

export const getStoredSession = (): AuthResponse | null => {
  const rawSession = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);

  if (!rawSession) return null;

  try {
    const parsed = JSON.parse(rawSession);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.accessToken === 'string' &&
      parsed.user &&
      typeof parsed.user === 'object' &&
      typeof parsed.user.role === 'string'
    ) {
      return parsed as AuthResponse;
    }
    
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const getStoredAccessToken = () => getStoredSession()?.accessToken ?? null;

export const saveStoredSession = (session: AuthResponse, remember = true) => {
  const targetStorage = remember ? localStorage : sessionStorage;
  const staleStorage = remember ? sessionStorage : localStorage;

  staleStorage.removeItem(SESSION_KEY);
  targetStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const updateStoredSession = (session: AuthResponse) => {
  const storage = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearStoredSession = () => {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
};
