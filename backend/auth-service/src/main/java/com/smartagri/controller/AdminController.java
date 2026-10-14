package com.smartagri.controller;

import com.smartagri.dto.request.AdminUserRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.UserResponse;
import com.smartagri.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping
    public ApiResponse<List<UserResponse>> getAllUsers() {
        return ApiResponse.success(adminService.getAllUsers());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody AdminUserRequest request) {
        return ApiResponse.success("User created", adminService.createUser(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody AdminUserRequest request) {
        return ApiResponse.success("User updated", adminService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ApiResponse.message("User deleted");
    }

    @PostMapping("/{id}/suspend")
    public ApiResponse<UserResponse> suspendUser(@PathVariable Long id,
                                                 @Valid @RequestBody com.smartagri.dto.request.SuspendUserRequest request) {
        return ApiResponse.success("User account suspended", adminService.suspendUser(id, request));
    }

    @PostMapping("/{id}/unsuspend")
    public ApiResponse<UserResponse> unsuspendUser(@PathVariable Long id) {
        return ApiResponse.success("User account reactivated", adminService.unsuspendUser(id));
    }
}
