import QuizAttempt from "../models/QuizAttempt.js";
import QuizAttemptAnswer from "../models/QuizAttemptAnswer.js";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import MLInsight from "../models/MLInsight.js";

/**
 * Generates machine learning insights for a user based on their quiz performance
 * @param {string} userId - The user ID to generate insights for
 * @returns {Promise<Object>} - The updated ML insights
 */
export const generateUserInsights = async (userId) => {
  try {
    console.log(`Generating ML insights for user: ${userId}`);
    
    // Get completed quiz attempts for the user (limit to most recent 20 for better data)
    const attempts = await QuizAttempt.find({ 
      user_id: userId,
      status: "COMPLETED"
    })
    .sort({ completed_at: -1 })
    .limit(20)
    .lean();
    
    if (attempts.length === 0) {
      console.log(`No completed quiz attempts found for user: ${userId}`);
      return null;
    }
    
    // Get all quiz IDs from attempts
    const quizIds = [...new Set(attempts.map(attempt => attempt.quiz_id))];
    
    // Get quiz data to access topics
    const quizzes = await Quiz.find({
      id: { $in: quizIds }
    }).lean();
    
    // Create a map for quick quiz lookups
    const quizMap = {};
    quizzes.forEach(quiz => {
      quizMap[quiz.id] = quiz;
    });
    
    // Get attempt IDs
    const attemptIds = attempts.map(attempt => attempt.id);
    
    // Get all answers from these attempts
    const answers = await QuizAttemptAnswer.find({
      attempt_id: { $in: attemptIds }
    }).lean();
    
    // Get question IDs from answers
    const questionIds = [...new Set(answers.map(answer => answer.question_id))];
    
    // Get questions to map to quiz IDs
    const questions = await Question.find({
      id: { $in: questionIds }
    }).lean();
    
    // Create a map for quick question lookups
    const questionMap = {};
    questions.forEach(question => {
      questionMap[question.id] = question;
    });
    
    // Analyze topic performance
    const topicStats = {};
    const topicAttempts = {};
    const recentAttemptsByTopic = {};
    
    // Process answers
    answers.forEach(answer => {
      const question = questionMap[answer.question_id];
      if (!question) return; // Skip if question not found
      
      const quiz = quizMap[question.quiz_id];
      if (!quiz) return; // Skip if quiz not found
      
      const topic = quiz.topic;
      if (!topic) return; // Skip if topic not found
      
      // Initialize topic stats
      if (!topicStats[topic]) {
        topicStats[topic] = { 
          correct: 0, 
          total: 0, 
          // Track weighted scores based on difficulty
          weightedCorrect: 0,
          weightedTotal: 0
        };
      }
      
      // Initialize topic attempts tracking
      if (!topicAttempts[topic]) {
        topicAttempts[topic] = [];
      }
      
      // Initialize recent attempts tracking
      if (!recentAttemptsByTopic[topic]) {
        recentAttemptsByTopic[topic] = [];
      }
      
      // Get the attempt for timestamp info
      const attempt = attempts.find(a => a.id === answer.attempt_id);
      const timestamp = attempt ? attempt.completed_at || attempt.created_at : new Date();
      
      // Calculate weight based on difficulty (higher weight for harder questions)
      let difficultyWeight = 1.0;
      if (quiz.difficulty === 'MEDIUM') {
        difficultyWeight = 1.5;
      } else if (quiz.difficulty === 'HARD') {
        difficultyWeight = 2.0;
      }
      
      // Update stats
      topicStats[topic].total += 1;
      topicStats[topic].weightedTotal += difficultyWeight;
      
      if (answer.is_correct) {
        topicStats[topic].correct += 1;
        topicStats[topic].weightedCorrect += difficultyWeight;
      }
      
      // Track attempt details for confidence scoring
      const attemptDetail = {
        is_correct: answer.is_correct,
        timestamp: timestamp,
        difficulty: quiz.difficulty,
        weight: difficultyWeight
      };
      
      topicAttempts[topic].push(attemptDetail);
      recentAttemptsByTopic[topic].push(attemptDetail);
    });
    
    // For each topic, sort attempts by timestamp and keep only the most recent ones
    Object.keys(recentAttemptsByTopic).forEach(topic => {
      recentAttemptsByTopic[topic].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      // Keep only the 10 most recent attempts
      recentAttemptsByTopic[topic] = recentAttemptsByTopic[topic].slice(0, 10);
    });
    
    // Calculate topic proficiency scores with weighted scoring
    const topicProficiency = {};
    const weakTopics = [];
    const strongTopics = [];
    const confidenceScores = {};
    
    // Process topics with at least 3 attempts for more reliable data
    Object.entries(topicStats).forEach(([topic, stats]) => {
      if (stats.total < 3) return; // Skip topics with too few attempts
      
      // Calculate standard score using the weighted average
      const score = Math.round((stats.weightedCorrect / stats.weightedTotal) * 100);
      
      // Store the score
      topicProficiency[topic] = score;
      
      // Calculate confidence score based on consistency, recency, and improvement trend
      let confidenceScore = score; // Start with base score
      
      const recentAttempts = recentAttemptsByTopic[topic];
      if (recentAttempts.length >= 3) {
        // Calculate recent performance
        const recentCorrectWeighted = recentAttempts
          .filter(a => a.is_correct)
          .reduce((sum, a) => sum + a.weight, 0);
        
        const recentTotalWeighted = recentAttempts
          .reduce((sum, a) => sum + a.weight, 0);
        
        const recentScore = Math.round((recentCorrectWeighted / recentTotalWeighted) * 100);
        
        // Check for improvement trend
        const olderAttempts = topicAttempts[topic]
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(0, -recentAttempts.length);
        
        let trendFactor = 0;
        if (olderAttempts.length >= 3) {
          const olderCorrectWeighted = olderAttempts
            .filter(a => a.is_correct)
            .reduce((sum, a) => sum + a.weight, 0);
          
          const olderTotalWeighted = olderAttempts
            .reduce((sum, a) => sum + a.weight, 0);
          
          const olderScore = Math.round((olderCorrectWeighted / olderTotalWeighted) * 100);
          
          // Calculate trend (positive if improving)
          trendFactor = recentScore - olderScore;
        }
        
        // Blend base score with recent performance and trend
        confidenceScore = Math.round(score * 0.6 + recentScore * 0.3 + trendFactor * 0.1);
        
        // Ensure the score is within valid range
        confidenceScore = Math.max(0, Math.min(100, confidenceScore));
      }
      
      confidenceScores[topic] = confidenceScore;
      
      // Classify as weak or strong based on score
      if (score < 60) {
        weakTopics.push(topic);
      } else if (score >= 80) {
        strongTopics.push(topic);
      }
    });
    
    // Create weak_topics data object for dashboard
    const weakTopicsData = {};
    weakTopics.forEach(topic => {
      if (topicProficiency[topic] !== undefined) {
        weakTopicsData[topic] = topicProficiency[topic];
      }
    });
    
    // Find or create ML insight document for the user
    let mlInsight = await MLInsight.findOne({ user_id: userId });
    
    if (!mlInsight) {
      mlInsight = new MLInsight({ user_id: userId });
    }
    
    // Convert topic performance to Map for existing schema compatibility
    const performanceMap = new Map();
    Object.entries(topicProficiency).forEach(([topic, score]) => {
      performanceMap.set(topic, score);
    });
    
    // Update ML insights
    mlInsight.weak_topics = weakTopics;
    mlInsight.strong_topics = strongTopics;
    mlInsight.confidence_scores = confidenceScores;
    mlInsight.topic_performance = performanceMap;
    
    // Add or update the additional fields for the dashboard
    mlInsight.topic_proficiency = topicProficiency;
    mlInsight.weak_topics_data = weakTopicsData;
    mlInsight.last_updated = new Date();
    
    await mlInsight.save();
    
    console.log(`ML insights updated for user: ${userId} with ${Object.keys(topicProficiency).length} topics analyzed`);
    return mlInsight;
    
  } catch (error) {
    console.error('Error generating ML insights:', error);
    throw error;
  }

}