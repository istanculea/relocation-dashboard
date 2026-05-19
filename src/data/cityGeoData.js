export const cityGeoData = {
  bilbao: { lat: 43.263, lon: -2.935 },
  bucharest: { lat: 44.4268, lon: 26.1025 },
  bologna: { lat: 44.4949, lon: 11.3426 },
  lugo: { lat: 43.0123, lon: -7.5559 },
  milan: { lat: 45.4642, lon: 9.19 },
  reggioEmilia: { lat: 44.6983, lon: 10.6312 },
  cologne: { lat: 50.9375, lon: 6.9603 },
  valencia: { lat: 39.4699, lon: -0.3763 },
  vienna: { lat: 48.2082, lon: 16.3738 },
};

const MAP_BOUNDS = {
  minLat: 36,
  maxLat: 55,
  minLon: -10,
  maxLon: 30,
};

export const projectGeoPoint = ({ lat, lon }, width, height, padding = 28) => {
  const normalizedX = (lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon);
  const normalizedY = (lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);

  const x = padding + normalizedX * (width - padding * 2);
  const y = height - (padding + normalizedY * (height - padding * 2));

  return { x, y };
};
