package com.example.models;

import lombok.Data;
import java.util.List;

@Data
public class ClerkUserData {
    private String id;
    private String firstName;
    private String lastName;
    private String profileImageUrl;
    private List<ClerkEmailAddress> emailAddresses;
}
