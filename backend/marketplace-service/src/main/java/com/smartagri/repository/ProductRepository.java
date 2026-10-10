package com.smartagri.repository;

import com.smartagri.entity.Product;
import com.smartagri.entity.ProductCategory;
import com.smartagri.entity.ProductCondition;
import com.smartagri.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findBySellerId(Long sellerId);

    List<Product> findBySellerIdAndStatus(Long sellerId, ProductStatus status);

    List<Product> findByStatus(ProductStatus status);

    /** Products at or below a low-stock threshold, for a given seller's dashboard/alerts. */
    List<Product> findBySellerIdAndStockLessThanEqualAndStatusNot(Long sellerId, Integer threshold, ProductStatus excluded);

    /**
     * General storefront search/filter query (spec section 6). Every filter is
     * optional (NULL = not applied). Only products in a publicly-visible
     * status are ever returned here - callers pass in {@code visibleStatuses}
     * so admins/sellers can reuse this with a different status set if needed.
     */
    @Query("""
           SELECT p FROM Product p
           WHERE p.status IN :visibleStatuses
             AND (:category IS NULL OR p.category = :category)
             AND (:subCategory IS NULL OR LOWER(p.subCategory) = LOWER(:subCategory))
             AND (:brand IS NULL OR LOWER(p.brand) = LOWER(:brand))
             AND (:sellerId IS NULL OR p.seller.id = :sellerId)
             AND (:condition IS NULL OR p.condition = :condition)
             AND (:organic IS NULL OR p.organic = :organic)
             AND (:city IS NULL OR LOWER(p.city) = LOWER(:city))
             AND (:minPrice IS NULL OR COALESCE(p.discountPrice, p.price) >= :minPrice)
             AND (:maxPrice IS NULL OR COALESCE(p.discountPrice, p.price) <= :maxPrice)
             AND (:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%'))
                  OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))
                  OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%'))
                  OR LOWER(p.subCategory) LIKE LOWER(CONCAT('%', :search, '%')))
           """)
    Page<Product> search(@Param("search") String search,
                          @Param("category") ProductCategory category,
                          @Param("subCategory") String subCategory,
                          @Param("brand") String brand,
                          @Param("sellerId") Long sellerId,
                          @Param("condition") ProductCondition condition,
                          @Param("organic") Boolean organic,
                          @Param("city") String city,
                          @Param("minPrice") BigDecimal minPrice,
                          @Param("maxPrice") BigDecimal maxPrice,
                          @Param("visibleStatuses") Collection<ProductStatus> visibleStatuses,
                          Pageable pageable);
}
