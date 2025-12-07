// API Client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Storage for JWT token
const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Generic API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  async signup(email: string, password: string, rollNo?: string, name?: string, dob?: string) {
    const data = await apiRequest<{ user: any; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, rollNo, name, dob }),
    });
    setToken(data.token);
    return data.user;
  },

  async login(email: string, password: string) {
    const data = await apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data.user;
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
    }
  },

  async getCurrentUser() {
    const data = await apiRequest<{ user: any }>('/auth/me');
    return data.user;
  },

  async updateConsent(consentDate: string) {
    const data = await apiRequest<{ user: any }>('/auth/consent', {
      method: 'PATCH',
      body: JSON.stringify({ consentDate }),
    });
    return data.user;
  },
};

// Results API
export const resultsAPI = {
  async saveResult(gameId: string, score: number, accuracy: number, reactionTime: number, errorCount?: number, errorRate?: number, details?: any) {
    const data = await apiRequest<{ result: any }>('/results', {
      method: 'POST',
      body: JSON.stringify({ gameId, score, accuracy, reactionTime, errorCount, errorRate, details }),
    });
    return data.result;
  },

  async getResults() {
    const data = await apiRequest<{ results: any[] }>('/results');
    return data.results;
  },

  async getResultsByGame(gameId: string) {
    const data = await apiRequest<{ results: any[] }>(`/results/${gameId}`);
    return data.results;
  },

  async deleteResult(id: string) {
    await apiRequest(`/results/${id}`, { method: 'DELETE' });
  },
};

// Admin API
export const adminAPI = {
  async getUsers() {
    const data = await apiRequest<{ users: any[] }>('/admin/users');
    return data.users;
  },

  async getUser(id: string) {
    const data = await apiRequest<{ user: any }>(`/admin/users/${id}`);
    return data.user;
  },

  async deleteUser(id: string) {
    await apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
  },

  async getAllResults() {
    const data = await apiRequest<{ results: any[] }>('/admin/results');
    return data.results;
  },

  async getUserResults(userId: string) {
    const data = await apiRequest<{ results: any[] }>(`/admin/results/user/${userId}`);
    return data.results;
  },

  async getStats() {
    const data = await apiRequest<{ stats: any }>('/admin/stats');
    return data.stats;
  },

  async deleteResult(id: string) {
    await apiRequest(`/admin/results/${id}`, { method: 'DELETE' });
  },

  async resetDatabase() {
    await apiRequest('/admin/reset', { method: 'POST' });
  },
};

// Health check
export async function checkHealth() {
  try {
    const data = await apiRequest<{ status: string; timestamp: string }>('/health');
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
}
