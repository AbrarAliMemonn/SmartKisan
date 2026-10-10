package com.smartagri.service.impl;

import com.smartagri.dto.request.ModerationRequest;
import com.smartagri.dto.request.SellerRegistrationRequest;
import com.smartagri.dto.response.SellerAnalyticsResponse;
import com.smartagri.dto.response.SellerProfileResponse;
import com.smartagri.entity.OrderStatus;
import com.smartagri.entity.SellerProfile;
import com.smartagri.entity.SellerStatus;
import com.smartagri.entity.SellerType;
import com.smartagri.exception.BadRequestException;
import com.smartagri.exception.DuplicateResourceException;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.repository.OrderRepository;
import com.smartagri.repository.ProductRepository;
import com.smartagri.repository.SellerProfileRepository;
import com.smartagri.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerServiceImpl implements SellerService {

    private final SellerProfileRepository sellerProfileRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    private static final Set<OrderStatus> REVENUE_EXCLUDED_STATUSES =
            EnumSet.of(OrderStatus.CANCELLED, OrderStatus.RETURNED, OrderStatus.REFUNDED);

    @Override
    @Transactional
    public SellerProfileResponse registerSeller(Long userId, String sellerName, SellerRegistrationRequest request) {
        if (sellerProfileRepository.existsByUserId(userId)) {
            throw new DuplicateResourceException("You are already registered as a seller");
        }

        SellerProfile profile = SellerProfile.builder()
                .userId(userId)
                .sellerName(sellerName)
                .shopName(request.getShopName())
                .description(request.getDescription())
                .storeLogoUrl(request.getStoreLogoUrl())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .city(request.getCity())
                .province(request.getProvince())
                .location(request.getLocation())
                .sellerType(parseSellerType(request.getSellerType()))
                .status(SellerStatus.PENDING)
                .verified(false)
                .rating(0.0)
                .totalSales(0)
                .joinedAsSellerOn(LocalDate.now())
                .build();
        profile = sellerProfileRepository.save(profile);

        // NOTE: in a full deployment, publish a "UserBecameSellerEvent" to Kafka here
        // so auth-service can (eventually) flip User.seller = true. Omitted for brevity.

        return toResponse(profile);
    }

    @Override
    public SellerProfileResponse getById(Long sellerId) {
        return toResponse(getSellerOrThrow(sellerId));
    }

    @Override
    public SellerProfileResponse getMyProfile(Long userId) {
        return toResponse(sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("You are not registered as a seller")));
    }

    @Override
    public SellerAnalyticsResponse getAnalytics(Long userId) {
        SellerProfile seller = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("You are not registered as a seller"));

        long totalOrders = orderRepository.countBySellerId(seller.getId());
        long totalProducts = productRepository.findBySellerId(seller.getId()).size();
        long totalCustomers = orderRepository.countDistinctBuyersBySeller(seller.getId());
        var totalRevenue = orderRepository.sumRevenueBySeller(seller.getId(), REVENUE_EXCLUDED_STATUSES);

        return SellerAnalyticsResponse.builder()
                .sellerId(seller.getId())
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .totalProducts(totalProducts)
                .totalCustomers(totalCustomers)
                .rating(seller.getRating())
                .build();
    }

    // --- Admin moderation ---

    @Override
    public List<SellerProfileResponse> listPending() {
        return sellerProfileRepository.findByStatus(SellerStatus.PENDING).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public SellerProfileResponse approve(Long sellerId) {
        SellerProfile seller = getSellerOrThrow(sellerId);
        seller.setStatus(SellerStatus.APPROVED);
        seller.setModerationReason(null);
        return toResponse(sellerProfileRepository.save(seller));
    }

    @Override
    @Transactional
    public SellerProfileResponse reject(Long sellerId, ModerationRequest request) {
        SellerProfile seller = getSellerOrThrow(sellerId);
        seller.setStatus(SellerStatus.REJECTED);
        seller.setModerationReason(request.getReason());
        return toResponse(sellerProfileRepository.save(seller));
    }

    @Override
    @Transactional
    public SellerProfileResponse suspend(Long sellerId, ModerationRequest request) {
        SellerProfile seller = getSellerOrThrow(sellerId);
        seller.setStatus(SellerStatus.SUSPENDED);
        seller.setModerationReason(request.getReason());
        return toResponse(sellerProfileRepository.save(seller));
    }

    @Override
    @Transactional
    public SellerProfileResponse verify(Long sellerId) {
        SellerProfile seller = getSellerOrThrow(sellerId);
        seller.setVerified(true);
        return toResponse(sellerProfileRepository.save(seller));
    }

    private SellerProfile getSellerOrThrow(Long sellerId) {
        return sellerProfileRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + sellerId));
    }

    private SellerType parseSellerType(String value) {
        try {
            return SellerType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("Invalid seller type: " + value);
        }
    }

    private SellerProfileResponse toResponse(SellerProfile p) {
        return SellerProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .sellerName(p.getSellerName())
                .shopName(p.getShopName())
                .description(p.getDescription())
                .storeLogoUrl(p.getStoreLogoUrl())
                .phone(p.getPhone())
                .email(p.getEmail())
                .address(p.getAddress())
                .city(p.getCity())
                .province(p.getProvince())
                .location(p.getLocation())
                .sellerType(p.getSellerType() != null ? p.getSellerType().name() : null)
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .verified(p.isVerified())
                .moderationReason(p.getModerationReason())
                .rating(p.getRating())
                .totalSales(p.getTotalSales())
                .joinedAsSellerOn(p.getJoinedAsSellerOn())
                .build();
    }
}
