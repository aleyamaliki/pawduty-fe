import Constants from 'expo-constants';

export const PORT = 8001; // matches task-api README run command
// Set to your deployed task-api URL (e.g. 'https://<task-api-host>') for a
// production/demo build; keep it out of version control. null falls back to the
// auto-derived local dev host (http://<metro-host>:8001).
export const OVERRIDE = null;

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
