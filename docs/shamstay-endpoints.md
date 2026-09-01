# Shamstay BnB Endpoints

Shamstay is treated as a complete short-term rental website plus admin panel. The endpoint set covers property discovery, booking requests, quote/payment capture, guest messages, wishlists, host calendar control, reviews, turnovers, maintenance, owner payouts, and refunds.

Research basis: Airbnb host tools center around reservations, calendar availability/pricing, listing content, guest messaging, earnings, and reviews. Airbnb guest flows also include reservation management, group messaging, and reviews.

Public base path: `/client-api/public/shamstay`

Admin base path: `/client-api/shamstay`

Staging origin: `https://peptrace.stg.esteemed.engineering`. Prefix every path
below with that origin when testing staging.

Admin auth:

- Requires Shamstay BnB client JWT.
- Other clients receive `404`.
- Write endpoints require `owner`, `admin`, or `manager`.

## Admin Panel: Analytics

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/shamstay/analytics/overview` | Dashboard rollup for properties, reservation statuses, payment totals, open operations, reviews, conversations, and saved properties. Supports `from`, `to`, and `propertyId`. |

## Public Website: Property Discovery

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/public/shamstay/properties` | Public property search. Supports `search`, `city`, `country`, `checkIn`, `checkOut`, `guests`, `minNightlyRate`, and `maxNightlyRate`. Excludes unavailable dates. |
| `GET` | `/client-api/public/shamstay/properties/:idOrSlug` | Public property detail with photos, amenities, house rules, upcoming availability blocks, and approved reviews. |
| `GET` | `/client-api/public/shamstay/properties/:idOrSlug/quote` | Quote available dates with nightly subtotal, cleaning fee, taxes, and total amount. Requires `checkIn` and `checkOut`; supports `guests`. |
| `GET` | `/client-api/public/shamstay/properties/:idOrSlug/reviews` | Public approved reviews for one property. |

## Public Website: Guest Conversion

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/client-api/public/shamstay/reservation-requests` | Create a website booking request. Creates or updates the guest, checks conflicts, stores a `REQUESTED` reservation, and opens a guest conversation. |
| `POST` | `/client-api/public/shamstay/payments` | Create provider-neutral payment intent metadata for a reservation request. |
| `POST` | `/client-api/public/shamstay/contact` | Create a public guest inquiry thread for a property or reservation. |
| `GET` | `/client-api/public/shamstay/wishlist` | List saved properties for a `visitorKey`. |
| `POST` | `/client-api/public/shamstay/wishlist` | Save a property for a `visitorKey`. |
| `DELETE` | `/client-api/public/shamstay/wishlist/:propertyIdOrSlug` | Remove a saved property for a `visitorKey`. |

## Admin Panel: Properties

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/shamstay/properties` | List properties. Supports `search`, `status`, `city`, `country`, `guests`, `minNightlyRate`, and `maxNightlyRate`. |
| `GET` | `/client-api/shamstay/properties/:idOrSlug` | Get property with reservations, turnovers, maintenance, payouts, availability blocks, reviews, and conversations. |
| `POST` | `/client-api/shamstay/properties` | Create property with core rates plus `description`, `amenities`, `houseRules`, `photos`, and geo coordinates. |
| `PATCH` | `/client-api/shamstay/properties/:id` | Edit property content, pricing, owner, photos, rules, amenities, geo data, or status. |
| `PATCH` | `/client-api/shamstay/properties/:id/status` | Fast status update. |
| `DELETE` | `/client-api/shamstay/properties/:id` | Archive property by setting status to `ARCHIVED`. |

## Admin Panel: Calendar And Availability

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/shamstay/properties/:propertyId/availability-blocks` | List blocked/open calendar periods for a property. Supports `status`. |
| `POST` | `/client-api/shamstay/properties/:propertyId/availability-blocks` | Add calendar block, owner hold, seasonal minimum night rule, or nightly rate override. |
| `PATCH` | `/client-api/shamstay/availability-blocks/:id` | Edit calendar block dates, reason, status, rate override, or notes. |
| `DELETE` | `/client-api/shamstay/availability-blocks/:id` | Remove a calendar block. |

## Admin Panel: Guests And Reservations

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/shamstay/guests` | List guests. Supports `search`. |
| `GET` | `/client-api/shamstay/guests/:id` | Get one guest with recent reservations, conversations, and payments. |
| `POST` | `/client-api/shamstay/guests` | Create guest profile. |
| `PATCH` | `/client-api/shamstay/guests/:id` | Edit guest profile, contact details, country, or notes. |
| `GET` | `/client-api/shamstay/reservations` | List reservations. Supports `status` and `propertyId`. |
| `GET` | `/client-api/shamstay/reservations/:id` | Get reservation with guest, property, and turnovers. |
| `POST` | `/client-api/shamstay/reservations` | Create admin reservation. |
| `PATCH` | `/client-api/shamstay/reservations/:id` | Edit reservation property, guest, dates, channel, pricing, totals, status, or notes. |
| `PATCH` | `/client-api/shamstay/reservations/:id/status` | Update reservation status and notes. |
| `DELETE` | `/client-api/shamstay/reservations/:id` | Archive reservation by setting status to `ARCHIVED`. |

