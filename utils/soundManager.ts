import { createAudioPlayer, AudioPlayer } from 'expo-audio';

class SoundManager {
  private static instance: SoundManager;
  private sounds: { [key: string]: AudioPlayer } = {};
  private backgroundMusic: AudioPlayer | null = null;
  private isMuted: boolean = false;

  private constructor() {}

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  async loadSounds() {
    try {
      const soundsToLoad: { [key: string]: any } = {
        victory: require('../assets/sounds/victory.mp3'),
        gameOver: require('../assets/sounds/gameover.mp3'),
        background: require('../assets/sounds/background.mp3'),
      };

      for (const [key, source] of Object.entries(soundsToLoad)) {
        try {
          const player = createAudioPlayer(source);
          this.sounds[key] = player;
        } catch (error) {
          console.warn(`Failed to load sound ${key}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  }

  playSound(soundName: string) {
    if (this.isMuted) return;

    try {
      const sound = this.sounds[soundName];
      if (sound) {
        sound.seekTo(0);
        sound.play();
      }
    } catch (error) {
      console.warn(`Error playing sound ${soundName}:`, error);
    }
  }

  startBackgroundMusic() {
    if (this.isMuted) return;

    try {
      const sound = this.sounds.background;
      if (sound) {
        sound.loop = true;
        sound.play();
        this.backgroundMusic = sound;
      }
    } catch (error) {
      console.error('Error playing background music:', error);
    }
  }

  // Pause/resume ignore the mute flag: muting is applied to the player itself,
  // so the track must keep its position even while muted.
  pauseBackgroundMusic() {
    try {
      this.backgroundMusic?.pause();
    } catch (error) {
      console.warn('Error pausing background music:', error);
    }
  }

  resumeBackgroundMusic() {
    try {
      this.backgroundMusic?.play();
    } catch (error) {
      console.warn('Error resuming background music:', error);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const allSounds = Object.values(this.sounds);
    for (const sound of allSounds) {
        sound.muted = this.isMuted;
    }
    return this.isMuted;
  }

  unloadSounds() {
    try {
      for (const sound of Object.values(this.sounds)) {
        sound.remove();
      }
      this.sounds = {};
      this.backgroundMusic = null;
    } catch (error) {
      console.error('Error unloading sounds:', error);
    }
  }
}

export default SoundManager.getInstance(); 