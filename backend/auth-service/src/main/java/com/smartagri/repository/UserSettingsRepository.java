package com.smartagri.repository;

import com.smartagri.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {
    Optional<UserSettings> findByUserId(Long userId);

    @Modifying
    @Query("delete from UserSettings s where s.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
