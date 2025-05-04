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