package com.smartagri.service.impl;

import com.smartagri.dto.request.ChatMessageRequest;
import com.smartagri.dto.response.ChatConversationSummary;
import com.smartagri.dto.response.ChatMessageResponse;
import com.smartagri.entity.ChatMessage;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.kafka.SocketIOPushService;
import com.smartagri.repository.ChatMessageRepository;
import com.smartagri.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final SocketIOPushService socketIOPushService;

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(Long senderId, String senderName, String senderRole, ChatMessageRequest request) {
        ChatMessage message = ChatMessage.builder()
                .senderId(senderId)
                .senderName(senderName)
                .senderRole(senderRole != null ? senderRole : "USER")
                .recipientId(request.getRecipientId())
                .recipientName(request.getRecipientName())
                .productId(request.getProductId())
                .productTitle(request.getProductTitle())
                .productImage(request.getProductImage())
                .message(request.getMessage())
                .offerPrice(request.getOfferPrice())
                .isRead(false)
                .build();

        message = chatMessageRepository.save(message);

        ChatMessageResponse response = toResponse(message);

        // Push live via Socket.IO to recipient
        try {
            socketIOPushService.pushChatMessage(request.getRecipientId(), response);
        } catch (Exception e) {
            log.warn("Failed to push chat message via socket: {}", e.getMessage());
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getHistory(Long userId, Long otherUserId, Long productId) {
        List<ChatMessage> messages;
        if (productId != null) {
            messages = chatMessageRepository.findProductChatHistory(userId, otherUserId, productId);
        } else {
            messages = chatMessageRepository.findChatHistory(userId, otherUserId);
        }
        return messages.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatConversationSummary> getConversations(Long userId) {
        List<ChatMessage> allMessages = chatMessageRepository.findAllForUser(userId);

        Map<String, ChatConversationSummary> summaryMap = new LinkedHashMap<>();

        for (ChatMessage msg : allMessages) {
            Long otherUserId = msg.getSenderId().equals(userId) ? msg.getRecipientId() : msg.getSenderId();
            String otherUserName = msg.getSenderId().equals(userId) ? msg.getRecipientName() : msg.getSenderName();
            Long productId = msg.getProductId();

            String key = otherUserId + "_" + (productId != null ? productId : 0);

            if (!summaryMap.containsKey(key)) {
                long unreadCount = allMessages.stream()
                        .filter(m -> m.getRecipientId().equals(userId) &&
                                     m.getSenderId().equals(otherUserId) &&
                                     Objects.equals(m.getProductId(), productId) &&
                                     !m.isRead())
                        .count();

                summaryMap.put(key, ChatConversationSummary.builder()
                        .otherUserId(otherUserId)
                        .otherUserName(otherUserName != null ? otherUserName : "User #" + otherUserId)
                        .productId(productId)
                        .productTitle(msg.getProductTitle())
                        .productImage(msg.getProductImage())
                        .lastMessage(msg.getMessage())
                        .lastMessageAt(msg.getCreatedAt())
                        .unreadCount(unreadCount)
                        .build());
            }
        }

        return new ArrayList<>(summaryMap.values());
    }

    @Override
    @Transactional
    public void markAsRead(Long messageId, Long userId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
        if (message.getRecipientId().equals(userId)) {
            message.setRead(true);
            chatMessageRepository.save(message);
        }
    }

    private ChatMessageResponse toResponse(ChatMessage msg) {
        return ChatMessageResponse.builder()
                .id(msg.getId())
                .senderId(msg.getSenderId())
                .senderName(msg.getSenderName())
                .senderRole(msg.getSenderRole())
                .recipientId(msg.getRecipientId())
                .recipientName(msg.getRecipientName())
                .productId(msg.getProductId())
                .productTitle(msg.getProductTitle())
                .productImage(msg.getProductImage())
                .message(msg.getMessage())
                .offerPrice(msg.getOfferPrice())
                .isRead(msg.isRead())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
