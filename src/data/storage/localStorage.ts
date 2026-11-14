const getStorage = (): Storage | null => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
};

export const setItem = <T>(key: string, value: T): boolean => {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const getItem = <T>(key: string, fallback: T): T => {
  const storage = getStorage();
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

export const removeItem = (key: string): boolean => {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const hasItem = (key: string): boolean => {
  const storage = getStorage();
  return storage ? storage.getItem(key) !== null : false;
};

export const clearAll = (): boolean => {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.clear();
    return true;
  } catch {
    return false;
  }
};
