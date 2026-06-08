import { useState, useEffect, useRef } from 'react';

export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  function start() { setRunning(true); }
  function stop() { setRunning(false); }
  function reset() { setRunning(false); setSeconds(0); }

  return { seconds, running, start, stop, reset };
}
