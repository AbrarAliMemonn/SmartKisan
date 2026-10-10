package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartSellerGroupResponse {
    private Long sellerId;
    private String sellerShopName;
    private List<CartItemResponse> items;
    private BigDecimal subtotal;
}
