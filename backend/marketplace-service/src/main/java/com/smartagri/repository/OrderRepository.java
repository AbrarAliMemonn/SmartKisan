package com.smartagri.repository;

import com.smartagri.entity.Order;
import com.smartagri.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyerIdOrderByOrderDateDesc(Long buyerId);
    List<Order> findBySellerIdOrderByOrderDateDesc(Long sellerId);
    long countBySellerId(Long sellerId);

    /** Used to gate "verified purchase" reviews - true only if the buyer actually received this product. */
    @Query("""
           SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END
           FROM OrderItem oi
           WHERE oi.order.buyerId = :buyerId
             AND oi.product.id = :productId
             AND oi.order.status = com.smartagri.entity.OrderStatus.DELIVERED
           """)
    boolean existsDeliveredPurchase(@Param("buyerId") Long buyerId, @Param("productId") Long productId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.seller.id = :sellerId AND o.status NOT IN :excludedStatuses")
    BigDecimal sumRevenueBySeller(@Param("sellerId") Long sellerId, @Param("excludedStatuses") Collection<OrderStatus> excludedStatuses);

    @Query("SELECT COUNT(DISTINCT o.buyerId) FROM Order o WHERE o.seller.id = :sellerId")
    long countDistinctBuyersBySeller(@Param("sellerId") Long sellerId);
}
