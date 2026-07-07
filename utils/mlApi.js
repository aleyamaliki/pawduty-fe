import { ML_API_BASE } from '../constants/mlApi';

// Thrown for any failed thermal scan. `status` is the HTTP status (0 = network
// unreachable); the ml-heat service returns 422 with a detail when no cat body
// can be isolated in the frame.
export class MlScanError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : `Scan failed with status ${status}`);
    this.name = 'MlScanError';
    this.status = status;
    this.detail = detail;
  }
}

// POST a captured image to ml-heat POST /scan and resolve { tag, confidence }.
// `tag` is 'healthy' | 'unhealthy'; `confidence` is the probability (>= 0.5) of
// the reported class. Do NOT set Content-Type — fetch sets the multipart
// boundary itself when the body is FormData.
export async function scanThermal(imageUri) {
  const form = new FormData();
  form.append('image', { uri: imageUri, name: 'scan.jpg', type: 'image/jpeg' });

  let res;
  try {
    res = await fetch(`${ML_API_BASE}/scan`, { method: 'POST', body: form });
  } catch (e) {
    throw new MlScanError(0, 'Could not reach the scan service.');
  }

  if (!res.ok) {
    let detail;
    try {
      detail = (await res.json())?.detail;
    } catch (e) {
      detail = undefined;
    }
    throw new MlScanError(res.status, detail);
  }

  return res.json();
}
