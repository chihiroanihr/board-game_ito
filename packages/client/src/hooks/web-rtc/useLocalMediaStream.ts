import { useState, useEffect, useCallback } from 'react';

const useLocalMediaStream = () => {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Access media
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      // Start signaling
      .then((stream) => {
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

  const closeMediaStream = useCallback(() => {
    if (localMediaStream) {
      localMediaStream.getTracks().forEach((track) => {
        track.stop(); // Stop media track
        localMediaStream.removeTrack(track); // Remove media track from the stream
      });

      // setLocalMediaStream(null); // Reset media
    }
  }, [localMediaStream]);

  /**
   * Toggle mute button handler
   */
  const toggleMuteMediaStream = () => {
    setIsMuted((prevMuted) => !prevMuted);
  };

  return { localMediaStream, closeMediaStream, toggleMuteMediaStream, isMuted };
};

export default useLocalMediaStream;
