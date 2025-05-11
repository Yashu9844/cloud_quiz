import Quiz from "../models/Quiz.js";
import Question from "../models/Question.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Script to reset questions for 5 topics:
 * 1. Finds the quiz IDs for the topics
 * 2. Deletes all existing questions
 * 3. Adds 10 new questions for each topic
 */
const resetTopicQuestions = async () => {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("Missing MONGO_URI in environment variables");
    }
    
    await mongoose.connect(mongoUri);
    console.log("Successfully connected to MongoDB");
    
    // The 5 topics we want to update
    const topics = ["algebra", "geometry", "chemistry", "biology", "physics"];
    
    // Get quiz IDs for each topic
    const quizzes = [];
    for (const topic of topics) {
      const quiz = await Quiz.findOne({ 
        topic: { $regex: new RegExp(`^${topic}$`, 'i') } 
      }).lean();
      
      if (quiz) {
        quizzes.push(quiz);
        console.log(`Found quiz for ${topic}: "${quiz.title}" (ID: ${quiz.id})`);
      } else {
        console.log(`No quiz found for topic: ${topic}`);
      }
    }
    
    if (quizzes.length === 0) {
      throw new Error("No quizzes found for the specified topics");
    }
    
    // Delete questions and add new ones for each quiz
    for (const quiz of quizzes) {
      const quizId = quiz.id;
      const topic = quiz.topic.toLowerCase();
      
      // Delete existing questions
      const deleteResult = await Question.deleteMany({ quiz_id: quizId });
      console.log(`Deleted ${deleteResult.deletedCount} questions from quiz "${quiz.title}"`);
      
      // Add 10 new questions based on the topic
      const questions = generateQuestionsForTopic(topic, quizId);
      
      // Save all questions
      for (const question of questions) {
        const newQuestion = new Question(question);
        await newQuestion.save();
      }
      
      console.log(`Added 10 new questions to quiz "${quiz.title}"`);
    }
    
    console.log("Successfully reset questions for all topics");
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

/**
 * Generate 10 appropriate questions for a topic
 */
