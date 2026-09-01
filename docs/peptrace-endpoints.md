# Peptrace Endpoints

Peptrace is treated as a peptide quality intelligence website plus admin panel. The endpoint set covers public vendor/product comparison, peptide research views, public lab-test browsing, certificate verification, and admin batch/certificate operations.

Public base path: `/client-api/public/quality`

Admin base path: `/client-api/quality`

Staging origin: `https://peptrace.stg.esteemed.engineering`. Prefix every path
below with that origin when testing staging.

Admin auth:

- Requires Peptrace client JWT.
- Other clients receive `404`.
- Write endpoints require `owner`, `admin`, or `manager`.

## Public Website: Vendor And Product Discovery

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/public/quality/vendors` | Public vendor comparison with products and overall ratings. |
| `GET` | `/client-api/public/quality/vendors/:idOrSlug` | Public vendor detail with products and released tests. |
| `GET` | `/client-api/public/quality/peptides` | Public peptide index with available vendor products. |
| `GET` | `/client-api/public/quality/peptides/:idOrSlug` | Public peptide detail with products and released test results. |

## Public Website: Testing And Certificate Verification

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/public/quality/tests` | Public released lab tests. Supports `status`, `vendorId`, and `peptideId`, but only public test statuses are returned. |
| `GET` | `/client-api/public/quality/certificates/:idOrNumber/verify` | Verify a public certificate of analysis by id or certificate number. Returns only issued/approved/verified certificates. |

## Admin Panel: Reference Catalog

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/quality/vendors` | List vendors. |
| `GET` | `/client-api/quality/vendors/:idOrSlug` | Get one vendor with products and tests. |
| `GET` | `/client-api/quality/peptides` | List peptides. |
| `GET` | `/client-api/quality/peptides/:idOrSlug` | Get one peptide with products and tests. |
| `GET` | `/client-api/quality/labs` | List labs. |
| `GET` | `/client-api/quality/tests` | List lab tests. Supports `status`, `vendorId`, and `peptideId`. |
| `GET` | `/client-api/quality/tests/:id` | Get one lab test. |

## Admin Panel: Batches

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/quality/batches` | List batches. Supports `status`, `vendorId`, and `peptideId`. |
| `GET` | `/client-api/quality/batches/:idOrCode` | Get one batch with certificates. |
| `POST` | `/client-api/quality/batches` | Create quality batch. |
| `PATCH` | `/client-api/quality/batches/:id` | Edit batch code, vendor, peptide, dates, quantity, status, storage, and notes. |
| `PATCH` | `/client-api/quality/batches/:id/status` | Fast batch status update. |
| `DELETE` | `/client-api/quality/batches/:id` | Archive batch by setting status to `ARCHIVED`. |

## Admin Panel: Certificates

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/quality/certificates` | List certificates. Supports `status` and `batchId`. |
| `GET` | `/client-api/quality/certificates/:idOrNumber` | Get one certificate. |
| `POST` | `/client-api/quality/certificates` | Create certificate of analysis. |
| `PATCH` | `/client-api/quality/certificates/:id` | Edit certificate batch, lab test, number, status, dates, document URL, and summary. |
| `PATCH` | `/client-api/quality/certificates/:id/status` | Fast certificate status update. |
| `DELETE` | `/client-api/quality/certificates/:id` | Archive certificate by setting status to `ARCHIVED`. |

## Platform Maintenance

These older platform routes still exist for platform maintenance and superadmin catalog setup.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/vendors` | List vendors. |
| `GET` | `/api/vendor/:idOrSlug` | Get one vendor. |
| `POST` | `/api/vendors` | Create vendor. |
| `GET` | `/api/peptides` | List peptides. |
| `GET` | `/api/peptide/:idOrSlug` | Get one peptide. |
| `POST` | `/api/peptides` | Create peptide. |
| `GET` | `/api/labs` | List labs. |
| `POST` | `/api/labs` | Create lab. |
| `GET` | `/api/testing` | List lab tests. |
| `GET` | `/api/testing/:id` | Get one lab test. |
| `POST` | `/api/testing` | Create lab test. |
