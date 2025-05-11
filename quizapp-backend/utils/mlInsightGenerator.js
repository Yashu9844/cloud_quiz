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
    
    // Get completed quiz attempts for the user (limit to most recent 10)
    const attempts = await QuizAttempt.find({ 
      user_id: userId,
      status: "COMPLETED"
    })
    .sort({ completed_at: -1 })
    .limit(10)
    .lean();
    
    if (attempts.length === 0) {
      console.log(`No completed quiz attempts found for user: ${userId}`);
      return null;
    }
    
    // Get attempt IDs
    const attemptIds = attempts.map(attempt => attempt.id);
    
    // Get all answers from these attempts
    const answers = await QuizAttemptAnswer.find({
      attempt_id: { $in: attemptIds }
    }).lean();
    
    // Get question IDs from answers
    const questionIds = [...new Set(answers.map(answer => answer.question_id))];
    
    // Get questions with topics
    const questions = await Question.find({
      id: { $in: questionIds }
    }).lean();
    
    // Create a map of question ID to topic
    const questionTopicMap = {};
    questions.forEach(question => {
      questionTopicMap[question.id] = question.topic;
    });
    
    // Analyze topic performance
    const topicStats = {};
    const topicAttempts = {};
    
    // Process answers
    answers.forEach(answer => {
      const topic = questionTopicMap[answer.question_id];
      
      if (!topic) return; // Skip if topic not found
      
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      
      if (!topicAttempts[topic]) {
        topicAttempts[topic] = [];
      }
      
      topicStats[topic].total += 1;
      if (answer.is_correct) {
        topicStats[topic].correct += 1;
      }
      
      // Track attempt details for confidence scoring
      topicAttempts[topic].push({
        is_correct: answer.is_correct,
        timestamp: answer.created_at
      });
    });
    
    // Calculate topic performance scores (0-100)
    const topicPerformance = new Map();
    Object.entries(topicStats).forEach(([topic, stats]) => {
      const score = Math.round((stats.correct / stats.total) * 100);
      topicPerformance.set(topic, score);
    });
    
    // Determine weak and strong topics
    const weakTopics = [];
    const strongTopics = [];
    const confidenceScores = {};
    const performanceMap = new Map();
    
    Object.entries(topicStats).forEach(([topic, stats]) => {
      const score = Math.round((stats.correct / stats.total) * 100);
      performanceMap.set(topic, score);
      
      // Calculate confidence score based on consistency and recency
      const attempts = topicAttempts[topic];
      let confidenceScore = score;  // Base confidence on performance
      
      // Adjust for trend (improving or declining)
      if (attempts.length >= 3) {
        const recentAttempts = attempts
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 3);
          
        const recentCorrect = recentAttempts.filter(a => a.is_correct).length;
        const recentTrend = (recentCorrect / recentAttempts.length) * 100;
        
        // Blend base score with recent trend
        confidenceScore = Math.round(score * 0.7 + recentTrend * 0.3);
      }
      
      confidenceScores[topic] = confidenceScore;
      
      // Classify as weak or strong (store only topic names in arrays)
      if (score < 60) {
        weakTopics.push(topic);
      } else if (score >= 80) {
        strongTopics.push(topic);
      }
    });
    
    // Find or create ML insight document for the user
    let mlInsight = await MLInsight.findOne({ user_id: userId });
    
    if (!mlInsight) {
      mlInsight = new MLInsight({ user_id: userId });
    }
    
    // Update ML insights
    mlInsight.weak_topics = weakTopics;
    mlInsight.strong_topics = strongTopics;
    mlInsight.confidence_scores = confidenceScores;
    mlInsight.topic_performance = performanceMap;
    mlInsight.last_updated = new Date();
    
    await mlInsight.save();
    
    console.log(`ML insights updated for user: ${userId}`);
    return mlInsight;
    
  } catch (error) {
    console.error('Error generating ML insights:', error);
    throw error;
  }
};

