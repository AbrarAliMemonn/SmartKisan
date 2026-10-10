package com.smartagri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {

    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    private String recipientName;

    private Long productId;

    private String productTitle;

    private String productImage;

    @NotBlank(message = "Message text cannot be empty")
    private String message;

    private BigDecimal offerPrice;
}
