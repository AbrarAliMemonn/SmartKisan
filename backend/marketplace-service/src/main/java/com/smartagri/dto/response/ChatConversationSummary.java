package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatConversationSummary {
    private Long otherUserId;
    private String otherUserName;
    private Long productId;
    private String productTitle;
    private String productImage;
    private String lastMessage;
    private Instant lastMessageAt;
    private long unreadCount;
}
