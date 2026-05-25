const defaultHeaders = {
  'Content-Type': 'application/json'
};

let guestMode = false;

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (guestMode && method !== 'GET') {
    throw new Error('В гостевом профиле редактирование запрещено! Войдите в свой профиль.');
  }

  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function withQuery(basePath, key, value) {
  if (value === null || value === undefined || value === '') {
    return basePath;
  }

  return `${basePath}?${key}=${encodeURIComponent(value)}`;
}

export const apiClient = {
  setGuestMode: (enabled) => {
    guestMode = !!enabled;
  },

  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),
  getProfile: () => request('/api/profile'),
  updateProfile: (payload) => request('/api/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  changeCredentials: (payload) => request('/api/account/change-credentials', { method: 'POST', body: JSON.stringify(payload) }),

  getGoals: () => request('/api/goals'),
  createGoal: (payload) => request('/api/goals', { method: 'POST', body: JSON.stringify(payload) }),

  getProjects: (goalId) => request(withQuery('/api/projects', 'goalId', goalId)),
  createProject: (payload) => request('/api/projects', { method: 'POST', body: JSON.stringify(payload) }),

  getTasks: (projectId) => request(withQuery('/api/tasks', 'projectId', projectId)),
  createTask: (payload) => request('/api/tasks', { method: 'POST', body: JSON.stringify(payload) }),

  getExecutors: () => request('/api/executors'),
  createExecutor: (payload) => request('/api/executors', { method: 'POST', body: JSON.stringify(payload) }),
  deleteExecutor: (id) => request(`/api/executors/${id}`, { method: 'DELETE' }),
  updateExecutor: (id, payload) => request(`/api/executors/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getLeaders: () => request('/api/leaders'),
  createLeader: (payload) => request('/api/leaders', { method: 'POST', body: JSON.stringify(payload) }),
  deleteLeader: (id) => request(`/api/leaders/${id}`, { method: 'DELETE' }),
  updateLeader: (id, payload) => request(`/api/leaders/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getTimeEntries: (taskId) => request(withQuery('/api/timeentries', 'taskId', taskId)),
  createTimeEntry: (payload) => request('/api/timeentries', { method: 'POST', body: JSON.stringify(payload) })
};
