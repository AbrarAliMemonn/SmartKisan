package com.smartagri.service.impl;

import com.smartagri.dto.request.OrderItemRequest;
import com.smartagri.dto.request.OrderRequest;
import com.smartagri.dto.request.UpdateOrderStatusRequest;
import com.smartagri.dto.response.OrderItemResponse;
import com.smartagri.dto.response.OrderResponse;
import com.smartagri.dto.response.PaymentResponse;
import com.smartagri.entity.*;
import com.smartagri.exception.BadRequestException;
import com.smartagri.exception.InsufficientStockException;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.exception.UnauthorizedException;
import com.smartagri.kafka.OrderEventProducer;
import com.smartagri.kafka.event.OrderEvent;
import com.smartagri.repository.OrderRepository;
import com.smartagri.repository.PaymentRepository;
import com.smartagri.repository.ProductRepository;
import com.smartagri.repository.SellerProfileRepository;
import com.smartagri.service.CouponService;
import com.smartagri.service.OrderService;
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
public class OrderServiceImpl implements OrderService {

    /** Placeholder flat delivery fee until a real courier/shipping integration exists. Waived by freeDelivery coupons. */
    private static final BigDecimal FLAT_DELIVERY_CHARGE = new BigDecimal("150.00");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PaymentRepository paymentRepository;
    private final OrderEventProducer orderEventProducer;
    private final CouponService couponService;
    private final PaymentService paymentService;

    @Override
    @Transactional
    public OrderResponse createOrder(Long buyerId, OrderRequest request) {
        SellerProfile seller = sellerProfileRepository.findById(request.getSellerId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

        if (seller.getStatus() != SellerStatus.APPROVED) {
            throw new BadRequestException("This seller is not currently active");
        }

        PaymentMethod paymentMethod = parsePaymentMethod(request.getPaymentMethod());

        Order order = Order.builder()
                .buyerId(buyerId)
                .seller(seller)
                .status(OrderStatus.PENDING)
                .deliveryAddress(request.getDeliveryAddress())
                .contactPhone(request.getPhone())
                .city(request.getCity())
                .province(request.getProvince())
                .buyerName(request.getBuyerName())
                .subtotal(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .deliveryCharge(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.getItems()) {
            // Locked/re-fetched inside the same transaction; Product.version guards against
            // a concurrent order oversubscribing the same stock (optimistic locking).
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with id: " + itemRequest.getProductId()));

            if (!product.getSeller().getId().equals(seller.getId())) {
                throw new BadRequestException("Product " + product.getId() + " does not belong to the selected seller");
            }
            if (product.getStatus() != ProductStatus.APPROVED && product.getStatus() != ProductStatus.OUT_OF_STOCK) {
                throw new BadRequestException("Product " + product.getTitle() + " is not currently available for purchase");
            }
            if (itemRequest.getQuantity() <= 0) {
                throw new BadRequestException("Quantity must be greater than zero");
            }
            if (itemRequest.getQuantity() > product.getStock()) {
                throw new InsufficientStockException(
                        "Insufficient stock for " + product.getTitle() + ": requested " + itemRequest.getQuantity()
                                + ", available " + product.getStock());
            }

            // Always re-price using the current DB price; never trust the client.
            BigDecimal unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            product.setStock(product.getStock() - itemRequest.getQuantity());
            if (product.getStock() == 0) product.setStatus(ProductStatus.OUT_OF_STOCK);
            productRepository.save(product);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .priceAtPurchase(unitPrice)
                    .build();
            order.addItem(orderItem);
        }

        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal deliveryCharge = FLAT_DELIVERY_CHARGE;
        if (StringUtils.hasText(request.getCouponCode())) {
            CouponService.CouponResult result = couponService.validateAndApply(request.getCouponCode(), subtotal);
            discount = result.discountAmount();
            if (result.freeDelivery()) {
                deliveryCharge = BigDecimal.ZERO;
            }
            order.setCouponCode(request.getCouponCode().toUpperCase());
        }

        BigDecimal grandTotal = subtotal.subtract(discount).add(deliveryCharge);
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            grandTotal = BigDecimal.ZERO;
        }

        order.setSubtotal(subtotal);
        order.setDiscountAmount(discount);
        order.setDeliveryCharge(deliveryCharge);
        order.setTotalAmount(grandTotal);
        Order saved = orderRepository.save(order);

        PaymentResponse payment = paymentService.createForOrder(
                saved, paymentMethod, request.getPaymentAccountId(),
                request.getTransactionReference(), request.getPaidAmount(), request.getPaymentProofUrl());

        orderEventProducer.publish(OrderEvent.builder()
                .orderId(saved.getId())
                .buyerId(buyerId)
                .sellerId(seller.getId())
                .status(saved.getStatus().name())
                .totalAmount(saved.getTotalAmount())
                .timestamp(Instant.now())
                .build());

        return toResponse(saved, payment);
    }

    @Override
    public List<OrderResponse> getMyOrders(Long buyerId) {
        return orderRepository.findByBuyerIdOrderByOrderDateDesc(buyerId).stream().map(this::toResponse).toList();
    }

    @Override
    public List<OrderResponse> getSellerOrders(Long userId) {
        SellerProfile seller = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("You are not registered as a seller"));
        return orderRepository.findBySellerIdOrderByOrderDateDesc(seller.getId()).stream().map(this::toResponse).toList();
    }

