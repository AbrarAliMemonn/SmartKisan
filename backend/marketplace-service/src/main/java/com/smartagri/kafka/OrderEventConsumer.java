package com.smartagri.kafka;

import com.smartagri.kafka.event.NotificationEvent;
import com.smartagri.kafka.event.OrderEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

/** Reacts to order lifecycle events by generating buyer/seller notifications. */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventConsumer {

    private final NotificationProducer notificationProducer;

    @KafkaListener(topics = "${app.kafka.topics.order-events}", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(OrderEvent event) {
        log.info("Order event received: order={} status={}", event.getOrderId(), event.getStatus());

        notificationProducer.publish(NotificationEvent.builder()
                .userId(event.getBuyerId())
                .title("Order " + event.getStatus())
                .message("Your order #" + event.getOrderId() + " is now " + event.getStatus())
                .type("INFO")
                .timestamp(Instant.now())
                .build());
    }
}
