# Sham Real Estate Hub Endpoints

Sham Real Estate Hub is treated as a complete property marketplace plus brokerage admin panel. The endpoint set covers public listing search, listing details, buyer/renter inquiries, tour requests, saved homes, saved searches, admin listing management, leads, viewings, offers, and commissions.

Research basis: Zillow-style real estate portals support filtered map/search results, saved searches, saved homes, inquiry/contact forms, and tour requests. Realtor.com-style buyer flows also center on scheduling property tours.

Public base path: `/client-api/public/real-estate`

Admin base path: `/client-api/real-estate`

Staging origin: `https://peptrace.stg.esteemed.engineering`. Prefix every path
below with that origin when testing staging.

Admin auth:

- Requires Sham Real Estate Hub client JWT.
- Other clients receive `404`.
- Write endpoints require `owner`, `admin`, or `manager`.

## Admin Panel: Analytics

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/real-estate/analytics/overview` | Dashboard rollup for listing statuses, lead pipeline, tours, offers, commission totals, saved listings, and saved searches. Supports `from`, `to`, `listingId`, and `assignedAgent`. |

## Public Website: Listing Discovery

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/public/real-estate/listings` | Public listing search. Supports `search`, `city`, `district`, `propertyType`, `listingPurpose`, `minPrice`, `maxPrice`, `bedrooms`, `bathrooms`, and `minSizeSqm`. Returns only `PUBLISHED` listings. |
| `GET` | `/client-api/public/real-estate/listings/:idOrSlug` | Public listing detail with rich description, photos, features, geo data, price, specs, and assigned agent. |

## Public Website: Buyer And Renter Conversion

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/client-api/public/real-estate/inquiries` | Create a buyer/renter inquiry lead from a listing detail page or general contact form. |
| `POST` | `/client-api/public/real-estate/tour-requests` | Create a high-priority lead and requested viewing for a selected listing and time. |
| `GET` | `/client-api/public/real-estate/saved-listings` | List saved listings for a `visitorKey`. |
| `POST` | `/client-api/public/real-estate/saved-listings` | Save a listing for a `visitorKey`. |
| `DELETE` | `/client-api/public/real-estate/saved-listings/:listingIdOrSlug` | Remove a saved listing for a `visitorKey`. |
| `GET` | `/client-api/public/real-estate/saved-searches` | List saved searches for a `visitorKey`. |
| `POST` | `/client-api/public/real-estate/saved-searches` | Save search filters and alert frequency for a `visitorKey`. |
| `DELETE` | `/client-api/public/real-estate/saved-searches/:id` | Delete a saved search for a `visitorKey`. |

## Admin Panel: Listings

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/real-estate/listings` | List listings. Supports `search`, `status`, `assignedAgent`, `city`, `district`, `propertyType`, `listingPurpose`, `minPrice`, `maxPrice`, `bedrooms`, `bathrooms`, and `minSizeSqm`. |
| `GET` | `/client-api/real-estate/listings/:idOrSlug` | Get listing with leads, viewings, offers, commissions, and recent saves. |
| `POST` | `/client-api/real-estate/listings` | Create listing with core details plus `description`, `listingPurpose`, `features`, `photos`, geo coordinates, lot size, and year built. |
| `PATCH` | `/client-api/real-estate/listings/:id` | Edit listing content, pricing, status, agent, owner, photos, features, geo data, and publishing metadata. |
| `PATCH` | `/client-api/real-estate/listings/:id/status` | Fast listing status update. Sets `publishedAt` when status becomes `PUBLISHED`. |
| `DELETE` | `/client-api/real-estate/listings/:id` | Archive listing by setting status to `ARCHIVED`. |

## Admin Panel: Leads

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/real-estate/leads` | List leads. Supports `search`, `status`, `listingId`, and `assignedAgent`. |
| `GET` | `/client-api/real-estate/leads/:id` | Get lead with listing, viewings, and offers. |
| `POST` | `/client-api/real-estate/leads` | Create lead from admin panel, phone call, referral, portal import, or walk-in. |
| `PATCH` | `/client-api/real-estate/leads/:id` | Edit lead contact details, interest, budget, priority, agent, status, or notes. |
| `PATCH` | `/client-api/real-estate/leads/:id/status` | Update lead status and notes. |
| `DELETE` | `/client-api/real-estate/leads/:id` | Archive lead by setting status to `ARCHIVED`. |

## Admin Panel: Tours And Viewings

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/real-estate/viewings` | List viewings. Supports `status`, `listingId`, and `assignedAgent`. |
| `GET` | `/client-api/real-estate/viewings/:id` | Get one viewing with lead and listing context. |
| `POST` | `/client-api/real-estate/viewings` | Create scheduled viewing. |
| `PATCH` | `/client-api/real-estate/viewings/:id` | Edit viewing listing, lead, schedule, agent, feedback, status, or notes. |
| `PATCH` | `/client-api/real-estate/viewings/:id/status` | Confirm, complete, cancel, or reschedule viewing status. |
| `DELETE` | `/client-api/real-estate/viewings/:id` | Archive viewing by setting status to `ARCHIVED`. |

## Admin Panel: Offers And Closing

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/real-estate/offers` | List offers. Supports `status` and `listingId`. |
| `GET` | `/client-api/real-estate/offers/:id` | Get one offer with lead, listing, and commission context. |
| `POST` | `/client-api/real-estate/offers` | Create offer for a lead and listing. |
| `PATCH` | `/client-api/real-estate/offers/:id` | Edit offer listing, lead, amount, terms, dates, status, or notes. |
| `PATCH` | `/client-api/real-estate/offers/:id/status` | Update offer status. |
| `DELETE` | `/client-api/real-estate/offers/:id` | Archive offer by setting status to `ARCHIVED`. |
| `GET` | `/client-api/real-estate/commissions` | List commissions. Supports `status` and `listingId`. |
| `GET` | `/client-api/real-estate/commissions/:id` | Get one commission with listing and offer context. |
| `POST` | `/client-api/real-estate/commissions` | Create commission split. |
| `PATCH` | `/client-api/real-estate/commissions/:id` | Edit commission listing, offer, agent, split amounts, due/paid dates, status, or notes. |
| `PATCH` | `/client-api/real-estate/commissions/:id/status` | Update commission status and paid date. |
| `DELETE` | `/client-api/real-estate/commissions/:id` | Void commission by setting status to `VOID` and clearing `paidAt`. |

## Admin Panel: Saved Buyer Signals

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/real-estate/saved-listings` | Admin list of saved listings, optionally filtered by `visitorKey`. |
| `GET` | `/client-api/real-estate/saved-searches` | Admin list of saved searches and alert preferences, optionally filtered by `visitorKey`. |