    @Override
    public OrderResponse getById(Long orderId, Long requestingUserId) {
        Order order = getOrderOrThrow(orderId);
        boolean isBuyer = order.getBuyerId().equals(requestingUserId);
        boolean isSeller = order.getSeller().getUserId().equals(requestingUserId);
        if (!isBuyer && !isSeller) {
            throw new UnauthorizedException("You are not a participant in this order");
        }
        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(Long orderId, Long sellerUserId, UpdateOrderStatusRequest request) {
        Order order = getOrderOrThrow(orderId);
        if (!order.getSeller().getUserId().equals(sellerUserId)) {
            throw new UnauthorizedException("Only the seller who owns this order can update its status");
        }

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid order status: " + request.getStatus());
        }

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);

        if (newStatus == OrderStatus.DELIVERED) {
            // COD is only ever marked PAID once delivery actually happens; manual methods are
            // unaffected here since they're settled through the payment-verification flow.
            paymentService.markCodPaidOnDelivery(saved.getId());
        }

        orderEventProducer.publish(OrderEvent.builder()
                .orderId(saved.getId())
                .buyerId(saved.getBuyerId())
                .sellerId(saved.getSeller().getId())
                .status(saved.getStatus().name())
                .totalAmount(saved.getTotalAmount())
                .timestamp(Instant.now())
                .build());

        return toResponse(saved);
    }

    private Order getOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    /**
     * Accepts the canonical enum names plus the shorthand labels a frontend
     * commonly sends ("COD", "CASH", "EASY_PAISA", "BANK"). Without this,
     * a checkout posting paymentMethod="COD" failed with
     * 400 "Invalid payment method: COD" even though the buyer had picked
     * Cash on Delivery.
     */
    private PaymentMethod parsePaymentMethod(String value) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Payment method is required");
        }

        String normalized = value.trim().toUpperCase().replace("-", "_").replace(" ", "_");

        return switch (normalized) {
            case "COD", "CASH", "CASH_ON_DELIVERY", "CASHONDELIVERY", "CASH_ONDELIVERY" ->
                    PaymentMethod.CASH_ON_DELIVERY;
            case "EASYPAISA", "EASY_PAISA" -> PaymentMethod.EASYPAISA;
            case "JAZZCASH", "JAZZ_CASH" -> PaymentMethod.JAZZCASH;
            case "BANK", "BANK_TRANSFER", "BANKTRANSFER", "BANK_TRANSFERS" ->
                    PaymentMethod.BANK_TRANSFER;
            default -> throw new BadRequestException(
                    "Invalid payment method: " + value
                            + ". Allowed: CASH_ON_DELIVERY, EASYPAISA, JAZZCASH, BANK_TRANSFER");
        };
    }

    private OrderResponse toResponse(Order o) {
        PaymentResponse payment = paymentRepository.findByOrderId(o.getId())
                .map(p -> paymentService.getByOrderId(o.getId(), o.getBuyerId()))
                .orElse(null);
        return toResponse(o, payment);
    }

    private OrderResponse toResponse(Order o, PaymentResponse payment) {
        List<OrderItemResponse> items = o.getItems().stream()
                .map(i -> OrderItemResponse.builder()
                        .productId(i.getProduct().getId())
                        .title(i.getProduct().getTitle())
                        .quantity(i.getQuantity())
                        .unit(i.getProduct().getUnit())
                        .price(i.getPriceAtPurchase())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(o.getId())
                .buyerId(o.getBuyerId())
                .sellerId(o.getSeller().getId())
                .sellerShopName(o.getSeller().getShopName())
                .status(o.getStatus().name())
                .subtotal(o.getSubtotal())
                .discountAmount(o.getDiscountAmount())
                .deliveryCharge(o.getDeliveryCharge())
                .totalAmount(o.getTotalAmount())
                .couponCode(o.getCouponCode())
                .deliveryAddress(o.getDeliveryAddress())
                .city(o.getCity())
                .province(o.getProvince())
                .phone(o.getContactPhone())
                .buyerName(o.getBuyerName())
                .items(items)
                .orderDate(o.getOrderDate())
                .payment(payment)
                .build();
    }
}
