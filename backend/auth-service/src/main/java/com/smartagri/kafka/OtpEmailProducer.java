package com.smartagri.kafka;

import com.smartagri.entity.OtpPurpose;
import com.smartagri.kafka.event.OtpEmailEvent;
import com.smartagri.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Publishes OTP email requests to Kafka. The publish happens after the
 * surrounding DB transaction commits, so no mail goes out for a rolled back
 * request. If Kafka is unreachable the mail is sent directly over SMTP.
 */
@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true", matchIfMissing = true)
@Slf4j
public class OtpEmailProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final EmailService emailService;
    private final String topic;

    public OtpEmailProducer(KafkaTemplate<String, Object> kafkaTemplate,
                            EmailService emailService,
                            @Value("${app.kafka.topics.otp-email}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.emailService = emailService;
        this.topic = topic;
    }

    public void publish(String email, String otp, OtpPurpose purpose, long validMinutes) {
        OtpEmailEvent event = OtpEmailEvent.builder()
                .email(email)
                .otp(otp)
                .purpose(purpose.name())
                .validMinutes(validMinutes)
                .build();

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send(event);
                }
            });
        } else {
            send(event);
        }
    }

    private void send(OtpEmailEvent event) {
        try {
            kafkaTemplate.send(topic, event.getEmail(), event).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.warn("Kafka publish failed for {} ({}), sending directly", event.getEmail(), ex.getMessage());
                    sendDirect(event);
                }
            });
        } catch (Exception ex) {
            log.warn("Kafka unavailable ({}), sending OTP mail to {} directly", ex.getMessage(), event.getEmail());
            sendDirect(event);
        }
    }

    private void sendDirect(OtpEmailEvent event) {
        try {
            emailService.sendOtpEmail(event.getEmail(), event.getOtp(),
                    OtpPurpose.valueOf(event.getPurpose()), event.getValidMinutes());
        } catch (Exception ex) {
            log.error("Direct OTP mail to {} failed: {}", event.getEmail(), ex.getMessage());
        }
    }
}
