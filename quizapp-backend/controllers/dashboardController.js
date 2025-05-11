import QuizAttempt from "../models/QuizAttempt.js";
import MLInsight from "../models/MLInsight.js";
import UserBadge from "../models/UserBadge.js";
import Badge from "../models/Badge.js";

/**
 * Get dashboard data for a user
 * Includes:
 * - Latest weak/strong topics from MLInsight
 * - Recent performance history from QuizAttempt
 * - Badge achievements from UserBadge
 */
export const getDashboardData = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Security check: users can only access their own dashboard
    if (userId !== requestingUserId) {
      return res.status(403).json({ 
        message: "Unauthorized. You can only access your own dashboard." 
      });
    }

    // Get MLInsight data (weak/strong topics)
    const mlInsight = await MLInsight.findOne({ user_id: userId })
      .sort({ last_updated: -1 })
      .lean();

    // Get recent quiz attempts (performance history)
    const quizAttempts = await QuizAttempt.find({ 
      user_id: userId,
      status: "COMPLETED" 
    })
      .sort({ completed_at: -1 })
      .limit(10)
      .lean();

    // Format the quiz attempts for the dashboard
    const performanceHistory = quizAttempts.map(attempt => ({
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      score: attempt.score,
      correct_answers: attempt.correct_answers,
      total_questions: attempt.total_questions,
      date: attempt.completed_at || attempt.created_at
    }));

    // Get user badges (achievements)
    const userBadges = await UserBadge.find({ user_id: userId })
      .sort({ achieved_at: -1 })
      .lean();

    // Fetch full badge details
    const badgeIds = userBadges.map(ub => ub.badge_id);
    const badges = await Badge.find({ id: { $in: badgeIds } }).lean();

    // Map badge details to user badges
    const badgeAchievements = userBadges.map(userBadge => {
      const badgeDetails = badges.find(badge => badge.id === userBadge.badge_id) || {};
      return {
        id: userBadge.id,
        badge_id: userBadge.badge_id,
        name: badgeDetails.name || "Unknown Badge",
        description: badgeDetails.description || "",
        achieved_at: userBadge.achieved_at
      };
    });

    // Get topic proficiency data for dashboard
    let topicProficiency = {};
    let weakTopicsData = {};
    
    if (mlInsight) {
      // First check if we have the new formats available
      if (mlInsight.topic_proficiency && Object.keys(mlInsight.topic_proficiency).length > 0) {
        topicProficiency = mlInsight.topic_proficiency;
      }
      // If not, fall back to the old topic_performance Map
      else if (mlInsight.topic_performance) {
        // Convert Map to regular object if needed
        if (mlInsight.topic_performance instanceof Map) {
          mlInsight.topic_performance.forEach((value, key) => {
            topicProficiency[key] = value;
          });
        } else if (typeof mlInsight.topic_performance === 'object') {
          topicProficiency = mlInsight.topic_performance;
        }
      }
      
      // Get weak topics data if available
      if (mlInsight.weak_topics_data && Object.keys(mlInsight.weak_topics_data).length > 0) {
        weakTopicsData = mlInsight.weak_topics_data;
      }
      // If weak_topics_data isn't available, create it from weak_topics array and topic_proficiency
      else if (mlInsight.weak_topics && mlInsight.weak_topics.length > 0) {
        mlInsight.weak_topics.forEach(topic => {
          if (topicProficiency[topic] !== undefined) {
            weakTopicsData[topic] = topicProficiency[topic];
          }
        });
      }
    }

    // Validate topic proficiency data for consistent scores
    Object.keys(topicProficiency).forEach(topic => {
      // Ensure all scores are numbers between 0-100
      const score = topicProficiency[topic];
      if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 100) {
        topicProficiency[topic] = 0; // Default to 0 for invalid scores
      }
    });

    // Do the same validation for weak topics data
    Object.keys(weakTopicsData).forEach(topic => {
      const score = weakTopicsData[topic];
      if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 100) {
        weakTopicsData[topic] = 0;
      }
    });

    // Prepare response data with both formats the frontend might expect
    const dashboardData = {
      // Array of topic names only (for backward compatibility)
      weak_topics_array: mlInsight?.weak_topics || [],
      strong_topics: mlInsight?.strong_topics || [],
      confidence_scores: mlInsight?.confidence_scores || {},
      
      // Provide at least one of these formats for the frontend chart
      topic_proficiency: Object.keys(topicProficiency).length > 0 ? topicProficiency : {},
      weak_topics: Object.keys(weakTopicsData).length > 0 ? weakTopicsData : {},
      
      performance_history: performanceHistory,
      badges: badgeAchievements,
      insight_last_updated: mlInsight?.last_updated || null
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ 
      message: "Error fetching dashboard data", 
      error: error.message 
    });
  }
};

