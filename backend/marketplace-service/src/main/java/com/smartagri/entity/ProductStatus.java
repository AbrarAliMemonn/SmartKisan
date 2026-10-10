package com.smartagri.entity;

/**
 * Product lifecycle / moderation workflow (spec section 1).
 * Replaces the previous ACTIVE/INACTIVE/SOLD_OUT set with a full
 * seller-listing -> admin-moderation -> stock lifecycle.
 */
public enum ProductStatus {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    OUT_OF_STOCK,
    SUSPENDED
}
