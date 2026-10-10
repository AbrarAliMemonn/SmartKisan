package com.smartagri.service;

import com.smartagri.dto.request.PaymentDecisionRequest;
import com.smartagri.dto.request.PaymentSubmitRequest;
import com.smartagri.dto.response.PaymentResponse;
import com.smartagri.entity.Order;
import com.smartagri.entity.PaymentMethod;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {

    /** Called once, at checkout, to open the payment record for a freshly-created order. Never marks a manual method as paid. */
    PaymentResponse createForOrder(Order order, PaymentMethod method, Long paymentAccountId,
                                    String transactionReference, BigDecimal paidAmount, String paymentProofUrl);

    PaymentResponse getByOrderId(Long orderId, Long requestingUserId);
    List<PaymentResponse> getMyPayments(Long buyerId);

    /** Buyer submits (or resubmits after a rejection) manual-transfer proof. */
    PaymentResponse submitPaymentInfo(Long orderId, Long buyerId, PaymentSubmitRequest request);

    /** Seller (order owner) or admin confirms the manual transfer arrived. Buyers can never approve their own payment. */
    PaymentResponse approve(Long orderId, Long actingUserId, boolean isAdmin);

    PaymentResponse reject(Long orderId, Long actingUserId, boolean isAdmin, PaymentDecisionRequest request);

    /** Marks a COD payment PAID - called when an order transitions to DELIVERED. */
    void markCodPaidOnDelivery(Long orderId);

    List<PaymentResponse> getPendingForSeller(Long sellerUserId);
    List<PaymentResponse> getPendingForAdmin();
}
