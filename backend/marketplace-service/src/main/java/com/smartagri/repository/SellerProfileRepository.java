package com.smartagri.repository;

import com.smartagri.entity.SellerProfile;
import com.smartagri.entity.SellerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SellerProfileRepository extends JpaRepository<SellerProfile, Long> {
    Optional<SellerProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    List<SellerProfile> findByStatus(SellerStatus status);
}
