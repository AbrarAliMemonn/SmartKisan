package com.smartagri.service.impl;

import com.smartagri.dto.request.AdminUserRequest;
import com.smartagri.dto.response.UserResponse;
import com.smartagri.entity.Role;
import com.smartagri.entity.User;
import com.smartagri.entity.UserType;
import com.smartagri.exception.DuplicateResourceException;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.repository.UserRepository;
import com.smartagri.repository.UserSettingsRepository;
import com.smartagri.service.AdminService;
import com.smartagri.service.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartagri.dto.request.SuspendUserRequest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(userMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public UserResponse createUser(AdminUserRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email is already registered");
        }

        String rawPassword = request.getPassword() != null ? request.getPassword() : UUID.randomUUID().toString();

        User user = User.builder()
                .name(request.getName())
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(Role.valueOf(request.getRole().toUpperCase(Locale.ROOT)))
                .userType(UserType.valueOf(request.getUserType().toUpperCase(Locale.ROOT)))
                .phone(request.getPhone())
                .location(request.getLocation())
                .enabled(true)
                .emailVerified(true)
                .build();

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, AdminUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setLocation(request.getLocation());
        if (request.getRole() != null) user.setRole(Role.valueOf(request.getRole().toUpperCase(Locale.ROOT)));
        if (request.getUserType() != null) user.setUserType(UserType.valueOf(request.getUserType().toUpperCase(Locale.ROOT)));

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found");
        }
        // user_settings has a FK to users, so it has to go first.
        userSettingsRepository.deleteByUserId(id);
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public UserResponse suspendUser(Long id, SuspendUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        boolean isTemp = "TEMPORARY".equalsIgnoreCase(request.getType());
        user.setSuspended(true);
        user.setSuspensionType(isTemp ? "TEMPORARY" : "PERMANENT");
        user.setSuspensionReason(request.getReason() != null ? request.getReason().trim() : "Violated terms of service");

        if (isTemp) {
            int days = (request.getDays() != null && request.getDays() > 0) ? request.getDays() : 7;
            user.setSuspendedUntil(Instant.now().plus(days, ChronoUnit.DAYS));
        } else {
            user.setSuspendedUntil(null);
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse unsuspendUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setSuspended(false);
        user.setSuspensionType(null);
        user.setSuspendedUntil(null);
        user.setSuspensionReason(null);

        return userMapper.toResponse(userRepository.save(user));
    }
}
