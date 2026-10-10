package com.smartagri.controller;

import com.smartagri.dto.request.OrderRequest;
import com.smartagri.dto.request.UpdateOrderStatusRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.OrderResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marketplace/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OrderResponse> create(@Valid @RequestBody OrderRequest request,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Order placed", orderService.createOrder(principal.getId(), request));
    }

    @GetMapping("/my-orders")
    public ApiResponse<List<OrderResponse>> myOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(orderService.getMyOrders(principal.getId()));
    }

    @GetMapping("/seller-orders")
    public ApiResponse<List<OrderResponse>> sellerOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(orderService.getSellerOrders(principal.getId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(orderService.getById(id, principal.getId()));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<OrderResponse> updateStatus(@PathVariable Long id,
                                                     @Valid @RequestBody UpdateOrderStatusRequest request,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Order status updated", orderService.updateStatus(id, principal.getId(), request));
    }
}
