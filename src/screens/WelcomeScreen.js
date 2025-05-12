// src/screens/WelcomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SoundService from '../services/SoundService';
import MascotDisplay from '../components/mascot/MascotDisplay';

const WelcomeScreen = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [mascotType, setMascotType] = useState('excited');
  const [mascotMessage, setMascotMessage] = useState('Welcome to Brain Bites Mobile!');
  
  useEffect(() => {
    // Start background music
    SoundService.startMenuMusic();
    
    return () => {
      // Clean up sound when component unmounts
      SoundService.stopMusic();
    };
  }, []);
  
  // Update mascot based on current page
  useEffect(() => {
    updateMascotForPage(currentPage);
  }, [currentPage]);
  
  const updateMascotForPage = (pageIndex) => {
    switch(pageIndex) {
      case 0:
        setMascotType('excited');
        setMascotMessage('Hi there! I\'m your Brain Bites buddy!');
        break;
      case 1:
        setMascotType('happy');
        setMascotMessage('Answer questions to earn time!');
        break;
      case 2:
        setMascotType('gamemode');
        setMascotMessage('Use your time for fun apps!');
        break;
      case 3:
        setMascotType('excited');
        setMascotMessage('Let\'s get started!');
        break;
      default:
        setMascotType('excited');
        setMascotMessage('Welcome to Brain Bites Mobile!');
    }
  };
  
  const pages = [
    {
      title: "Welcome to Brain Bites Mobile!",
      text: "Learn while managing your screen time. Answer questions correctly to earn time for your favorite apps!",
      icon: "brain",
    },
    {
      title: "Answer Questions",
      text: "Each correct answer gives you app time. Build a streak for bonus rewards!",
      icon: "head-question",
    },
    {
      title: "Use Your Earned Time",
      text: "Spend your earned time on social media apps. When time runs out, return to earn more!",
      icon: "clock-outline",
    },
    {
      title: "Ready to Start?",
      text: "Let's begin your brain-powered app usage journey!",
      icon: "rocket-launch",
      isLast: true
    }
  ];
  
  const handleNext = () => {
    // Play button sound
    SoundService.playButtonPress();
    
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };
  
  const handleFinish = async () => {
    // Play success sound
    SoundService.playStreak();
    
    // Mark onboarding as complete
    await AsyncStorage.setItem('brainbites_onboarding_complete', 'true');
    
    // Navigate to home
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }]
    });
  };
  
  const handleSkip = () => {
    // Play button sound
    SoundService.playButtonPress();
    handleFinish();
  };
  
  const page = pages[currentPage];
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name={page.icon} size={80} color="#FF9F1C" />
          </View>
          
          <Text style={styles.title}>{page.title}</Text>
          <Text style={styles.text}>{page.text}</Text>
        </View>
        
        <View style={styles.dotContainer}>
          {pages.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot,
                currentPage === index && styles.activeDot
              ]} 
            />
          ))}
        </View>
        
        <View style={styles.buttonContainer}>
          {!page.isLast && (
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextText}>
              {page.isLast ? "Get Started" : "Next"}
            </Text>
            {!page.isLast && <Icon name="arrow-right" size={20} color="white" />}
          </TouchableOpacity>
        </View>
        
        {/* Mascot */}
        <MascotDisplay
          type={mascotType}
          position="right"
          showMascot={true}
          message={mascotMessage}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#FF9F1C',
    width: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#666',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#FF9F1C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 4,
  },
});

export default WelcomeScreen;