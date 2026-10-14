package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;      // security role: ADMIN / USER
    private String userType;  // business type: ADMIN / FARMER
    private String phone;
    private String location;
    private String farmSize;
    private String avatar;
    private boolean isSeller;
    private Instant joinDate;
    private boolean enabled;
    private boolean suspended;
    private String suspensionType;
    private Instant suspendedUntil;
    private String suspensionReason;
}
