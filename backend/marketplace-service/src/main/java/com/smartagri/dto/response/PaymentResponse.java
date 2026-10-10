package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private String method;
    private String status;
    private BigDecimal amount;
    private String transactionReference;
    private BigDecimal paidAmount;
    private String paymentProofUrl;
    private PaymentAccountResponse paymentAccount;
    private Long verifiedBy;
    private Instant verificationTimestamp;
    private String rejectionReason;
    private Instant createdAt;
}
