// src/screens/HomeScreen.js (fixed version)
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TimerService from '../services/TimerService';
import QuizService from '../services/QuizService';
import SoundService from '../services/SoundService';
import EnhancedMascotDisplay from '../components/mascot/EnhancedMascotDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../styles/theme';
import commonStyles from '../styles/commonStyles';
import animations from '../styles/animations';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [availableTime, setAvailableTime] = useState(0);
  const [categories, setCategories] = useState(['funfacts', 'psychology']);
  const [showMascot, setShowMascot] = useState(true);
  const [mascotType, setMascotType] = useState('happy');
  const [mascotMessage, setMascotMessage] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const timeCardAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  // Initialize with empty animation values array
  const categoryAnimValues = useRef([]).current;
  
  useEffect(() => {
    // Play menu music when entering home screen
    SoundService.startMenuMusic();
    
    // Load initial time
    loadAvailableTime();
    
    // Add timer event listener
    const removeListener = TimerService.addEventListener(handleTimerEvent);
    
    // Load categories
    loadCategories();
    
    // Load settings
    loadSettings();
    
    // Set mascot message based on available time
    updateMascotMessage();
    
    // Initialize animation values for categories
    initializeCategoryAnimations(categories);
    
    // Start entrance animations
    Animated.parallel([
      // Fade in everything
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      
      // Scale in
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      
      // Time card animation
      Animated.sequence([
        Animated.delay(250),
        Animated.spring(timeCardAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      
      // Bounce animation for time icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ),
      
      // Staggered category animations (will be added in initializeCategoryAnimations)
    ]).start();
    
    return () => {
      removeListener();
    };
  }, []);
  
  // Initialize animation values for categories
  const initializeCategoryAnimations = (categoriesList) => {
    // Clear existing animation values
    categoryAnimValues.length = 0;
    
    // Create animation values for each category
    categoriesList.forEach((_, index) => {
      categoryAnimValues[index] = new Animated.Value(0);
    });
    
    // Start staggered animations
    const animations = categoryAnimValues.map((anim, index) => 
      Animated.sequence([
        Animated.delay(500 + (index * 100)),
        Animated.spring(anim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Start all animations in parallel
    Animated.parallel(animations).start();
  };
  
  useEffect(() => {
    // Update mascot message when time changes
    updateMascotMessage();
  }, [availableTime]);
  
  // Update category animations when categories change
  useEffect(() => {
    // Initialize animation values for new categories
    initializeCategoryAnimations(categories);
  }, [categories]);
  
  const loadAvailableTime = async () => {
    const timeInSeconds = TimerService.getAvailableTime();
    setAvailableTime(timeInSeconds);
  };
  
  const loadCategories = async () => {
    try {
      const cats = await QuizService.getCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  const loadSettings = async () => {
    try {
      const mascotEnabled = await AsyncStorage.getItem('brainbites_show_mascot');
      if (mascotEnabled !== null) {
        setShowMascot(mascotEnabled === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const updateMascotMessage = () => {
    if (availableTime <= 0) {
      setMascotType('depressed');
      setMascotMessage("You're out of app time! Answer questions to earn more.");
    } else if (availableTime < 60) {
      setMascotType('sad');
      setMascotMessage("You're running low on time! Let's earn some more.");
    } else {
      setMascotType('happy');
      setMascotMessage("Ready to start a quiz and earn some time?");
    }
  };
  
  const handleTimerEvent = (event) => {
    if (event.event === 'creditsAdded' || event.event === 'timeUpdate') {
      setAvailableTime(TimerService.getAvailableTime());
    }
  };
  
  const handleStartQuiz = (category) => {
    // Play button press sound
    SoundService.playButtonPress();
    
    // Stop menu music
    SoundService.stopMusic();
    
    // Navigate to quiz
    navigation.navigate('Quiz', { category });
  };
  
  const handleOpenSettings = () => {
    // Play button press sound
    SoundService.playButtonPress();
    navigation.navigate('Settings');
  };
  
  const getCategoryIcon = (category) => {
    // Map categories to icons
    const iconMap = {
      'funfacts': 'lightbulb-on-outline',
      'psychology': 'brain',
      'math': 'calculator-variant-outline',
      'science': 'flask-outline',
      'history': 'book-open-page-variant-outline',
      'english': 'alphabetical-variant',
      'general': 'text-box-outline'
    };
    
    return iconMap[category] || 'help-circle-outline';
  };
  
  const getCategoryColor = (category) => {
    // Map categories to colors (similar to web version)
    const colorMap = {
      'funfacts': theme.colors.primary,
      'psychology': '#FF6B6B',
      'math': '#4CAF50',
      'science': '#2196F3',
      'history': '#9C27B0',
      'english': '#3F51B5',
      'general': '#607D8B'
    };
    
    return colorMap[category] || theme.colors.primary;
  };
  
  const formattedTime = TimerService.formatTime(availableTime);
  
  // Ensure we have valid animation values for categories
  const getAnimValue = (index) => {
    // Make sure we have a valid animation value, or create a default
    return categoryAnimValues[index] || new Animated.Value(1);
  };
  
  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <ScrollView style={styles.scrollContainer}>
          {/* Settings button */}
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={handleOpenSettings}
          >
            <Icon name="cog" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.header}>
            <Text style={styles.title}>Brain Bites Mobile</Text>
            <Text style={styles.subtitle}>Learn and earn app time!</Text>
          </View>
          
          <Animated.View 
            style={[
              styles.timeCard,
              {
                opacity: timeCardAnim,
                transform: [
                  { 
                    translateY: timeCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }
                ]
              }
            ]}
          >
            {/* Enhanced icon with pulse animation */}
            <Animated.View
              style={{
                transform: [
                  { scale: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1]
                  })}
                ]
              }}
            >
              <Icon name="timer-sand" size={40} color={theme.colors.primary} />
            </Animated.View>
            <Text style={styles.timeTitle}>Available App Time</Text>
            <Text style={styles.timeValue}>{formattedTime}</Text>
          </Animated.View>
          
          <Text style={styles.sectionTitle}>Quiz Categories</Text>
          
          <View style={styles.categoriesContainer}>
            {categories.map((category, index) => (
              <Animated.View
                key={category}
                style={{
                  opacity: getAnimValue(index),
                  transform: [
                    { 
                      translateY: getAnimValue(index).interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                      })
                    }
                  ],
                  width: '48%',
                }}
              >
                <TouchableOpacity 
                  style={[
                    styles.categoryCard, 
                    { borderColor: getCategoryColor(category) }
                  ]}
                  onPress={() => handleStartQuiz(category)}
                  activeOpacity={0.8}
                >
                  <View 
                    style={[
                      styles.categoryIcon, 
                      { backgroundColor: getCategoryColor(category) }
                    ]}
                  >
                    <Icon name={getCategoryIcon(category)} size={24} color="white" />
                  </View>
                  <Text style={styles.categoryName}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <Text style={styles.categorySubtext}>
                    Answer to earn time
                  </Text>
                  {/* Added small arrow icon to indicate action */}
                  <View style={styles.categoryArrow}>
                    <Icon name="arrow-right-circle" size={18} color={getCategoryColor(category)} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          
          <View style={styles.footer} />
        </ScrollView>
        
        {/* Mascot component with web-style appearance */}
        {showMascot && (
          <EnhancedMascotDisplay
            type={mascotType}
            position="left"
            showMascot={true}
            message={mascotMessage}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textDark,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  timeCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    ...theme.shadows.md,
  },
  timeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: theme.colors.textDark,
  },
  timeValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.textDark,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    ...theme.shadows.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    color: theme.colors.textDark,
  },
  categorySubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    height: 100, // Extra space at bottom to avoid mascot overlap
  },
  categoryArrow: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
});

export default HomeScreen;