import { Note, TagCount, AuthResponse, User, ExportFilter } from './types';

const BASE = '/api';
const TOKEN_KEY = 'commonplace_token';

// Token management
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${url}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearToken();
    }
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  signup(email: string, password: string, name?: string) {
    return request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe() {
    return request<{ user: User }>('/auth/me');
  },

  // Notes
  getNotes(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Note[]>(`/notes${qs}`);
  },

  getNote(id: string) {
    return request<Note>(`/notes/${id}`);
  },

  createNote(data: Partial<Note>) {
    return request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateNote(id: string, data: Partial<Note>) {
    return request<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteNote(id: string) {
    return request<void>(`/notes/${id}`, { method: 'DELETE' });
  },

  getTags() {
    return request<TagCount[]>('/notes/meta/tags');
  },

  // File upload
  async uploadFile(file: Blob, filename: string) {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file, filename);
    const res = await fetch(`${BASE}/upload`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json() as Promise<{ url: string; filename: string }>;
  },

  // Audio transcription
  async transcribe(audioBlob: Blob, filename: string) {
    const token = getToken();
    const formData = new FormData();
    formData.append('audio', audioBlob, filename);
    const res = await fetch(`${BASE}/transcribe`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Transcription failed');
    return res.json() as Promise<{ url: string; transcription: string; message?: string }>;
  },

  // Video transcription
  async transcribeVideo(file: File) {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file, file.name);
    const res = await fetch(`${BASE}/transcribe/video`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Video transcription failed');
    return res.json() as Promise<{ url: string; transcription: string; message?: string }>;
  },

  // Export
  exportToEmail(email: string, filter: ExportFilter) {
    return request<{ success: boolean; message: string }>('/export/email', {
      method: 'POST',
      body: JSON.stringify({ email, filter }),
    });
  },
};
