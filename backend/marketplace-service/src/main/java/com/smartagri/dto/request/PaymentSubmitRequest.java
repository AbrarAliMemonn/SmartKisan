package com.smartagri.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentSubmitRequest {

    @NotBlank(message = "Transaction/reference number is required")
    private String transactionReference;

    @NotNull(message = "Paid amount is required")
    private BigDecimal paidAmount;

    private String paymentProofUrl;

    private Long paymentAccountId;
}
