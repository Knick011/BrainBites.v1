// src/services/QuizService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import CSVReader from '../utils/CSVReader';

// Add direct import for questions as a more reliable fallback
// Convert your CSV to JSON and place it in this location
let questionsJson = [];
try {
  questionsJson = require('../assets/data/questions.json');
} catch (e) {
  console.log('Questions JSON not available, will try CSV or fallback');
}

class QuizService {
  constructor() {
    this.questions = [];
    this.usedQuestionIds = new Set();
    this.categoryCounts = {};
    this.STORAGE_KEY = 'brainbites_quiz_data';
    this.loadSavedData();
    this.loadQuestions();
  }
  
  // Load previously saved quiz data from storage
  async loadSavedData() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        this.usedQuestionIds = new Set(parsedData.usedQuestionIds || []);
      }
    } catch (error) {
      console.error('Error loading saved quiz data:', error);
    }
  }
  
  // Save quiz data to storage
  async saveData() {
    try {
      const data = {
        usedQuestionIds: Array.from(this.usedQuestionIds),
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving quiz data:', error);
    }
  }
  
  // Load questions from CSV file with multiple fallback strategies
  async loadQuestions() {
    console.log('Starting to load questions...');
    
    // Track if we've successfully loaded questions
    let questionsLoaded = false;
    
    // Try multiple strategies for loading questions
    
    // Strategy 1: Try loading from CSV in assets/data
    try {
      console.log('Attempting to load questions from CSV...');
      const questionData = await CSVReader.readCSV('questions.csv', 'assets/data');
      
      // Process the data
      if (questionData && questionData.length > 0) {
        this.questions = questionData.filter(item => item.id && item.question);
        if (this.questions.length > 0) {
          questionsLoaded = true;
          console.log(`Successfully loaded ${this.questions.length} questions from CSV`);
        }
      }
    } catch (error) {
      console.log('Error loading questions from CSV (Strategy 1):', error.message);
    }
    
    // Strategy 2: Try loading from src/assets/data
    if (!questionsLoaded) {
      try {
        console.log('Attempting to load questions from src/assets/data...');
        const questionData = await CSVReader.readCSV('questions.csv', 'src/assets/data');
        
        if (questionData && questionData.length > 0) {
          this.questions = questionData.filter(item => item.id && item.question);
          if (this.questions.length > 0) {
            questionsLoaded = true;
            console.log(`Successfully loaded ${this.questions.length} questions from src/assets/data CSV`);
          }
        }
      } catch (error) {
        console.log('Error loading questions from CSV (Strategy 2):', error.message);
      }
    }
    
    // Strategy 3: Use the imported JSON if available
    if (!questionsLoaded && questionsJson.length > 0) {
      console.log('Using pre-imported questions JSON...');
      this.questions = questionsJson;
      questionsLoaded = true;
      console.log(`Loaded ${this.questions.length} questions from bundled JSON`);
    }
    
    // Strategy 4: If all else fails, use hardcoded fallback questions
    if (!questionsLoaded) {
      console.log('All loading strategies failed, using fallback questions');
      this.setupFallbackQuestions();
      questionsLoaded = true;
    }
    
    // Update category counts after loading questions via any method
    this._updateCategoryCounts();
    console.log('Available categories:', Object.keys(this.categoryCounts));
  }
  
  // Update the counts of questions by category
  _updateCategoryCounts() {
    this.categoryCounts = {};
    this.questions.forEach(q => {
      if (q.category) {
        if (!this.categoryCounts[q.category]) {
          this.categoryCounts[q.category] = 0;
        }
        this.categoryCounts[q.category]++;
      }
    });
  }
  
  // The rest of the methods remain the same
  
  // Set up fallback questions in case CSV loading fails
  setupFallbackQuestions() {
    console.log('Using fallback questions');
    
    // Create a minimal set of fallback questions
    this.questions = [
      {
        id: 'A1',
        category: 'funfacts',
        question: 'Which planet is known as the Red Planet?',
        optionA: 'Venus',
        optionB: 'Mars',
        optionC: 'Jupiter',
        optionD: 'Saturn',
        correctAnswer: 'B',
        explanation: 'Mars is called the Red Planet because of the reddish iron oxide on its surface.'
      },
      {
        id: 'B1',
        category: 'psychology',
        question: 'What is the fear of spiders called?',
        optionA: 'Arachnophobia',
        optionB: 'Acrophobia',
        optionC: 'Agoraphobia',
        optionD: 'Aerophobia',
        correctAnswer: 'A',
        explanation: 'Arachnophobia is the intense fear of spiders and other arachnids.'
      },
      {
        id: 'C1',
        category: 'math',
        question: 'What is the square root of 144?',
        optionA: '10',
        optionB: '11',
        optionC: '12',
        optionD: '13',
        correctAnswer: 'C',
        explanation: 'The square root of 144 is 12 because 12² = 144.'
      },
      {
        id: 'D1',
        category: 'science',
        question: 'What is the chemical symbol for gold?',
        optionA: 'Au',
        optionB: 'Ag',
        optionC: 'Fe',
        optionD: 'Ge',
        correctAnswer: 'A',
        explanation: "The chemical symbol for gold is Au from the Latin word 'aurum'."
      },
      {
        id: 'E1',
        category: 'history',
        question: 'Who was the first President of the United States?',
        optionA: 'Thomas Jefferson',
        optionB: 'John Adams',
        optionC: 'George Washington',
        optionD: 'Benjamin Franklin',
        correctAnswer: 'C',
        explanation: 'George Washington served as the first President of the United States from 1789 to 1797.'
      },
      {
        id: 'F1',
        category: 'english',
        question: 'What is the past tense of the verb "to go"?',
        optionA: 'Gone',
        optionB: 'Went',
        optionC: 'Going',
        optionD: 'Goed',
        correctAnswer: 'B',
        explanation: 'The past tense of "to go" is "went" while "gone" is the past participle.'
      },
      {
        id: 'G1',
        category: 'general',
        question: 'Which is the largest ocean on Earth?',
        optionA: 'Atlantic Ocean',
        optionB: 'Indian Ocean',
        optionC: 'Southern Ocean',
        optionD: 'Pacific Ocean',
        correctAnswer: 'D',
        explanation: "The Pacific Ocean is the largest and deepest ocean on Earth, covering more than 30% of the Earth's surface."
      }
    ];
    
    // Update category counts for fallbacks
    this._updateCategoryCounts();
    
    console.log('Fallback questions loaded successfully');
  }
  
  // Get a random question from a specific category
  async getRandomQuestion(category = 'funfacts') {
    try {
      // Filter questions by category
      const categoryQuestions = this.questions.filter(q => q.category === category);
      
      if (categoryQuestions.length === 0) {
        console.warn(`No questions found for category: ${category}`);
        return this.getFallbackQuestion(category);
      }
      
      // Filter out recently used questions
      const availableQuestions = categoryQuestions.filter(q => !this.usedQuestionIds.has(q.id));
      
      // If we've used too many questions (more than 80% of the category), reset tracking for this category
      if (availableQuestions.length < 0.2 * this.categoryCounts[category]) {
        // Clear only the used questions for this specific category
        const categoryPrefix = category[0].toUpperCase();
        this.usedQuestionIds.forEach(id => {
          if (id.startsWith(categoryPrefix)) {
            this.usedQuestionIds.delete(id);
          }
        });
        
        await this.saveData();
        console.log(`Reset tracking for category ${category}`);
        
        // Try again with refreshed tracking
        return this.getRandomQuestion(category);
      }
      
      // If still no available questions, return a fallback
      if (availableQuestions.length === 0) {
        return this.getFallbackQuestion(category);
      }
      
      // Pick a truly random question
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions[randomIndex];
      
      // Mark as used
      this.usedQuestionIds.add(question.id);
      await this.saveData();
      
      console.log(`Selected question ${question.id} from ${availableQuestions.length} available questions`);
      
      // Format the question object to match what the app expects
      return {
        id: question.id,
        question: question.question,
        options: {
          A: question.optionA,
          B: question.optionB,
          C: question.optionC,
          D: question.optionD
        },
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      };
    } catch (error) {
      console.error('Error getting random question:', error);
      return this.getFallbackQuestion(category);
    }
  }
  
  // The rest of your methods remain unchanged
  getFallbackQuestion(category) {
    const fallbacks = {
      'funfacts': {
        id: 'fallback-funfacts',
        question: "Which planet is closest to the Sun?",
        options: {
          A: "Earth",
          B: "Venus",
          C: "Mercury",
          D: "Mars"
        },
        correctAnswer: "C",
        explanation: "Mercury is the closest planet to the Sun in our solar system."
      },
      'psychology': {
        id: 'fallback-psychology',
        question: "What is the study of dreams called?",
        options: {
          A: "Oneirology",
          B: "Neurology",
          C: "Psychology",
          D: "Psychiatry"
        },
        correctAnswer: "A",
        explanation: "Oneirology is the scientific study of dreams."
      },
      // Rest of fallbacks remain the same
      'default': {
        id: 'fallback-default',
        question: "What is the capital of France?",
        options: {
          A: "London",
          B: "Berlin",
          C: "Paris",
          D: "Madrid"
        },
        correctAnswer: "C",
        explanation: "Paris is the capital and largest city of France."
      }
    };
    
    return fallbacks[category] || fallbacks['default'];
  }
  
  // Get available categories
  async getCategories() {
    try {
      // Get unique categories from questions
      const categories = [...new Set(this.questions.map(q => q.category))];
      return categories.length > 0 ? categories : ['funfacts', 'psychology', 'math', 'science', 'history', 'english', 'general'];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return ['funfacts', 'psychology', 'math', 'science', 'history', 'english', 'general'];
    }
  }
  
  // Clear used questions tracking
  async resetUsedQuestions() {
    this.usedQuestionIds.clear();
    await this.saveData();
    console.log('Reset all used questions tracking');
  }
}

export default new QuizService();