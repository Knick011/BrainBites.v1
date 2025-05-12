// src/screens/WelcomeScreen.js (modified to match web version's style)
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Animated,
  Easing,
  ImageBackground,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SoundService from '../services/SoundService';
import EnhancedMascotDisplay from '../components/mascot/EnhancedMascotDisplay';
import theme from '../styles/theme';
import commonStyles from '../styles/commonStyles';
import animations from '../styles/animations';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [mascotType, setMascotType] = useState('excited');
  const [mascotMessage, setMascotMessage] = useState('Welcome to Brain Bites Mobile!');
  
  // Animation values
  const logoAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  
  // Implement animation effects similar to web version
  useEffect(() => {
    // Start background music
    SoundService.startMenuMusic();
    
    // Start entrance animations
    Animated.parallel([
      // Fade in everything
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      
      // Float animation for logo
      animations.float(logoAnim, 4000),
      
      // Scale in the button
      Animated.sequence([
        Animated.delay(400),
        Animated.spring(buttonAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      
      // Slide up the info cards
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(cardAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    
    return () => {
      // Clean up sound when component unmounts
      SoundService.stopMusic();
    };
  }, [fadeAnim, logoAnim, buttonAnim, cardAnim]);
  
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
  
  // Create gradient-like background with orange-to-yellow colors
  const Gradient = () => (
    <View style={styles.gradient}>
      <View style={styles.gradientInner} />
    </View>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Gradient />
      
      <Animated.View 
        style={[
          styles.container,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                transform: [
                  { translateY: logoAnim }
                ]
              }
            ]}
          >
            <Icon name={page.icon} size={80} color="white" />
          </Animated.View>
          
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
          
          <Animated.View
            style={{
              transform: [
                { scale: buttonAnim }
              ],
              opacity: fadeAnim
            }}
          >
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextText}>
                {page.isLast ? "Get Started" : "Next"}
              </Text>
              {!page.isLast && <Icon name="arrow-right" size={20} color="white" />}
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <Animated.View
          style={[
            styles.infoCardsContainer,
            {
              transform: [
                { translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })}
              ],
              opacity: cardAnim
            }
          ]}
        >
          <View style={styles.infoCardsGrid}>
            <View style={styles.infoCard}>
              <Icon name="brain" size={24} color={theme.colors.primary} />
              <Text style={styles.infoTitle}>Learn</Text>
              <Text style={styles.infoText}>Test your knowledge</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Icon name="video" size={24} color={theme.colors.primary} />
              <Text style={styles.infoTitle}>Watch</Text>
              <Text style={styles.infoText}>Earn videos as rewards</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Icon name="trophy" size={24} color={theme.colors.primary} />
              <Text style={styles.infoTitle}>Grow</Text>
              <Text style={styles.infoText}>Build your streak</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Mascot */}
        <EnhancedMascotDisplay
          type={mascotType}
          position="right"
          showMascot={true}
          message={mascotMessage}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  gradientInner: {
    position: 'absolute',
    right: 0,
    top: '30%',
    width: '70%',
    height: '40%',
    backgroundColor: theme.colors.warmYellow,
    borderTopLeftRadius: 300,
    borderBottomLeftRadius: 300,
    opacity: 0.3,
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
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: 'white',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  nextText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 16,
    marginRight: 4,
  },
  infoCardsContainer: {
    marginBottom: 20,
    width: '100%',
  },
  infoCardsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '31%',
    aspectRatio: 0.9,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default WelcomeScreen;