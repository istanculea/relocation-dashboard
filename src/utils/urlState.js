const SHARE_PARAM = 's';

const toBase64Url = (value) => btoa(unescape(encodeURIComponent(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const fromBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return decodeURIComponent(escape(atob(`${normalized}${padding}`)));
};

export const parseHashLocation = (hash = '') => {
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const [routeRaw, queryRaw = ''] = cleanHash.split('?');
  const route = routeRaw === '/explorer'
    ? 'explorer'
    : routeRaw === '/map'
      ? 'map'
      : '';
  const params = new URLSearchParams(queryRaw);

  return { route, params };
};

export const readShareStateFromHash = (hash = '') => {
  try {
    const { params } = parseHashLocation(hash);
    const payload = params.get(SHARE_PARAM);

    if (!payload) {
      return null;
    }

    const json = fromBase64Url(payload);
    const parsed = JSON.parse(json);

    return typeof parsed === 'object' && parsed ? parsed : null;
  } catch {
    return null;
  }
};

export const buildHashWithShareState = (route = '', shareState = null) => {
  const routePart = route === 'explorer'
    ? '/explorer'
    : route === 'map'
      ? '/map'
      : '/';

  if (!shareState) {
    return `#${routePart}`;
  }

  const params = new URLSearchParams();
  params.set(SHARE_PARAM, toBase64Url(JSON.stringify(shareState)));

  return `#${routePart}?${params.toString()}`;
};

export const buildShareUrl = ({ route = '', shareState, locationObject = window.location } = {}) => {
  const base = `${locationObject.origin}${locationObject.pathname}`;
  return `${base}${buildHashWithShareState(route, shareState)}`;
};
