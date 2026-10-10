package com.smartagri.controller;

import com.smartagri.dto.request.ProductRequest;
import com.smartagri.dto.request.ProductReviewRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.CategoryResponse;
import com.smartagri.dto.response.ProductResponse;
import com.smartagri.dto.response.ProductReviewResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/marketplace/products")
    public ApiResponse<Page<ProductResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String subCategory,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Boolean organic,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Sort resolvedSort = switch (sort) {
            case "price_low_high" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_high_low" -> Sort.by(Sort.Direction.DESC, "price");
            case "rating" -> Sort.by(Sort.Direction.DESC, "rating");
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt"); // "relevance"/unknown falls back to newest
        };

        return ApiResponse.success(productService.search(
                search, category, subCategory, brand, sellerId, condition, organic, city,
                minPrice, maxPrice, PageRequest.of(page, size, resolvedSort)));
    }

    @GetMapping("/marketplace/products/my-listings")
    public ApiResponse<List<ProductResponse>> myListings(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(productService.getBySeller(principal.getId()));
    }

    @GetMapping("/marketplace/products/{id}")
    public ApiResponse<ProductResponse> getOne(@PathVariable Long id) {
        return ApiResponse.success(productService.getById(id));
    }

    @PostMapping("/marketplace/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductResponse> create(@Valid @RequestBody ProductRequest request,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Product submitted for approval", productService.create(request, principal.getId()));
    }

    @PutMapping("/marketplace/products/{id}")
    public ApiResponse<ProductResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody ProductRequest request,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Product updated", productService.update(id, request, principal.getId()));
    }

    @DeleteMapping("/marketplace/products/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        productService.delete(id, principal.getId());
        return ApiResponse.message("Product removed");
    }

    @GetMapping("/marketplace/categories")
    public ApiResponse<List<CategoryResponse>> categories() {
        return ApiResponse.success(productService.getCategories());
    }

    @PostMapping("/marketplace/products/{id}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductReviewResponse> addReview(@PathVariable Long id,
                                                          @Valid @RequestBody ProductReviewRequest request,
                                                          @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success("Review added", productService.addReview(id, principal.getId(), principal.getName(), request));
    }

    @GetMapping("/marketplace/products/{id}/reviews")
    public ApiResponse<List<ProductReviewResponse>> getReviews(@PathVariable Long id) {
        return ApiResponse.success(productService.getReviews(id));
    }
}
