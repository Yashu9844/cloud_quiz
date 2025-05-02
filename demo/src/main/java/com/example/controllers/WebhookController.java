package com.example.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.models.AppUser;
import com.example.models.ClerkWebhookPayload;
import com.example.models.ClerkUserData;
import com.example.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.logging.Logger;
import java.util.logging.Level;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    @Autowired
    private UserRepository appUserRepository;
    
    private static final Logger logger = Logger.getLogger(WebhookController.class.getName());

    @PostMapping("/clerk")
    public ResponseEntity<String> handleClerkWebhook(@RequestBody ClerkWebhookPayload payload) {
        try {
            logger.info("Received Clerk webhook: " + (payload != null ? payload.getType() : "null"));
            
            if (payload == null) {
                logger.warning("Received null payload in Clerk webhook");
                return ResponseEntity.badRequest().body("Invalid webhook payload");
            }
            
            if ("user.created".equals(payload.getType())) {
                ClerkUserData userData = payload.getData();
                
                if (userData == null) {
                    logger.warning("Received null user data in Clerk webhook");
                    return ResponseEntity.badRequest().body("Invalid user data");
                }
                
                String clerkId = userData.getId();
                if (clerkId == null || clerkId.trim().isEmpty()) {
                    logger.warning("Missing clerk ID in user data");
                    return ResponseEntity.badRequest().body("Missing required user ID");
                }
                
                AppUser appUser = new AppUser();
                appUser.setId(UUID.randomUUID());
                appUser.setClerkId(clerkId);
                
                // Handle name safely
                String firstName = userData.getFirstName() != null ? userData.getFirstName() : "";
                String lastName = userData.getLastName() != null ? userData.getLastName() : "";
                String fullName = (firstName + " " + lastName).trim();
                appUser.setName(fullName.isEmpty() ? "Unknown User" : fullName);
                
                // Handle email safely
                if (userData.getEmailAddresses() != null && !userData.getEmailAddresses().isEmpty() 
                    && userData.getEmailAddresses().get(0) != null) {
                    String email = userData.getEmailAddresses().get(0).getEmailAddress();
                    if (email != null && !email.trim().isEmpty()) {
                        appUser.setEmail(email);
                    } else {
                        appUser.setEmail("no-email@example.com");
                        logger.info("Empty email provided for user: " + clerkId);
                    }
                } else {
                    appUser.setEmail("no-email@example.com");
                    logger.info("No email provided for user: " + clerkId);
                }
                
                // Handle profile image safely
                String profileImage = userData.getProfileImageUrl();
                appUser.setProfileImage(profileImage != null ? profileImage : "");
                
                // Set timestamps
                LocalDateTime now = LocalDateTime.now();
                appUser.setCreatedAt(now);
                appUser.setUpdatedAt(now);
                
                appUserRepository.save(appUser);
                
                logger.info("Successfully created new user from Clerk webhook: " + clerkId);
                return ResponseEntity.ok("User created successfully");
            }
            
            return ResponseEntity.ok("Webhook received but no action taken");
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error processing Clerk webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error processing webhook: " + e.getMessage());
        }
    }
}
