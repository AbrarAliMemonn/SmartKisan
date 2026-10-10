package com.smartagri.kafka;

import com.smartagri.entity.OtpPurpose;
import com.smartagri.kafka.event.OtpEmailEvent;
import com.smartagri.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/** Sends the OTP mails requested through Kafka. A thrown exception triggers the retry policy in KafkaConfig. */
@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class OtpEmailConsumer {

    private final EmailService emailService;

    @KafkaListener(topics = "${app.kafka.topics.otp-email}", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(OtpEmailEvent event) {
        log.debug("Received OTP email event for {}", event.getEmail());
        emailService.sendOtpEmail(event.getEmail(), event.getOtp(),
                OtpPurpose.valueOf(event.getPurpose()), event.getValidMinutes());
    }
}
