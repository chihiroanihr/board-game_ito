import React, { useState, useEffect, useRef } from 'react';
import { Avatar, type AvatarProps as MuiAvatarProps } from '@mui/material';

import { type User } from '@bgi/shared';

import { useRemoteStreams } from '@/hooks';
import { usernameToColor, convertHexToRgb } from '@/utils';
import { type RemotePeerDataType } from '../enum';

interface PlayerAvatarProps extends MuiAvatarProps {
  player: User;
}

const MIN_VOLUME = 10;

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, sx, ...rest }) => {
  const { remoteStreams } = useRemoteStreams();
  const [volume, setVolume] = useState(0);
  // const dynamicThresholdRef = useRef(BASE_THRESHOLD); // Adjust based on noise levels
  const animationFrameRef = useRef<number | null>(null); // To store animation frame ID

  const userColorHex = usernameToColor(player.name);
  const { r, g, b } = convertHexToRgb(userColorHex);

  // Obtain player's remote stream if exists
  const remotePeerData: RemotePeerDataType | undefined = remoteStreams?.[player._id.toString()];

  useEffect(() => {
    // If remote peer data does not exist, or remote stream is muted, then stop animation
    if (!remotePeerData || remotePeerData.isMuted) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    // Detect player's voice activity through remote stream
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaStreamSource(remotePeerData.stream);
    const analyser = audioContext.createAnalyser();
    audioSource.connect(analyser);

    const detectVoiceActivity = () => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Calculate average audio level
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setVolume(average);

      animationFrameRef.current = requestAnimationFrame(detectVoiceActivity);
    };

    detectVoiceActivity();

    return () => {
      // Cleanup animation on component unmount
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      // Cleanup audio context on component unmount
      audioContext.suspend();
      analyser.disconnect();
      audioSource.disconnect();
      audioContext.close();
    };
  }, [remotePeerData]);

  return (
    <Avatar
      alt={player.name}
      sx={{
        bgcolor: userColorHex,
        border: volume > MIN_VOLUME ? `2.5px solid white` : 'none',
        boxShadow: volume
          ? `0 0 ${Math.min(25, volume)}px rgba(${r},${g},${b},${Math.min(1, volume / (255 / 4))})`
          : 'none',
        ...(sx || {}),
      }}
      {...rest}
    >
      {player.name[0]}
      {player.name[1]}
    </Avatar>
  );
};

export default PlayerAvatar;
