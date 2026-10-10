package com.smartagri.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUserRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    /** Only used when creating a new user (optional; a random one is generated otherwise) */
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank
    @Pattern(regexp = "(?i)ADMIN|USER", message = "role must be ADMIN or USER")
    private String role;      // ADMIN or USER (security role)

    @NotBlank
    @Pattern(regexp = "(?i)ADMIN|FARMER", message = "userType must be ADMIN or FARMER")
    private String userType;  // ADMIN, FARMER

    private String phone;
    private String location;
}
