package com.example.models;

import lombok.Data;

@Data
public class ClerkWebhookPayload {
    private String type;
    private ClerkUserData data;
}
