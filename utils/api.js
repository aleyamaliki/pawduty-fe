import { API_BASE } from '../constants/api';

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, options = {}) {
  const { headers: customHeaders, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...customHeaders },
    ...rest,
  });
  if (!res.ok) {
    let detail;
    try {
      const body = await res.json();
      detail = body?.detail;
    } catch (e) {
      detail = undefined;
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listTasks: () => request('/tasks'),
  listPets: () => request('/pets'),
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id, fields) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
