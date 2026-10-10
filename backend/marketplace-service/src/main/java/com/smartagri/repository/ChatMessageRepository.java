package com.smartagri.repository;

import com.smartagri.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "((m.senderId = :user1 AND m.recipientId = :user2) OR " +
           "(m.senderId = :user2 AND m.recipientId = :user1)) " +
           "ORDER BY m.createdAt ASC")
    List<ChatMessage> findChatHistory(@Param("user1") Long user1, @Param("user2") Long user2);

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "((m.senderId = :user1 AND m.recipientId = :user2) OR " +
           "(m.senderId = :user2 AND m.recipientId = :user1)) AND " +
           "m.productId = :productId " +
           "ORDER BY m.createdAt ASC")
    List<ChatMessage> findProductChatHistory(@Param("user1") Long user1, @Param("user2") Long user2, @Param("productId") Long productId);

    @Query("SELECT m FROM ChatMessage m WHERE m.senderId = :userId OR m.recipientId = :userId ORDER BY m.createdAt DESC")
    List<ChatMessage> findAllForUser(@Param("userId") Long userId);
}
