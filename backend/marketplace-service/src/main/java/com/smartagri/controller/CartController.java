package com.smartagri.controller;

import com.smartagri.dto.request.AddCartItemRequest;
import com.smartagri.dto.request.UpdateCartItemRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.CartResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/marketplace/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ApiResponse<CartResponse> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(cartService.getCart(principal.getId()));
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addItem(@Valid @RequestBody AddCartItemRequest request,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Added to cart", cartService.addItem(principal.getId(), request));
    }

    @PutMapping("/items/{productId}")
    public ApiResponse<CartResponse> updateItem(@PathVariable Long productId,
                                                 @Valid @RequestBody UpdateCartItemRequest request,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Cart updated", cartService.updateItem(principal.getId(), productId, request));
    }

    @DeleteMapping("/items/{productId}")
    public ApiResponse<CartResponse> removeItem(@PathVariable Long productId,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Removed from cart", cartService.removeItem(principal.getId(), productId));
    }

    @DeleteMapping
    public ApiResponse<CartResponse> clear(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Cart cleared", cartService.clear(principal.getId()));
    }
}
