package com.smartagri.controller;

import com.smartagri.dto.request.ModerationRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.PaymentResponse;
import com.smartagri.dto.response.ProductResponse;
import com.smartagri.dto.response.SellerProfileResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.PaymentService;
import com.smartagri.service.ProductService;
import com.smartagri.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Marketplace administration (spec section 31). Every endpoint here requires
 * ROLE_ADMIN - enforced via method security, reusing the existing JWT/role
 * infrastructure rather than a separate auth system.
 */
@RestController
@RequestMapping("/marketplace/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final SellerService sellerService;
    private final ProductService productService;
    private final PaymentService paymentService;

    // --- Sellers ---

    @GetMapping("/sellers")
    public ApiResponse<List<SellerProfileResponse>> allSellers() {
        return ApiResponse.success(sellerService.listAll());
    }

    @GetMapping("/sellers/pending")
    public ApiResponse<List<SellerProfileResponse>> pendingSellers() {
        return ApiResponse.success(sellerService.listPending());
    }

    @PostMapping("/sellers/{id}/approve")
    public ApiResponse<SellerProfileResponse> approveSeller(@PathVariable Long id) {
        return ApiResponse.success("Seller approved", sellerService.approve(id));
    }

    @PostMapping("/sellers/{id}/reject")
    public ApiResponse<SellerProfileResponse> rejectSeller(@PathVariable Long id, @RequestBody(required = false) ModerationRequest request) {
        return ApiResponse.success("Seller rejected", sellerService.reject(id, request != null ? request : new ModerationRequest()));
    }

    @PostMapping("/sellers/{id}/suspend")
    public ApiResponse<SellerProfileResponse> suspendSeller(@PathVariable Long id, @RequestBody(required = false) ModerationRequest request) {
        return ApiResponse.success("Seller suspended", sellerService.suspend(id, request != null ? request : new ModerationRequest()));
    }

    @PostMapping("/sellers/{id}/unsuspend")
    public ApiResponse<SellerProfileResponse> unsuspendSeller(@PathVariable Long id) {
        return ApiResponse.success("Seller unsuspended", sellerService.unsuspend(id));
    }

    @PostMapping("/sellers/{id}/verify")
    public ApiResponse<SellerProfileResponse> verifySeller(@PathVariable Long id) {
        return ApiResponse.success("Seller verified", sellerService.verify(id));
    }

    // --- Products ---

    @GetMapping("/products/pending")
    public ApiResponse<List<ProductResponse>> pendingProducts() {
        return ApiResponse.success(productService.listPendingApproval());
    }

    @PostMapping("/products/{id}/approve")
    public ApiResponse<ProductResponse> approveProduct(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Product approved", productService.approve(id, principal.getId()));
    }

    @PostMapping("/products/{id}/reject")
    public ApiResponse<ProductResponse> rejectProduct(@PathVariable Long id, @RequestBody(required = false) ModerationRequest request,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Product rejected", productService.reject(id, principal.getId(), request != null ? request : new ModerationRequest()));
    }

    @PostMapping("/products/{id}/suspend")
    public ApiResponse<ProductResponse> suspendProduct(@PathVariable Long id, @RequestBody(required = false) ModerationRequest request,
                                                        @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Product suspended", productService.suspend(id, principal.getId(), request != null ? request : new ModerationRequest()));
    }

    // --- Payments ---

    @GetMapping("/payments/pending")
    public ApiResponse<List<PaymentResponse>> pendingPayments() {
        return ApiResponse.success(paymentService.getPendingForAdmin());
    }

    @PostMapping("/payments/order/{orderId}/approve")
    public ApiResponse<PaymentResponse> approvePayment(@PathVariable Long orderId, @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Payment approved", paymentService.approve(orderId, principal.getId(), true));
    }

    @PostMapping("/payments/order/{orderId}/reject")
    public ApiResponse<PaymentResponse> rejectPayment(@PathVariable Long orderId,
                                                       @RequestBody(required = false) com.smartagri.dto.request.PaymentDecisionRequest request,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Payment rejected", paymentService.reject(
                orderId, principal.getId(), true,
                request != null ? request : new com.smartagri.dto.request.PaymentDecisionRequest()));
    }
}
