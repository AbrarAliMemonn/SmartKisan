package com.smartagri.service.impl;

import com.smartagri.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/** Housekeeping: removes expired OTP rows every 30 minutes. */
@Component
@RequiredArgsConstructor
@Slf4j
public class OtpCleanupJob {

    private final OtpTokenRepository otpTokenRepository;

    @Scheduled(fixedDelay = 30 * 60 * 1000L, initialDelay = 60 * 1000L)
    @Transactional
    public void purgeExpired() {
        int removed = otpTokenRepository.deleteExpired(Instant.now());
        if (removed > 0) {
            log.debug("Purged {} expired OTP rows", removed);
        }
    }
}
