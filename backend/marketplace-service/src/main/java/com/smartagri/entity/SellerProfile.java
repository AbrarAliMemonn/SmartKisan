package com.smartagri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "seller_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Owning user lives in auth-service; only the id crosses the boundary.
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    // Denormalized snapshot captured from the JWT at registration time,
    // avoiding a synchronous call back to auth-service on every read.
    @Column(name = "seller_name")
    private String sellerName;

    /** Store name (spec section 4/5 "Store name"). */
    @Column(nullable = false)
    private String shopName;

    /** Store description. */
    @Column(length = 1000)
    private String description;

    @Column(name = "store_logo_url")
    private String storeLogoUrl;

    private String phone;

    private String email;

    private String address;

    private String city;

    private String province;

    /** Legacy free-text location, kept for backward compatibility; prefer city/province. */
    private String location;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "seller_type")
    private SellerType sellerType = SellerType.INDIVIDUAL_FARMER;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SellerStatus status = SellerStatus.PENDING;

    /** Distinct "verified" badge, independent of PENDING/APPROVED workflow status. */
    @Builder.Default
    private boolean verified = false;

    /** Reason an admin gave when rejecting/suspending this seller. */
    @Column(name = "moderation_reason", length = 1000)
    private String moderationReason;

    @Builder.Default
    private Double rating = 0.0;

    @Builder.Default
    private Integer totalSales = 0;

    private LocalDate joinedAsSellerOn;
}
