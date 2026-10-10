package com.smartagri.controller;

import com.smartagri.dto.request.CouponRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.CouponResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marketplace/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final com.smartagri.service.CouponService couponService;

    @GetMapping
    public ApiResponse<List<CouponResponse>> listActive() {
        return ApiResponse.success(couponService.listActive());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<CouponResponse>> listAll() {
        return ApiResponse.success(couponService.listAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CouponResponse> create(@Valid @RequestBody CouponRequest request) {
        return ApiResponse.success("Coupon created", couponService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CouponResponse> update(@PathVariable Long id, @Valid @RequestBody CouponRequest request) {
        return ApiResponse.success("Coupon updated", couponService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CouponResponse> deactivate(@PathVariable Long id) {
        return ApiResponse.success("Coupon deactivated", couponService.deactivate(id));
    }
}
