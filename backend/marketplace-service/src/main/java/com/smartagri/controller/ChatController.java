package com.smartagri.controller;

import com.smartagri.dto.request.ChatMessageRequest;
import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.ChatConversationSummary;
import com.smartagri.dto.response.ChatMessageResponse;
import com.smartagri.security.UserPrincipal;
import com.smartagri.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marketplace/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/send")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ChatMessageResponse> sendMessage(@Valid @RequestBody ChatMessageRequest request,
                                                        @AuthenticationPrincipal UserPrincipal principal) {
        String role = principal.getAuthorities().stream().findFirst().map(Object::toString).orElse("USER");
        ChatMessageResponse response = chatService.sendMessage(principal.getId(), principal.getName(), role, request);
        return ApiResponse.success("Message sent successfully", response);
    }

    @GetMapping("/history")
    public ApiResponse<List<ChatMessageResponse>> getHistory(@RequestParam Long recipientId,
                                                             @RequestParam(required = false) Long productId,
                                                             @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(chatService.getHistory(principal.getId(), recipientId, productId));
    }

    @GetMapping("/conversations")
    public ApiResponse<List<ChatConversationSummary>> getConversations(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(chatService.getConversations(principal.getId()));
    }

    @PatchMapping("/read/{id}")
    public ApiResponse<Void> markAsRead(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        chatService.markAsRead(id, principal.getId());
        return ApiResponse.message("Message marked as read");
    }
}
