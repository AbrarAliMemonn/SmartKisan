# Marketplace Module — Spring Boot Backend Integration Guide

This document specifies the backend contract the new **Marketplace** feature in the
frontend expects. It's written so a Java/Spring Boot developer can implement the
module and plug it straight into the existing `smart-agri` API without any
frontend changes.

The frontend already calls these endpoints through `src/services/api.js` →
`marketplaceAPI`. Right now the UI runs on local mock data so it's fully
demoable, but every call is shaped to match the contract below — once the
backend is live, only `marketplaceAPI` needs to point at real responses.

---

## 1. Suggested package layout

```
com.smartagri.marketplace
 ├── controller/
 │    ├── ProductController.java
 │    ├── OrderController.java
 │    └── SellerController.java
 ├── dto/
 │    ├── ProductRequest.java
 │    ├── ProductResponse.java
 │    ├── OrderRequest.java
 │    ├── OrderResponse.java
 │    └── SellerRegistrationRequest.java
 ├── entity/
 │    ├── Product.java
 │    ├── Order.java
 │    ├── OrderItem.java
 │    ├── SellerProfile.java
 │    └── ProductReview.java
 ├── repository/
 │    ├── ProductRepository.java
 │    ├── OrderRepository.java
 │    └── SellerProfileRepository.java
 └── service/
      ├── ProductService.java
      ├── OrderService.java
      └── SellerService.java
```

## 2. Entities

```java
@Entity
@Table(name = "seller_profiles")
public class SellerProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;                 // existing User entity

    private String shopName;
    private String description;
    private String location;
    private boolean verified = false;
    private Double rating = 0.0;
    private Integer totalSales = 0;
    private LocalDate joinedAsSellerOn;
}

@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private SellerProfile seller;

    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private ProductCategory category;  // PRODUCE, SEEDS, FERTILIZERS, EQUIPMENT, TOOLS, LIVESTOCK

    private BigDecimal price;
    private String unit;               // kg, quintal, ton, liter, piece, acre, dozen
    private Integer stock;
    private boolean organic = false;
    private boolean negotiable = false;
    private String imageUrl;

    private Double rating = 0.0;
    private Integer reviewsCount = 0;

    @Enumerated(EnumType.STRING)
    private ProductStatus status = ProductStatus.ACTIVE; // ACTIVE, INACTIVE, SOLD_OUT

    private Instant createdAt;
    private Instant updatedAt;
}

@Entity
@Table(name = "orders")
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne @JoinColumn(name = "seller_id", nullable = false)
    private SellerProfile seller;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;
    // PENDING, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED

    private String deliveryAddress;
    private Instant orderDate;
}

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne @JoinColumn(name = "product_id")
    private Product product;

    private Integer quantity;
    private BigDecimal priceAtPurchase;
}
```

> The **cart itself is not persisted server-side** in this design — the React
> app keeps it in memory via Zustand (`useStore.cartItems`) and only calls the
> backend once, at checkout, via `POST /marketplace/orders`. This matches how
> the current mock UI batches cart items by seller before submitting.

## 3. REST endpoints (base path `/api/marketplace`)

All routes sit under the same base path as the rest of the API
(`API_BASE_URL` = `http://localhost:8080/api` by default — see
`src/utils/constants.js`), and go through the existing JWT filter, since
`src/services/api.js` already attaches `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/marketplace/products` | Public | List/search products. Query params: `search`, `category`, `page`, `size` |
| GET | `/marketplace/products/{id}` | Public | Product detail |
| GET | `/marketplace/products/my-listings` | Seller | Products owned by current user |
| POST | `/marketplace/products` | Seller | Create listing |
| PUT | `/marketplace/products/{id}` | Seller (owner) | Update listing |
| DELETE | `/marketplace/products/{id}` | Seller (owner) | Remove listing |
| GET | `/marketplace/categories` | Public | Static category list |
| POST | `/marketplace/sellers/register` | Authenticated | Upgrade the logged-in user to a seller |
| GET | `/marketplace/sellers/{id}` | Public | Seller profile + rating |
| POST | `/marketplace/orders` | Buyer | Place an order (one call per seller group) |
| GET | `/marketplace/orders/my-orders` | Buyer | Orders the current user placed |
| GET | `/marketplace/orders/seller-orders` | Seller | Orders placed against the current seller |
| GET | `/marketplace/orders/{id}` | Buyer/Seller (participant) | Order detail |
| PATCH | `/marketplace/orders/{id}/status` | Seller (owner) | Update order status |
| POST | `/marketplace/products/{id}/reviews` | Buyer | Add a rating/review |

