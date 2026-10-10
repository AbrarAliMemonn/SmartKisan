package com.smartagri.controller;

import com.smartagri.dto.request.ForgotPasswordRequest;
import com.smartagri.dto.request.LoginRequest;
import com.smartagri.dto.request.RegisterRequest;
import com.smartagri.dto.request.ResendOtpRequest;
import com.smartagri.dto.request.ResetPasswordRequest;
import com.smartagri.dto.request.VerifyOtpRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.AuthResponse;
import com.smartagri.dto.response.UserResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Login successful", authService.login(request));
    }

    /** Step 1 of sign-up: creates the account and emails a 6 digit OTP. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ApiResponse.message("Registration successful. An OTP has been sent to your email to verify your account");
    }

    /** Step 2 of sign-up: confirms the OTP and returns the tokens. */
    @PostMapping("/verify-otp")
    public ApiResponse<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return ApiResponse.success("Email verified successfully", authService.verifyEmail(request));
    }

    @PostMapping("/resend-otp")
    public ApiResponse<Void> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        authService.resendVerificationOtp(request);
        return ApiResponse.message("If the account is awaiting verification, a new OTP has been sent to the email");
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.message("If an account exists for this email, a password reset OTP has been sent");
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.message("Password reset successful. You can now log in with your new password");
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        // Stateless JWT: logout is a client-side token discard. Endpoint kept
        // for parity with the frontend's authAPI.logout() call.
        return ApiResponse.message("Logged out successfully");
    }

    @GetMapping("/profile")
    public ApiResponse<UserResponse> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(authService.getProfile(principal.getId()));
    }
}
