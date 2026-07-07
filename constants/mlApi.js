import Constants from 'expo-constants';

// ml-heat cat-thermal-health service (FastAPI): `uvicorn api.main:app` → :8000.
// Kept separate from the task-api base (constants/api.js, :8001).
export const ML_PORT = 8000;
export const ML_OVERRIDE = null; // e.g. 'http://192.168.1.42:8000' for tunnel/edge cases

function deriveHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    '';
  const host = hostUri.split(':')[0];
  return host ? `http://${host}:${ML_PORT}` : `http://localhost:${ML_PORT}`;
}

export const ML_API_BASE = ML_OVERRIDE || deriveHost();
