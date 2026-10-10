package com.smartagri.service.impl;

import com.smartagri.dto.request.AddCartItemRequest;
import com.smartagri.dto.request.UpdateCartItemRequest;
import com.smartagri.dto.response.CartItemResponse;
import com.smartagri.dto.response.CartResponse;
import com.smartagri.dto.response.CartSellerGroupResponse;
import com.smartagri.entity.Cart;
import com.smartagri.entity.CartItem;
import com.smartagri.entity.Product;
import com.smartagri.entity.ProductStatus;
import com.smartagri.exception.BadRequestException;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.repository.CartRepository;
import com.smartagri.repository.ProductRepository;
import com.smartagri.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    @Override
    public CartResponse getCart(Long buyerId) {
        return toResponse(getOrCreateCart(buyerId));
    }

    @Override
    @Transactional
    public CartResponse addItem(Long buyerId, AddCartItemRequest request) {
        Cart cart = getOrCreateCart(buyerId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (product.getStatus() != ProductStatus.APPROVED) {
            throw new BadRequestException("This product is not currently available for purchase");
        }

        CartItem existing = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(product.getId()))
                .findFirst().orElse(null);

        int desiredQuantity = (existing != null ? existing.getQuantity() : 0) + request.getQuantity();
        if (desiredQuantity > product.getStock()) {
            throw new BadRequestException("Only " + product.getStock() + " units of " + product.getTitle() + " are available");
        }

        if (existing != null) {
            existing.setQuantity(desiredQuantity);
        } else {
            cart.addItem(CartItem.builder().product(product).quantity(request.getQuantity()).build());
        }

        return toResponse(cartRepository.save(cart));
    }

    @Override
    @Transactional
    public CartResponse updateItem(Long buyerId, Long productId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCart(buyerId);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Product not in cart: " + productId));

        if (request.getQuantity() > item.getProduct().getStock()) {
            throw new BadRequestException("Only " + item.getProduct().getStock() + " units are available");
        }
        item.setQuantity(request.getQuantity());
        return toResponse(cartRepository.save(cart));
    }

    @Override
    @Transactional
    public CartResponse removeItem(Long buyerId, Long productId) {
        Cart cart = getOrCreateCart(buyerId);
        cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        return toResponse(cartRepository.save(cart));
    }

    @Override
    @Transactional
    public CartResponse clear(Long buyerId) {
        Cart cart = getOrCreateCart(buyerId);
        cart.getItems().clear();
        return toResponse(cartRepository.save(cart));
    }

    private Cart getOrCreateCart(Long buyerId) {
        return cartRepository.findByBuyerId(buyerId)
                .orElseGet(() -> cartRepository.save(Cart.builder().buyerId(buyerId).items(new ArrayList<>()).build()));
    }

    private CartResponse toResponse(Cart cart) {
        Map<Long, List<CartItem>> bySeller = new LinkedHashMap<>();
        for (CartItem item : cart.getItems()) {
            bySeller.computeIfAbsent(item.getProduct().getSeller().getId(), k -> new ArrayList<>()).add(item);
        }

        List<CartSellerGroupResponse> groups = new ArrayList<>();
        BigDecimal grandSubtotal = BigDecimal.ZERO;
        int itemCount = 0;

        for (Map.Entry<Long, List<CartItem>> entry : bySeller.entrySet()) {
            List<CartItemResponse> itemResponses = new ArrayList<>();
            BigDecimal sellerSubtotal = BigDecimal.ZERO;
            String sellerName = entry.getValue().get(0).getProduct().getSeller().getShopName();

            for (CartItem item : entry.getValue()) {
                Product product = item.getProduct();
                BigDecimal unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

                boolean purchasable = product.getStatus() == ProductStatus.APPROVED && product.getStock() >= item.getQuantity();
                String reason = null;
                if (product.getStatus() != ProductStatus.APPROVED) {
                    reason = "Product is no longer available";
                } else if (product.getStock() < item.getQuantity()) {
                    reason = "Only " + product.getStock() + " left in stock";
                }

                itemResponses.add(CartItemResponse.builder()
                        .id(item.getId())
                        .productId(product.getId())
                        .title(product.getTitle())
                        .imageUrl(product.getImageUrl())
                        .unitPrice(unitPrice)
                        .quantity(item.getQuantity())
                        .availableStock(product.getStock())
                        .lineTotal(lineTotal)
                        .purchasable(purchasable)
                        .unavailableReason(reason)
                        .build());

                sellerSubtotal = sellerSubtotal.add(lineTotal);
                itemCount += item.getQuantity();
            }

            groups.add(CartSellerGroupResponse.builder()
                    .sellerId(entry.getKey())
                    .sellerShopName(sellerName)
                    .items(itemResponses)
                    .subtotal(sellerSubtotal)
                    .build());

            grandSubtotal = grandSubtotal.add(sellerSubtotal);
        }

        return CartResponse.builder()
                .sellers(groups)
                .itemCount(itemCount)
                .grandSubtotal(grandSubtotal)
                .build();
    }
}
