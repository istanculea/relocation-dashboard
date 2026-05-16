let city360MetaPromise;
let citySourceMetaPromise;
let cityTrendDataPromise;
let cityAuditMetaPromise;

const logCityDetailLoadError = (label, error) => {
  console.warn(`Failed to load ${label}.`, error);
};

const loadCity360Meta = () => {
  if (!city360MetaPromise) {
    city360MetaPromise = (async () => {
      const module = await import('./city360Meta.js');
      return module.city360Meta;
    })()
      .catch((error) => {
        city360MetaPromise = undefined;
        logCityDetailLoadError('city360 metadata', error);
        return {};
      });
  }

  return city360MetaPromise;
};

const loadCitySourceMeta = () => {
  if (!citySourceMetaPromise) {
    citySourceMetaPromise = (async () => {
      const module = await import('./citySourceMeta.js');
      return module.citySourceMeta;
    })()
      .catch((error) => {
        citySourceMetaPromise = undefined;
        logCityDetailLoadError('city source metadata', error);
        return {};
      });
  }

  return citySourceMetaPromise;
};

const loadCityTrendData = () => {
  if (!cityTrendDataPromise) {
    cityTrendDataPromise = (async () => {
      const module = await import('./cityTrendData.js');
      return module.cityTrendData;
    })()
      .catch((error) => {
        cityTrendDataPromise = undefined;
        logCityDetailLoadError('city trend data', error);
        return {};
      });
  }

  return cityTrendDataPromise;
};

const loadCityAuditMeta = () => {
  if (!cityAuditMetaPromise) {
    cityAuditMetaPromise = (async () => {
      const module = await import('./cityAuditMeta.js');
      return module.cityAuditMeta;
    })()
      .catch((error) => {
        cityAuditMetaPromise = undefined;
        logCityDetailLoadError('city audit metadata', error);
        return {};
      });
  }

  return cityAuditMetaPromise;
};

export const loadCity360Detail = async (cityKey) => {
  const city360Meta = await loadCity360Meta();

  return city360Meta[cityKey] ?? null;
};

export const loadCitySourceDetail = async (cityKey) => {
  const citySourceMeta = await loadCitySourceMeta();

  return citySourceMeta[cityKey] ?? {};
};

export const loadCityTrendDetail = async (cityKey) => {
  const cityTrendData = await loadCityTrendData();

  return cityTrendData[cityKey] ?? [];
};

export const loadCityExplorerDetail = async (cityKey) => {
  const [city360, sources, trends, audit] = await Promise.all([
    loadCity360Detail(cityKey),
    loadCitySourceDetail(cityKey),
    loadCityTrendDetail(cityKey),
    loadCityAuditMeta(),
  ]);

  return {
    audit: audit[cityKey] ?? null,
    city360,
    sources,
    trends,
  };
};