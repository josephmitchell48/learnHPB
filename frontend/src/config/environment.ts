export const isLightweightMode =
  String(import.meta.env.VITE_LIGHTWEIGHT_MODE ?? '').toLowerCase() === 'true'
