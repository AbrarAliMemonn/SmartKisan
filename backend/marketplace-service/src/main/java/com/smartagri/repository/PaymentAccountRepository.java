package com.smartagri.repository;

import com.smartagri.entity.PaymentAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentAccountRepository extends JpaRepository<PaymentAccount, Long> {
    List<PaymentAccount> findByOwnerUserId(Long ownerUserId);
    List<PaymentAccount> findByOwnerUserIdAndActiveTrue(Long ownerUserId);
    List<PaymentAccount> findByOwnerUserIdIsNullAndActiveTrue();
}
