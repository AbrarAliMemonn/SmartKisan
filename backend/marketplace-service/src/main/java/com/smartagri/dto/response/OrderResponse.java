package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private Long buyerId;
    private Long sellerId;
    private String sellerShopName;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal deliveryCharge;
    private BigDecimal totalAmount;
    private String couponCode;
    private String deliveryAddress;
    private String city;
    private String province;
    private String phone;
    private String buyerName;
    private List<OrderItemResponse> items;
    private Instant orderDate;
    private PaymentResponse payment;
}
