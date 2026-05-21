const isBrowser = typeof window !== 'undefined';

export const readStoredValue = (key, fallbackValue, validator = () => true) => {
  if (!isBrowser) {
    return fallbackValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue !== null && validator(storedValue) ? storedValue : fallbackValue;
  } catch (error) {
    console.warn(`Unable to read local storage key: ${key}`, error);
    return fallbackValue;
  }
};

export const persistStoredValue = (key, value) => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(key, String(value));
  } catch (error) {
    console.warn(`Unable to persist local storage key: ${key}`, error);
  }
};
