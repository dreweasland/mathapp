import { useEffect, useRef, useState } from 'react';
import type { CheerAudio } from '../db/db';
import { createClipPlayer } from '../audio/clip';

const MAX_MS = 20_000;

const supported = () =>
  typeof MediaRecorder !== 'undefined' && navigator.mediaDevices?.getUserMedia !== undefined;

/** Up to 20 seconds, listened to before sending. The audio stays on this device. */
export function Recorder({ onSave }: { onSave: (audio: CheerAudio) => void }) {
  const recorder = useRef<MediaRecorder>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stopStream = useRef<() => void>(undefined);
  const [player] = useState(createClipPlayer);
  const [state, setState] = useState<'idle' | 'recording' | 'review'>('idle');
  const [take, setTake] = useState<CheerAudio>();
  const [problem, setProblem] = useState('');

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      stopStream.current?.();
      player.stop();
    },
    [player],
  );

  if (!supported()) {
    return <p className="text-sm">This browser can't record, so send a picture instead.</p>;
  }

  const stop = () => {
    clearTimeout(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
  };

  const start = async () => {
    setProblem('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stopStream.current = () => stream.getTracks().forEach((t) => t.stop());
      const media = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      media.ondataavailable = (e) => chunks.push(e.data);
      media.onstop = () => {
        stopStream.current?.();
        const blob = new Blob(chunks, { type: media.mimeType });
        void blob.arrayBuffer().then((bytes) => {
          setTake({ bytes, type: media.mimeType });
          setState('review');
        });
      };
      recorder.current = media;
      media.start();
      setState('recording');
      timer.current = setTimeout(stop, MAX_MS);
    } catch {
      setProblem('The microphone is not available. Check its permission in Settings.');
    }
  };

  const reset = () => {
    player.stop();
    setTake(undefined);
    setState('idle');
  };

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="recorder">
      {state === 'idle' && (
        <button type="button" className="p-btn" onClick={() => void start()}>
          Record a message
        </button>
      )}
      {state === 'recording' && (
        <button type="button" className="p-btn p-btn-main" onClick={stop}>
          Stop recording
        </button>
      )}
      {state === 'review' && take && (
        <>
          <button type="button" className="p-btn" onClick={() => player.play(take)}>
            Listen
          </button>
          <button
            type="button"
            className="p-btn p-btn-main"
            onClick={() => {
              onSave(take);
              reset();
            }}
          >
            Send
          </button>
          <button type="button" className="p-btn" onClick={reset}>
            Discard
          </button>
        </>
      )}
      {problem && (
        <p role="alert" className="text-sm font-bold">
          {problem}
        </p>
      )}
    </div>
  );
}
