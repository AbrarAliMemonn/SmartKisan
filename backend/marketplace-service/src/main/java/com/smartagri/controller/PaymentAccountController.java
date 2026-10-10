package com.smartagri.controller;

import com.smartagri.dto.request.PaymentAccountRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.PaymentAccountResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.PaymentAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marketplace/payment-accounts")
@RequiredArgsConstructor
public class PaymentAccountController {

    private final PaymentAccountService paymentAccountService;

    @GetMapping("/me")
    public ApiResponse<List<PaymentAccountResponse>> myAccounts(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(paymentAccountService.getMyAccounts(principal.getId()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentAccountResponse> create(@Valid @RequestBody PaymentAccountRequest request,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Payment account added", paymentAccountService.create(principal.getId(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<PaymentAccountResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody PaymentAccountRequest request,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Payment account updated", paymentAccountService.update(id, principal.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deactivate(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        paymentAccountService.deactivate(id, principal.getId());
        return ApiResponse.message("Payment account deactivated");
    }

    /** Active receiving accounts a buyer can pay into for a given seller - shown during checkout only. */
    @GetMapping("/seller/{sellerUserId}")
    public ApiResponse<List<PaymentAccountResponse>> forSeller(@PathVariable Long sellerUserId) {
        return ApiResponse.success(paymentAccountService.getActiveAccountsForSeller(sellerUserId));
    }
}
