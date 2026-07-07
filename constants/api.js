import Constants from 'expo-constants';

export const PORT = 8001; // matches task-api README run command
// Deployed task-api (Railway). Set to null to fall back to the auto-derived
// local dev host (http://<metro-host>:8001) when running the backend locally.
export const OVERRIDE = 'https://<task-api-host>';

function deriveHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    '';
  const host = hostUri.split(':')[0];
  return host ? `http://${host}:${PORT}` : `http://localhost:${PORT}`;
}

export const API_BASE = OVERRIDE || deriveHost();
