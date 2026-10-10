package com.smartagri.controller;

import com.smartagri.dto.request.ChangePasswordRequest;
import com.smartagri.dto.request.UpdateProfileRequest;
import com.smartagri.dto.request.UpdateSettingsRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.UserResponse;
import com.smartagri.dto.response.UserSettingsResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/profile")
    public ApiResponse<UserResponse> updateProfile(@RequestBody UpdateProfileRequest request,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Profile updated successfully", userService.updateProfile(principal.getId(), request));
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                             @AuthenticationPrincipal UserPrincipal principal) {
        userService.changePassword(principal.getId(), request);
        return ApiResponse.message("Password changed successfully");
    }

    @PostMapping(value = "/avatar", consumes = "multipart/form-data")
    public ApiResponse<UserResponse> uploadAvatar(@RequestParam("avatar") MultipartFile file,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Avatar updated", userService.uploadAvatar(principal.getId(), file));
    }

    @PutMapping("/settings")
    public ApiResponse<UserSettingsResponse> updateSettings(@RequestBody UpdateSettingsRequest request,
                                                              @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Settings updated", userService.updateSettings(principal.getId(), request));
    }
}
