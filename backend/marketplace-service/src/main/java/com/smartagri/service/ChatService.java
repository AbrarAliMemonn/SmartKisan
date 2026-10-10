package com.smartagri.service;

import com.smartagri.dto.request.ChatMessageRequest;
import com.smartagri.dto.response.ChatConversationSummary;
import com.smartagri.dto.response.ChatMessageResponse;

import java.util.List;

public interface ChatService {
    ChatMessageResponse sendMessage(Long senderId, String senderName, String senderRole, ChatMessageRequest request);
    List<ChatMessageResponse> getHistory(Long userId, Long otherUserId, Long productId);
    List<ChatConversationSummary> getConversations(Long userId);
    void markAsRead(Long messageId, Long userId);
}
