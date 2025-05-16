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
      
      let loadedSounds = 0;
      const totalSounds = 6; // Total number of sounds to load
      
      const checkInitialization = () => {
        loadedSounds++;
        if (loadedSounds === totalSounds) {
          this.isInitialized = true;
          console.log("Sound initialization complete");
          resolve();
        }
      };
      
      // Load sounds one by one to isolate any issues
      this._loadSoundFile('buttonpress', 'buttonpress.mp3', checkInitialization);
      this._loadSoundFile('menuMusic', 'menu_music.mp3', checkInitialization);
      this._loadSoundFile('gameMusic', 'gamemusic.mp3', checkInitialization);
      this._loadSoundFile('streak', 'streak.mp3', checkInitialization);
      this._loadSoundFile('correct', 'correct.mp3', checkInitialization);
      this._loadSoundFile('incorrect', 'incorrect.mp3', checkInitialization);
      
      // Set a timeout to resolve even if some sounds fail to load
      setTimeout(() => {
        if (!this.isInitialized) {
          console.warn("Sound initialization timed out - some sounds may not be available");
          this.isInitialized = true;
          resolve();
        }
      }, 5000); // Increased timeout to 5 seconds
    });
  }
  
  _loadSoundFile(soundName, filename, callback) {
    // Load sound from the bundled assets folder
    Sound.loadSoundFromActiveSoundLibrary = true;
    
    // Use the correct path format for React Native
    const soundPath = `sounds/${filename}`;
    
    try {
      // This is the correct way to load sounds in React Native
      const sound = new Sound(soundPath, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error(`Error loading sound ${soundName}: ${error.message}`);
          // Attempt to load from a different path if the first attempt fails
          const fallbackPath = filename;
          const fallbackSound = new Sound(fallbackPath, Sound.MAIN_BUNDLE, (fallbackError) => {
            if (fallbackError) {
              console.error(`Fallback loading failed for ${soundName}: ${fallbackError.message}`);
            } else {
              console.log(`Sound ${soundName} loaded successfully from fallback path`);
              this.sounds[soundName] = fallbackSound;
              this._configureSound(soundName, fallbackSound);
            }
          });
        } else {
          console.log(`Sound ${soundName} loaded successfully`);
          this.sounds[soundName] = sound;
          this._configureSound(soundName, sound);
        }
      });
    } catch (error) {
      console.error(`Error creating sound ${soundName}:`, error);
    }
  }
  
  _configureSound(soundName, sound) {
    // Configure specific sounds
    if (soundName === 'menuMusic' || soundName === 'gameMusic') {
      sound.setVolume(0.5);
    }
  }
  
  async play(soundName, options = {}) {
    if (!this.soundsEnabled) return null;
    
    const sound = this.sounds[soundName];
    if (!sound) {
      console.log(`