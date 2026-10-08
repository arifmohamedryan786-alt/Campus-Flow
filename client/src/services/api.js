const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function getAuthHeaders() {
  const token = localStorage.getItem('campusflow_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('campusflow_token');
      localStorage.removeItem('campusflow_user');
    }
    throw new Error(data.error || 'An unexpected error occurred');
  }
  return data;
}

export const api = {
  // Auth
  async login(identifier, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    return handleResponse(res);
  },

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } finally {
      localStorage.removeItem('campusflow_token');
      localStorage.removeItem('campusflow_user');
    }
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async changePassword(currentPassword, newPassword) {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return handleResponse(res);
  },

  // Dashboard
  async getDashboard() {
    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Timetable
  async getTimetable(day = '') {
    const url = day ? `${API_BASE_URL}/timetable?day=${encodeURIComponent(day)}` : `${API_BASE_URL}/timetable`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Attendance
  async getAttendance() {
    const res = await fetch(`${API_BASE_URL}/attendance`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getAttendancePrediction() {
    const res = await fetch(`${API_BASE_URL}/attendance/prediction`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async markAttendance(subjectId, status) {
    const res = await fetch(`${API_BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ subjectId, status })
    });
    return handleResponse(res);
  },

  // Tasks
  async getTasks(status = '') {
    const url = status ? `${API_BASE_URL}/tasks?status=${encodeURIComponent(status)}` : `${API_BASE_URL}/tasks`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createTask(taskData) {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return handleResponse(res);
  },

  async updateTask(id, taskData) {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return handleResponse(res);
  },

  async deleteTask(id) {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Profile & Settings
  async getProfile() {
    const res = await fetch(`${API_BASE_URL}/profile`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  async updateSettings(settingsData) {
    const res = await fetch(`${API_BASE_URL}/profile/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settingsData)
    });
    return handleResponse(res);
  },

  // AI
  async getAIPriorities() {
    const res = await fetch(`${API_BASE_URL}/ai/priorities`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async askAIAssistant(query) {
    const res = await fetch(`${API_BASE_URL}/ai/assistant`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query })
    });
    return handleResponse(res);
  }
};
