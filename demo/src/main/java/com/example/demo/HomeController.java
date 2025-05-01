package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String root() {
        return "Welcome to Quiz Cloud Application! This is the root page.";
    }
    
    @GetMapping("/home")
    public String home() {
        return "Welcome to Quiz Cloud Application - Home Page!";
    }
}
