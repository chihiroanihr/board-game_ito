/**
 * @class MediaStreamManager - A singleton
 * @classdesc A class that manages the local media stream, including muting and unmuting.
 * @returns {MediaStreamManager} The singleton instance of the MediaStreamManager.
 *
 * It's independent of React's state and lifecycle, ensuring the stream is always accessible.
 */
class MediaStreamManager {
  private static instance: MediaStreamManager;
  private mediaStream: MediaStream | null = null;

  private constructor() {}

  /**
   * @function getInstance - A static method that returns the singleton instance of the MediaStreamManager.
   * @returns {MediaStreamManager} The singleton instance of the MediaStreamManager.
   */
  public static getInstance(): MediaStreamManager {
    if (!MediaStreamManager.instance) {
      MediaStreamManager.instance = new MediaStreamManager();
    }
    return MediaStreamManager.instance;
  }

  /**
   * @function startStream - A method that starts the local media stream.
   * @returns {Promise<void>} A promise that resolves when the stream has started.
   */
  async startStream(): Promise<void> {
    try {
      // Access media stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
        },
        video: false,
      });
      // Mute by default
      this.mediaStream.getTracks().forEach((track) => {
        track.enabled = false;
      });

      console.log('Local media stream started.');
    } catch (error) {
      console.error('Failed to start media stream:', error);
    }
  }

  async unmuteStream(): Promise<void> {
    try {
      if (this.mediaStream) {
        // Unmute
        this.mediaStream.getTracks().forEach((track) => {
          track.enabled = true;
        });
      } else {
        throw new Error('No media stream available.');
      }

      console.log('Local media stream unmuted.');
    } catch (error) {
      console.error('Failed to unmute media stream:', error);
    }
  }

  muteStream(): void {
    try {
      if (this.mediaStream) {
        // mute
        this.mediaStream.getTracks().forEach((track) => {
          track.enabled = false;
        });
      } else {
        throw new Error('No media stream available.');
      }

      console.log('Local media stream muted.');
    } catch (error) {
      console.error('Failed to mute media stream:', error);
    }
  }

  /**
   * @function endStream - A method that ends the local media stream.
   * @returns {void}
   */
  endStream(): void {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => {
          track.enabled = false; // Mute back
          track.stop(); // Stop media track
          this.mediaStream?.removeTrack(track);
        });
        this.mediaStream = null;

        console.log('Local media stream ended.');
      }
    } catch (error) {
      console.error('Failed to end media stream:', error);
    }
  }

  /**
   * @function hasStream - A method that checks if a media stream is currently open.
   * @returns {boolean} True if a media stream is open, false otherwise.
   */
  hasStream(): boolean {
    return this.mediaStream !== null;
  }

  /**
   * @function getStream - A method that returns the local media stream.
   * @returns {MediaStream | null} The local media stream.
   */
  getStream(): MediaStream | null {
    return this.mediaStream;
  }
}

export default MediaStreamManager.getInstance();
