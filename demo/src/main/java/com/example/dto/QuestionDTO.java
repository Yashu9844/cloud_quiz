package com.example.dto;

import com.example.models.Question;
import com.example.models.QuestionType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.UUID;

/**
 * Data Transfer Object for Question entities.
 * Avoids circular references and handles JSONB fields properly.
 */
@Slf4j
public class QuestionDTO {
    // Static ObjectMapper for JSON processing
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private UUID id;
    private UUID quizId;
    private String quizTitle;
    private String content;
    private QuestionType questionType;
    private String options;
    private String correctAnswer;
    private Instant createdAt;

    // Default constructor
    public QuestionDTO() {
    }

    // Constructor for converting from entity
    public QuestionDTO(Question question) {
        this.id = question.getId();
        if (question.getQuiz() != null) {
            this.quizId = question.getQuiz().getId();
            this.quizTitle = question.getQuiz().getTitle();
        }
        this.content = question.getContent();
        this.questionType = question.getQuestionType();
        
        // Safely handle options JSONB field
        try {
            if (question.getOptions() != null) {
                // Store the raw JSON string for safer handling
                this.options = question.getOptions();
                
                // Validate that it's proper JSON (will throw exception if invalid)
                objectMapper.readTree(question.getOptions());
            } else {
                this.options = "[]"; // Default empty array if null
            }
        } catch (JsonProcessingException e) {
            log.warn("Error parsing options JSON for question {}: {}", question.getId(), e.getMessage());
            this.options = "[]"; // Default to empty array on error
        }
        
        // Safely handle correctAnswer JSONB field
        try {
            if (question.getCorrectAnswer() != null) {
                // Store the raw JSON string for safer handling
                this.correctAnswer = question.getCorrectAnswer();
                
                // Validate that it's proper JSON (will throw exception if invalid)
                objectMapper.readTree(question.getCorrectAnswer());
            } else {
                this.correctAnswer = "\"\""; // Default empty string if null
            }
        } catch (JsonProcessingException e) {
            log.warn("Error parsing correctAnswer JSON for question {}: {}", question.getId(), e.getMessage());
            this.correctAnswer = "\"\""; // Default to empty string on error
        }
        
        this.createdAt = question.getCreatedAt();
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getQuizId() {
        return quizId;
    }

    public void setQuizId(UUID quizId) {
        this.quizId = quizId;
    }

    public String getQuizTitle() {
        return quizTitle;
    }

    public void setQuizTitle(String quizTitle) {
        this.quizTitle = quizTitle;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public QuestionType getQuestionType() {
        return questionType;
    }

    public void setQuestionType(QuestionType questionType) {
        this.questionType = questionType;
    }

    public String getOptions() {
        return options;
    }

    public void setOptions(String options) {
        // Validate JSON before setting
        try {
            if (options != null) {
                objectMapper.readTree(options);
                this.options = options;
            } else {
                this.options = "[]";
            }
        } catch (JsonProcessingException e) {
            log.warn("Invalid options JSON: {}", e.getMessage());
            this.options = "[]";
        }
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        // Validate JSON before setting
        try {
            if (correctAnswer != null) {
                objectMapper.readTree(correctAnswer);
                this.correctAnswer = correctAnswer;
            } else {
                this.correctAnswer = "\"\"";
            }
        } catch (JsonProcessingException e) {
            log.warn("Invalid correctAnswer JSON: {}", e.getMessage());
            this.correctAnswer = "\"\"";
        }
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

