package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentAccountResponse {
    private Long id;
    private Long ownerUserId;
    private String type;
    private String accountTitle;
    private String accountNumber;
    private String bankName;
    private String iban;
    private boolean active;
}
