package com.smartagri.service.impl;

import com.smartagri.entity.OtpPurpose;
import com.smartagri.entity.OtpToken;
import com.smartagri.exception.BadRequestException;
import com.smartagri.exception.TooManyRequestsException;
import com.smartagri.kafka.OtpEmailProducer;
import com.smartagri.repository.OtpTokenRepository;
import com.smartagri.service.EmailService;
import com.smartagri.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int OTP_LENGTH = 6;

    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    /** Present only when app.kafka.enabled=true; otherwise mail is sent directly. */
    private final ObjectProvider<OtpEmailProducer> otpEmailProducer;

    @Value("${app.otp.expiry-minutes:5}")
    private long expiryMinutes;

    @Value("${app.otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.otp.resend-cooldown-seconds:60}")
    private long resendCooldownSeconds;

    @Override
    @Transactional
    public void generateAndSend(String email, OtpPurpose purpose) {
        Instant now = Instant.now();

        otpTokenRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose).ifPresent(last -> {
            Instant nextAllowed = last.getCreatedAt().plusSeconds(resendCooldownSeconds);
            if (nextAllowed.isAfter(now)) {
                long wait = Duration.between(now, nextAllowed).toSeconds() + 1;
                throw new TooManyRequestsException("Please wait " + wait + " seconds before requesting a new OTP");
            }
        });

        otpTokenRepository.deleteByEmailAndPurpose(email, purpose);

        String otp = generateOtp();
        otpTokenRepository.save(OtpToken.builder()
                .email(email)
                .purpose(purpose)
                .otpHash(passwordEncoder.encode(otp))
                .attempts(0)
                .createdAt(now)
                .expiresAt(now.plus(Duration.ofMinutes(expiryMinutes)))
                .build());

        OtpEmailProducer producer = otpEmailProducer.getIfAvailable();
        if (producer != null) {
            // Kafka: published after commit, mail is sent asynchronously by the consumer.
            producer.publish(email, otp, purpose, expiryMinutes);
        } else {
            // Direct SMTP: if sending fails the whole transaction (incl. the OTP row) is rolled back.
            emailService.sendOtpEmail(email, otp, purpose, expiryMinutes);
        }
    }

    /**
     * noRollbackFor: failed-attempt counters and expired-OTP cleanup must be
     * persisted even though a BadRequestException is thrown.
     */
    @Override
    @Transactional(noRollbackFor = BadRequestException.class)
    public void verify(String email, OtpPurpose purpose, String otp) {
        OtpToken token = otpTokenRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new BadRequestException("Invalid or expired OTP"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            otpTokenRepository.delete(token);
            throw new BadRequestException("OTP has expired. Please request a new one");
        }

        if (token.getAttempts() >= maxAttempts) {
            otpTokenRepository.delete(token);
            throw new BadRequestException("Too many incorrect attempts. Please request a new OTP");
        }

        if (otp == null || !passwordEncoder.matches(otp, token.getOtpHash())) {
            token.setAttempts(token.getAttempts() + 1);
            otpTokenRepository.save(token);
            throw new BadRequestException("Invalid OTP");
        }

        otpTokenRepository.delete(token);
    }

    private String generateOtp() {
        StringBuilder sb = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}
