import { useState, useRef, useCallback } from 'react';
import { Upload, Film, Loader2, X } from 'lucide-react';

interface Props {
  onTranscriptionComplete: (transcription: string, mediaUrl: string) => void;
}

export default function VideoUploader({ onTranscriptionComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setFileName(file.name);
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const res = await fetch('/api/transcribe/video', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.message || 'Transcription failed');
        setIsTranscribing(false);
        return;
      }

      onTranscriptionComplete(data.transcription || '', data.url || '');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscriptionComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (isTranscribing) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 bg-parchment-100 rounded-lg border border-parchment-300">
        <Loader2 className="w-8 h-8 text-parchment-700 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-ink-700">Transcribing video...</p>
          <p className="text-xs text-ink-500 mt-1">{fileName}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
          isDragging
            ? 'border-parchment-600 bg-parchment-100'
            : 'border-parchment-300 hover:border-parchment-500 hover:bg-parchment-50'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-parchment-100 flex items-center justify-center">
          {isDragging ? (
            <Film className="w-6 h-6 text-parchment-700" />
          ) : (
            <Upload className="w-6 h-6 text-parchment-600" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-ink-700">
            {isDragging ? 'Drop your video here' : 'Upload a video to transcribe'}
          </p>
          <p className="text-xs text-ink-500 mt-1">
            Drag & drop or click to select (max 25MB)
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*,.mp4,.webm,.mp3,.m4a,.wav,.ogg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && (
        <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
