import Constants from 'expo-constants';

export const PORT = 8001; // matches task-api README run command
export const OVERRIDE = null; // e.g. 'http://192.168.1.42:8001' for tunnel/edge cases

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
