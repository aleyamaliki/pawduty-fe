import { scanThermal, MlScanError } from '../../utils/mlApi';
import { ML_API_BASE } from '../../constants/mlApi';

beforeEach(() => {
  global.fetch = jest.fn();
});

test('POSTs multipart image to /scan and returns parsed result', async () => {
  global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ tag: 'unhealthy', confidence: 0.62 }) });

  const result = await scanThermal('file:///tmp/cat.jpg');

  const [url, opts] = global.fetch.mock.calls[0];
  expect(url).toBe(`${ML_API_BASE}/scan`);
  expect(opts.method).toBe('POST');
  expect(opts.body).toBeInstanceOf(FormData);
  expect(result).toEqual({ tag: 'unhealthy', confidence: 0.62 });
});

test('throws MlScanError with detail on 422 (no body detected)', async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: 'no body' }) });

  await expect(scanThermal('file:///tmp/blank.jpg')).rejects.toMatchObject({ status: 422, detail: 'no body' });
  await expect(scanThermal('file:///tmp/blank.jpg')).rejects.toBeInstanceOf(MlScanError);
});

test('throws MlScanError with status 0 when the network is unreachable', async () => {
  global.fetch.mockRejectedValue(new TypeError('Network request failed'));

  await expect(scanThermal('file:///tmp/cat.jpg')).rejects.toMatchObject({ status: 0 });
});
