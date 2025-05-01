package com.example.controllers;

import org.springframework.web.bind.annotation.GetMapping;

public class TestController {
       @GetMapping
    public String hello() {
        return "Hello World!";
    }
}
