// src/components/mascot/EnhancedMascotDisplay.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing,
  Image,
  Dimensions,
  TouchableOpacity,
  Platform
} from 'react-native';
import theme from '../../styles/theme';

// Get screen dimensions for positioning
const { width, height } = Dimensions.get('window');

// Map mascot types to image paths (will need to create these assets)
const MASCOT_IMAGES = {
  happy: require('../../assets/images/mascot/happy.png'),
  sad: require('../../assets/images/mascot/sad.png'),
  excited: require('../../assets/images/mascot/excited.png'),
  depressed: require('../../assets/images/mascot/depressed.png'),
  gamemode: require('../../assets/images/mascot/gamemode.png'),
  below: require('../../assets/images/mascot/below.png'),
};

const EnhancedMascotDisplay = ({ 
  type = 'happy', 
  position = 'left',
  showMascot = true,
  lastVisit = null,
  onDismiss = null,
  message = null, // Speech bubble message
  autoHide = false, // Automatically hide after a duration
  autoHideDuration = 5000 // Duration in ms before auto-hiding
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mascotType, setMascotType] = useState(type);
  const [isWaving, setIsWaving] = useState(false);
  const [isSinking, setIsSinking] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState(message);
  
  // Animation values
  const entryAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  
  // Timers
  const autoHideTimer = useRef(null);
  const sinkTimer = useRef(null);
  const messageTimer = useRef(null);
  
  // Used for entry animation delay
  const entryDelay = 300;
  
  // Update mascot type when prop changes
  useEffect(() => {
    // Check if returning user after 1+ days - similar to web version
    if (lastVisit && type === 'happy') {
      const daysSinceLastVisit = Math.floor((new Date() - new Date(lastVisit)) / (1000 * 60 * 60 * 24));
      if (daysSinceLastVisit >= 1) {
        setMascotType('depressed');
      } else {
        setMascotType(type);
      }
    } else {
      setMascotType(type);
    }
  }, [type, lastVisit]);
  
  // Handle message updates
  useEffect(() => {
    setDisplayedMessage(message);
  }, [message]);
  
  // Start bounce animation
  const startBounceAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        })
      ])
    ).start();
  };
  
  // Start wave animation
  const startWaveAnimation = () => {
    setIsWaving(true);
    Animated.sequence([
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin)
      }),
      Animated.timing(waveAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin)
      }),
      Animated.timing(waveAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin)
      }),
      Animated.timing(waveAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin)
      })
    ]).start(() => {
      setIsWaving(false);
    });
  };
  
  // Main effect to control visibility and animations
  useEffect(() => {
    // Clear all timers when component unmounts or dependencies change
    const clearAllTimers = () => {
      clearTimeout(sinkTimer.current);
      clearTimeout(autoHideTimer.current);
      clearTimeout(messageTimer.current);
    };
    
    if (showMascot) {
      // Clear any existing timers
      clearAllTimers();
      
      // If we're already showing the peeking mascot and want to show
      // the main mascot, hide the peeking one first
      if (isPeeking) {
        setIsPeeking(false);
      }
      
      // Show the main mascot after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsSinking(false);
        
        // Animate entry
        Animated.timing(entryAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }).start();
        
        // Start bounce animation
        startBounceAnimation();
        
        // Add a wave animation
        setTimeout(() => {
          startWaveAnimation();
        }, 500);
        
        // For messages, display longer (5s) vs standard (3s)
        const displayDuration = displayedMessage ? 5000 : 3000;
        
        // Schedule the mascot to sink after the display duration
        sinkTimer.current = setTimeout(() => {
          setIsSinking(true);
          
          // Animate out
          Animated.timing(entryAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic)
          }).start();
          
          // After sinking animation completes, show peeking mascot
          setTimeout(() => {
            setIsVisible(false);
            setIsPeeking(true);
          }, 300); // Sinking animation duration
        }, displayDuration);
        
        // Set up auto-hide if enabled (overrides sinking behavior)
        if (autoHide) {
          autoHideTimer.current = setTimeout(() => {
            setIsSinking(true);
            
            // Animate out
            Animated.timing(entryAnim, {
              toValue: 0,
              duration: 300, 
              useNativeDriver: true,
              easing: Easing.in(Easing.cubic)
            }).start();
            
            setTimeout(() => {
              setIsVisible(false);
              setIsPeeking(true);
              if (onDismiss) onDismiss();
            }, 300);
          }, autoHideDuration);
        }
      }, entryDelay);
      
      return () => {
        clearTimeout(timer);
        clearAllTimers();
      };
    } else {
      // When instructed to hide, hide everything
      setIsVisible(false);
      setIsPeeking(false);
    }
  }, [showMascot, autoHide, autoHideDuration, onDismiss, displayedMessage, entryAnim]);
  
  // Handle new message arrival - reset timers to give user time to read
  useEffect(() => {
    if (isVisible && displayedMessage && !isSinking) {
      // Clear any existing sink timer to give user time to read the message
      clearTimeout(sinkTimer.current);
      
      // Set new sink timer
      sinkTimer.current = setTimeout(() => {
        setIsSinking(true);
        
        // Animate out
        Animated.timing(entryAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start();
        
        // After sinking animation completes, show peeking mascot
        setTimeout(() => {
          setIsVisible(false);
          setIsPeeking(true);
        }, 300); // Sinking animation duration
      }, 5000); // 5 seconds for messages
    }
  }, [displayedMessage, isVisible, isSinking, entryAnim]);
  
  // Handle mascot dismissal
  const handleDismiss = () => {
    setIsSinking(true);
    
    // Animate out
    Animated.timing(entryAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    setTimeout(() => {
      setIsVisible(false);
      setIsPeeking(true);
      if (onDismiss) {
        onDismiss();
      }
    }, 300);
  };
  
  // Handle click on peeking mascot
  const handlePeekClick = () => {
    setIsPeeking(false);
    
    setTimeout(() => {
      setIsVisible(true);
      setIsSinking(false);
      
      // Animate back in
      Animated.timing(entryAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }).start();
      
      // Reset sinking timer - sink after 3 seconds (or 5 if has message)
      const displayDuration = displayedMessage ? 5000 : 3000;
      
      clearTimeout(sinkTimer.current);
      sinkTimer.current = setTimeout(() => {
        setIsSinking(true);
        
        // Animate out 
        Animated.timing(entryAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start();
        
        setTimeout(() => {
          setIsVisible(false);
          setIsPeeking(true);
        }, 300);
      }, displayDuration);
    }, 100);
  };
  
  // Get the mascot image source
  const getMascotImage = () => {
    const imageSrc = MASCOT_IMAGES[mascotType] || MASCOT_IMAGES.happy;
    return imageSrc;
  };
  
  // Don't render anything if not supposed to show and not peeking
  if (!showMascot && !isVisible && !isPeeking) return null;
  
  // Special case for 'below' type
  if (mascotType === 'below') {
    return (
      <View style={[
        styles.belowContainer, 
        position === 'left' ? styles.left : styles.right
      ]}>
        {/* Speech bubble */}
        {displayedMessage && (
          <View style={[
            styles.speechBubble, 
            styles.belowSpeechBubble, 
            position === 'left' ? styles.leftBubble : styles.rightBubble
          ]}>
            <Text style={styles.speechText}>{displayedMessage}</Text>
            <View 
              style={[
                styles.speechArrow, 
                styles.belowSpeechArrow,
                position === 'left' ? styles.leftArrow : styles.rightArrow
              ]} 
            />
          </View>
        )}
        
        {/* Below mascot - only top portion visible */}
        <Animated.View style={[
          styles.belowMascotWrapper, 
          { opacity: entryAnim }
        ]}>
          <Image 
            source={getMascotImage()} 
            style={styles.belowMascotImage} 
            resizeMode="contain" 
          />
        </Animated.View>
      </View>
    );
  }
  
  // Peeking mascot
  if (isPeeking && !isVisible) {
    return (
      <TouchableOpacity 
        style={styles.peekingContainer}
        onPress={handlePeekClick}
        activeOpacity={0.8}
      >
        <Animated.Image 
          source={MASCOT_IMAGES.below} // Always use 'below' image for peeking
          style={styles.peekingImage} 
          resizeMode="contain" 
        />
      </TouchableOpacity>
    );
  }
  
  // Get transform based on position
  const getTransform = () => {
    const baseTransform = [
      { 
        translateY: entryAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [100, 0] 
        })
      }
    ];
    
    // Add rotation based on position
    if (position === 'left') {
      baseTransform.push({ rotate: '8deg' });
    } else {
      baseTransform.push({ rotate: '-8deg' });
    }
    
    // Add bounce animation
    baseTransform.push({
      translateY: bounceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10]
      })
    });
    
    // Add wave animation if active
    if (isWaving) {
      baseTransform.push({
        rotate: waveAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [position === 'left' ? '8deg' : '-8deg', position === 'left' ? '0deg' : '0deg', position === 'left' ? '15deg' : '-15deg']
        })
      });
    }
    
    return baseTransform;
  };
  
  // Regular mascot display
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        position === 'left' ? styles.left : styles.right
      ]}
      onPress={handleDismiss}
      activeOpacity={1}
    >
      <Animated.View 
        style={[
          styles.mascotWrapper,
          {
            opacity: entryAnim,
            transform: getTransform()
          }
        ]}
      >
        {/* Speech bubble */}
        {displayedMessage && (
          <View style={[
            styles.speechBubble, 
            position === 'left' ? styles.leftBubble : styles.rightBubble
          ]}>
            <Text style={styles.speechText}>{displayedMessage}</Text>
            <View 
              style={[
                styles.speechArrow, 
                position === 'left' ? styles.leftArrow : styles.rightArrow
              ]} 
            />
          </View>
        )}
        
        {/* Mascot image */}
        <View style={styles.mascotImageContainer}>
          <Image 
            source={getMascotImage()} 
            style={styles.mascotImage} 
            resizeMode="contain" 
          />
          {/* Stick/pole effect from web version */}
          <View style={styles.mascotStick} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    zIndex: 100,
  },
  belowContainer: {
    position: 'absolute',
    bottom: -40,
    zIndex: 100,
    width: 120,
  },
  left: {
    left: 20,
  },
  right: {
    right: 20,
  },
  mascotWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  belowMascotWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  mascotImageContainer: {
    width: 100,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  belowMascotImage: {
    width: 120,
    height: 100,
  },
  mascotStick: {
    position: 'absolute',
    bottom: -30,
    left: '50%',
    marginLeft: -8, // Half of the width
    width: 16,
    height: 70,
    backgroundColor: '#bb8e3c',
    borderRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  peekingContainer: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -60, // Half of the width
    width: 120,
    height: 80,
    zIndex: 49,
  },
  peekingImage: {
    width: 120,
    height: 80,
  },
  speechBubble: {
    position: 'absolute',
    bottom: 130,
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 12,
    maxWidth: 200,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  belowSpeechBubble: {
    bottom: 90, // Adjusted for 'below' type
  },
  leftBubble: {
    left: 0,
  },
  rightBubble: {
    right: 0,
  },
  speechText: {
    fontSize: 14,
    color: theme.colors.textDark,
  },
  speechArrow: {
    position: 'absolute',
    bottom: -10,
    width: 20,
    height: 20,
    backgroundColor: theme.colors.background,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: theme.colors.primary,
    transform: [{ rotate: '45deg' }],
  },
  belowSpeechArrow: {
    bottom: -10,
  },
  leftArrow: {
    left: 20,
  },
  rightArrow: {
    right: 20,
  },
});

export default EnhancedMascotDisplay;