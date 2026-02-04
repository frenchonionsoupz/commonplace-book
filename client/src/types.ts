export type NoteType = 'text' | 'voice' | 'screen';
export type SourceType = '' | 'podcast' | 'article' | 'lecture' | 'book' | 'video' | 'other';

export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  source: string;
  source_type: SourceType;
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
