package com.smartagri.controller;

import com.smartagri.dto.request.PaymentDecisionRequest;
import com.smartagri.dto.request.PaymentSubmitRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.PaymentResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marketplace/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/order/{orderId}")
    public ApiResponse<PaymentResponse> getByOrder(@PathVariable Long orderId,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(paymentService.getByOrderId(orderId, principal.getId()));
    }

    @GetMapping("/my-payments")
    public ApiResponse<List<PaymentResponse>> myPayments(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(paymentService.getMyPayments(principal.getId()));
    }

    /** Buyer submits (or resubmits) manual-transfer proof for a non-COD order. */
    @PostMapping("/order/{orderId}/submit")
    public ApiResponse<PaymentResponse> submit(@PathVariable Long orderId,
                                                @Valid @RequestBody PaymentSubmitRequest request,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Payment information submitted", paymentService.submitPaymentInfo(orderId, principal.getId(), request));
    }

    @GetMapping("/seller-pending")
    public ApiResponse<List<PaymentResponse>> sellerPending(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(paymentService.getPendingForSeller(principal.getId()));
    }

    /** Seller (order owner) confirms the manual transfer arrived. A buyer can never approve their own payment. */
    @PostMapping("/order/{orderId}/approve")
    public ApiResponse<PaymentResponse> approve(@PathVariable Long orderId,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = isAdmin(principal);
        return ApiResponse.success("Payment approved", paymentService.approve(orderId, principal.getId(), isAdmin));
    }

    @PostMapping("/order/{orderId}/reject")
    public ApiResponse<PaymentResponse> reject(@PathVariable Long orderId,
                                                @RequestBody(required = false) PaymentDecisionRequest request,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = isAdmin(principal);
        return ApiResponse.success("Payment rejected", paymentService.reject(
                orderId, principal.getId(), isAdmin, request != null ? request : new PaymentDecisionRequest()));
    }

    private boolean isAdmin(UserPrincipal principal) {
        return "ADMIN".equalsIgnoreCase(principal.getRole());
    }
}
