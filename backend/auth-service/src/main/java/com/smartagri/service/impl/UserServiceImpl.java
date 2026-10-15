package com.smartagri.service.impl;

import com.smartagri.dto.request.ChangePasswordRequest;
import com.smartagri.dto.request.UpdateProfileRequest;
import com.smartagri.dto.request.UpdateSettingsRequest;
import com.smartagri.dto.response.UserResponse;
import com.smartagri.dto.response.UserSettingsResponse;
import com.smartagri.entity.User;
import com.smartagri.entity.UserSettings;
import com.smartagri.exception.BadRequestException;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.repository.UserRepository;
import com.smartagri.repository.UserSettingsRepository;
import com.smartagri.service.UserService;
import com.smartagri.service.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.upload.public-path:/uploads}")
    private String publicPath;

    @Override
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserOrThrow(userId);

        if (StringUtils.hasText(request.getName())) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getLocation() != null) user.setLocation(request.getLocation());
        if (request.getFarmSize() != null) user.setFarmSize(request.getFarmSize());

        user = userRepository.save(user);
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getUserOrThrow(userId);

        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public UserResponse uploadAvatar(Long userId, MultipartFile file) {
        User user = getUserOrThrow(userId);

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file uploaded");
        }

        try {
            Path dir = Path.of(uploadDir, "avatars");
            Files.createDirectories(dir);

            String extension = "";
            String original = file.getOriginalFilename();
            if (original != null && original.contains(".")) {
                extension = original.substring(original.lastIndexOf('.'));
            }
            String filename = UUID.randomUUID() + extension;
            Path target = dir.resolve(filename);
            Files.copy(file.getInputStream(), target);

            user.setAvatar(publicPath + "/avatars/" + filename);
            user = userRepository.save(user);
            return userMapper.toResponse(user);
        } catch (IOException e) {
            throw new BadRequestException("Failed to store uploaded avatar: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public UserSettingsResponse updateSettings(Long userId, UpdateSettingsRequest request) {
        User user = getUserOrThrow(userId);

        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> UserSettings.builder().user(user).build());

        if (request.getEmailNotifications() != null) settings.setEmailNotifications(request.getEmailNotifications());
        if (request.getSmsNotifications() != null) settings.setSmsNotifications(request.getSmsNotifications());
        if (request.getPushNotifications() != null) settings.setPushNotifications(request.getPushNotifications());
        if (request.getLanguage() != null) settings.setLanguage(request.getLanguage());
        if (request.getTheme() != null) settings.setTheme(request.getTheme());
        if (request.getIrrigationAlerts() != null) settings.setIrrigationAlerts(request.getIrrigationAlerts());
        if (request.getWeatherAlerts() != null) settings.setWeatherAlerts(request.getWeatherAlerts());

        settings = userSettingsRepository.save(settings);

        return UserSettingsResponse.builder()
                .emailNotifications(settings.isEmailNotifications())
                .smsNotifications(settings.isSmsNotifications())
                .pushNotifications(settings.isPushNotifications())
                .language(settings.getLanguage())
                .theme(settings.getTheme())
                .irrigationAlerts(settings.isIrrigationAlerts())
                .weatherAlerts(settings.isWeatherAlerts())
                .build();
    }

    @Override
    @Transactional
    public void deleteAccount(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        userSettingsRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
