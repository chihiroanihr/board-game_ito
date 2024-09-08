import { useEffect } from 'react';

interface VoiceActivityProps {
  stream: MediaStream | null;
  threshold: number;
  isMuted: boolean;
  onVoiceActivity: (isActive: boolean) => void;
}

/**
 * @function useVoiceActivity - A hook that detects voice activity in the local stream.
 * @param {VoiceActivityProps} props - Props for the hook
 * @param {MediaStream} props.stream - Media stream to check
 * @param {number} props.threshold - Threshold for audio level
 * @param {boolean} props.isMuted - Whether the stream is muted
 * @param {Function} props.onVoiceActivity - Callback function to be called when voice activity changes
 */
const useVoiceActivity = ({ stream, threshold, isMuted, onVoiceActivity }: VoiceActivityProps) => {
  useEffect(() => {
    if (!stream || isMuted) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let isActive = false;

    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

      const newIsActive = average > threshold;
      if (newIsActive !== isActive) {
        isActive = newIsActive;
        onVoiceActivity(isActive);
      }
    };

    const intervalId = setInterval(checkAudioLevel, 100);

    return () => {
      clearInterval(intervalId);
      audioContext.close();
    };
  }, [isMuted, onVoiceActivity, stream, threshold]);
};

export default useVoiceActivity;
