// App.js (modified to use enhanced components with web-like style)
import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import services
import TimerService from './src/services/TimerService';
import SoundService from './src/services/SoundService';
import QuizService from './src/services/QuizService';

// Import theme
import theme from './src/styles/theme';

const Stack = createStackNavigator();

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  
  // Setup and initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log("Initializing services...");
        
        // First check if this is the first launch
        const hasLaunchedBefore = await AsyncStorage.getItem('brainbites_onboarding_complete');
        setIsFirstLaunch(hasLaunchedBefore !== 'true');
        
        // Initialize the sound service
        await SoundService.initSounds();
        console.log("Sound service initialized successfully");
        
        // Initialize the quiz service
        await QuizService.initialize();
        console.log("Quiz service initialized successfully");
        
        // Load saved time data
        await TimerService.loadSavedTime();
        console.log("Timer service initialized successfully");
        
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Brain Bites...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={isFirstLaunch ? "Welcome" : "Home"}
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: theme.colors.background },
            // Add fancy transition effects similar to web version
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.height, 0],
                      }),
                    },
                  ],
                  opacity: current.progress,
                },
              };
            },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: theme.colors.textDark,
    fontWeight: '500',
  },
});

export default App;