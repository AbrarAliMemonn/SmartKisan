package com.smartagri.service.impl;

import com.smartagri.dto.request.ModerationRequest;
import com.smartagri.dto.request.ProductRequest;
import com.smartagri.dto.request.ProductReviewRequest;
import com.smartagri.dto.response.CategoryResponse;
import com.smartagri.dto.response.ProductResponse;
import com.smartagri.dto.response.ProductReviewResponse;
import com.smartagri.entity.*;
import com.smartagri.exception.BadRequestException;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.repository.OrderRepository;
import com.smartagri.repository.ProductRepository;
import com.smartagri.repository.ProductReviewRepository;
import com.smartagri.repository.SellerProfileRepository;
import com.smartagri.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductReviewRepository productReviewRepository;
    private final OrderRepository orderRepository;

    private static final Set<ProductStatus> PUBLICLY_VISIBLE = Set.of(ProductStatus.APPROVED, ProductStatus.OUT_OF_STOCK);

    private static final List<CategoryResponse> CATEGORIES = List.of(
            new CategoryResponse("SEEDS", "Seeds", "🌱"),
            new CategoryResponse("FERTILIZERS", "Fertilizers", "🧪"),
            new CategoryResponse("CROP_PROTECTION", "Crop Protection", "🛡️"),
            new CategoryResponse("EQUIPMENT", "Agricultural Equipment", "🚜"),
            new CategoryResponse("IRRIGATION", "Irrigation", "💧"),
            new CategoryResponse("SMART_FARMING", "Smart Farming / IoT", "📡"),
            new CategoryResponse("LIVESTOCK", "Livestock", "🐄"),
            new CategoryResponse("FARMER_PRODUCE", "Farmer Produce", "🌾"),
            new CategoryResponse("TOOLS", "Farm Tools", "🛠️")
    );

    @Override
    public Page<ProductResponse> search(String search, String category, String subCategory, String brand,
                                         Long sellerId, String condition, Boolean organic, String city,
                                         BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        ProductCategory categoryEnum = parseOptionalCategory(category);
        ProductCondition conditionEnum = parseOptionalCondition(condition);
        return productRepository.search(
                StringUtils.hasText(search) ? search : null,
                categoryEnum,
                StringUtils.hasText(subCategory) ? subCategory : null,
                StringUtils.hasText(brand) ? brand : null,
                sellerId,
                conditionEnum,
                organic,
                StringUtils.hasText(city) ? city : null,
                minPrice,
                maxPrice,
                PUBLICLY_VISIBLE,
                pageable
        ).map(this::toResponse);
    }

    @Override
    public ProductResponse getById(Long id) {
        return productRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    @Override
    public List<ProductResponse> getBySeller(Long userId) {
        SellerProfile seller = getSellerProfileOrThrow(userId);
        return productRepository.findBySellerId(seller.getId()).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request, Long userId) {
        SellerProfile seller = getSellerProfileOrThrow(userId);
        if (seller.getStatus() != SellerStatus.APPROVED) {
            throw new BadRequestException("Your seller account must be approved by an admin before you can list products");
        }
        validatePricing(request);

        Product product = Product.builder()
                .seller(seller)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(parseCategory(request.getCategory()))
                .subCategory(request.getSubCategory())
                .brand(request.getBrand())
                .sku(request.getSku())
                .price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .unit(request.getUnit())
                .stock(request.getStock())
                .condition(parseOptionalCondition(request.getCondition()) == null ? ProductCondition.NEW : parseOptionalCondition(request.getCondition()))
                .organic(request.isOrganic())
                .negotiable(request.isNegotiable())
                .imageUrl(resolveCoverImage(request))
                .videoUrl(request.getVideoUrl())
                .attributes(request.getAttributes() == null ? new HashMap<>() : new HashMap<>(request.getAttributes()))
                .city(request.getCity())
                .province(request.getProvince())
                .country(request.getCountry())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .expiryDate(request.getExpiryDate())
                .status(ProductStatus.PENDING_APPROVAL)
                .build();

        attachImages(product, request);

        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public ProductResponse update(Long id, ProductRequest request, Long userId) {
        Product product = getOwnedProductOrThrow(id, userId);
        validatePricing(request);

        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setCategory(parseCategory(request.getCategory()));
        product.setSubCategory(request.getSubCategory());
        product.setBrand(request.getBrand());
        product.setSku(request.getSku());
        product.setPrice(request.getPrice());
        product.setDiscountPrice(request.getDiscountPrice());
        product.setUnit(request.getUnit());
        product.setStock(request.getStock());
        if (StringUtils.hasText(request.getCondition())) {
            product.setCondition(parseOptionalCondition(request.getCondition()));
        }
        product.setOrganic(request.isOrganic());
        product.setNegotiable(request.isNegotiable());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
        if (request.getVideoUrl() != null) product.setVideoUrl(request.getVideoUrl());
        if (request.getAttributes() != null) product.setAttributes(new HashMap<>(request.getAttributes()));
        if (request.getCity() != null) product.setCity(request.getCity());
        if (request.getProvince() != null) product.setProvince(request.getProvince());
        if (request.getCountry() != null) product.setCountry(request.getCountry());
        if (request.getLatitude() != null) product.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) product.setLongitude(request.getLongitude());
        if (request.getExpiryDate() != null) product.setExpiryDate(request.getExpiryDate());

        if (product.getStock() == 0 && product.getStatus() == ProductStatus.APPROVED) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else if (product.getStock() > 0 && product.getStatus() == ProductStatus.OUT_OF_STOCK) {
            product.setStatus(ProductStatus.APPROVED);
        } else if (product.getStatus() == ProductStatus.REJECTED) {
            // Seller fixed a rejected listing - send it back for re-review.
            product.setStatus(ProductStatus.PENDING_APPROVAL);
            product.setModerationReason(null);
        }

        if (request.getImages() != null) {
            product.getImages().clear();
            attachImages(product, request);
        }

        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        Product product = getOwnedProductOrThrow(id, userId);
        productRepository.delete(product);
    }

    @Override
    public List<CategoryResponse> getCategories() {
        return CATEGORIES;
    }

    @Override
    @Transactional
    public ProductReviewResponse addReview(Long productId, Long userId, String reviewerName, ProductReviewRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        boolean verifiedPurchase = orderRepository.existsDeliveredPurchase(userId, productId);

        ProductReview review = ProductReview.builder()
                .product(product)
                .reviewerId(userId)
                .reviewerName(reviewerName)
                .rating(request.getRating())
                .comment(request.getComment())
                .verifiedPurchase(verifiedPurchase)
                .build();
        review = productReviewRepository.save(review);

        // recompute running average rating
        List<ProductReview> allReviews = productReviewRepository.findByProductId(productId);
        double avg = allReviews.stream().mapToInt(ProductReview::getRating).average().orElse(0);
        product.setRating(Math.round(avg * 10.0) / 10.0);
        product.setReviewsCount(allReviews.size());
        productRepository.save(product);

        return ProductReviewResponse.builder()
                .id(review.getId())
                .productId(productId)
                .reviewerName(review.getReviewerName())
                .rating(review.getRating())
                .comment(review.getComment())
                .verifiedPurchase(review.isVerifiedPurchase())
                .createdAt(review.getCreatedAt())
                .build();
    }

    @Override
    public List<ProductReviewResponse> getReviews(Long productId) {
        return productReviewRepository.findByProductId(productId).stream()
                .map(r -> ProductReviewResponse.builder()
                        .id(r.getId())
                        .productId(productId)
                        .reviewerName(r.getReviewerName())
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .verifiedPurchase(r.isVerifiedPurchase())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();
    }

    // --- Admin moderation ---

    @Override
    public List<ProductResponse> listPendingApproval() {
        return productRepository.findByStatus(ProductStatus.PENDING_APPROVAL).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public ProductResponse approve(Long productId, Long adminUserId) {
        Product product = getProductOrThrow(productId);
        product.setStatus(product.getStock() > 0 ? ProductStatus.APPROVED : ProductStatus.OUT_OF_STOCK);
        product.setModerationReason(null);
        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public ProductResponse reject(Long productId, Long adminUserId, ModerationRequest request) {
        Product product = getProductOrThrow(productId);
        product.setStatus(ProductStatus.REJECTED);
        product.setModerationReason(request.getReason());
        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public ProductResponse suspend(Long productId, Long adminUserId, ModerationRequest request) {
        Product product = getProductOrThrow(productId);
        product.setStatus(ProductStatus.SUSPENDED);
        product.setModerationReason(request.getReason());
        return toResponse(productRepository.save(product));
    }

    // --- helpers ---

    private void validatePricing(ProductRequest request) {
        if (request.getDiscountPrice() != null && request.getPrice() != null
                && request.getDiscountPrice().compareTo(request.getPrice()) >= 0) {
            throw new BadRequestException("Discount price must be lower than the regular price");
        }
    }

    private String resolveCoverImage(ProductRequest request) {
        if (StringUtils.hasText(request.getImageUrl())) return request.getImageUrl();
        if (request.getImages() != null && !request.getImages().isEmpty()) return request.getImages().get(0);
        return null;
    }

    private void attachImages(Product product, ProductRequest request) {
        if (request.getImages() == null) return;
        int order = 0;
        for (String url : request.getImages()) {
            if (!StringUtils.hasText(url)) continue;
            product.addImage(ProductImage.builder().url(url).sortOrder(order++).build());
        }
    }

    private ProductCategory parseCategory(String value) {
        try {
            return ProductCategory.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("Invalid category: " + value);
        }
    }

    private ProductCategory parseOptionalCategory(String value) {
        if (!StringUtils.hasText(value)) return null;
        try {
            return ProductCategory.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private ProductCondition parseOptionalCondition(String value) {
        if (!StringUtils.hasText(value)) return null;
        try {
            return ProductCondition.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid condition: " + value);
        }
    }

    private SellerProfile getSellerProfileOrThrow(Long userId) {
        return sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("You must register as a seller first"));
    }

    private Product getProductOrThrow(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
    }

    private Product getOwnedProductOrThrow(Long productId, Long userId) {
        Product product = getProductOrThrow(productId);
        if (!product.getSeller().getUserId().equals(userId)) {
            throw new BadRequestException("You do not own this product listing");
        }
        return product;
    }

    private ProductResponse toResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .sellerId(p.getSeller().getId())
                .sellerShopName(p.getSeller().getShopName())
                .title(p.getTitle())
                .description(p.getDescription())
                .category(p.getCategory().name())
                .subCategory(p.getSubCategory())
                .brand(p.getBrand())
                .sku(p.getSku())
                .price(p.getPrice())
                .discountPrice(p.getDiscountPrice())
                .unit(p.getUnit())
                .stock(p.getStock())
                .condition(p.getCondition() != null ? p.getCondition().name() : null)
                .organic(p.isOrganic())
                .negotiable(p.isNegotiable())
                .imageUrl(p.getImageUrl())
                .videoUrl(p.getVideoUrl())
                .images(p.getImages() == null ? new ArrayList<>() :
                        p.getImages().stream().map(ProductImage::getUrl).toList())
                .attributes(p.getAttributes() == null ? new HashMap<>() : new HashMap<>(p.getAttributes()))
                .city(p.getCity())
                .province(p.getProvince())
                .country(p.getCountry())
                .expiryDate(p.getExpiryDate())
                .rating(p.getRating())
                .reviewsCount(p.getReviewsCount())
                .status(p.getStatus().name())
                .moderationReason(p.getModerationReason())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
