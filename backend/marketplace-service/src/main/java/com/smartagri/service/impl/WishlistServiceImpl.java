package com.smartagri.service.impl;

import com.smartagri.dto.request.AddCartItemRequest;
import com.smartagri.dto.response.WishlistItemResponse;
import com.smartagri.entity.Product;
import com.smartagri.entity.ProductStatus;
import com.smartagri.entity.Wishlist;
import com.smartagri.entity.WishlistItem;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.repository.ProductRepository;
import com.smartagri.repository.WishlistRepository;
import com.smartagri.service.CartService;
import com.smartagri.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;

    @Override
    public List<WishlistItemResponse> getWishlist(Long buyerId) {
        return toResponse(getOrCreate(buyerId));
    }

    @Override
    @Transactional
    public List<WishlistItemResponse> addItem(Long buyerId, Long productId) {
        Wishlist wishlist = getOrCreate(buyerId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        boolean alreadyThere = wishlist.getItems().stream().anyMatch(i -> i.getProduct().getId().equals(productId));
        if (!alreadyThere) {
            wishlist.addItem(WishlistItem.builder().product(product).build());
            wishlistRepository.save(wishlist);
        }
        return toResponse(wishlist);
    }

    @Override
    @Transactional
    public List<WishlistItemResponse> removeItem(Long buyerId, Long productId) {
        Wishlist wishlist = getOrCreate(buyerId);
        wishlist.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        wishlistRepository.save(wishlist);
        return toResponse(wishlist);
    }

    @Override
    public boolean isInWishlist(Long buyerId, Long productId) {
        return wishlistRepository.findByBuyerId(buyerId)
                .map(w -> w.getItems().stream().anyMatch(i -> i.getProduct().getId().equals(productId)))
                .orElse(false);
    }

    @Override
    @Transactional
    public List<WishlistItemResponse> moveToCart(Long buyerId, Long productId) {
        AddCartItemRequest request = new AddCartItemRequest();
        request.setProductId(productId);
        request.setQuantity(1);
        cartService.addItem(buyerId, request);
        return removeItem(buyerId, productId);
    }

    private Wishlist getOrCreate(Long buyerId) {
        return wishlistRepository.findByBuyerId(buyerId)
                .orElseGet(() -> wishlistRepository.save(Wishlist.builder().buyerId(buyerId).items(new ArrayList<>()).build()));
    }

    private List<WishlistItemResponse> toResponse(Wishlist wishlist) {
        return wishlist.getItems().stream().map(item -> {
            Product p = item.getProduct();
            return WishlistItemResponse.builder()
                    .productId(p.getId())
                    .title(p.getTitle())
                    .imageUrl(p.getImageUrl())
                    .price(p.getPrice())
                    .discountPrice(p.getDiscountPrice())
                    .available(p.getStatus() == ProductStatus.APPROVED && p.getStock() > 0)
                    .addedAt(item.getAddedAt())
                    .build();
        }).toList();
    }
}
