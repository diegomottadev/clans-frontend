// Origen de la API. REACT_APP_BASE_URL vacío = mismo origen (el nginx del frontend
// reenvía /api al backend, sin CORS). Sin definir = valor histórico.
const fromEnv = process.env.REACT_APP_BASE_URL;
export const BASE_URL = fromEnv === undefined ? 'http://api.clans.local' : fromEnv.replace(/\/+$/, '');
