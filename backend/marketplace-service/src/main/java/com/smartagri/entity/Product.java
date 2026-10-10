package com.smartagri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private SellerProfile seller;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductCategory category;

    /** Free-text finer classification within the category, e.g. "Wheat", "Urea", "Tractors". */
    @Column(name = "sub_category")
    private String subCategory;

    private String brand;

    @Column(unique = true)
    private String sku;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    /** Optional discounted selling price; must be lower than price (validated in service layer). */
    @Column(name = "discount_price", precision = 12, scale = 2)
    private BigDecimal discountPrice;

    private String unit;

    @Column(nullable = false)
    private Integer stock;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "product_condition")
    private ProductCondition condition = ProductCondition.NEW;

    @Builder.Default
    private boolean organic = false;

    @Builder.Default
    private boolean negotiable = false;

    /** Primary/cover image - kept for backward compatibility with existing frontend responses. */
    private String imageUrl;

    private String videoUrl;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    /**
     * Generic category-specific attributes (e.g. cropType, varietyName, npkRatio,
     * activeIngredient, engineHp, harvestDate, qualityGrade ...). Keeping this as a
     * flexible key/value map lets every category in spec section 3 be represented
     * without a bespoke table per category.
     */
    @ElementCollection
    @CollectionTable(name = "product_attributes", joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyColumn(name = "attr_key")
    @Column(name = "attr_value", length = 500)
    @Builder.Default
    private Map<String, String> attributes = new HashMap<>();

    private String city;

    private String province;

    private String country;

    private Double latitude;

    private Double longitude;

    private LocalDate expiryDate;

    @Builder.Default
    private Double rating = 0.0;

    @Builder.Default
    private Integer reviewsCount = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProductStatus status = ProductStatus.PENDING_APPROVAL;

    /** Reason an admin gave when rejecting/suspending this listing. */
    @Column(name = "moderation_reason", length = 1000)
    private String moderationReason;

    /** Optimistic lock guarding against overselling under concurrent orders. */
    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public void addImage(ProductImage image) {
        images.add(image);
        image.setProduct(this);
    }
}
