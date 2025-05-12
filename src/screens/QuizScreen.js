// src/screens/QuizScreen.js (modified to match web version's style)
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import QuizService from '../services/QuizService';
import TimerService from '../services/TimerService';
import SoundService from '../services/SoundService';
import EnhancedMascotDisplay from '../components/mascot/EnhancedMascotDisplay';
import theme from '../styles/theme';
import commonStyles from '../styles/commonStyles';
import animations from '../styles/animations';

const QuizScreen = ({ navigation, route }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [category, setCategory] = useState(route.params?.category || 'funfacts');
  const [mascotType, setMascotType] = useState('gamemode');
  const [mascotMessage, setMascotMessage] = useState(null);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  
  // Animation values
  const cardAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef([]).current;
  const explanationAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(1)).current;
  const pointsAnim = useRef(new Animated.Value(0)).current;
  
  // Timer animation for time mode
  const timerAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  
  useEffect(() => {
    // Start game music when entering quiz screen
    SoundService.startGameMusic();
    
    // Set initial mascot state
    setMascotType('gamemode');
    setMascotMessage("Choose the correct answer!");
    
    loadQuestion();
    
    return () => {
      // Stop game music when leaving
      SoundService.stopMusic();
      
      // Clear any running animations/timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  const loadQuestion = async () => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
    
    // Reset animations
    cardAnim.setValue(0);
    fadeAnim.setValue(0);
    explanationAnim.setValue(0);
    
    // Reset mascot to gamemode type
    setMascotType('gamemode');
    setMascotMessage("Choose the correct answer!");
    
    try {
      const question = await QuizService.getRandomQuestion(category);
      setCurrentQuestion(question);
      setQuestionsAnswered(prev => prev + 1);
      
      // Play button sound
      SoundService.playButtonPress();
      
      // Create animation values for each option
      optionsAnim.length = Object.keys(question.options || {}).length;
      for (let i = 0; i < optionsAnim.length; i++) {
        optionsAnim[i] = new Animated.Value(0);
      }
      
      // Start animations
      Animated.parallel([
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Staggered options animation
        ...optionsAnim.map((anim, index) => 
          Animated.sequence([
            Animated.delay(400 + (index * 100)),
            Animated.spring(anim, {
              toValue: 1,
              friction: 7,
              tension: 40,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
      
      // Start timer animation
      Animated.timing(timerAnim, {
        toValue: 0,
        duration: 10000, // 10 seconds
        useNativeDriver: false, // Need for width animation
        easing: Easing.linear,
      }).start();
      
      // Set timer to show time's up after 10 seconds
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = setTimeout(() => {
        // Only trigger if no answer selected yet
        if (selectedAnswer === null) {
          handleTimeUp();
        }
      }, 10000);
      
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTimeUp = () => {
    // Check if already answered
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer('TIMEOUT');
    setIsCorrect(false);
    setMascotType('sad');
    setMascotMessage("Time's up! Let's try again.");
    
    // Show explanation with a short delay
    setTimeout(() => {
      setShowExplanation(true);
      showExplanationWithAnimation();
    }, 500);
    
    // Reset streak on timeout
    setStreak(0);
    
    // Play incorrect sound
    SoundService.playIncorrect();
  };
  
  const handleAnswerSelect = (option) => {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    
    setSelectedAnswer(option);
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    
    // Update mascot based on answer correctness
    if (correct) {
      setMascotType('excited');
      setMascotMessage("Great job! That's correct!");
      
      // Animate streak counter
      Animated.sequence([
        Animated.timing(streakAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(streakAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ]).start();
      
      SoundService.playCorrect();
    } else {
      setMascotType('sad');
      setMascotMessage("Oops, that's not right.");
      SoundService.playIncorrect();
    }
    
    // Update streak
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectAnswers(prev => prev + 1);
      
      // Show points animation
      const points = Math.round(50 + (50 * timerAnim._value)); // More points for faster answers
      setPointsEarned(points);
      setShowPointsAnimation(true);
      
      // Animate points popup
      Animated.sequence([
        Animated.timing(pointsAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.delay(1200),
        Animated.timing(pointsAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start(() => {
        setShowPointsAnimation(false);
      });
      
      // Handle milestone (every 5 correct answers)
      if (newStreak % 5 === 0) {
        // Add more time for milestones - 2 minutes (120 seconds)
        TimerService.addTimeCredits(120);
        
        // Play streak sound for milestones
        SoundService.playStreak();
        
        // Update mascot to celebrate milestone
        setMascotType('excited');
        setMascotMessage("🎉 Amazing! You hit a streak milestone!");
      } else {
        // Regular reward - 30 seconds
        TimerService.addTimeCredits(30);
      }
    } else {
      // Reset streak on wrong answer
      setStreak(0);
    }
    
    // Show explanation with a short delay
    setTimeout(() => {
      setShowExplanation(true);
      showExplanationWithAnimation();
    }, 500);
  };
  
  const showExplanationWithAnimation = () => {
    // Start explanation animation
    Animated.spring(explanationAnim, {
      toValue: 1,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const handleContinue = () => {
    // Play button sound
    SoundService.playButtonPress();
    
    // Hide explanation with animation
    Animated.timing(explanationAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic),
    }).start(() => {
      setShowExplanation(false);
      loadQuestion();
    });
  };
  
  const handleGoBack = () => {
    // Play button sound
    SoundService.playButtonPress();
    navigation.goBack();
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const getRewardText = () => {
    if (!isCorrect) return '';
    
    // Different text for milestone versus regular correct answer
    if ((streak) % 5 === 0) {
      return '🎉 Milestone bonus! +2 minutes of app time!';
    } else {
      return '+30 seconds of app time!';
    }
  };
  
  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header with stats */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Correct: {correctAnswers}/{questionsAnswered}</Text>
          </View>
          <Animated.View 
            style={[
              styles.streakContainer,
              {
                transform: [{ scale: streakAnim }]
              }
            ]}
          >
            <Icon 
              name="fire" 
              size={16} 
              color={streak > 0 ? theme.colors.primary : '#ccc'} 
            />
            <Text style={styles.streakText}>{streak}</Text>
          </Animated.View>
        </Animated.View>
        
        {/* Category indicator */}
        <Animated.View 
          style={[
            styles.categoryContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.categoryText}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </Animated.View>
        
        {/* Timer bar - looks similar to web version */}
        <Animated.View 
          style={[
            styles.timerContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.timerBar}>
            <Animated.View 
              style={[
                styles.timerFill,
                {
                  width: timerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: timerAnim.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: ['#ef4444', '#facc15', '#22c55e', '#22c55e']
                  })
                }
              ]}
            />
          </View>
        </Animated.View>
        
        {/* Question card */}
        <Animated.View 
          style={[
            styles.questionContainer,
            {
              opacity: cardAnim,
              transform: [
                { 
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                },
                { 
                  scale: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }
              ]
            }
          ]}
        >
          <Text style={styles.questionText}>{currentQuestion?.question}</Text>
          
          <View style={styles.optionsContainer}>
            {currentQuestion?.options && Object.entries(currentQuestion.options).map(([key, value], index) => (
              <Animated.View
                key={key}
                style={{
                  opacity: optionsAnim[index] || fadeAnim,
                  transform: [
                    { 
                      translateY: (optionsAnim[index] || fadeAnim).interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }
                  ]
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedAnswer === key && (
                      key === currentQuestion.correctAnswer ? styles.correctOption : styles.incorrectOption
                    )
                  ]}
                  onPress={() => handleAnswerSelect(key)}
                  disabled={selectedAnswer !== null}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionKey}>{key}.</Text>
                  <Text style={styles.optionText}>{value}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
        
        {/* Explanation */}
        {showExplanation && (
          <Animated.View 
            style={[
              styles.explanationContainer,
              isCorrect ? styles.correctExplanation : styles.incorrectExplanation,
              {
                opacity: explanationAnim,
                transform: [
                  { 
                    translateY: explanationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  },
                  { 
                    scale: explanationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1]
                    })
                  }
                ]
              }
            ]}
          >
            <Text style={styles.explanationTitle}>
              {isCorrect ? 'Correct!' : selectedAnswer === 'TIMEOUT' ? 'Time\'s up!' : 'Incorrect!'}
            </Text>
            <Text style={styles.explanationText}>
              {currentQuestion.explanation}
            </Text>
            
            {isCorrect && (
              <View style={styles.rewardContainer}>
                <Icon name="clock-plus-outline" size={20} color="#856404" />
                <Text style={styles.rewardText}>
                  {getRewardText()}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Next Question</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Exit button */}
        {!showExplanation && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Text style={styles.backButtonText}>Exit Quiz</Text>
          </TouchableOpacity>
        )}
        
        {/* Points animation - similar to web version */}
        {showPointsAnimation && (
          <Animated.View 
            style={[
              styles.pointsAnimationContainer,
              {
                opacity: pointsAnim,
                transform: [
                  { 
                    translateY: pointsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -30]
                    })
                  },
                  { 
                    scale: pointsAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 1.2, 1]
                    })
                  }
                ]
              }
            ]}
          >
            <Text style={styles.pointsText}>+{pointsEarned}</Text>
          </Animated.View>
        )}
        
        {/* Mascot */}
        <EnhancedMascotDisplay
          type={mascotType}
          position="right"
          showMascot={true}
          message={mascotMessage}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    ...theme.shadows.sm,
  },
  statsText: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.textDark,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 8,
    ...theme.shadows.sm,
  },
  streakText: {
    marginLeft: 4,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  categoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  timerContainer: {
    marginBottom: 16,
  },
  timerBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    ...theme.shadows.md,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.textDark,
    lineHeight: 24,
  },
  optionsContainer: {
    marginVertical: 12,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  correctOption: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderColor: 'rgba(46, 204, 113, 0.5)',
    borderWidth: 2,
  },
  incorrectOption: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderColor: 'rgba(231, 76, 60, 0.5)',
    borderWidth: 2,
  },
  optionKey: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
    color: theme.colors.textDark,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    color: theme.colors.textDark,
  },
  explanationContainer: {
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.md,
  },
  correctExplanation: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderColor: 'rgba(46, 204, 113, 0.3)',
    borderWidth: 2,
  },
  incorrectExplanation: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderColor: 'rgba(231, 76, 60, 0.3)',
    borderWidth: 2,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.textDark,
  },
  explanationText: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
    color: theme.colors.textDark,
  },
  rewardContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    color: '#856404',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  pointsAnimationContainer: {
    position: 'absolute',
    top: '30%', 
    right: '15%',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    ...theme.shadows.md,
  },
  pointsText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 20,
  },
});

export default QuizScreen;