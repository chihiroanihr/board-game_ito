import { useCallback, useEffect, useState } from 'react';

interface VoiceActivityProps {
  stream: MediaStream | null;
  baseThreshold: number;
  isMuted: boolean;
}

/**
 * @function useVoiceActivity - A hook that detects voice activity in the local stream.
 * @param {VoiceActivityProps} props - Props for the hook
 * @param {MediaStream} props.stream - Media stream to check
 * @param {number} props.threshold - Threshold for audio level
 * @param {boolean} props.isMuted - Whether the stream is muted
 * @param {Function} props.onVoiceActivity - Callback function to be called when voice activity changes
 */
const useVoiceActivity = ({ stream, baseThreshold = 30, isMuted }: VoiceActivityProps) => {
  const [isActive, setIsActive] = useState(false);
  const [dynamicThreshold, setDynamicThreshold] = useState(baseThreshold);

  const checkAudioLevel = useCallback(
    (analyser: AnalyserNode, dataArray: Uint8Array) => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / analyser.frequencyBinCount;

      // Update dynamic threshold (dynamic threshold: a threshold that slowly adapts to the audio environment.)
      setDynamicThreshold((prevThreshold) => {
        const newThreshold = prevThreshold * 0.95 + average * 0.05;
        return Math.max(baseThreshold, newThreshold);
      });

      // Implement hysteresis to prevent rapid switching between active and inactive states.
      if (isActive) {
        return average > dynamicThreshold * 0.8; // Lower threshold to stay active
      } else {
        return average > dynamicThreshold * 1.2; // Higher threshold to become active
      }
    },
    [baseThreshold, dynamicThreshold, isActive]
  );

  useEffect(() => {
    if (!stream || isMuted) {
      setIsActive(false);
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const intervalId = setInterval(() => {
      const isActiveUpdated = checkAudioLevel(analyser, dataArray);
      setIsActive(isActiveUpdated);
    }, 100);

    return () => {
      clearInterval(intervalId);
      audioContext.close();
    };
  }, [checkAudioLevel, isMuted, stream]);

  return isActive;
};

export default useVoiceActivity;
