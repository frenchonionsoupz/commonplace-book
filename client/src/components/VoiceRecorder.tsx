import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { api } from '../api';

interface Props {
  onRecordingComplete: (blob: Blob, transcription: string) => void;
  onMediaUrl?: (url: string) => void;
}

export default function VoiceRecorder({ onRecordingComplete, onMediaUrl }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  // Keep callbacks accessible after unmount for background upload
  const callbacksRef = useRef({ onRecordingComplete, onMediaUrl });
  callbacksRef.current = { onRecordingComplete, onMediaUrl };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start browser speech recognition for real-time transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalText = '';
          let interimText = '';
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript;
            } else {
              interimText += result[0].transcript;
            }
          }
          transcriptRef.current = finalText + interimText;
          setLiveTranscript(finalText + interimText);
        };

        // Restart recognition if it stops unexpectedly during recording
        recognition.onend = () => {
          if (mediaRecorderRef.current?.state === 'recording') {
            try { recognition.start(); } catch {}
          }
        };

        recognition.onerror = () => {};
        recognitionRef.current = recognition;
        recognition.start();
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach((t) => t.stop());

        // Stop speech recognition
        try { recognitionRef.current?.stop(); } catch {}
        recognitionRef.current = null;

        const browserTranscript = transcriptRef.current.trim();
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';

        // Upload audio to server and wait for the media URL before completing
        setIsTranscribing(true);
        try {
          const data = await api.transcribe(blob, `voice-note.${ext}`);
          if (data.url) callbacksRef.current.onMediaUrl?.(data.url);
          // Use browser transcript if available (instant), otherwise use server transcription
          const transcript = browserTranscript || data.transcription || '';
          callbacksRef.current.onRecordingComplete(blob, transcript);
        } catch {
          // Upload failed — use browser transcript if we have one
          callbacksRef.current.onRecordingComplete(blob, browserTranscript || '(Transcription failed)');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setDuration(0);
      setLiveTranscript('');
      transcriptRef.current = '';
      timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      alert('Microphone access denied. Please allow microphone access to record voice notes.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (isTranscribing) {
    return (
      <div className="flex items-center gap-3 p-4 bg-parchment-100 rounded-lg border border-parchment-300">
        <Loader2 className="w-5 h-5 text-ink-600 animate-spin" />
        <span className="text-sm text-ink-600">Saving audio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
      {isRecording && liveTranscript && (
        <div className="p-3 bg-parchment-50 rounded-lg border border-parchment-200 text-sm text-ink-600 font-serif italic">
          {liveTranscript}
        </div>
      )}
    </div>
  );
}
