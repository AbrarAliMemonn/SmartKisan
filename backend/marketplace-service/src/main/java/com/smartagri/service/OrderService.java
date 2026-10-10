package com.smartagri.service;

import com.smartagri.dto.request.OrderRequest;
import com.smartagri.dto.request.UpdateOrderStatusRequest;
import com.smartagri.dto.response.OrderResponse;

import java.util.List;

public interface OrderService {
    OrderResponse createOrder(Long buyerId, OrderRequest request);
    List<OrderResponse> getMyOrders(Long buyerId);
    List<OrderResponse> getSellerOrders(Long userId);
    OrderResponse getById(Long orderId, Long requestingUserId);
    OrderResponse updateStatus(Long orderId, Long sellerUserId, UpdateOrderStatusRequest request);
}
