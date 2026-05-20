import { clampValue } from './cityMapPageUtils.js';

export const zoomViewport = (setZoom, direction) => {
  setZoom((previousZoom) => {
    const delta = direction === 'in' ? 0.2 : -0.2;
    return clampValue(Number((previousZoom + delta).toFixed(2)), 1, 2.4);
  });
};

export const panViewport = (setPan, dx, dy) => {
  setPan((previousPan) => ({
    x: clampValue(previousPan.x + dx, -220, 220),
    y: clampValue(previousPan.y + dy, -180, 180),
  }));
};

export const resetViewport = (setZoom, setPan) => {
  setZoom(1);
  setPan({ x: 0, y: 0 });
};
