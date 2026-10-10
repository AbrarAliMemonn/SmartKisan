# marketplace-service Upgrade Report

## STEP 2 — What existed before this upgrade

- **Entities:** `Product`, `ProductCategory` (6 values), `ProductReview`, `ProductStatus`
  (ACTIVE/INACTIVE/SOLD_OUT), `SellerProfile`, `Order`, `OrderItem`, `OrderStatus` (6 values).
- **Controllers:** `ProductController`, `SellerController`, `OrderController` — basic
  CRUD + search + reviews + seller registration + order placement/status update.
- **Infra:** JWT verification shared with other services, Kafka order/notification
  events + Socket.IO push, a solid `GlobalExceptionHandler`.
- **Missing entirely:** cart, wishlist, any payment system, coupons, a seller
  approval workflow, admin endpoints, multi-image products, category-specific
  attributes, location fields, returns/disputes/reports, buyer-seller chat.

## STEP 3/4 — Upgrade plan actually implemented

Everything below **extends** the existing package layout/conventions
(`com.smartagri`, `/marketplace/**` routes, `ApiResponse<T>` envelope, the
same JWT/role security model) rather than replacing it.

### Product management & catalog (spec §1–3, 24, 27, 29)
- `ProductStatus` → `DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, OUT_OF_STOCK, SUSPENDED`.
- `ProductCategory` → 9 agricultural categories (Seeds, Fertilizers, Crop
  Protection, Equipment, Irrigation, Smart Farming, Livestock, Farmer Produce, Tools).
- `Product` gained: `subCategory`, `brand`, `sku`, `discountPrice`, `condition`
  (NEW/USED/REFURBISHED), `videoUrl`, multi-image gallery (`ProductImage`),
  a flexible `attributes` map (covers every category's spec §3 attribute list
  without a bespoke table per category), `city/province/country/lat/lng`,
  `expiryDate`, and `@Version` optimistic locking (prevents overselling under
  concurrent orders).
- New products are created `PENDING_APPROVAL`; only an admin-approved product
  is publicly visible or purchasable.

### Seller system & store (spec §4–5)
- `SellerProfile` gained `sellerType` (6 types), `status`
  (PENDING/APPROVED/REJECTED/SUSPENDED), a separate `verified` badge, plus
  contact/address fields.
- New sellers start `PENDING`; admin must `approve` before they can list products
  or receive orders.
- **Deferred:** followers, seller-level reviews, and store statistics beyond
  the analytics endpoint below (see "Not implemented" section).

### Search & filtering (spec §6)
- `ProductRepository.search(...)` now filters on category, sub-category, brand,
  seller, condition, organic, city, and price range, plus text search — all
  optional/combinable, paginated, sortable (`?sort=price_low_high|price_high_low|rating|newest`).

### Cart & Wishlist (spec §7–8) — brand new
- `Cart`/`CartItem`, `Wishlist`/`WishlistItem` entities, one per buyer.
- Cart is grouped by seller with server-recalculated line totals; blocks
  quantities above stock and flags items that became unavailable.
- Wishlist supports add/remove/status-check/move-to-cart.

### Orders (spec §9)
- `OrderStatus` expanded to the full 11-state workflow from the spec.
- `Order` now carries `subtotal`, `discountAmount`, `deliveryCharge`,
  `couponCode`, alongside the existing `totalAmount` (grand total) and
  `deliveryAddress`.

### Manual payments only — no gateway (spec §10–17) — brand new, the biggest addition
- `PaymentMethod`: `CASH_ON_DELIVERY, EASYPAISA, JAZZCASH, BANK_TRANSFER`. No
  Stripe/PayPal/Easypaisa-API/JazzCash-API/bank-API integration anywhere.
- `PaymentAccount`: seller (or platform-level, when unowned) manual receiving
  details — title/number/bank/IBAN only, never a card number or gateway secret.
- `Payment`: one per order, tracks method/status/reference/paid amount/proof/
  verifier/rejection reason.
- Checkout creates the `Payment` record but **never** marks a manual method
  PAID automatically. Flow: buyer submits transaction reference (at checkout
  or via `POST /payments/order/{id}/submit`) → `PAYMENT_PENDING_VERIFICATION`
  → seller **or** admin (never the buyer) approves/rejects →
  `PAYMENT_VERIFIED`/`PAYMENT_REJECTED` (rejected payments can be resubmitted).
  COD stays `PAYMENT_PENDING` until the order is marked `DELIVERED`, at which
  point it flips to `PAYMENT_PAID` automatically — the only auto-transition,
  and it's for COD specifically, as the spec allows.

### Coupons (spec §28) — brand new
- Percentage/fixed discount, free delivery, min order, max discount cap, date
  window, usage limit — fully validated server-side, usage incremented on
  successful checkout.

