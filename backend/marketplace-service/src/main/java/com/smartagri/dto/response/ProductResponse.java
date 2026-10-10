package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private Long sellerId;
    private String sellerShopName;
    private String title;
    private String description;
    private String category;
    private String subCategory;
    private String brand;
    private String sku;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private String unit;
    private Integer stock;
    private String condition;
    private boolean organic;
    private boolean negotiable;
    private String imageUrl;
    private String videoUrl;
    private List<String> images;
    private Map<String, String> attributes;
    private String city;
    private String province;
    private String country;
    private LocalDate expiryDate;
    private Double rating;
    private Integer reviewsCount;
    private String status;
    private String moderationReason;
    private Instant createdAt;
    private Instant updatedAt;
}
