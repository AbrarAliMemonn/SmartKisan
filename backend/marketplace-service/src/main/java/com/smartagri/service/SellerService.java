package com.smartagri.service;

import com.smartagri.dto.request.ModerationRequest;
import com.smartagri.dto.request.SellerRegistrationRequest;
import com.smartagri.dto.response.SellerAnalyticsResponse;
import com.smartagri.dto.response.SellerProfileResponse;

import java.util.List;

public interface SellerService {
    SellerProfileResponse registerSeller(Long userId, String sellerName, SellerRegistrationRequest request);
    SellerProfileResponse getById(Long sellerId);
    SellerProfileResponse getMyProfile(Long userId);
    SellerAnalyticsResponse getAnalytics(Long userId);

    // --- Admin moderation (spec sections 4, 31) ---
    List<SellerProfileResponse> listPending();
    SellerProfileResponse approve(Long sellerId);
    SellerProfileResponse reject(Long sellerId, ModerationRequest request);
    SellerProfileResponse suspend(Long sellerId, ModerationRequest request);
    SellerProfileResponse verify(Long sellerId);
}