### Reviews (spec §18)
- `ProductReview` gained a `verifiedPurchase` flag, set automatically by
  checking for a `DELIVERED` order containing that product for that buyer.
  **Deferred:** seller-level reviews, review moderation/reporting.

### Admin marketplace management (spec §31)
- New `AdminController` (`/marketplace/admin/**`, `@PreAuthorize("hasRole('ADMIN')")`):
  seller approve/reject/suspend/verify, product approve/reject/suspend, and
  payment-verification queue + approve/reject.

### Seller analytics (spec §30)
- `GET /marketplace/sellers/me/analytics` — real totals (orders, revenue,
  products, distinct customers) computed from the database; no fabricated numbers.

### Security (spec §32)
- No new auth system. Every new endpoint reuses the existing JWT filter +
  `UserPrincipal`. Ownership checks added throughout (cart/wishlist keyed by
  buyer id from the token; payment accounts, payment approval, and product/
  seller edits check ownership before allowing changes; buyers can never
  approve/reject their own payment).

### Error handling
- Added a handler for optimistic-lock conflicts (concurrent stock updates) →
  `409 Conflict` with a clear message, on top of the existing exception set.

## What was intentionally NOT implemented this pass

To keep this increment reviewable and correct rather than a wall of unverified
code, the following spec sections were left for a follow-up iteration:

- **§19 Buyer-seller chat** — no domain model added; existing Socket.IO
  infrastructure is currently wired only for notification push.
- **§21 Returns & refunds**, **§22 Disputes**, **§23 Reports** — no entities/
  endpoints yet.
- **§5 Store followers, seller reviews, store statistics beyond analytics.**
- **§25/§26 Smart-agriculture recommendations & AI product-search hooks** — no
  farmer-profile data source exists in this service to recommend against yet;
  building this without a real data source would mean fabricating results,
  which the spec explicitly forbids.
- A fully normalized `Category`/`SubCategory` table (spec §35 lists them as
  *potential* models) — implemented instead as an enum category + free-text
  `subCategory` + a flexible attribute map, which covers the same ground
  without a schema migration for every new sub-type.
- **§31 admin user block/unblock** — user accounts live in `auth-service`, not
  in `marketplace_service`; out of scope for this codebase.

## New/modified files

**New entities:** `ProductImage`, `Cart`, `CartItem`, `Wishlist`, `WishlistItem`,
`Payment`, `PaymentAccount`, `Coupon`, and enums `SellerType`, `SellerStatus`,
`ProductCondition`, `PaymentMethod`, `PaymentStatus`, `PaymentAccountType`, `DiscountType`.

**Modified entities:** `Product`, `SellerProfile`, `Order`, `ProductReview`,
`ProductStatus`, `OrderStatus`, `ProductCategory`.

**New repositories:** `CartRepository`, `WishlistRepository`, `PaymentRepository`,
`PaymentAccountRepository`, `CouponRepository`.

**Modified repositories:** `ProductRepository` (filtering), `OrderRepository`
(analytics + verified-purchase check), `SellerProfileRepository` (status lookup).

**New services (+ impls):** `CartService`, `WishlistService`, `PaymentService`,
`PaymentAccountService`, `CouponService`.

**Modified services:** `ProductService`/`Impl` (moderation + richer search),
`SellerService`/`Impl` (approval workflow + analytics), `OrderService`/`Impl`
(payment + coupon integrated checkout, stock re-validated against current
status, optimistic locking).

**New controllers:** `CartController`, `WishlistController`, `PaymentController`,
`PaymentAccountController`, `CouponController`, `AdminController`.

**Modified controllers:** `ProductController` (new filters/sort), `SellerController`
(profile/analytics endpoints).

**Modified config:** `SecurityConfig` (new public/authenticated route rules).

**Modified:** `GlobalExceptionHandler` (optimistic-lock → 409).

No changes were needed to `pom.xml` — every addition uses dependencies already
present (Spring Data JPA, Bean Validation, Lombok).

## Important caveats

1. **This could not be compiled in this environment** — the sandbox has no
   access to Maven Central (only a small allow-list of package registries),
   so `mvn compile` could not be run. Every file was written and then
   cross-checked by hand (interface ↔ impl ↔ controller signatures, entity
   field names against every JPQL query and builder call, enum renames
   grepped for stale references). Please run `mvn -B clean compile` yourself
   before deploying, and treat this as a thorough first pass rather than a
   guarantee.
2. **Delivery charge** is currently a flat placeholder fee (waived by
   `freeDelivery` coupons) — there's no courier/shipping-rate integration to
   compute a real one yet.
3. **`ddl-auto=update`** is already configured, so the new tables/columns will
   be created automatically on next boot — no manual migration needed for a
   dev/staging DB. For production, consider generating a proper migration
   script instead of relying on `update`.
