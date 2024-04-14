import React, { useEffect } from 'react';
import { Fab, Typography } from '@mui/material';
import { Mic as MicOnIcon, MicOff as MicOffIcon } from '@mui/icons-material';

import { useLocalMediaStream } from '@/hooks';

const VoiceButton = () => {
  const { localMediaStream, isMuted, toggleMic } = useLocalMediaStream();

  // const remoteAudioRefs = useRef<{ [key: string]: React.RefObject<HTMLAudioElement> }>({});
  // const [speakingUser, setSpeakingUser] = useState<User>();

  // Function to handle incoming voice data from other users
  // const handleVoiceData = ({ data, user }: { data: MediaStream | undefined; user: User }) => {
  //   console.log('handleVoiceData: ', data);
  //   // Play incoming audio data
  //   setSpeakingUser(data);
  // };

  useEffect(() => {
    // // Get the audio tracks from localMediaStream
    // const audioTracks = localMediaStream.getAudioTracks();
    // // Disable each audio track
    // for (let i = 0; i < audioTracks.length; i++) {
    //   // Toggle the enabled property based on the isMuted variable
    //   audioTracks[i]!.enabled = !isMuted;
    // }
    // localMediaStream.getAudioTracks().forEach((track) => {
    //   track.enabled = false;
    // });

    if (localMediaStream) {
      for (let i = 0; i < localMediaStream.getAudioTracks().length; i++) {
        localMediaStream.getAudioTracks()[i].enabled = isMuted ? false : true;
      }

      console.log(
        isMuted,
        localMediaStream?.getAudioTracks()[0]!.enabled,
        isMuted ? 'Audio muted.' : 'Audio unmuted.'
      );
      // localMediaStream.getAudioTracks()[0]!.enabled = !isMuted;
    }
  }, [isMuted, localMediaStream]);

  return (
    <>
      <Fab
        component="button"
        color="primary"
        aria-describedby={isMuted ? 'mic-button' : undefined}
        disabled={!localMediaStream}
        onClick={toggleMic}
      >
        {isMuted ? (
          <MicOffIcon sx={{ width: 'unset', height: 'unset', p: '0.6rem' }} />
        ) : (
          <MicOnIcon sx={{ width: 'unset', height: 'unset', p: '0.6rem' }} color="error" />
        )}
      </Fab>
    </>
  );
};

export default VoiceButton;
