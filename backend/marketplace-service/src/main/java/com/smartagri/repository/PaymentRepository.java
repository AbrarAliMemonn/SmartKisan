package com.smartagri.repository;

import com.smartagri.entity.Payment;
import com.smartagri.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(Long orderId);
    List<Payment> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);
    List<Payment> findBySellerIdAndStatusOrderByCreatedAtDesc(Long sellerId, PaymentStatus status);
    List<Payment> findByStatusOrderByCreatedAtDesc(PaymentStatus status);
}