## Admin Panel: Guest Messages

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/shamstay/conversations` | List guest conversations. Supports `status`, `propertyId`, `reservationId`, and `search`. |
| `POST` | `/client-api/shamstay/conversations` | Create an admin-started conversation, optionally with an initial message. |
| `GET` | `/client-api/shamstay/conversations/:id` | Get one conversation with guest, property, reservation, and messages. |
| `DELETE` | `/client-api/shamstay/conversations/:id` | Archive guest conversation by setting status to `ARCHIVED`. |
| `GET` | `/client-api/shamstay/conversations/:id/messages` | List messages in a conversation. |
| `POST` | `/client-api/shamstay/conversations/:id/messages` | Add a host/admin message with optional attachments. |

## Admin Panel: Review Moderation

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/shamstay/reviews` | List reviews. Supports `status` and `propertyId`. |
| `GET` | `/client-api/shamstay/reviews/:id` | Get one review with property and reservation context. |
| `POST` | `/client-api/shamstay/reviews` | Create/import a review tied to a property and optional reservation. |
| `PATCH` | `/client-api/shamstay/reviews/:id/status` | Approve, reject, hide, or mark review pending. |
| `PATCH` | `/client-api/shamstay/reviews/:id/response` | Add or update host response. |
| `DELETE` | `/client-api/shamstay/reviews/:id` | Archive review by setting status to `ARCHIVED`. |

## Admin Panel: Operations

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/shamstay/turnovers` | List turnover tasks. Supports `status` and `propertyId`. |
| `GET` | `/client-api/shamstay/turnovers/:id` | Get one turnover task with property and reservation context. |
| `POST` | `/client-api/shamstay/turnovers` | Create turnover task. |
| `PATCH` | `/client-api/shamstay/turnovers/:id` | Edit turnover schedule, assignment, checklist, completion time, status, or notes. |
| `PATCH` | `/client-api/shamstay/turnovers/:id/status` | Update turnover status. |
| `DELETE` | `/client-api/shamstay/turnovers/:id` | Archive turnover by setting status to `ARCHIVED`. |
| `GET` | `/client-api/shamstay/maintenance` | List maintenance tickets. Supports `status` and `propertyId`. |
| `GET` | `/client-api/shamstay/maintenance/:id` | Get one maintenance ticket with property context. |
| `POST` | `/client-api/shamstay/maintenance` | Create maintenance ticket. |
| `PATCH` | `/client-api/shamstay/maintenance/:id` | Edit maintenance details, priority, vendor, costs, dates, status, or notes. |
| `PATCH` | `/client-api/shamstay/maintenance/:id/status` | Update maintenance status. |
| `DELETE` | `/client-api/shamstay/maintenance/:id` | Archive maintenance ticket by setting status to `ARCHIVED`. |
| `GET` | `/client-api/shamstay/payouts` | List owner payouts. Supports `status` and `propertyId`. |
| `GET` | `/client-api/shamstay/payouts/:id` | Get one owner payout with property context. |
| `POST` | `/client-api/shamstay/payouts` | Create owner payout. |
| `PATCH` | `/client-api/shamstay/payouts/:id` | Edit payout period, amounts, paid date, status, or notes. |
| `PATCH` | `/client-api/shamstay/payouts/:id/status` | Update payout status. |
| `DELETE` | `/client-api/shamstay/payouts/:id` | Archive owner payout by setting status to `ARCHIVED`. |

## Admin Panel: Billing And Refunds

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/shamstay/payments` | List reservation payments. Supports `status`, `propertyId`, `reservationId`, and `guestId`. |
| `GET` | `/client-api/shamstay/payments/:id` | Get one payment with guest, property, and reservation context. |
| `POST` | `/client-api/shamstay/payments` | Create manual or provider-backed payment record for a reservation, property, or guest. |
| `PATCH` | `/client-api/shamstay/payments/:id` | Edit provider, reference, amount, fees, taxes, refund amount, status, paid/refunded timestamps, notes, and metadata. |
| `PATCH` | `/client-api/shamstay/payments/:id/status` | Fast payment status update. Marks paid/refunded timestamps for terminal statuses. |
| `POST` | `/client-api/shamstay/payments/:id/refunds` | Apply partial or full refund amount and update refund status. |
| `DELETE` | `/client-api/shamstay/payments/:id` | Void payment by setting status to `VOID`. |
