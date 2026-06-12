import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import styled, { keyframes } from 'styled-components';
import { Mic, StopCircle, Trash2, AlertCircle } from 'lucide-react';
import { getAudioUploadUrl, deleteAudioFile } from '../utils/api';
import { formatTimer } from '../utils/time';
import { Label, FormGroup } from './ui/Input';
import Button from './ui/Button';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
`;

const RecordBtn = styled(Button)`
  background: ${({ theme }) => theme.danger};
  color: #fff;
  border: none;
  &:hover { opacity: 0.9; }
`;

const RecordingBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Dot = styled.span`
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.danger};
  flex-shrink: 0;
  animation: ${pulse} 1.2s ease-in-out infinite;
`;

const Timer = styled.span`
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.85rem;
  color: ${({ $warn, theme }) => $warn ? theme.danger : theme.text};
  min-width: 2.25rem;
`;

const LevelTrack = styled.div`
  flex: 1;
  height: 4px;
  background: ${({ theme }) => theme.border};
  border-radius: 2px;
  overflow: hidden;
`;

const LevelFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.danger};
  border-radius: 2px;
  transition: width 0.05s linear;
  width: ${({ $pct }) => $pct}%;
`;

const AudioRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const StopBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3125rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.62rem;
  font-weight: 700;
  color: ${({ theme }) => theme.danger};
  border: 1px solid ${({ theme }) => theme.danger};
  background: transparent;
  padding: 0.4rem 0.75rem;
  border-radius: 0.25rem;
  opacity: 0.85;
  transition: all 0.15s;

  &:hover { opacity: 1; }
`;

const StyledAudio = styled.audio`
  width: 100%;
  display: ${({ $visible }) => $visible ? 'block' : 'none'};
  border-radius: ${({ theme }) => theme.radiusSm};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ErrorMsg = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.danger};
`;

const Hint = styled.span`
  font-size: 0.82rem;
  opacity: 0.5;
`;

const wave = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50%       { transform: scaleY(1); }
`;

const Waveform = styled.div`
  display: flex;
  align-items: center;
  gap: 0.1875rem;
  height: 1.5rem;
`;

const WaveBar = styled.span`
  display: block;
  width: 0.1875rem;
  height: 100%;
  border-radius: 2px;
  background: ${({ theme }) => theme.primary};
  transform-origin: center;
  animation: ${wave} 0.9s ease-in-out infinite;
  animation-delay: ${({ $i }) => $i * 0.12}s;
`;

const MIME_TYPE = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
  ? 'audio/webm'
  : 'audio/mp4';


