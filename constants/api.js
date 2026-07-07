import Constants from 'expo-constants';

export const PORT = 8001; // matches task-api README run command
// Deployed task-api URL for a production/demo build. Set via the gitignored
// .env.local (EXPO_PUBLIC_TASK_API_URL=https://…) so the URL stays out of git.
// When unset, falls back to the auto-derived local dev host (http://<metro-host>:8001).
export const OVERRIDE = process.env.EXPO_PUBLIC_TASK_API_URL ?? null;

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
