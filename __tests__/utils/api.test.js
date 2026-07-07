import { api, ApiError } from '../../utils/api';
import { API_BASE } from '../../constants/api';

function mockResponse({ ok = true, status = 200, body = undefined }) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

beforeEach(() => {
  global.fetch = jest.fn();
});

test('listTasks GETs /tasks and returns parsed array', async () => {
  const tasks = [{ id: 't1' }];
  global.fetch.mockResolvedValue(mockResponse({ body: tasks }));
  const result = await api.listTasks();
  expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/tasks`, expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }));
  expect(result).toEqual(tasks);
});

test('listPets GETs /pets', async () => {
  global.fetch.mockResolvedValue(mockResponse({ body: [{ id: 'p1' }] }));
  await api.listPets();
  expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/pets`, expect.any(Object));
});

test('getTask GETs /tasks/{id}', async () => {
  global.fetch.mockResolvedValue(mockResponse({ body: { id: 't1' } }));
  await api.getTask('t1');
  expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/tasks/t1`);
});

test('createTask POSTs JSON body with no id and returns created task', async () => {
  const created = { id: 'srv1', title: 'x' };
  global.fetch.mockResolvedValue(mockResponse({ status: 201, body: created }));
  const result = await api.createTask({ title: 'x', category: 'other', petId: 'p1', date: '2026-07-08', assignee: { name: 'Al' } });
  const [url, opts] = global.fetch.mock.calls[0];
  expect(url).toBe(`${API_BASE}/tasks`);
  expect(opts.method).toBe('POST');
  expect(JSON.parse(opts.body)).not.toHaveProperty('id');
  expect(result).toEqual(created);
});

test('updateTask PATCHes /tasks/{id} with fields', async () => {
  global.fetch.mockResolvedValue(mockResponse({ body: { id: 't1', done: true } }));
  await api.updateTask('t1', { done: true });
  const [url, opts] = global.fetch.mock.calls[0];
  expect(url).toBe(`${API_BASE}/tasks/t1`);
  expect(opts.method).toBe('PATCH');
  expect(JSON.parse(opts.body)).toEqual({ done: true });
});

test('deleteTask DELETEs and resolves null on 204', async () => {
  global.fetch.mockResolvedValue(mockResponse({ status: 204, body: undefined }));
  const result = await api.deleteTask('t1');
  const [url, opts] = global.fetch.mock.calls[0];
  expect(url).toBe(`${API_BASE}/tasks/t1`);
  expect(opts.method).toBe('DELETE');
  expect(result).toBeNull();
});

test('non-2xx throws ApiError with status and detail', async () => {
  global.fetch.mockResolvedValue(mockResponse({ ok: false, status: 404, body: { detail: 'Task not found' } }));
  await expect(api.getTask('nope')).rejects.toMatchObject({ status: 404, detail: 'Task not found' });
  await expect(api.getTask('nope')).rejects.toBeInstanceOf(ApiError);
});
