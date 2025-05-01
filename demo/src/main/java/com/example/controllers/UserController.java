package com.example.controllers;

import com.example.models.AppUser;
import com.example.repositories.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // Allow frontend to access this API
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // POST: Create new user
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppUser createUser(@Valid @RequestBody AppUser user) {
        return userRepository.save(user);
    }

    // GET: Get all users (this fixes the 405 error on browser access)
    @GetMapping
    public List<AppUser> getAllUsers() {
        return userRepository.findAll();
    }

    // GET: Get user by Clerk ID
    @GetMapping("/clerk/{clerkId}")
    public ResponseEntity<AppUser> getUserByClerkId(@PathVariable String clerkId) {
        return userRepository.findByClerkId(clerkId)
            .map(ResponseEntity::ok)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with clerkId: " + clerkId));
    }

    // GET: Get user by UUID
    @GetMapping("/{id}")
    public ResponseEntity<AppUser> getUserById(@PathVariable UUID id) {
        return userRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id));
    }
}
