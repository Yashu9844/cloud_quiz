package com.example.controllers;

import com.example.models.Quiz;
import com.example.repositories.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    @Autowired
    private QuizRepository quizRepository;

    @PostMapping
    public Quiz createQuiz(@RequestBody Quiz quiz) {
        quiz.setId(UUID.randomUUID());
        quiz.setCreatedAt(Instant.now());
        return quizRepository.save(quiz);
    }

    @GetMapping
    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }
}
