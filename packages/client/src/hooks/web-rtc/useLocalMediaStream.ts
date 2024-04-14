import { useState, useEffect } from 'react';

const useLocalMediaStream = () => {
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  useEffect(() => {
    // Access media
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      // Start signaling
      .then((stream) => {
        // Initialize with muted state
        // stream.getTracks().forEach((track) => (track.enabled = false));
        // stream.getAudioTracks()[0]!.enabled = false;
        // Save local media stream
        setLocalMediaStream(stream);
      })
      .catch((error) =>
        console.error(
          `Failed to read write to local storage: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      );
  }, []);

  const closeMediaStream = () => {
    if (localMediaStream) {
      // localMediaStream.getTracks().forEach((track) => track.stop());
      localMediaStream.getAudioTracks()[0]!.stop();
      setLocalMediaStream(null);
    }
  };

  const toggleMic = () => {
    if (localMediaStream) {
      setIsMuted((prevMuted) => !prevMuted);
    }
  };

  return { localMediaStream, closeMediaStream, isMuted, toggleMic };
};

export default useLocalMediaStream;
