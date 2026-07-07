import Constants from 'expo-constants';

// ml-heat cat-thermal-health service (FastAPI): `uvicorn api.main:app` → :8000.
// Kept separate from the task-api base (constants/api.js, :8001).
export const ML_PORT = 8000;
// Deployed ml-heat URL for a production/demo build. Set via the gitignored
// .env.local (EXPO_PUBLIC_ML_API_URL=https://…) so the URL stays out of git.
// When unset, falls back to the auto-derived local dev host (http://<metro-host>:8000).
export const ML_OVERRIDE = process.env.EXPO_PUBLIC_ML_API_URL ?? null;

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
