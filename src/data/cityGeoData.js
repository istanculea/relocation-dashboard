export const cityGeoData = {
  bilbao: { lat: 43.263, lon: -2.935 },
  bucharest: { lat: 44.4268, lon: 26.1025 },
  bologna: { lat: 44.4949, lon: 11.3426 },
  lugo: { lat: 44.4205, lon: 12.2609 },
  milan: { lat: 45.4642, lon: 9.19 },
  reggioEmilia: { lat: 44.6983, lon: 10.6312 },
  cologne: { lat: 50.9375, lon: 6.9603 },
  valencia: { lat: 39.4699, lon: -0.3763 },
  vienna: { lat: 48.2082, lon: 16.3738 },
  salzburg: { lat: 47.8095, lon: 13.055 },
  graz: { lat: 47.0707, lon: 15.4395 },
  hamburg: { lat: 53.5511, lon: 9.9937 },
  munich: { lat: 48.1351, lon: 11.582 },
  malaga: { lat: 36.7213, lon: -4.4214 },
  bristol: { lat: 51.4545, lon: -2.5879 },
  edinburgh: { lat: 55.9533, lon: -3.1883 },
  udine: { lat: 46.0711, lon: 13.2346 },
  padova: { lat: 45.4064, lon: 11.8768 },
  trento: { lat: 46.0748, lon: 11.1217 },
  sanLazzaro: { lat: 44.4705, lon: 11.4094 },
  imola: { lat: 44.353, lon: 11.7163 },
  urbino: { lat: 43.7262, lon: 12.6363 },
  parma: { lat: 44.8015, lon: 10.3279 },
  verona: { lat: 45.4384, lon: 10.9916 },
  bergamo: { lat: 45.6983, lon: 9.6773 },
  modena: { lat: 44.6471, lon: 10.9252 },
  torino: { lat: 45.0703, lon: 7.6869 },
  lucca: { lat: 43.8429, lon: 10.5027 },
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
