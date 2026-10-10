package com.smartagri.controller;

import com.smartagri.dto.request.SellerRegistrationRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.SellerAnalyticsResponse;
import com.smartagri.dto.response.SellerProfileResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.SellerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/marketplace/sellers")
@RequiredArgsConstructor
public class SellerController {

    private final SellerService sellerService;

    @PostMapping("/register")
    public ApiResponse<SellerProfileResponse> register(@Valid @RequestBody SellerRegistrationRequest request,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Seller application submitted for approval", sellerService.registerSeller(principal.getId(), principal.getName(), request));
    }

    @GetMapping("/me")
    public ApiResponse<SellerProfileResponse> myProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(sellerService.getMyProfile(principal.getId()));
    }

    @GetMapping("/me/analytics")
    public ApiResponse<SellerAnalyticsResponse> myAnalytics(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(sellerService.getAnalytics(principal.getId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<SellerProfileResponse> getSeller(@PathVariable Long id) {
        return ApiResponse.success(sellerService.getById(id));
    }
}
