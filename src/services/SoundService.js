// src/services/SoundService.js
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable playback in silent mode
Sound.setCategory('Playback');

class SoundService {
  constructor() {
    this.sounds = {};
    this.soundsEnabled = true;
    this.loadSoundsEnabled();
    
    // Don't preload sounds in constructor
    // Will preload when needed instead
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
    // Check if sounds are already loaded
    if (Object.keys(this.sounds).length > 0) return;
    
    return new Promise((resolve) => {
      try {
        // Sound file paths - these match your actual file locations
        const soundPaths = {
          buttonpress: require('../../assets/sounds/buttonpress.mp3'),
          menuMusic: require('../../assets/sounds/menu_music.mp3'), // Adjusted filename to use underscores
          gameMusic: require('../../assets/sounds/gamemusic.mp3'),
          streak: require('../../assets/sounds/streak.mp3'),
          correct: require('../../assets/sounds/correct.mp3'),
          incorrect: require('../../assets/sounds/incorrect.mp3')
        };
        
        // Track how many sounds have loaded
        let loadedCount = 0;
        const totalSounds = Object.keys(soundPaths).length;
        
        // Load each sound
        Object.entries(soundPaths).forEach(([key, soundPath]) => {
          const sound = new Sound(soundPath, (error) => {
            if (error) {
              console.error(`Failed to load sound ${key}:`, error);
              // Create a dummy sound object for this failed sound
              this.sounds[key] = this._createDummySound(key);
            } else {
              // Success - sound is loaded
              console.log(`Sound ${key} loaded successfully`);
              this.sounds[key] = sound;
              
              // Set volume and loop settings for background music
              if (key === 'menuMusic' || key === 'gameMusic') {
                sound.setVolume(0.5);
              }
            }
            
            // Track progress
            loadedCount++;
            if (loadedCount === totalSounds) {
              resolve();
            }
          });
        });
      } catch (error) {
        console.error("Error initializing sounds:", error);
        
        // Fall back to dummy sounds in case of error
        this._initDummySounds();
        resolve();
      }
    });
  }
  
  // Create a dummy sound object that logs instead of playing
  _createDummySound(name) {
    return {
      play: (callback) => { 
        console.log(`[SOUND SIMULATION] Playing ${name} sound`);
        if (callback) callback(true);
      },
      stop: () => { console.log(`[SOUND SIMULATION] Stopping ${name} sound`); },
      setVolume: () => {},
      setNumberOfLoops: () => {},
      setCurrentTime: () => {},
      release: () => {}
    };
  }
  
  // Fallback method for when sound files aren't available
  _initDummySounds() {
    const soundNames = [
      'buttonpress',
      'menuMusic',
      'gameMusic',
      'streak',
      'correct',
      'incorrect'
    ];
    
    soundNames.forEach(name => {
      this.sounds[name] = this._createDummySound(name);
    });
    
    console.log('Using simulated sounds - no actual sound files will be played');
  }
  
  async play(soundName, options = {}) {
    if (!this.soundsEnabled) return null;
    
    // Make sure sounds are initialized
    if (Object.keys(this.sounds).length === 0) {
      await this.initSounds();
    }
    
    const sound = this.sounds[soundName];
    if (!sound) {
      console.error(`Sound ${soundName} not found`);
      return null;
    }
    
    // Reset to start (in case the sound was already playing)
    if (sound.stop) sound.stop();
    if (sound.setCurrentTime) sound.setCurrentTime(0);
    
    // Apply options
    if (options.volume !== undefined && sound.setVolume) {
      sound.setVolume(options.volume);
    }
    
    if (options.loops !== undefined && sound.setNumberOfLoops) {
      sound.setNumberOfLoops(options.loops);
    }
    
    // Play the sound
    sound.play((success) => {
      if (!success) {
        console.error(`Failed to play sound ${soundName}`);
      }
    });
    
    return sound;
  }
  
  stop(soundName) {
    if (this.sounds[soundName] && this.sounds[soundName].stop) {
      this.sounds[soundName].stop();
    }
  }
  
  stopAll() {
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.stop) sound.stop();
    });
  }
  
  toggleSounds(enabled) {
    this.soundsEnabled = enabled;
    AsyncStorage.setItem('brainbites_sounds_enabled', enabled.toString());
    
    // If sounds are disabled, stop all currently playing sounds
    if (!enabled) {
      this.stopAll();
    }
  }
  
  // Play a button press sound (common action)
  async playButtonPress() {
    return await this.play('buttonpress');
  }
  
  // Play a success sound
  async playCorrect() {
    return await this.play('correct');
  }
  
  // Play an error sound
  async playIncorrect() {
    return await this.play('incorrect');
  }
  
  // Play streak achievement sound
  async playStreak() {
    return await this.play('streak');
  }
  
  // Start menu background music
  async startMenuMusic() {
    this.stop('gameMusic');
    return await this.play('menuMusic', { volume: 0.3, loops: -1 });
  }
  
  // Start game background music
  async startGameMusic() {
    this.stop('menuMusic');
    return await this.play('gameMusic', { volume: 0.3, loops: -1 });
  }
  
  // Stop all background music
  stopMusic() {
    this.stop('menuMusic');
    this.stop('gameMusic');
  }
  
  // Clean up when the app is closing
  cleanup() {
    this.stopAll();
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.release) sound.release();
    });
    this.sounds = {};
  }
}

export default new SoundService();