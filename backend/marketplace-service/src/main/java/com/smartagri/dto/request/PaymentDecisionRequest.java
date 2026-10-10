package com.smartagri.dto.request;

import lombok.Data;

@Data
public class PaymentDecisionRequest {
    /** Required when rejecting; ignored when approving. */
    private String reason;
}
