package com.smartagri.service;

import com.smartagri.dto.request.ModerationRequest;
import com.smartagri.dto.request.ProductRequest;
import com.smartagri.dto.request.ProductReviewRequest;
import com.smartagri.dto.response.CategoryResponse;
import com.smartagri.dto.response.ProductResponse;
import com.smartagri.dto.response.ProductReviewResponse;
import com.smartagri.entity.ProductCondition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    Page<ProductResponse> search(String search, String category, String subCategory, String brand,
                                  Long sellerId, String condition, Boolean organic, String city,
                                  BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);

    ProductResponse getById(Long id);
    List<ProductResponse> getBySeller(Long userId);
    ProductResponse create(ProductRequest request, Long userId);
    ProductResponse update(Long id, ProductRequest request, Long userId);
    void delete(Long id, Long userId);
    List<CategoryResponse> getCategories();
    ProductReviewResponse addReview(Long productId, Long userId, String reviewerName, ProductReviewRequest request);
    List<ProductReviewResponse> getReviews(Long productId);

    // --- Admin moderation (spec sections 1, 31) ---
    List<ProductResponse> listPendingApproval();
    ProductResponse approve(Long productId, Long adminUserId);
    ProductResponse reject(Long productId, Long adminUserId, ModerationRequest request);
    ProductResponse suspend(Long productId, Long adminUserId, ModerationRequest request);
}
