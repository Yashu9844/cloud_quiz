import { Quiz } from '../models/Quiz.js';

// Create a new Quiz
export const createQuiz = async (req, res) => {
  try {
    const { title, description, topic, difficulty } = req.body;

    const newQuiz = new Quiz({
      title,
      description,
      topic,
      difficulty,
    });

    await newQuiz.save();

    res.status(201).json(newQuiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create quiz' });
  }
};

// Get all Quizzes
export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
};
