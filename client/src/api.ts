import { Note, TagCount } from './types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
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
    const formData = new FormData();
    formData.append('file', file, filename);
    const res = await fetch(`${BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json() as Promise<{ url: string; filename: string }>;
  },

  // Transcription
  async transcribe(audioBlob: Blob, filename: string) {
    const formData = new FormData();
    formData.append('audio', audioBlob, filename);
    const res = await fetch(`${BASE}/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Transcription failed');
    return res.json() as Promise<{ url: string; transcription: string; message?: string }>;
  },
};
