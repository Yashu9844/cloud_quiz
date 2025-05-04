package com.example.controllers;

import com.example.dto.QuestionDTO;
import com.example.exception.ResourceNotFoundException;
import com.example.exception.ValidationException;
import com.example.models.Question;
import com.example.models.QuestionType;
import com.example.models.Quiz;
import com.example.repositories.QuestionRepository;
import com.example.repositories.QuizRepository;
import com.example.services.QuestionValidationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/questions")
@Slf4j
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionValidationService validationService;

    @GetMapping
    public ResponseEntity<?> getAllQuestions() {
        log.info("Fetching all questions");
        List<Question> questions = questionRepository.findAll();
        log.info("Found {} questions", questions.size());
        
        List<QuestionDTO> questionDTOs = questions.stream()
                .map(question -> {
                    try {
                        return new QuestionDTO(question);
                    } catch (Exception e) {
                        log.error("Error converting question to DTO: {}", question.getId(), e);
                        return null;
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(questionDTOs);
    }

    @PostMapping
    public ResponseEntity<?> createQuestion(@RequestBody QuestionDTO questionDTO) {
        log.info("Creating new question");
        
        // Validate that the quiz exists
        if (questionDTO.getQuizId() == null) {
            throw new ValidationException("Quiz ID is required");
        }
        
        Quiz quiz = quizRepository.findById(questionDTO.getQuizId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", questionDTO.getQuizId()));
        
        // Validate JSON fields
        if (questionDTO.getContent() == null || questionDTO.getContent().trim().isEmpty()) {
            throw new ValidationException("Question content is required");
        }
        
        if (questionDTO.getQuestionType() == null) {
            throw new ValidationException("Question type is required");
        }
        
        // Validate JSON fields - the service throws IllegalArgumentException which will be handled by global handler
        validationService.validateQuestionData(
            questionDTO.getOptions(), 
            questionDTO.getCorrectAnswer(), 
            questionDTO.getQuestionType()
        );
        
        // Create and save the question
        Question question = new Question();
        question.setQuiz(quiz);
        question.setContent(questionDTO.getContent());
        question.setQuestionType(questionDTO.getQuestionType());
        question.setOptions(questionDTO.getOptions());
        question.setCorrectAnswer(questionDTO.getCorrectAnswer());
        
        Question savedQuestion = questionRepository.save(question);
        log.info("Question created with ID: {}", savedQuestion.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(new QuestionDTO(savedQuestion));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getQuestionById(@PathVariable UUID id) {
        log.info("Fetching question with ID: {}", id);
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", id));
        
        log.info("Question found: {}", question.getId());
        return ResponseEntity.ok(new QuestionDTO(question));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable UUID id) {
        log.info("Deleting question with ID: {}", id);
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Question", "id", id);
        }
        
        questionRepository.deleteById(id);
        log.info("Question deleted successfully: {}", id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuestion(@PathVariable UUID id, @RequestBody QuestionDTO questionDTO) {
        log.info("Updating question with ID: {}", id);
        
        // Check if question exists
        Question existingQuestion = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", id));
        
        // Validate quiz if provided
        if (questionDTO.getQuizId() != null) {
            Quiz quiz = quizRepository.findById(questionDTO.getQuizId())
                    .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", questionDTO.getQuizId()));
            existingQuestion.setQuiz(quiz);
        }
        
        // Update fields if provided
        if (questionDTO.getContent() != null && !questionDTO.getContent().trim().isEmpty()) {
            existingQuestion.setContent(questionDTO.getContent());
        }
        
        if (questionDTO.getQuestionType() != null) {
            existingQuestion.setQuestionType(questionDTO.getQuestionType());
        }
        
        // Collect what needs to be validated
        String optionsToValidate = questionDTO.getOptions() != null ? 
            questionDTO.getOptions() : existingQuestion.getOptions();
        String correctAnswerToValidate = questionDTO.getCorrectAnswer() != null ? 
            questionDTO.getCorrectAnswer() : existingQuestion.getCorrectAnswer();
        QuestionType typeToValidate = existingQuestion.getQuestionType();
        
        // Validate JSON fields if options or correct answer are being updated
        if (questionDTO.getOptions() != null || questionDTO.getCorrectAnswer() != null) {
            validationService.validateQuestionData(
                optionsToValidate,
                correctAnswerToValidate,
                typeToValidate
            );
        }
        
        // Update the fields
        if (questionDTO.getOptions() != null) {
            existingQuestion.setOptions(questionDTO.getOptions());
        }
        
        if (questionDTO.getCorrectAnswer() != null) {
            existingQuestion.setCorrectAnswer(questionDTO.getCorrectAnswer());
        }
        
        Question updatedQuestion = questionRepository.save(existingQuestion);
        log.info("Question updated successfully: {}", updatedQuestion.getId());
        
        return ResponseEntity.ok(new QuestionDTO(updatedQuestion));
    }
}
