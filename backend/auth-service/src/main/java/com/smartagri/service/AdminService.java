package com.smartagri.service;

import com.smartagri.dto.request.AdminUserRequest;
import com.smartagri.dto.response.UserResponse;

import java.util.List;

public interface AdminService {
    List<UserResponse> getAllUsers();
    UserResponse createUser(AdminUserRequest request);
    UserResponse updateUser(Long id, AdminUserRequest request);
    void deleteUser(Long id);
}
