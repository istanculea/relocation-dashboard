export const parseManifestJson = (raw, absolutePath) => {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid migration manifest JSON: ${absolutePath}`);
  }
};