const AudioRecorder = forwardRef(function AudioRecorder({ jokeId, audioUrl, onChange, onDuration, onStatusChange, maxDuration = 300 }, ref) {
  const [status, setStatus] = useState(audioUrl ? 'done' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');

  function applyStatus(next) {
    setStatus(next);
    onStatusChange?.(next);
  }

  useImperativeHandle(ref, () => ({
    upload: handleUpload,
    discard,
  }));

  const [localUrl, setLocalUrl] = useState(null);
  const [audioReady, setAudioReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const blobRef = useRef(null);
  const localUrlRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const maxTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (audioUrl && status === 'idle') applyStatus('done');
  }, [audioUrl, status]);

  useEffect(() => {
    return () => {
      if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
      stopFeedback();
      if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Apply WebM duration fix to the JSX audio element via ref.
  // WebM blobs from MediaRecorder report duration=Infinity until the browser
  // scans the whole file, which we trigger by seeking past the end.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !localUrl) return;

    let cancelled = false;
    setAudioReady(false);

    el.src = localUrl;
    el.load();

    const onMetadata = () => {
      if (cancelled) return;
      if (isFinite(el.duration)) { setAudioReady(true); return; }
      el.currentTime = 1e101;
      el.addEventListener('timeupdate', () => {
        if (cancelled) return;
        el.currentTime = 0;
        setAudioReady(true);
      }, { once: true });
    };

    el.addEventListener('loadedmetadata', onMetadata, { once: true });
    const fallback = setTimeout(() => { if (!cancelled) setAudioReady(true); }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      el.removeEventListener('loadedmetadata', onMetadata);
    };
  }, [localUrl]);

  function startFeedback(stream) {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setLevel(Math.round((avg / 255) * 100));
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch { /* Web Audio unavailable - meter stays at 0 */ }
  }

  function stopFeedback() {
    clearInterval(timerRef.current);
    clearTimeout(maxTimerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    setLevel(0);
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }

  async function startRecording() {
    setErrorMsg('');
    applyStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: MIME_TYPE });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = () => {
        const durationSecs = Math.round((Date.now() - startTimeRef.current) / 1000);
        stopFeedback();
        const blob = new Blob(chunksRef.current, { type: MIME_TYPE });
        blobRef.current = blob;
        if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
        const url = URL.createObjectURL(blob);
        localUrlRef.current = url;
        setLocalUrl(url);
        applyStatus('recorded');
        stream.getTracks().forEach(t => t.stop());
        onDuration?.(durationSecs);
      };

      mr.start();
      maxTimerRef.current = setTimeout(() => stopRecording(), maxDuration * 1000);
      startTimeRef.current = Date.now();
      startFeedback(stream);
      applyStatus('recording');
    } catch {
      streamRef.current?.getTracks().forEach(t => t.stop());
      setErrorMsg('Recording failed. Check microphone permissions and try again.');
      applyStatus('error');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function handleUpload() {
    const MAX_BYTES = 15 * 1024 * 1024;
    if (blobRef.current?.size > MAX_BYTES) {
      setErrorMsg('Recording is too large to save. Maximum is 5 minutes.');
      applyStatus('error');
      return;
    }
    applyStatus('uploading');
    try {
      const { uploadUrl, audioUrl: newAudioUrl } = await getAudioUploadUrl(jokeId, MIME_TYPE);
      await fetch(uploadUrl, { method: 'PUT', body: blobRef.current, headers: { 'Content-Type': MIME_TYPE } });
      onChange(newAudioUrl);
      applyStatus('done');
      return newAudioUrl;
    } catch {
      applyStatus('error');
      throw new Error('Upload failed');
    }
  }

  function discard() {
    if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current);
    localUrlRef.current = null;
    setLocalUrl(null);
    blobRef.current = null;
    applyStatus('idle');
  }

  async function deleteRecording() {
    try {
      await deleteAudioFile(jokeId);
    } catch { /* best-effort */ }
    onChange(null);
    applyStatus('idle');
  }

  return (
    <FormGroup>
      <Label>Recording (max {Math.round(maxDuration / 60)} min)</Label>
      <AudioRow>
        {(status === 'idle' || status === 'requesting') && (
          <RecordBtn type="button" onClick={startRecording} $loading={status === 'requesting'} disabled={status === 'requesting'}>
            <Mic size={15} strokeWidth={2} />
            Record
          </RecordBtn>
        )}

        {status === 'recording' && (
          <RecordingBar>
            <Dot />
            <Timer $warn={elapsed >= maxDuration - Math.min(30, Math.ceil(maxDuration * 0.3))}>{formatTimer(elapsed)}</Timer>
            <LevelTrack><LevelFill $pct={level} /></LevelTrack>
            <StopBtn type="button" onClick={stopRecording}>
              <StopCircle size={14} strokeWidth={2.5} />
              STOP
            </StopBtn>
          </RecordingBar>
        )}

        {(status === 'recorded' || status === 'uploading') && (
          <>
            <StyledAudio ref={audioRef} controls $visible={audioReady} />
            {!audioReady && <Waveform>{[0,1,2,3,4].map(i => <WaveBar key={i} $i={i} />)}</Waveform>}
            <ActionRow>
              <Button type="button" onClick={handleUpload} disabled={status === 'uploading' || !audioReady}>
                {status === 'uploading' ? 'Saving…' : 'Save recording'}
              </Button>
              <Button type="button" $variant="ghost" onClick={discard} disabled={status === 'uploading'}>
                Discard
              </Button>
            </ActionRow>
          </>
        )}

        {status === 'done' && (localUrl || audioUrl) && (
          <>
            <StyledAudio $visible controls src={localUrl || audioUrl} />
            <Button type="button" $variant="ghost" onClick={deleteRecording}>
              <Trash2 size={14} strokeWidth={2} />
              Delete recording
            </Button>
          </>
        )}

        {status === 'done' && !audioUrl && (
          <Hint>Recording saved - hit Save Joke to keep it.</Hint>
        )}

        {status === 'error' && (
          <>
            <ErrorMsg><AlertCircle size={14} strokeWidth={2} style={{ marginRight: '0.3125rem', verticalAlign: 'middle' }} />{errorMsg || 'Recording failed. Check microphone permissions and try again.'}</ErrorMsg>
            <Button type="button" $variant="ghost" onClick={() => applyStatus('idle')}>Try again</Button>
          </>
        )}
      </AudioRow>
    </FormGroup>
  );
});

export default AudioRecorder;
