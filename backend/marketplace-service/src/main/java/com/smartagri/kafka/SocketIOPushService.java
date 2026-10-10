package com.smartagri.kafka;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.smartagri.kafka.event.NotificationEvent;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bridges Kafka-driven notification events to connected Socket.IO clients.
 * Clients are expected to connect with a "userId" query param
 * (e.g. ws://host:port/socket.io/?userId=42) so we know which socket to
 * push an alert to.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SocketIOPushService {

    private final SocketIOServer socketIOServer;

    private final Map<Long, SocketIOClient> connectedUsers = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        socketIOServer.addConnectListener(client -> {
            Long userId = extractUserId(client);
            if (userId != null) {
                connectedUsers.put(userId, client);
                log.debug("Socket client connected for user {}", userId);
            } else {
                log.debug("Socket client connected as guest/anonymous");
            }
        });

        socketIOServer.addDisconnectListener(client -> {
            connectedUsers.values().remove(client);
            log.debug("Socket client disconnected");
        });
    }

    public void broadcastAlert(NotificationEvent event) {
        SocketIOClient client = connectedUsers.get(event.getUserId());
        if (client != null) {
            client.sendEvent("notification", event);
        } else {
            log.debug("No active socket connection for user {}; notification not delivered live", event.getUserId());
        }
    }

    public void pushChatMessage(Long recipientId, Object message) {
        SocketIOClient client = connectedUsers.get(recipientId);
        if (client != null) {
            client.sendEvent("chat_message", message);
            log.debug("Live chat message sent to user {}", recipientId);
        } else {
            log.debug("User {} not currently connected via Socket.IO; message stored in DB", recipientId);
        }
    }

    public void broadcastSensorData(Object sensorData) {
        socketIOServer.getBroadcastOperations().sendEvent("sensor-data", sensorData);
    }

    private Long extractUserId(SocketIOClient client) {
        String raw = client.getHandshakeData().getSingleUrlParam("userId");
        if (raw == null) {
            return null;
        }
        try {
            return Long.valueOf(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
