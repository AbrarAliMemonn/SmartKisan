package com.smartagri.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderRequest {

    @NotNull(message = "Seller id is required")
    private Long sellerId;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    /**
     * CASH_ON_DELIVERY / EASYPAISA / JAZZCASH / BANK_TRANSFER.
     * Common frontend aliases such as "COD" are also accepted - see
     * OrderServiceImpl.parsePaymentMethod.
     */
    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    /** Optional contact details shown to the seller with the order. */
    private String buyerName;
    private String phone;
    private String city;
    private String province;

    private String couponCode;

    /** Which of the seller's/platform's active receiving accounts the buyer intends to pay into (manual methods only). */
    private Long paymentAccountId;

    // The following let a buyer submit manual-transfer proof at checkout time instead of a separate call.
    // All optional; ignored for CASH_ON_DELIVERY.
    private String transactionReference;
    private BigDecimal paidAmount;
    private String paymentProofUrl;
}
