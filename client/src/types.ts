export type NoteType = 'text' | 'voice' | 'video';

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
