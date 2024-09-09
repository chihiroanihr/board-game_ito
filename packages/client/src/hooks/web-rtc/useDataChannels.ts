import { useCallback, useRef, useState } from 'react';

/**
 * @function useDataChannels - A hook that manages data channels for sending voice activity information between peers.
 * @param {string} remoteStrUserId - The ID of the remote user.
 * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection instance.
 * @returns {Object} An object containing functions to manage data channels and send voice activity information.
 * @returns {Function} createNewDataChannel - A function to create a new data channel for voice activity.
 * @returns {Function} sendVoiceActivity - A function to send voice activity information over the data channel.
 * @returns {Function} setActiveSpeakers - A function to set the active speakers.
 * @returns {string[]} activeSpeakers - An array of active speaker IDs.
 * @example
 * const { createNewDataChannel, sendVoiceActivity, setActiveSpeakers, activeSpeakers } = useDataChannels();
 */
const useDataChannels = () => {
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const dataChannels = useRef<Record<string, RTCDataChannel>>({});

  const createNewDataChannel = useCallback(
    (peerConnection: RTCPeerConnection, remoteStrUserId: string) => {
      const dataChannel = peerConnection.createDataChannel('voice-activity', {
        ordered: false, // This prioritizes speed over reliability, which is appropriate for real-time voice activity updates.
        maxRetransmits: 0,
      });

      // Logs
      dataChannel.onopen = () => console.log(`Data channel opened for user ${remoteStrUserId}`);
      dataChannel.onclose = () => console.log(`Data channel closed for user ${remoteStrUserId}`);

      dataChannel.onmessage = (event) => {
        const { isActive } = JSON.parse(event.data);
        setActiveSpeakers((prev) =>
          isActive
            ? [...new Set([...prev, remoteStrUserId])]
            : prev.filter((id) => id !== remoteStrUserId)
        );
      };

      dataChannels.current[remoteStrUserId] = dataChannel;
    },
    []
  );

  const sendVoiceActivity = useCallback((isActive: boolean) => {
    Object.values(dataChannels.current).forEach((channel) => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify({ isActive }));
      }
    });
  }, []);

  return {
    createNewDataChannel,
    sendVoiceActivity,
    setActiveSpeakers,
    activeSpeakers,
  };
};

export default useDataChannels;
