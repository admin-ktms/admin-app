/**
 * Pluggable Key-Value Storage Adapter
 * Decouples Supabase session token persistence from raw browser localStorage.
 * Enables zero-code substitution with native Capacitor Preferences/SecureStorage.
 */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export const appStorage: KeyValueStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Safe failover for restricted WebView or private browsing contexts
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Safe failover
    }
  },
};
