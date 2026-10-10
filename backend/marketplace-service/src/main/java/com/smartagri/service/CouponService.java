package com.smartagri.service;

import com.smartagri.dto.request.CouponRequest;
import com.smartagri.dto.response.CouponResponse;

import java.math.BigDecimal;
import java.util.List;

public interface CouponService {

    /** Result of applying a coupon to a subtotal. */
    record CouponResult(String code, BigDecimal discountAmount, boolean freeDelivery) {}

    /** Validates the coupon against the given subtotal and returns the discount to apply. Increments usage on success. */
    CouponResult validateAndApply(String code, BigDecimal subtotal);

    List<CouponResponse> listActive();

    // --- Admin ---
    List<CouponResponse> listAll();
    CouponResponse create(CouponRequest request);
    CouponResponse update(Long id, CouponRequest request);
    CouponResponse deactivate(Long id);
}
