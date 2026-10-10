package com.smartagri.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class CouponRequest {

    @NotBlank(message = "Code is required")
    private String code;

    /** PERCENTAGE / FIXED */
    @NotBlank(message = "Discount type is required")
    private String discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Discount value must be greater than 0")
    private BigDecimal discountValue;

    private boolean freeDelivery;

    private BigDecimal minOrderAmount;

    private BigDecimal maxDiscountAmount;

    private Instant startDate;

    private Instant endDate;

    private Integer usageLimit;

    private boolean active = true;
}
