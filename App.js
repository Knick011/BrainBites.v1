// App.js
import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation';
import TimerService from './src/services/TimerService';
import SoundService from './src/services/SoundService';
import QuizService from './src/services/QuizService';

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Setup and initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log("Initializing services...");
        
        // Initialize the sound service
        await SoundService.initSounds();
        console.log("Sound service initialized successfully");
        
        // Any other initialization can go here
        
        // Delay a bit to make sure everything is ready
        setTimeout(() => {
          setIsInitializing(false);
        }, 1000);
      } catch (error) {
        console.error("Error initializing services:", error);
        setIsInitializing(false);
      }
    };

    initializeServices();
    
    // Cleanup when app unmounts
    return () => {
      TimerService.cleanup();
      SoundService.cleanup();
    };
  }, []);

  // Show a loading screen while initializing
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9F1C" />
        <Text style={styles.loadingText}>Loading Brain Bites...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8E7" />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
});

export default App;