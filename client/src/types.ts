export type NoteType = 'text' | 'voice';

export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  source: string;
  media_url: string;
  transcription: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  tags: string[];
}

export interface TagCount {
  name: string;
  count: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type ExportFilter = 'new' | 'all' | `days:${number}`;
