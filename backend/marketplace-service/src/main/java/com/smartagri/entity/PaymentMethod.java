package com.smartagri.entity;

/**
 * Supported payment methods. Intentionally MANUAL only - no paid payment
 * gateway (Stripe/PayPal/Easypaisa API/JazzCash API/bank API) is integrated.
 * EASYPAISA/JAZZCASH/BANK_TRANSFER are manual transfers verified by the
 * seller/admin after the buyer pays out-of-band.
 */
public enum PaymentMethod {
    CASH_ON_DELIVERY,
    EASYPAISA,
    JAZZCASH,
    BANK_TRANSFER
}
