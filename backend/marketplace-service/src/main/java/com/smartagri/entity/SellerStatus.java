package com.smartagri.entity;

/** Admin-managed approval workflow for seller accounts (spec section 4). */
public enum SellerStatus {
    PENDING,
    APPROVED,
    REJECTED,
    SUSPENDED
}
