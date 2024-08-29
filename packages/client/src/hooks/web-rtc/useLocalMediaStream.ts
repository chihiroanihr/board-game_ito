import { useState, useEffect, useCallback } from 'react';

const useLocalMediaStream = () => {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);

  /**
   * Handler to stop and remove tracks from the local media stream
   */
  const closeLocalMediaStream = useCallback(() => {
    if (localMediaStream) {
      localMediaStream.getTracks().forEach((track) => {
        track.stop(); // Stop media track
        localMediaStream.removeTrack(track); // Remove media track from the stream
      });
    }
  }, [localMediaStream]);

  /**
   * Toggle mute button handler
   */
  const toggleMuteMediaStream = () => {
    setIsMuted((prevMuted) => !prevMuted);
  };

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
          `Failed to read write to local storage: ${error instanceof Error ? error.message : error}`
        )
      );
  }, []);

  useEffect(() => {
    // Close media when unmounted
    return () => closeLocalMediaStream();
  }, [closeLocalMediaStream]);

  return { localMediaStream, closeLocalMediaStream, toggleMuteMediaStream, isMuted };
};

export default useLocalMediaStream;
