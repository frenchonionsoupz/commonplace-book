import { useState, useRef, useCallback } from 'react';
import { Monitor, Square, Loader2 } from 'lucide-react';

interface Props {
  onRecordingComplete: (blob: Blob) => void;
  onMediaUrl?: (url: string) => void;
}

export default function ScreenRecorder({ onRecordingComplete, onMediaUrl }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        stream.getTracks().forEach((t) => t.stop());

        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', blob, 'screen-recording.webm');
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.url) onMediaUrl?.(data.url);
        } catch {
          // Upload will be retried when saving
        }

        onRecordingComplete(blob);
        setIsUploading(false);
      };

      // Handle user stopping screen share via browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        alert('Screen recording failed. Your browser may not support this feature.');
      }
    }
  }, [onRecordingComplete, onMediaUrl]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isUploading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-parchment-100 rounded-lg border border-parchment-300">
        <Loader2 className="w-5 h-5 text-ink-600 animate-spin" />
        <span className="text-sm text-ink-600">Uploading recording...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isRecording ? (
        <>
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <Square className="w-4 h-4" />
            Stop Recording
          </button>
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <div className="w-3 h-3 rounded-full bg-red-500 recording-pulse" />
            <span className="font-mono">{formatTime(duration)}</span>
          </div>
        </>
      ) : (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 btn-secondary"
        >
          <Monitor className="w-4 h-4" />
          Record Screen
        </button>
      )}
    </div>
  );
}
