package com.smartagri.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class ProductRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    private String subCategory;

    private String brand;

    private String sku;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    @DecimalMin(value = "0.0", inclusive = false, message = "Discount price must be greater than 0")
    private BigDecimal discountPrice;

    @NotBlank(message = "Unit is required")
    private String unit;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    /** NEW / USED / REFURBISHED. Defaults to NEW when omitted. */
    private String condition;

    private boolean organic;

    private boolean negotiable;

    private String imageUrl;

    private String videoUrl;

    /** Additional gallery images beyond the cover imageUrl. */
    private List<@NotBlank String> images;

    /** Category-specific attributes, e.g. {"cropType":"Wheat","npkRatio":"20-20-20"}. */
    private Map<String, String> attributes;

    private String city;

    private String province;

    private String country;

    private Double latitude;

    private Double longitude;

    private LocalDate expiryDate;
}
