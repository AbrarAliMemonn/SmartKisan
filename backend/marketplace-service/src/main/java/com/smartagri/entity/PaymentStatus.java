package com.smartagri.entity;

public enum PaymentStatus {
    /** COD placed, or manual method chosen but buyer hasn't submitted transfer details yet. */
    PAYMENT_PENDING,
    /** Buyer submitted transaction reference/proof for a manual method; awaiting seller/admin review. */
    PAYMENT_PENDING_VERIFICATION,
    /** Seller/admin confirmed the manual transfer was received. */
    PAYMENT_VERIFIED,
    /** Seller/admin rejected the submitted payment info; buyer may resubmit. */
    PAYMENT_REJECTED,
    /** Payment fully settled (COD collected on delivery, or verified manual payment). */
    PAYMENT_PAID
}
