package com.smartagri.service;

import com.smartagri.dto.request.AddCartItemRequest;
import com.smartagri.dto.request.UpdateCartItemRequest;
import com.smartagri.dto.response.CartResponse;

public interface CartService {
    CartResponse getCart(Long buyerId);
    CartResponse addItem(Long buyerId, AddCartItemRequest request);
    CartResponse updateItem(Long buyerId, Long productId, UpdateCartItemRequest request);
    CartResponse removeItem(Long buyerId, Long productId);
    CartResponse clear(Long buyerId);
}
