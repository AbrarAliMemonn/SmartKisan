package com.smartagri.service.mapper;

import com.smartagri.dto.response.UserResponse;
import com.smartagri.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .userType(user.getUserType().name())
                .phone(user.getPhone())
                .location(user.getLocation())
                .farmSize(user.getFarmSize())
                .avatar(user.getAvatar())
                .isSeller(user.isSeller())
                .joinDate(user.getCreatedAt())
                .build();
    }
}
