import { useState, useCallback } from 'react';

/**
 * @function useLocalMediaStream - A hook that manages the local media stream, including muting and unmuting.
 * @returns {Object} localMediaStream, closeLocalMediaStream, toggleMuteMediaStream, isMuted
 * @returns {MediaStream} localMediaStream - The local media stream
 * @returns {Function} closeLocalMediaStream - Handler to stop and remove tracks from the local media stream
 * @returns {Function} toggleMuteMediaStream - Toggle mute button handler
 * @returns {boolean} isMuted - Whether the stream is muted
 * @example
 * const { localMediaStream, closeLocalMediaStream, toggleMuteMediaStream, isMuted } = useLocalMediaStream();
 */
const useLocalMediaStream = () => {
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);

  /**
   * Handler to open local media stream
   */
  const openLocalMediaStream = useCallback(() => {
    // Access media
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      // Start signaling
      .then((stream) => {
        // Mute the stream by default
        stream.getTracks().forEach((track) => {
          track.enabled = false;
        });
        // Save local media stream
        setLocalMediaStream(stream);
      })
      .catch((error) =>
        console.error(
          `Failed to read write to local storage: ${error instanceof Error ? error.message : error}`
        )
      );

    console.log('Media opened.');
  }, []);

  /**
   * Handler to stop and remove tracks from the local media stream
   */
  const closeLocalMediaStream = useCallback(() => {
    if (localMediaStream) {
      localMediaStream.getTracks().forEach((track) => {
        track.enabled = false; // Mute back
        track.stop(); // Stop media track
        localMediaStream.removeTrack(track); // Remove media track from the stream
      });

      console.log('Remaining tracks:', localMediaStream.getTracks());

      setLocalMediaStream(null);

      console.log('Local media stream closed.');
    }
  }, [localMediaStream]);

  /**
   * Toggle mute button handler
   */
  const toggleMuteMediaStream = useCallback(() => {
    if (localMediaStream) {
      localMediaStream.getTracks().forEach((track) => {
        track.enabled = isMuted; // Toggle the track's enabled state
      });
      setIsMuted((prevMuted) => !prevMuted);
    }
  }, [isMuted, localMediaStream]);

  return {
    localMediaStream,
    openLocalMediaStream,
    closeLocalMediaStream,
    toggleMuteMediaStream,
    isMuted,
  };
};

export default useLocalMediaStream;
