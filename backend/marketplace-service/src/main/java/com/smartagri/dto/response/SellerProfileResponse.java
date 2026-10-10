package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfileResponse {
    private Long id;
    private Long userId;
    private String sellerName;
    private String shopName;
    private String description;
    private String storeLogoUrl;
    private String phone;
    private String email;
    private String address;
    private String city;
    private String province;
    private String location;
    private String sellerType;
    private String status;
    private boolean verified;
    private String moderationReason;
    private Double rating;
    private Integer totalSales;
    private LocalDate joinedAsSellerOn;
}
