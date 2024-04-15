import React, { useState, useEffect, useCallback } from 'react';
import { Fab, Typography } from '@mui/material';
import { Mic as MicOnIcon, MicOff as MicOffIcon } from '@mui/icons-material';

interface VoiceButtonProps {
  audioStream: MediaStream | null;
  peerConnections: RTCPeerConnection[] | undefined;
}

const VoiceButton = ({ audioStream, peerConnections }: VoiceButtonProps) => {
  const [isMuted, setIsMuted] = useState<boolean>(true);

  /**
   * Toggle mute button handler
   */
  const toggleMute = () => {
    setIsMuted((prevMuted) => !prevMuted);
  };

  /**
   * Toggle mute for WebRTC peer connection
   */
  const handleSenderMute = useCallback(
    (peerConnection: RTCPeerConnection) => {
      // Access senders
      const senders = peerConnection.getSenders();
      // Change parameters in all senders
      senders.forEach(async (sender: RTCRtpSender) => {
        const params = sender.getParameters();
        if (params.encodings[0]) {
          params.encodings[0].active = isMuted ? false : true;
          await sender.setParameters(params);
        }
      });
    },
    [isMuted]
  );

  /**
   * Execute when mute state (isMute) changed
   */
  useEffect(() => {
    if (audioStream && peerConnections) {
      // Iterate each peer connections
      Object.keys(peerConnections).forEach((socketId: string) => {
        const peerConnection = peerConnections[socketId];
        if (peerConnection) {
          // Toggle mute state of each peer connection
          handleSenderMute(peerConnection);
        }
      });
    }
  }, [handleSenderMute, audioStream, peerConnections]);

  return (
    <Fab
      component="button"
      color="primary"
      aria-describedby={isMuted ? 'mic-button' : undefined}
      disabled={!audioStream}
      onClick={toggleMute}
    >
      {isMuted ? (
        <MicOffIcon sx={{ width: 'unset', height: 'unset', p: '0.6rem' }} />
      ) : (
        <MicOnIcon sx={{ width: 'unset', height: 'unset', p: '0.6rem' }} color="error" />
      )}
    </Fab>
  );
};

export default VoiceButton;
