package com.smartagri.service;

import com.smartagri.dto.request.ChangePasswordRequest;
import com.smartagri.dto.request.UpdateProfileRequest;
import com.smartagri.dto.request.UpdateSettingsRequest;
import com.smartagri.dto.response.UserResponse;
import com.smartagri.dto.response.UserSettingsResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserResponse updateProfile(Long userId, UpdateProfileRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    UserResponse uploadAvatar(Long userId, MultipartFile file);
    UserSettingsResponse updateSettings(Long userId, UpdateSettingsRequest request);
}
