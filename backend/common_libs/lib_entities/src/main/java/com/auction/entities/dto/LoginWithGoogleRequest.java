package com.auction.entities.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginWithGoogleRequest {
    private String googleIdToken;
    private String email;
    private String fullName;
    private String profilePicture;
}