const generateQuestionsForTopic = (topic, quizId) => {
  const questions = [];
  
  // Questions for each topic
  const topicQuestions = {
    algebra: [
      {
        content: "What is the value of x in the equation 2x + 5 = 15?",
        options: ["x = 5", "x = 7", "x = 8", "x = 10"],
        correct_answer: ["x = 5"]
      },
      {
        content: "Simplify the expression 3(2x - 4) + 5",
        options: ["6x - 12 + 5", "6x - 7", "6x - 12", "6x + 5"],
        correct_answer: ["6x - 7"]
      },
      {
        content: "Solve for y: 4y - 8 = 2y + 6",
        options: ["y = 7", "y = 8", "y = 6", "y = 5"],
        correct_answer: ["y = 7"]
      },
      {
        content: "What is the slope of the line passing through the points (2, 4) and (6, 12)?",
        options: ["1", "2", "3", "4"],
        correct_answer: ["2"]
      },
      {
        content: "Factor completely: x² - 9",
        options: ["(x-3)(x+3)", "(x-9)(x+1)", "(x-3)²", "(x-3)(x-3)"],
        correct_answer: ["(x-3)(x+3)"]
      },
      {
        content: "Which of the following is equivalent to 2(x + 3) - 4x?",
        options: ["2x + 6 - 4x", "-2x + 6", "2x - 4x + 6", "2x - 4x - 6"],
        correct_answer: ["-2x + 6"]
      },
      {
        content: "If f(x) = x² + 3x - 4, what is f(2)?",
        options: ["4", "6", "8", "10"],
        correct_answer: ["6"]
      },
      {
        content: "Solve the inequality: 3x - 5 > 7",
        options: ["x > 4", "x > 3", "x > 2", "x > 12/3"],
        correct_answer: ["x > 4"]
      },
      {
        content: "What is the value of y in the system of equations: 3x + 2y = 12 and x - y = 3?",
        options: ["y = 0", "y = 1", "y = 2", "y = 3"],
        correct_answer: ["y = 0"]
      },
      {
        content: "Simplify: (3x²y)(2xy²)",
        options: ["5x³y³", "6x³y³", "5x²y²", "6x²y²"],
        correct_answer: ["6x³y³"]
      }
    ],
    geometry: [
      {
        content: "What is the area of a rectangle with length 8 units and width 5 units?",
        options: ["13 square units", "26 square units", "40 square units", "80 square units"],
        correct_answer: ["40 square units"]
      },
      {
        content: "In a right-angled triangle, if one angle is 90° and another is 35°, what is the measure of the third angle?",
        options: ["55°", "45°", "65°", "75°"],
        correct_answer: ["55°"]
      },
      {
        content: "What is the formula for the area of a circle?",
        options: ["πr", "2πr", "πr²", "2πr²"],
        correct_answer: ["πr²"]
      },
      {
        content: "What is the sum of interior angles in a pentagon?",
        options: ["360°", "480°", "540°", "720°"],
        correct_answer: ["540°"]
      },
      {
        content: "What is the Pythagorean theorem?",
        options: ["a² + b² = c²", "a + b = c", "a² - b² = c²", "a · b = c²"],
        correct_answer: ["a² + b² = c²"]
      },
      {
        content: "What shape has all sides equal in length and all interior angles equal?",
        options: ["Rectangle", "Isosceles Triangle", "Regular Polygon", "Rhombus"],
        correct_answer: ["Regular Polygon"]
      },
      {
        content: "What is the volume of a cube with side length 4 units?",
        options: ["16 cubic units", "32 cubic units", "48 cubic units", "64 cubic units"],
        correct_answer: ["64 cubic units"]
      },
      {
        content: "Which of the following is NOT a type of quadrilateral?",
        options: ["Rectangle", "Pentagon", "Rhombus", "Trapezoid"],
        correct_answer: ["Pentagon"]
      },
      {
        content: "What is the perimeter of a regular hexagon with side length 5 units?",
        options: ["15 units", "20 units", "25 units", "30 units"],
        correct_answer: ["30 units"]
      },
      {
        content: "Two angles are complementary. If one angle is 38°, what is the other angle?",
        options: ["52°", "142°", "152°", "62°"],
        correct_answer: ["52°"]
      }
    ],
    chemistry: [
      {
        content: "What is the chemical symbol for gold?",
        options: ["Go", "Gd", "Au", "Ag"],
        correct_answer: ["Au"]
      },
      {
        content: "Which of the following is a noble gas?",
        options: ["Oxygen", "Hydrogen", "Neon", "Nitrogen"],
        correct_answer: ["Neon"]
      },
      {
        content: "What is the pH of a neutral solution?",
        options: ["0", "7", "10", "14"],
        correct_answer: ["7"]
      },
      {
        content: "Which of the following is NOT a state of matter?",
        options: ["Solid", "Liquid", "Gas", "Energy"],
        correct_answer: ["Energy"]
      },
      {
        content: "What is the chemical formula for water?",
        options: ["H₂O", "CO₂", "CH₄", "O₂"],
        correct_answer: ["H₂O"]
      },
      {
        content: "Which element has the atomic number 6?",
        options: ["Oxygen", "Carbon", "Nitrogen", "Hydrogen"],
        correct_answer: ["Carbon"]
      },
      {
        content: "What type of reaction occurs when substances combine to form a new compound?",
        options: ["Decomposition", "Synthesis", "Single replacement", "Double replacement"],
        correct_answer: ["Synthesis"]
      },
      {
        content: "Which of the following is an example of a chemical change?",
        options: ["Melting ice", "Dissolving salt in water", "Rusting iron", "Grinding pepper"],
        correct_answer: ["Rusting iron"]
      },
      {
        content: "What is the most abundant element in the Earth's atmosphere?",
        options: ["Oxygen", "Carbon dioxide", "Hydrogen", "Nitrogen"],
        correct_answer: ["Nitrogen"]
      },
      {
        content: "Which subatomic particle has a positive charge?",
        options: ["Proton", "Neutron", "Electron", "Photon"],
        correct_answer: ["Proton"]
      }
    ],
    biology: [
      {
        content: "What is the powerhouse of the cell?",
        options: ["Nucleus", "Mitochondria", "Endoplasmic reticulum", "Golgi apparatus"],
        correct_answer: ["Mitochondria"]
      },
      {
        content: "Which of the following is NOT a component of DNA?",
        options: ["Adenine", "Guanine", "Uracil", "Thymine"],
        correct_answer: ["Uracil"]
      },
      {
        content: "What is the process by which plants make their own food?",
        options: ["Respiration", "Photosynthesis", "Digestion", "Excretion"],
        correct_answer: ["Photosynthesis"]
      },
      {
        content: "What is the largest organ in the human body?",
        options: ["Heart", "Liver", "Skin", "Brain"],
        correct_answer: ["Skin"]
      },
      {
        content: "Which of the following is a function of the liver?",
        options: ["Pumping blood", "Filtering oxygen", "Detoxification", "Producing insulin"],
        correct_answer: ["Detoxification"]
      },
      {
        content: "What is the scientific name for humans?",
        options: ["Homo erectus", "Homo sapiens", "Homo neanderthalensis", "Homo habilis"],
        correct_answer: ["Homo sapiens"]
      },
      {
        content: "Which blood type is considered the universal donor?",
        options: ["Type A", "Type B", "Type AB", "Type O-negative"],
        correct_answer: ["Type O-negative"]
      },
      {
        content: "What is the main function of red blood cells?",
        options: ["Fighting infections", "Carrying oxygen", "Blood clotting", "Producing antibodies"],
        correct_answer: ["Carrying oxygen"]
      },
      {
        content: "Which of the following is NOT a type of muscle tissue?",
        options: ["Cardiac", "Epithelial", "Skeletal", "Smooth"],
        correct_answer: ["Epithelial"]
      },
      {
        content: "What structures in plant cells allow them to make their own food?",
        options: ["Mitochondria", "Chloroplasts", "Ribosomes", "Nucleus"],
        correct_answer: ["Chloroplasts"]
      }
    ],
    physics: [
      {
        content: "What is Newton's First Law of Motion also known as?",
        options: ["Law of Acceleration", "Law of Action and Reaction", "Law of Inertia", "Law of Energy Conservation"],
        correct_answer: ["Law of Inertia"]
      },
      {
        content: "What is the SI unit of force?",
        options: ["Watt", "Joule", "Newton", "Pascal"],
        correct_answer: ["Newton"]
      },
      {
        content: "What is the formula for calculating work?",
        options: ["Work = Force × Distance", "Work = Mass × Acceleration", "Work = Force / Distance", "Work = Mass × Velocity"],
        correct_answer: ["Work = Force × Distance"]
      },
      {
        content: "Which of the following is a vector quantity?",
        options: ["Temperature", "Mass", "Time", "Velocity"],
        correct_answer: ["Velocity"]
      },
      {
        content: "What is the acceleration due to gravity on Earth (approximately)?",
        options: ["5.6 m/s²", "7.8 m/s²", "9.8 m/s²", "11.2 m/s²"],
        correct_answer: ["9.8 m/s²"]
      },
      {
        content: "Which law states that energy cannot be created or destroyed, only transformed?",
        options: ["Newton's First Law", "Newton's Second Law", "Law of Conservation of Energy", "Ohm's Law"],
        correct_answer: ["Law of Conservation of Energy"]
      },
      {
        content: "What type of lens is used to correct nearsightedness?",
        options: ["Convex lens", "Concave lens", "Bifocal lens", "Cylindrical lens"],
        correct_answer: ["Concave lens"]
      },
      {
        content: "What is the formula for calculating kinetic energy?",
        options: ["KE = mv", "KE = ½mv²", "KE = mgh", "KE = F×d"],
        correct_answer: ["KE = ½mv²"]
      },
      {
        content: "Which color of light has the longest wavelength?",
        options: ["Blue", "Green", "Yellow", "Red"],
        correct_answer: ["Red"]
      },
      {
        content: "What is the unit of electrical resistance?",
        options: ["Ampere", "Volt", "Watt", "Ohm"],
        correct_answer: ["Ohm"]
      }
    ]
  };
  
  // Get questions for the specified topic
  const topicQuestionsArray = topicQuestions[topic] || [];
  
  // Create properly formatted question objects
  for (const q of topicQuestionsArray) {
    questions.push({
      id: uuidv4(),
      quiz_id: quizId,
      content: q.content,
      question_type: "MCQ", // All questions are MCQ type
      options: q.options,
      correct_answer: q.correct_answer,
      created_at: new Date()
    });
  }
  
  return questions;
};

// Run the script
(async () => {
  console.log("Starting question reset process...");
  try {
    await resetTopicQuestions();
    console.log("Question reset process completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error in main execution:", error);
    process.exit(1);
  }
})();

