package com.smartagri.service;

import com.smartagri.dto.request.ForgotPasswordRequest;
import com.smartagri.dto.request.LoginRequest;
import com.smartagri.dto.request.RegisterRequest;
import com.smartagri.dto.request.ResendOtpRequest;
import com.smartagri.dto.request.ResetPasswordRequest;
import com.smartagri.dto.request.VerifyOtpRequest;
import com.smartagri.dto.response.AuthResponse;
import com.smartagri.dto.response.UserResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);

    /** Creates the account (unverified) and emails an OTP. No tokens are issued yet. */
    void register(RegisterRequest request);

    /** Confirms the registration OTP and logs the user in. */
    AuthResponse verifyEmail(VerifyOtpRequest request);

    void resendVerificationOtp(ResendOtpRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    UserResponse getProfile(Long userId);
}
