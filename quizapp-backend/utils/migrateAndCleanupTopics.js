import Quiz from "../models/Quiz.js";
import Question from "../models/Question.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate required environment variables
if (!process.env.MONGO_URI) {
  console.error("ERROR: Missing MONGO_URI environment variable");
  console.error("Please ensure your .env file contains MONGO_URI=<your-mongodb-connection-string>");
  process.exit(1);
}

// Create readline interface for confirmation prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise-based prompt function
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

/**
 * Script to automatically migrate questions and clean up duplicate topics
 * - Identifies quizzes with the same topic
 * - Migrates questions to the oldest/most populated quiz
 * - Deletes empty duplicates
 */
const migrateAndCleanupTopics = async () => {
  try {
    // Validate MongoDB connection string
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri || typeof mongoUri !== 'string' || !mongoUri.startsWith('mongodb')) {
      throw new Error("Invalid MONGO_URI format. Please check your environment variables.");
    }
    
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Successfully connected to MongoDB");
    
    // Get all quizzes
    console.log("Fetching all quizzes...");
    const quizzes = await Quiz.find().sort({ created_at: 1 }).lean();
    console.log(`Found ${quizzes.length} quizzes in total`);
    
    // Group quizzes by topic (case-insensitive)
    const topicGroups = {};
    
    for (const quiz of quizzes) {
      // Normalize topic to lowercase for comparison
      const normalizedTopic = quiz.topic.trim().toLowerCase();
      
      if (!topicGroups[normalizedTopic]) {
        topicGroups[normalizedTopic] = [];
      }
      
      // Count questions for this quiz
      const questionCount = await Question.countDocuments({ quiz_id: quiz.id });
      
      // Add quiz with question count to the group
      topicGroups[normalizedTopic].push({
        id: quiz.id,
        title: quiz.title,
        topic: quiz.topic, // Original case preserved
        difficulty: quiz.difficulty,
        created_at: quiz.created_at,
        question_count: questionCount
      });
    }
    
    // Find duplicate topics
    const duplicateTopics = Object.entries(topicGroups)
      .filter(([_, quizzes]) => quizzes.length > 1)
      .map(([topic, quizzes]) => ({ topic, quizzes }));
    
    console.log(`Found ${duplicateTopics.length} topics with duplicates`);
    
    if (duplicateTopics.length === 0) {
      console.log("No duplicate topics found. Database is clean!");
      await closeConnection();
      return;
    }
    
    // Process each duplicate topic
    for (const { topic, quizzes } of duplicateTopics) {
      console.log(`\nProcessing topic: "${topic}" with ${quizzes.length} quizzes`);
      
      // Choose the quiz to keep (prioritize ones with most questions, then oldest)
      const sortedQuizzes = [...quizzes].sort((a, b) => {
        if (a.question_count !== b.question_count) {
          return b.question_count - a.question_count; // More questions first
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Then oldest
      });
      
      const quizToKeep = sortedQuizzes[0];
      const quizzesToDelete = sortedQuizzes.slice(1);
      
      console.log(`Selected quiz to keep: "${quizToKeep.title}" (ID: ${quizToKeep.id})`);
      console.log(`It has ${quizToKeep.question_count} questions and was created on ${new Date(quizToKeep.created_at).toLocaleString()}`);
      
      // Confirm before proceeding with this topic
      const answer = await prompt(`Do you want to process "${topic}" topic? (yes/no): `);
      if (answer.toLowerCase() !== 'yes') {
        console.log(`Skipping topic "${topic}"`);
        continue;
      }
      
      // Process each quiz to delete
      for (const quizToDelete of quizzesToDelete) {
        console.log(`\nProcessing quiz to delete: "${quizToDelete.title}" (ID: ${quizToDelete.id})`);
        
        // Only migrate if this quiz has questions
        if (quizToDelete.question_count > 0) {
          console.log(`This quiz has ${quizToDelete.question_count} questions that need to be migrated`);
          
          // Confirm migration
          const migrateAnswer = await prompt(`Migrate ${quizToDelete.question_count} questions to "${quizToKeep.title}"? (yes/no): `);
          
          if (migrateAnswer.toLowerCase() === 'yes') {
            // Migrate questions
            try {
              const result = await Question.updateMany(
                { quiz_id: quizToDelete.id },
                { $set: { quiz_id: quizToKeep.id } }
              );
              
              console.log(`Successfully migrated ${result.modifiedCount} questions from "${quizToDelete.title}" to "${quizToKeep.title}"`);
            } catch (error) {
              console.error(`Error migrating questions: ${error.message}`);
              const skipAnswer = await prompt("Continue with deletion anyway? (yes/no): ");
              if (skipAnswer.toLowerCase() !== 'yes') {
                console.log("Skipping this quiz");
                continue;
              }
            }
          } else {
            console.log("Skipping question migration");
            // Verify the user really wants to delete without migrating
            const confirmDeleteAnswer = await prompt("Delete this quiz without migrating its questions? This will LOSE ALL QUESTIONS. (yes/no): ");
            if (confirmDeleteAnswer.toLowerCase() !== 'yes') {
              console.log("Skipping this quiz");
              continue;
            }
          }
        }
        
        // Delete the quiz
        try {
          // Double-check there are no questions left (if we migrated them all)
          const remainingQuestions = await Question.countDocuments({ quiz_id: quizToDelete.id });
          
          if (remainingQuestions > 0) {
            console.log(`WARNING: There are still ${remainingQuestions} questions associated with this quiz!`);
            const forceDeleteAnswer = await prompt("Force delete anyway? This will orphan questions! (yes/no): ");
            if (forceDeleteAnswer.toLowerCase() !== 'yes') {
              console.log("Skipping deletion");
              continue;
            }
          }
          
          // Proceed with deletion
          await Quiz.deleteOne({ id: quizToDelete.id });
          console.log(`Successfully deleted quiz "${quizToDelete.title}" (ID: ${quizToDelete.id})`);
        } catch (error) {
          console.error(`Error deleting quiz: ${error.message}`);
        }
      }
      
      // Verify the topic cleanup was successful
      const remainingQuizzesForTopic = await Quiz.countDocuments({ 
        topic: { $regex: new RegExp(`^${topic}$`, 'i') } 
      });
      
      if (remainingQuizzesForTopic === 1) {
        console.log(`✅ Successfully cleaned up topic "${topic}" - now has 1 quiz`);
      } else {
        console.log(`⚠️ Topic "${topic}" still has ${remainingQuizzesForTopic} quizzes - cleanup incomplete`);
      }
    }
    
    // Final status report
    console.log("\n=== CLEANUP COMPLETE ===");
    
    // Check overall status of duplicate topics
    const finalQuizzes = await Quiz.find().lean();
    const finalTopicCounts = {};
    
    finalQuizzes.forEach(quiz => {
      const normalizedTopic = quiz.topic.trim().toLowerCase();
      finalTopicCounts[normalizedTopic] = (finalTopicCounts[normalizedTopic] || 0) + 1;
    });
    
    const remainingDuplicates = Object.entries(finalTopicCounts)
      .filter(([_, count]) => count > 1)
      .length;
    
    if (remainingDuplicates === 0) {
      console.log("All duplicate topics have been successfully cleaned up!");
    } else {
      console.log(`There are still ${remainingDuplicates} topics with duplicates that need attention.`);
    }
    
    // Report statistics
    console.log(`Total quizzes in database: ${finalQuizzes.length}`);
    console.log(`Unique topics: ${Object.keys(finalTopicCounts).length}`);
    
    // Close connections
    await closeConnection();
    
  } catch (error) {
    console.error("Error during cleanup:", error);
    await closeConnection();
    process.exit(1);
  }
};

// Helper to close connections
const closeConnection = async () => {
  try {
    rl.close();
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error closing connection:", error);
  }
};

// Run the script
(async () => {
  console.log("Starting duplicate topic migration and cleanup...");
  await migrateAndCleanupTopics();

  process.exit(0);
})();

