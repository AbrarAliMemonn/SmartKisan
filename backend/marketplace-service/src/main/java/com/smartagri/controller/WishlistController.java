package com.smartagri.controller;

import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.WishlistItemResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/marketplace/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ApiResponse<List<WishlistItemResponse>> get(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(wishlistService.getWishlist(principal.getId()));
    }

    @PostMapping("/{productId}")
    public ApiResponse<List<WishlistItemResponse>> add(@PathVariable Long productId,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Added to wishlist", wishlistService.addItem(principal.getId(), productId));
    }

    @DeleteMapping("/{productId}")
    public ApiResponse<List<WishlistItemResponse>> remove(@PathVariable Long productId,
                                                            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Removed from wishlist", wishlistService.removeItem(principal.getId(), productId));
    }

    @GetMapping("/{productId}/status")
    public ApiResponse<Map<String, Boolean>> status(@PathVariable Long productId,
                                                      @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(Map.of("inWishlist", wishlistService.isInWishlist(principal.getId(), productId)));
    }

    @PostMapping("/{productId}/move-to-cart")
    public ApiResponse<List<WishlistItemResponse>> moveToCart(@PathVariable Long productId,
                                                                @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Moved to cart", wishlistService.moveToCart(principal.getId(), productId));
    }
}
