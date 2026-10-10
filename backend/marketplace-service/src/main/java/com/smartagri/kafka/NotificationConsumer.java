package com.smartagri.kafka;

import com.smartagri.kafka.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/** Pushes notification events out to connected clients in real time. */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final SocketIOPushService socketIOPushService;

    @KafkaListener(topics = "${app.kafka.topics.notifications}", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(NotificationEvent event) {
        socketIOPushService.broadcastAlert(event);
        log.debug("Notification delivered to user {}: {}", event.getUserId(), event.getTitle());
    }
}
