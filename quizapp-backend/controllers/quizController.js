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

// Delete a Quiz by ID
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is provided
    if (!id) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    // Find and delete the quiz
    const deletedQuiz = await Quiz.findOneAndDelete({ id });
    
    // If quiz wasn't found
    if (!deletedQuiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json({ 
      message: 'Quiz deleted successfully',
      deletedQuiz
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Failed to delete quiz' });
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
