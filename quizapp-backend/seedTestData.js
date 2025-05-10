import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Import models
import User from './models/User.js';
import QuizAttempt from './models/QuizAttempt.js';
import MLInsight from './models/MLInsight.js';
import Badge from './models/Badge.js';
import UserBadge from './models/UserBadge.js';
import Quiz from './models/Quiz.js';
import Question from './models/Question.js';
import QuizAttemptAnswer from './models/QuizAttemptAnswer.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding ✅'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Constants
const TEST_USER_ID = uuidv4();
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';
const TEST_USERNAME = 'testuser';

// Seed data
const seedTestData = async () => {
  try {
    console.log('Starting to seed test data...');
    
    // Clear existing test data if any
    await clearTestData();
    
    // Create test user
    const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 10);
    const user = await User.create({
      id: TEST_USER_ID,
      username: TEST_USERNAME,
      email: TEST_USER_EMAIL,
      password: hashedPassword
    });
    console.log(`Created test user: ${user.username} (${user._id})`);
    
    // Create test quizzes
    const quizzes = await createTestQuizzes();
    
    // Create test quiz attempts
    const attempts = await createTestQuizAttempts(TEST_USER_ID, quizzes);
    
    // Create test MLInsight
    const mlInsight = await createTestMLInsight(TEST_USER_ID);
    
    // Create test badges and achievements
    const badges = await createTestBadges();
    await createTestUserBadges(TEST_USER_ID, badges);
    
    console.log('✅ Test data seeding completed successfully!');
    console.log(`Test User Email: ${TEST_USER_EMAIL}`);
    console.log(`Test User Password: ${TEST_USER_PASSWORD}`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
};

// Helper function to clear existing test data
const clearTestData = async () => {
  console.log('Clearing existing test data...');
  await User.deleteOne({ email: TEST_USER_EMAIL });
  await QuizAttempt.deleteMany({ user_id: TEST_USER_ID });
  await MLInsight.deleteMany({ user_id: TEST_USER_ID });
  await UserBadge.deleteMany({ user_id: TEST_USER_ID });
  console.log('Existing test data cleared.');
};

// Helper function to create test quizzes
const createTestQuizzes = async () => {
  console.log('Creating test quizzes...');
  
  const quizTopics = ['Algebra', 'Geometry', 'Chemistry', 'Biology', 'Physics'];
  const quizzes = [];
  
  for (const topic of quizTopics) {
    const quizId = uuidv4();
    
    const quiz = await Quiz.create({
      id: quizId,
      title: `${topic} Quiz`,
      description: `Test quiz for ${topic}`,
      difficulty: Math.random() > 0.5 ? 'MEDIUM' : 'EASY',
      time_limit: 600, // 10 minutes
      topic: topic,
      tags: [topic, 'Test'],
      is_published: true
    });
    
    // Create sample questions for this quiz
    const questions = [];
    for (let i = 1; i <= 5; i++) {
      const questionId = uuidv4();
      
      await Question.create({
        id: questionId,
        quiz_id: quizId,
        content: `Sample ${topic} question ${i}?`,
        question_type: 'MCQ',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: ['Option A'],
        created_at: new Date()
      });
      
      questions.push(questionId);
    }
    
    quizzes.push({ id: quizId, topic, questions });
    console.log(`Created quiz: ${quiz.title} with ${questions.length} questions`);
  }
  
  return quizzes;
};

// Helper function to create test quiz attempts
const createTestQuizAttempts = async (userId, quizzes) => {
  console.log('Creating test quiz attempts...');
  
  const attempts = [];
  const now = new Date();
  
  // Create attempts across last 30 days with varied performance
  for (let i = 0; i < quizzes.length; i++) {
    const quiz = quizzes[i];
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 6)); // Spread attempts over 30 days
    
    // Calculate a score that varies across attempts (60-95%)
    const score = Math.floor(60 + (Math.random() * 36));
    const correctAnswers = Math.floor((score / 100) * 5); // 5 questions per quiz
    
    const attemptId = uuidv4();
    
    // Create the attempt
    const attempt = await QuizAttempt.create({
      id: attemptId,
      user_id: userId,
      quiz_id: quiz.id,
      status: 'COMPLETED',
      score: score,
      total_questions: 5,
      correct_answers: correctAnswers,
      time_taken: 300 + Math.floor(Math.random() * 300), // 5-10 minutes
      created_at: date,
      completed_at: date
    });
    
    // Create answers for this attempt
    for (let j = 0; j < 5; j++) {
      const isCorrect = j < correctAnswers; // Make first 'correctAnswers' answers correct
      
      await QuizAttemptAnswer.create({
        id: uuidv4(),
        attempt_id: attemptId,
        question_id: quiz.questions[j],
        question_order: j + 1,
        selected_answer: isCorrect ? 'Option A' : 'Option B',
        is_correct: isCorrect,
        created_at: date
      });
    }
    
    attempts.push(attempt);
    console.log(`Created quiz attempt for ${quiz.topic} with score ${score}% and ${correctAnswers} correct answers`);
  }
  
  return attempts;
};

// Helper function to create test MLInsight
const createTestMLInsight = async (userId) => {
  console.log('Creating test MLInsight data...');
  
  // Create weak and strong topics
  const weakTopics = ['Algebra', 'Chemistry'];
  const strongTopics = ['Biology', 'Physics'];
  
  // Create confidence scores
  const confidenceScores = {
    'Algebra': 45,
    'Geometry': 65,
    'Chemistry': 52,
    'Biology': 88,
    'Physics': 78
  };
  
  // Create topic performance
  const topicPerformance = new Map();
  Object.entries(confidenceScores).forEach(([topic, score]) => {
    topicPerformance.set(topic, score);
  });
  
  const mlInsight = await MLInsight.create({
    id: uuidv4(),
    user_id: userId,
    weak_topics: weakTopics,
    strong_topics: strongTopics,
    confidence_scores: confidenceScores,
    topic_performance: topicPerformance,
    last_updated: new Date()
  });
  
  console.log(`Created MLInsight data with ${weakTopics.length} weak topics and ${strongTopics.length} strong topics`);
  return mlInsight;
};

// Helper function to create test badges
const createTestBadges = async () => {
  console.log('Creating test badges...');
  
  const badgeData = [
    {
      id: uuidv4(),
      name: "Beginner",
      description: "Complete your first quiz successfully",
      min_score_threshold: 60
    },
    {
      id: uuidv4(),
      name: "Intermediate",
      description: "Achieve a score of 80% or higher",
      min_score_threshold: 80
    },
    {
      id: uuidv4(),
      name: "Pro",
      description: "Achieve a perfect score",
      min_score_threshold: 95
    }
  ];
  
  const badges = [];
  for (const badge of badgeData) {
    const createdBadge = await Badge.create(badge);
    badges.push(createdBadge);
    console.log(`Created badge: ${createdBadge.name}`);
  }
  
  return badges;
};

// Helper function to create test user badges (achievements)
const createTestUserBadges = async (userId, badges) => {
  console.log('Creating test user badge achievements...');
  
  const now = new Date();
  const userBadges = [];
  
  // Award first two badges to the user
  for (let i = 0; i < 2; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 10)); // Space out badge achievements
    
    const userBadge = await UserBadge.create({
      id: uuidv4(),
      user_id: userId,
      badge_id: badges[i].id,
      achieved_at: date
    });
    
    userBadges.push(userBadge);
    console.log(`Awarded badge "${badges[i].name}" to test user`);
  }
  
  return userBadges;
};

// Run the seeding function
seedTestData();

