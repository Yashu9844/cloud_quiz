import Question from "../models/Question.js";

// Create a new question (already provided, included for completeness)
export const createQuestion = async (req, res) => {
  try {
    const { quiz_id, content, question_type, options, correct_answer } = req.body;

    const newQuestion = new Question({
      quiz_id,
      content,
      question_type,
      options,
      correct_answer,
    });

    await newQuestion.save();

    res.status(201).json({ message: "Question created successfully", question: newQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating question" });
  }
};

// Get all questions
export const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.status(200).json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching questions" });
  }
};

// Get a question by ID
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    res.status(200).json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching question" });
  }
};

// Update a question by ID
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { quiz_id, content, question_type, options, correct_answer } = req.body;

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { quiz_id, content, question_type, options, correct_answer },
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({ message: "Question updated successfully", question: updatedQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating question" });
  }
};

// Delete a question by ID
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQuestion = await Question.findByIdAndDelete(id);

    if (!deletedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting question" });
  }
};

// Get questions for a quiz (limited to 3 random questions)
export const getQuizQuestions = async (req, res) => {
  try {
    const { quiz_id } = req.query;
    
    console.log(`Fetching questions for quiz_id: ${quiz_id}`);
    
    if (!quiz_id || quiz_id.trim() === '') {
      return res.status(400).json({
        message: "Quiz ID is required",
        details: "Please provide a valid quiz_id query parameter"
      });
    }

    // Trim the quiz_id to handle potential whitespace
    const sanitizedQuizId = quiz_id.trim();

    // First check how many questions are available
    const questionCount = await Question.countDocuments({ quiz_id: sanitizedQuizId });
    console.log(`Found ${questionCount} questions for quiz_id: ${sanitizedQuizId}`);
    
    if (questionCount === 0) {
      return res.status(404).json({ 
        message: "No questions found for this quiz",
        quiz_id: sanitizedQuizId
      });
    }

    // If less than 3 questions, return all available questions
    const limit = Math.min(3, questionCount);
    console.log(`Returning ${limit} questions`);

    // Get random questions using aggregation
    // Using simplified approach without explicit projection to avoid potential issues
    const questions = await Question.aggregate([
      { $match: { quiz_id: sanitizedQuizId } },
      { $sample: { size: limit } }
    ]);

    // Transform questions to ensure consistent ID format
    const formattedQuestions = questions.map(question => {
      // Convert MongoDB ObjectId to string
      const _id = question._id.toString();
      
      return {
        // Use existing id field or fallback to _id string
        id: question.id || _id,
        _id: _id,
        quiz_id: question.quiz_id,
        content: question.content,
        question_type: question.question_type,
        options: question.options,
        correct_answer: question.correct_answer,
        created_at: question.created_at
      };
    });

    // Log sample question for debugging
    if (formattedQuestions.length > 0) {
      console.log('Sample question structure:', {
        id: formattedQuestions[0].id,
        _id: formattedQuestions[0]._id,
        content: formattedQuestions[0].content.substring(0, 30) + '...',
        question_type: formattedQuestions[0].question_type,
        options_count: formattedQuestions[0].options.length
      });
    }

    // Send response with consistent format
    const response = {
      questions: formattedQuestions,
      time_limit: 60, // 1 minute in seconds
      total_questions: formattedQuestions.length
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getQuizQuestions:', error);
    res.status(500).json({ 
      message: "Error fetching quiz questions", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      quiz_id: req.query.quiz_id 
    });
  }
};
