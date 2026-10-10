package com.smartagri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentAccountRequest {

    /** EASYPAISA / JAZZCASH / BANK_TRANSFER */
    @NotBlank(message = "Payment account type is required")
    private String type;

    @NotBlank(message = "Account title is required")
    private String accountTitle;

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    private String bankName;

    private String iban;
}
