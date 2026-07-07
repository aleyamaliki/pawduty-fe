import { Platform } from 'react-native';
import { ML_API_BASE } from '../constants/mlApi';

// Thrown for any failed thermal scan. `status` is the HTTP status (0 = network
// unreachable); `detail` is always a human-readable string or undefined (never a
// raw FastAPI validation object), so callers can render it directly.
export class MlScanError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : `Scan failed with status ${status}`);
    this.name = 'MlScanError';
    this.status = status;
    this.detail = typeof detail === 'string' ? detail : undefined;
  }
}

// POST a captured image to ml-heat POST /scan and resolve { tag, confidence }.
// `tag` is 'healthy' | 'unhealthy'; `confidence` is the probability (>= 0.5) of
// the reported class.
export async function scanThermal(imageUri) {
  const form = new FormData();

  if (Platform.OS === 'web') {
    // On web the {uri,name,type} React Native shim is NOT a real file part — the
    // browser would send it as text and FastAPI's File(...) would 422. Fetch the
    // captured image (blob:/data: URL) into a Blob and append a real file.
    const blob = await (await fetch(imageUri)).blob();
    form.append('image', blob, 'scan.jpg');
  } else {
    // Native: fetch sets the multipart boundary itself for the {uri,...} object.
    form.append('image', { uri: imageUri, name: 'scan.jpg', type: 'image/jpeg' });
  }

  let res;
  try {
    res = await fetch(`${ML_API_BASE}/scan`, { method: 'POST', body: form });
  } catch (e) {
    throw new MlScanError(0, 'Could not reach the scan service.');
  }

  if (!res.ok) {
    let detail;
    try {
      const body = await res.json();
      // FastAPI 422 `detail` may be a string OR an array of error objects; only
      // keep a string so we never surface an object to the UI.
      detail = typeof body?.detail === 'string' ? body.detail : undefined;
    } catch (e) {
      detail = undefined;
    }
    throw new MlScanError(res.status, detail);
  }

  return res.json();
}
