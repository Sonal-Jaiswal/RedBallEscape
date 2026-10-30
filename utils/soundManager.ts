import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTED_KEY = 'muted';

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

  get muted() {
    return this.isMuted;
  }

  async loadSounds() {
    try {
      this.isMuted = (await AsyncStorage.getItem(MUTED_KEY)) === 'true';
    } catch (error) {
      console.warn('Error loading mute setting:', error);
    }

    const soundsToLoad: { [key: string]: number } = {
      victory: require('../assets/sounds/victory.wav'),
      gameOver: require('../assets/sounds/gameover.mp3'),
      background: require('../assets/sounds/background.mp3'),
    };

    for (const [key, source] of Object.entries(soundsToLoad)) {
      try {
        const player = createAudioPlayer(source);
        player.muted = this.isMuted;
        this.sounds[key] = player;
      } catch (error) {
        console.warn(`Failed to load sound ${key}:`, error);
      }
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

  // The track loops even while muted so that unmuting picks it up immediately.
  startBackgroundMusic() {
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
    for (const sound of Object.values(this.sounds)) {
      sound.muted = this.isMuted;
    }
    AsyncStorage.setItem(MUTED_KEY, String(this.isMuted))
      .catch(error => console.warn('Error saving mute setting:', error));
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
