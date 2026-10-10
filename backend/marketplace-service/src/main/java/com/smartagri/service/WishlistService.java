package com.smartagri.service;

import com.smartagri.dto.response.WishlistItemResponse;

import java.util.List;

public interface WishlistService {
    List<WishlistItemResponse> getWishlist(Long buyerId);
    List<WishlistItemResponse> addItem(Long buyerId, Long productId);
    List<WishlistItemResponse> removeItem(Long buyerId, Long productId);
    boolean isInWishlist(Long buyerId, Long productId);

    /** Moves the item to the buyer's cart and removes it from the wishlist. Returns the updated wishlist. */
    List<WishlistItemResponse> moveToCart(Long buyerId, Long productId);
}
