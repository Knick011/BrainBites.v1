// src/services/SoundService.js
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable playback in silent mode
Sound.setCategory('Playback');

class SoundService {
  constructor() {
    this.sounds = {};
    this.soundsEnabled = true;
    this.isInitialized = false;
    this.loadSoundsEnabled();
  }
  
  async loadSoundsEnabled() {
    try {
      const enabled = await AsyncStorage.getItem('brainbites_sounds_enabled');
      if (enabled !== null) {
        this.soundsEnabled = enabled === 'true';
      }
    } catch (error) {
      console.error('Error loading sound settings:', error);
    }
  }
  
  async initSounds() {
    // Skip if already initialized
    if (this.isInitialized) return Promise.resolve();
    
    return new Promise((resolve) => {
      console.log("Initializing sounds...");
      
      // Load sounds one by one to isolate any issues
      this._loadSoundFile('buttonpress', 'buttonpress.mp3');
      this._loadSoundFile('menuMusic', 'menu_music.mp3');
      this._loadSoundFile('gameMusic', 'gamemusic.mp3');
      this._loadSoundFile('streak', 'streak.mp3');
      this._loadSoundFile('correct', 'correct.mp3');
      this._loadSoundFile('incorrect', 'incorrect.mp3');
      
      // Set a timeout to resolve even if some sounds fail to load
      setTimeout(() => {
        this.isInitialized = true;
        console.log("Sound initialization complete");
        resolve();
      }, 2000);
    });
  }
  
  _loadSoundFile(soundName, filename) {
    // Load sound from the bundled assets folder
    Sound.loadSoundFromActiveSoundLibrary = true;
    
    // Use the correct path format for React Native
    const soundPath = filename;
    
    try {
      // This is the correct way to load sounds in React Native
      const sound = new Sound(soundPath, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log(`Error loading sound ${soundName}: ${error}`);
        } else {
          console.log(`Sound ${soundName} loaded successfully`);
          this.sounds[soundName] = sound;
          
          // Configure specific sounds
          if (soundName === 'menuMusic' || soundName === 'gameMusic') {
            sound.setVolume(0.5);
          }
        }
      });
    } catch (error) {
      console.error(`Error creating sound ${soundName}:`, error);
    }
  }
  
  async play(soundName, options = {}) {
    if (!this.soundsEnabled) return null;
    
    const sound = this.sounds[soundName];
    if (!sound) {
      console.log(`Sound ${soundName} not available`);
      return null;
    }
    
    try {
      // Reset sound to beginning
      sound.stop();
      sound.setCurrentTime(0);
      
      // Apply options
      if (options.volume !== undefined) {
        sound.setVolume(options.volume);
      }
      
      if (options.loops !== undefined) {
        sound.setNumberOfLoops(options.loops);
      }
      
      // Play the sound
      sound.play((success) => {
        if (!success) {
          console.log(`Failed to play ${soundName}`);
        }
      });
      
      return sound;
    } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
      return null;
    }
  }
  
  stop(soundName) {
    try {
      if (this.sounds[soundName]) {
        this.sounds[soundName].stop();
      }
    } catch (error) {
      console.error(`Error stopping sound ${soundName}:`, error);
    }
  }
  
  stopAll() {
    try {
      Object.values(this.sounds).forEach(sound => {
        if (sound && sound.stop) sound.stop();
      });
    } catch (error) {
      console.error(`Error stopping all sounds:`, error);
    }
  }
  
  toggleSounds(enabled) {
    this.soundsEnabled = enabled;
    AsyncStorage.setItem('brainbites_sounds_enabled', enabled.toString());
    
    if (!enabled) {
      this.stopAll();
    }
  }
  
  async playButtonPress() {
    return this.play('buttonpress');
  }
  
  async playCorrect() {
    return this.play('correct');
  }
  
  async playIncorrect() {
    return this.play('incorrect');
  }
  
  async playStreak() {
    return this.play('streak');
  }
  
  async startMenuMusic() {
    this.stop('gameMusic');
    return this.play('menuMusic', { volume: 0.3, loops: -1 });
  }
  
  async startGameMusic() {
    this.stop('menuMusic');
    return this.play('gameMusic', { volume: 0.3, loops: -1 });
  }
  
  stopMusic() {
    this.stop('menuMusic');
    this.stop('gameMusic');
  }
  
  cleanup() {
    this.stopAll();
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.release) sound.release();
    });
    this.sounds = {};
    this.isInitialized = false;
  }
}

export default new SoundService();