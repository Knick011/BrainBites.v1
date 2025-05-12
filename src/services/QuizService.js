// src/services/QuizService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import CSVReader from '../utils/CSVReader';

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
  
  // Load questions from CSV file
  async loadQuestions() {
    try {
      // Try to load questions from CSV file in assets/data folder
      const questionData = await CSVReader.readCSV('questions.csv', 'src/assets/data');
      
      // Process the data
      this.questions = questionData.filter(item => item.id && item.question);
      
      // Count questions per category for tracking purposes
      this._updateCategoryCounts();
      
      console.log(`Loaded ${this.questions.length} questions from CSV file`);
      console.log('Categories count:', this.categoryCounts);
    } catch (error) {
      console.error('Error loading questions from CSV:', error);
      console.log('Falling back to built-in questions');
      this.setupFallbackQuestions();
    }
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
  
  // Provide a fallback question if something goes wrong
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
      'math': {
        id: 'fallback-math',
        question: "What is 2 + 2?",
        options: {
          A: "3",
          B: "4",
          C: "5",
          D: "6"
        },
        correctAnswer: "B",
        explanation: "2 + 2 = 4. This is a basic addition fact."
      },
      'science': {
        id: 'fallback-science',
        question: "What particle has a positive charge?",
        options: {
          A: "Proton",
          B: "Neutron",
          C: "Electron",
          D: "Photon"
        },
        correctAnswer: "A",
        explanation: "Protons have a positive charge, electrons have a negative charge, and neutrons have no charge."
      },
      'history': {
        id: 'fallback-history',
        question: "In which year did World War II end?",
        options: {
          A: "1943",
          B: "1945",
          C: "1947",
          D: "1950"
        },
        correctAnswer: "B",
        explanation: "World War II ended in 1945 with the surrender of Japan following the atomic bombings of Hiroshima and Nagasaki."
      },
      'english': {
        id: 'fallback-english',
        question: "Which of these words is a synonym for 'happy'?",
        options: {
          A: "Sad",
          B: "Jealous", 
          C: "Joyful",
          D: "Angry"
        },
        correctAnswer: "C",
        explanation: "Joyful is a synonym (word with similar meaning) for happy."
      },
      'general': {
        id: 'fallback-general',
        question: "What is the capital of Canada?",
        options: {
          A: "Toronto",
          B: "Vancouver",
          C: "Ottawa",
          D: "Montreal"
        },
        correctAnswer: "C",
        explanation: "Ottawa is the capital city of Canada, located in the province of Ontario."
      },
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