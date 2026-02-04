import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface Props {
  onRecordingComplete: (blob: Blob, transcription: string) => void;
  onMediaUrl?: (url: string) => void;
}

export default function VoiceRecorder({ onRecordingComplete, onMediaUrl }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        stream.getTracks().forEach((t) => t.stop());

        setIsTranscribing(true);

        // Try server-side transcription first
        try {
          const formData = new FormData();
          formData.append('audio', blob, `voice-note.${blob.type.includes('webm') ? 'webm' : 'mp4'}`);
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
          const data = await res.json();

          if (data.url) onMediaUrl?.(data.url);

          if (data.transcription) {
            onRecordingComplete(blob, data.transcription);
            setIsTranscribing(false);
            return;
          }
        } catch {
          // Fall through to browser transcription
        }

        // Fallback: browser Web Speech API
        const transcription = await browserTranscribe(blob);
        onRecordingComplete(blob, transcription);
        setIsTranscribing(false);
      };

      mediaRecorder.start(1000); // collect data every second
      setIsRecording(true);
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err: any) {
      alert('Microphone access denied. Please allow microphone access to record voice notes.');
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

  if (isTranscribing) {
    return (
      <div className="flex items-center gap-3 p-4 bg-parchment-100 rounded-lg border border-parchment-300">
        <Loader2 className="w-5 h-5 text-ink-600 animate-spin" />
        <span className="text-sm text-ink-600">Transcribing audio...</span>
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
          <Mic className="w-4 h-4" />
          Record Voice Note
        </button>
      )}
    </div>
  );
}

// Browser-based speech recognition fallback
function browserTranscribe(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      resolve('(Browser speech recognition not available. Set OPENAI_API_KEY for server transcription.)');
      return;
    }

    // For browser speech recognition, we play audio and let the recognition engine listen
    // This is a simplified approach — real-time recognition during recording is more reliable
    const audio = new Audio(URL.createObjectURL(blob));
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let transcript = '';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        }
      }
    };

    recognition.onend = () => {
      resolve(transcript.trim() || '(No speech detected)');
    };

    recognition.onerror = () => {
      resolve(transcript.trim() || '(Transcription failed. Set OPENAI_API_KEY for better results.)');
    };

    // Start recognition — note: browser speech recognition works with mic, not audio playback
    // So this fallback mainly captures during live recording
    recognition.start();
    audio.play().catch(() => {});

    // Stop after audio ends or timeout
    audio.onended = () => {
      setTimeout(() => recognition.stop(), 1000);
    };

    // Safety timeout
    setTimeout(() => {
      try { recognition.stop(); } catch {}
    }, 60000);
  });
}
