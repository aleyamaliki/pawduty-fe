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

test('web: fetches the image into a Blob and posts a real file part', async () => {
  const RN = require('react-native');
  const original = RN.Platform.OS;
  RN.Platform.OS = 'web';
  try {
    const blob = new Blob(['img'], { type: 'image/jpeg' });
    global.fetch
      .mockResolvedValueOnce({ blob: async () => blob }) // image fetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ tag: 'healthy', confidence: 0.8 }) });
    const result = await scanThermal('blob:https://client/abc');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const [scanUrl, opts] = global.fetch.mock.calls[1];
    expect(scanUrl).toBe(`${ML_API_BASE}/scan`);
    expect(opts.body).toBeInstanceOf(FormData);
    expect(result).toEqual({ tag: 'healthy', confidence: 0.8 });
  } finally {
    RN.Platform.OS = original;
  }
});

test('normalizes an array 422 detail to a string|undefined (never an object)', async () => {
  global.fetch.mockResolvedValue({
    ok: false,
    status: 422,
    json: async () => ({ detail: [{ type: 'value_error', loc: ['body', 'image'], msg: 'bad', input: null, ctx: {} }] }),
  });
  const err = await scanThermal('file:///tmp/x.jpg').catch((e) => e);
  expect(err).toBeInstanceOf(MlScanError);
  expect(err.status).toBe(422);
  expect(typeof err.detail === 'string' || err.detail === undefined).toBe(true);
  expect(typeof err.detail).not.toBe('object');
});
