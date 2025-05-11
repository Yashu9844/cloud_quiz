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

// Get questions for a quiz
export const getQuizQuestions = async (req, res) => {
  try {
    const quiz_id = req.params.id || req.query.quiz_id;
    
    console.log('Request to fetch quiz questions:', {
      quiz_id,
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      auth: req.headers.authorization ? 'Bearer token present' : 'No auth token'
    });
    
    if (!quiz_id || quiz_id.trim() === '') {
      return res.status(400).json({
        message: "Quiz ID is required",
        details: "Please provide a valid quiz ID"
      });
    }

    const sanitizedQuizId = quiz_id.trim();

    // Log the count and a sample question first
    const diagnosticQuery = await Question.findOne({ quiz_id: sanitizedQuizId });
    console.log('Diagnostic query result:', {
      found: !!diagnosticQuery,
      sampleQuestion: diagnosticQuery ? {
        id: diagnosticQuery.id,
        quiz_id: diagnosticQuery.quiz_id,
        content: diagnosticQuery.content.substring(0, 30)
      } : null
    });

    // Get all questions for this quiz (not just a sample)
    const questions = await Question.find({ quiz_id: sanitizedQuizId });
    console.log(`Found ${questions.length} questions for quiz_id: ${sanitizedQuizId}`);

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        message: "No questions found for this quiz",
        quiz_id: sanitizedQuizId,
        details: "The quiz exists but has no questions assigned"
      });
    }

    // Format questions for response
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      quiz_id: question.quiz_id,
      content: question.content,
      question_type: question.question_type,
      options: question.options,
      correct_answer: question.correct_answer,
      created_at: question.created_at
    }));

    const response = {
      questions: formattedQuestions,
      time_limit: 300, // 5 minutes in seconds
      total_questions: formattedQuestions.length
    };

    console.log('Sending response with questions:', {
      questionCount: formattedQuestions.length,
      timeLimit: response.time_limit,
      sampleQuestionId: formattedQuestions[0]?.id
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getQuizQuestions:', {
      error: error.message,
      stack: error.stack,
      quiz_id: req.params.id || req.query.quiz_id
    });
    
    res.status(500).json({
      message: "Error fetching quiz questions",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      quiz_id: req.params.id || req.query.quiz_id
    });
  }
};
