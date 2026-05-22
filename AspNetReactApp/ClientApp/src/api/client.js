const defaultHeaders = {
  'Content-Type': 'application/json'
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
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
  getGoals: () => request('/api/goals'),
  createGoal: (payload) => request('/api/goals', { method: 'POST', body: JSON.stringify(payload) }),

  getProjects: (goalId) => request(withQuery('/api/projects', 'goalId', goalId)),
  createProject: (payload) => request('/api/projects', { method: 'POST', body: JSON.stringify(payload) }),

  getTasks: (projectId) => request(withQuery('/api/tasks', 'projectId', projectId)),
  createTask: (payload) => request('/api/tasks', { method: 'POST', body: JSON.stringify(payload) }),

  getExecutors: () => request('/api/executors'),
  createExecutor: (payload) => request('/api/executors', { method: 'POST', body: JSON.stringify(payload) }),

  getResponsiblePersons: () => request('/api/responsible-persons'),
  createResponsiblePerson: (payload) => request('/api/responsible-persons', { method: 'POST', body: JSON.stringify(payload) }),

  getTimeEntries: (taskId) => request(withQuery('/api/timeentries', 'taskId', taskId)),
  createTimeEntry: (payload) => request('/api/timeentries', { method: 'POST', body: JSON.stringify(payload) })
};