### Sample controller

```java
@RestController
@RequestMapping("/api/marketplace/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public Page<ProductResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.search(search, category, PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public ProductResponse getOne(@PathVariable Long id) {
        return productService.getById(id);
    }

    @GetMapping("/my-listings")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public List<ProductResponse> myListings(@AuthenticationPrincipal UserDetailsImpl principal) {
        return productService.getBySeller(principal.getId());
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> create(
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal UserDetailsImpl principal) {
        ProductResponse created = productService.create(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ProductResponse update(@PathVariable Long id,
                                   @Valid @RequestBody ProductRequest request,
                                   @AuthenticationPrincipal UserDetailsImpl principal) {
        return productService.update(id, request, principal.getId());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserDetailsImpl principal) {
        productService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
```

### Order placement contract

`POST /api/marketplace/orders` — the frontend sends **one order per seller**
(it groups the cart client-side), shaped like this:

```json
{
  "sellerId": 4,
  "items": [
    { "productId": 2, "quantity": 5 },
    { "productId": 8, "quantity": 2 }
  ],
  "deliveryAddress": "12 Farm Road, Nashik, Maharashtra"
}
```

Server should re-price using the current DB price (never trust client-sent
totals), decrement `Product.stock`, and reject if `quantity > stock`.

Response:

```json
{
  "id": 1042,
  "status": "PENDING",
  "totalAmount": 1710.00,
  "items": [
    { "productId": 2, "title": "Hybrid Tomato Seeds", "quantity": 5, "unit": "piece", "price": 250.00 }
  ],
  "orderDate": "2026-07-27T10:15:00Z"
}
```

## 4. Roles & security

Reuse the existing `role` claim on `User` (`admin`, `farmer`, `expert`) and add
a **capability flag** rather than a new role: `SellerProfile` existing for a
user is what makes them a seller (mirrors `isSeller` on the frontend
`AuthContext`). Any authenticated user can call
`POST /marketplace/sellers/register` once to create their `SellerProfile`
row; after that, `@PreAuthorize` checks can test
`principal.hasSellerProfile()` (a custom `UserDetailsImpl` method backed by a
join) instead of introducing a full new role, so a farmer can be both a buyer
and a seller simultaneously — exactly how the UI's Buying/Selling toggle
works.

## 5. Frontend touch points (already wired, no UI change needed)

- `src/services/api.js` → `marketplaceAPI` — all calls above are already stubbed with the right paths/verbs.
- `src/context/AuthContext.jsx` → `becomeSeller()` — currently mocks the response; swap its body to call `marketplaceAPI.becomeSeller()` and merge the returned `sellerProfile` into `user`.
- `src/pages/Marketplace.jsx` — replace the `seedProducts` / `seedOrders` mock arrays with `marketplaceAPI.getProducts()` / `getMyOrders()` / `getSellerOrders()` calls inside a `useEffect`, and swap the local `setProducts`/`setOrders` mutations for the corresponding `marketplaceAPI` calls followed by a refetch.
- `src/store/useStore.js` → `cartItems` stays 100% client-side; only `handleCheckout` in `Marketplace.jsx` needs to call `marketplaceAPI.createOrder()` per seller group instead of pushing to local state.

No other pages, routes, or components need to change.
