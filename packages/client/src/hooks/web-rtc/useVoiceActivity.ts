// usePeerConnections.js
import { useRef, useCallback, useState, useEffect } from 'react';

interface VoiceActivityProps {
  stream: MediaStream | null;
  threshold: number;
}

/**
 * @function useVoiceActivity - Check if user is speaking in a stream
 * @param {VoiceActivityProps} props - Props for the hook
 * @param {MediaStream} props.stream - Media stream to check
 * @param {number} props.threshold - Threshold for audio level
 * @returns {boolean} isActive - True if user is speaking, false otherwise
 */
const useVoiceActivity = ({ stream, threshold }: VoiceActivityProps): boolean => {
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!stream) return;

    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudioLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

      if (average > threshold) {
        setIsActive(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsActive(false), 500);
      }
    };

    const intervalId = setInterval(checkAudioLevel, 100);

    return () => {
      clearInterval(intervalId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream, threshold]);

  return isActive;
};

export default useVoiceActivity;
