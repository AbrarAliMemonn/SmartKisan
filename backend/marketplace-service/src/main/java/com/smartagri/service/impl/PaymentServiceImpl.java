package com.smartagri.service.impl;

import com.smartagri.dto.request.PaymentDecisionRequest;
import com.smartagri.dto.request.PaymentSubmitRequest;
import com.smartagri.dto.response.PaymentAccountResponse;
import com.smartagri.dto.response.PaymentResponse;
import com.smartagri.entity.*;
import com.smartagri.exception.BadRequestException;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.exception.UnauthorizedException;
import com.smartagri.kafka.NotificationProducer;
import com.smartagri.kafka.event.NotificationEvent;
import com.smartagri.repository.OrderRepository;
import com.smartagri.repository.PaymentAccountRepository;
import com.smartagri.repository.PaymentRepository;
import com.smartagri.repository.SellerProfileRepository;
import com.smartagri.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentAccountRepository paymentAccountRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final OrderRepository orderRepository;
    private final NotificationProducer notificationProducer;

    @Override
    @Transactional
    public PaymentResponse createForOrder(Order order, PaymentMethod method, Long paymentAccountId,
                                           String transactionReference, BigDecimal paidAmount, String paymentProofUrl) {
        PaymentAccount account = null;
        if (paymentAccountId != null) {
            account = paymentAccountRepository.findById(paymentAccountId)
                    .filter(PaymentAccount::isActive)
                    .orElseThrow(() -> new BadRequestException("Selected payment account is not available"));
        }

        PaymentStatus status;
        if (method == PaymentMethod.CASH_ON_DELIVERY) {
            status = PaymentStatus.PAYMENT_PENDING;
        } else if (StringUtils.hasText(transactionReference)) {
            status = PaymentStatus.PAYMENT_PENDING_VERIFICATION;
        } else {
            status = PaymentStatus.PAYMENT_PENDING;
        }

        Payment payment = Payment.builder()
                .order(order)
                .buyerId(order.getBuyerId())
                .sellerId(order.getSeller().getId())
                .method(method)
                .status(status)
                .amount(order.getTotalAmount())
                .transactionReference(method == PaymentMethod.CASH_ON_DELIVERY ? null : transactionReference)
                .paidAmount(method == PaymentMethod.CASH_ON_DELIVERY ? null : paidAmount)
                .paymentProofUrl(method == PaymentMethod.CASH_ON_DELIVERY ? null : paymentProofUrl)
                .paymentAccount(account)
                .build();
        payment = paymentRepository.save(payment);

        if (status == PaymentStatus.PAYMENT_PENDING_VERIFICATION) {
            notifySeller(order, "New payment pending", "A buyer submitted payment info for order #" + order.getId());
        } else if (method != PaymentMethod.CASH_ON_DELIVERY) {
            notifySeller(order, "New order awaiting payment", "Order #" + order.getId() + " is awaiting the buyer's manual payment");
        } else {
            notifySeller(order, "New order (COD)", "Order #" + order.getId() + " was placed with cash on delivery");
        }

        return toResponse(payment);
    }

    @Override
    public PaymentResponse getByOrderId(Long orderId, Long requestingUserId) {
        Payment payment = getByOrderOrThrow(orderId);
        Order order = payment.getOrder();
        boolean isBuyer = order.getBuyerId().equals(requestingUserId);
        boolean isSeller = order.getSeller().getUserId().equals(requestingUserId);
        if (!isBuyer && !isSeller) {
            throw new UnauthorizedException("You are not a participant in this order's payment");
        }
        return toResponse(payment);
    }

    @Override
    public List<PaymentResponse> getMyPayments(Long buyerId) {
        return paymentRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public PaymentResponse submitPaymentInfo(Long orderId, Long buyerId, PaymentSubmitRequest request) {
        Payment payment = getByOrderOrThrow(orderId);
        if (!payment.getBuyerId().equals(buyerId)) {
            throw new UnauthorizedException("This is not your order");
        }
        if (payment.getMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            throw new BadRequestException("Cash on delivery orders do not require a transaction reference");
        }
        if (payment.getStatus() != PaymentStatus.PAYMENT_PENDING && payment.getStatus() != PaymentStatus.PAYMENT_REJECTED) {
            throw new BadRequestException("Payment information has already been submitted for this order");
        }

        if (request.getPaymentAccountId() != null) {
            PaymentAccount account = paymentAccountRepository.findById(request.getPaymentAccountId())
                    .filter(PaymentAccount::isActive)
                    .orElseThrow(() -> new BadRequestException("Selected payment account is not available"));
            payment.setPaymentAccount(account);
        }
        payment.setTransactionReference(request.getTransactionReference());
        payment.setPaidAmount(request.getPaidAmount());
        payment.setPaymentProofUrl(request.getPaymentProofUrl());
        payment.setRejectionReason(null);
        payment.setStatus(PaymentStatus.PAYMENT_PENDING_VERIFICATION);
        payment = paymentRepository.save(payment);

        notifySeller(payment.getOrder(), "Payment submitted",
                "Buyer submitted payment reference for order #" + payment.getOrder().getId());

        return toResponse(payment);
    }

    @Override
    @Transactional
    public PaymentResponse approve(Long orderId, Long actingUserId, boolean isAdmin) {
        Payment payment = getByOrderOrThrow(orderId);
        Order order = payment.getOrder();

        if (payment.getBuyerId().equals(actingUserId) && !isAdmin) {
            throw new UnauthorizedException("You cannot approve your own payment");
        }
        if (!isAdmin && !order.getSeller().getUserId().equals(actingUserId)) {
            throw new UnauthorizedException("Only the seller or an admin can approve this payment");
        }
        if (payment.getMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            throw new BadRequestException("Cash on delivery payments are settled on delivery, not manually approved");
        }
        if (payment.getStatus() != PaymentStatus.PAYMENT_PENDING_VERIFICATION) {
            throw new BadRequestException("Only payments pending verification can be approved");
        }

        payment.setStatus(PaymentStatus.PAYMENT_VERIFIED);
        payment.setVerifiedBy(actingUserId);
        payment.setVerificationTimestamp(Instant.now());
        payment = paymentRepository.save(payment);

        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
        }

        notifyBuyer(order, "Payment approved", "Your payment for order #" + order.getId() + " has been verified");

        return toResponse(payment);
    }

    @Override
    @Transactional
    public PaymentResponse reject(Long orderId, Long actingUserId, boolean isAdmin, PaymentDecisionRequest request) {
        Payment payment = getByOrderOrThrow(orderId);
        Order order = payment.getOrder();

        if (payment.getBuyerId().equals(actingUserId) && !isAdmin) {
            throw new UnauthorizedException("You cannot reject your own payment");
        }
        if (!isAdmin && !order.getSeller().getUserId().equals(actingUserId)) {
            throw new UnauthorizedException("Only the seller or an admin can reject this payment");
        }
        if (payment.getStatus() != PaymentStatus.PAYMENT_PENDING_VERIFICATION) {
            throw new BadRequestException("Only payments pending verification can be rejected");
        }

        payment.setStatus(PaymentStatus.PAYMENT_REJECTED);
        payment.setRejectionReason(request.getReason());
        payment = paymentRepository.save(payment);

        notifyBuyer(order, "Payment rejected",
                "Your payment for order #" + order.getId() + " was rejected"
                        + (StringUtils.hasText(request.getReason()) ? ": " + request.getReason() : "")
                        + ". You may resubmit payment information.");

        return toResponse(payment);
    }

    @Override
    @Transactional
    public void markCodPaidOnDelivery(Long orderId) {
        paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
            if (payment.getMethod() == PaymentMethod.CASH_ON_DELIVERY && payment.getStatus() == PaymentStatus.PAYMENT_PENDING) {
                payment.setStatus(PaymentStatus.PAYMENT_PAID);
                paymentRepository.save(payment);
            }
        });
    }

    @Override
    public List<PaymentResponse> getPendingForSeller(Long sellerUserId) {
        SellerProfile seller = sellerProfileRepository.findByUserId(sellerUserId)
                .orElseThrow(() -> new BadRequestException("You are not registered as a seller"));
        return paymentRepository.findBySellerIdAndStatusOrderByCreatedAtDesc(seller.getId(), PaymentStatus.PAYMENT_PENDING_VERIFICATION)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<PaymentResponse> getPendingForAdmin() {
        return paymentRepository.findByStatusOrderByCreatedAtDesc(PaymentStatus.PAYMENT_PENDING_VERIFICATION)
                .stream().map(this::toResponse).toList();
    }

    // --- helpers ---

    private Payment getByOrderOrThrow(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("No payment record found for order: " + orderId));
    }

    private void notifySeller(Order order, String title, String message) {
        notificationProducer.publish(NotificationEvent.builder()
                .userId(order.getSeller().getUserId())
                .title(title)
                .message(message)
                .type("INFO")
                .timestamp(Instant.now())
                .build());
    }

    private void notifyBuyer(Order order, String title, String message) {
        notificationProducer.publish(NotificationEvent.builder()
                .userId(order.getBuyerId())
                .title(title)
                .message(message)
                .type("INFO")
                .timestamp(Instant.now())
                .build());
    }

    private PaymentResponse toResponse(Payment p) {
        PaymentAccountResponse accountResponse = null;
        if (p.getPaymentAccount() != null) {
            PaymentAccount a = p.getPaymentAccount();
            accountResponse = PaymentAccountResponse.builder()
                    .id(a.getId())
                    .ownerUserId(a.getOwnerUserId())
                    .type(a.getType().name())
                    .accountTitle(a.getAccountTitle())
                    .accountNumber(a.getAccountNumber())
                    .bankName(a.getBankName())
                    .iban(a.getIban())
                    .active(a.isActive())
                    .build();
        }
        return PaymentResponse.builder()
                .id(p.getId())
                .orderId(p.getOrder().getId())
                .method(p.getMethod().name())
                .status(p.getStatus().name())
                .amount(p.getAmount())
                .transactionReference(p.getTransactionReference())
                .paidAmount(p.getPaidAmount())
                .paymentProofUrl(p.getPaymentProofUrl())
                .paymentAccount(accountResponse)
                .verifiedBy(p.getVerifiedBy())
                .verificationTimestamp(p.getVerificationTimestamp())
                .rejectionReason(p.getRejectionReason())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
