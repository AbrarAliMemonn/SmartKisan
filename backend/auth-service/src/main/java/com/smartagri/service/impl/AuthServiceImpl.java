package com.smartagri.service.impl;

import com.smartagri.dto.request.ForgotPasswordRequest;
import com.smartagri.dto.request.LoginRequest;
import com.smartagri.dto.request.RegisterRequest;
import com.smartagri.dto.request.ResendOtpRequest;
import com.smartagri.dto.request.ResetPasswordRequest;
import com.smartagri.dto.request.VerifyOtpRequest;
import com.smartagri.dto.response.AuthResponse;
import com.smartagri.dto.response.UserResponse;
import com.smartagri.entity.AuthProvider;
import com.smartagri.entity.OtpPurpose;
import com.smartagri.entity.Role;
import com.smartagri.entity.User;
import com.smartagri.entity.UserType;
import com.smartagri.exception.BadRequestException;
import com.smartagri.exception.DuplicateResourceException;
import com.smartagri.exception.EmailNotVerifiedException;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.repository.UserRepository;
import com.smartagri.security.JwtUtil;
import com.smartagri.service.AuthService;
import com.smartagri.service.OtpService;
import com.smartagri.service.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_AVATAR = "👨‍🌾";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        String email = normalize(request.getEmail());

        Optional<User> existing = userRepository.findByEmail(email);
        User user;
        if (existing.isPresent()) {
            user = existing.get();
            if (user.isEmailVerified()) {
                throw new DuplicateResourceException("Email is already registered");
            }
            // Earlier sign-up was never confirmed: let the new attempt take over the account.
            user.setName(request.getName());
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setPhone(request.getPhone());
            user.setLocation(request.getLocation());
            user.setFarmSize(request.getFarmSize());
        } else {
            user = User.builder()
                    .name(request.getName())
                    .email(email)
                    .passwordHash(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER)
                    .userType(UserType.FARMER)
                    .authProvider(AuthProvider.LOCAL)
                    .phone(request.getPhone())
                    .location(request.getLocation())
                    .farmSize(request.getFarmSize())
                    .avatar(DEFAULT_AVATAR)
                    .enabled(true)
                    .emailVerified(false)
                    .build();
        }
        userRepository.save(user);

        otpService.generateAndSend(email, OtpPurpose.EMAIL_VERIFICATION);
    }

    @Override
    @Transactional(noRollbackFor = BadRequestException.class)
    public AuthResponse verifyEmail(VerifyOtpRequest request) {
        String email = normalize(request.getEmail());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid or expired OTP"));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified. Please log in");
        }

        otpService.verify(email, OtpPurpose.EMAIL_VERIFICATION, request.getOtp());

        user.setEmailVerified(true);
        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void resendVerificationOtp(ResendOtpRequest request) {
        String email = normalize(request.getEmail());
        // Same response whether or not the account exists, so emails cannot be probed.
        userRepository.findByEmail(email)
                .filter(u -> !u.isEmailVerified())
                .ifPresent(u -> otpService.generateAndSend(email, OtpPurpose.EMAIL_VERIFICATION));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = normalize(request.getEmail());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (AuthenticationException ex) {
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException(
                    "Email is not verified. Please verify it using the OTP sent to your email");
        }

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = normalize(request.getEmail());
        // Same response whether or not the account exists, so emails cannot be probed.
        userRepository.findByEmail(email)
                .filter(User::isEnabled)
                .ifPresent(u -> otpService.generateAndSend(email, OtpPurpose.PASSWORD_RESET));
    }

    @Override
    @Transactional(noRollbackFor = BadRequestException.class)
    public void resetPassword(ResetPasswordRequest request) {
        String email = normalize(request.getEmail());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid or expired OTP"));

        otpService.verify(email, OtpPurpose.PASSWORD_RESET, request.getOtp());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        // Receiving the reset code proves ownership of the mailbox.
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return userMapper.toResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getName(),
                user.getRole().name(), user.getUserType().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userMapper.toResponse(user))
                .build();
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
