# AST-XGB Production Property Listing & Media API Contract

**System:** AST-XGB Real Estate Platform (`GharDhundo`)  
**Specification Version:** v1.0.0-PROD  
**Status:** Architecture Contract (Current Interim State: Local Prototype Adapter)  

---

## 1. Architectural Baseline & Interim Notice

As of Phase 8, the AST-XGB production backend runtime focuses exclusively on statutory inference (`/api/v1/predict`, `/api/v1/explain`, `/api/v1/counterfactual`) and empirical macroeconomic time series (`/api/v1/market/*`). Dynamic multi-tenant listing creation, authenticated owner accounts, and cloud image object storage require dedicated microservices.

An interim local persistence adapter (`listingStorageAdapter.ts`) is provided for front-end prototyping, validation testing, and immediate discovery simulation. **Draft and prototype submissions are explicitly labeled to prevent false claims of cloud publishing.**

This document defines the formal API contract required for connecting a production database and cloud storage service.

---

## 2. Authentication & Authorization

All listing mutation endpoints require a validated JWT Bearer Token issued by the identity provider:

```http
Authorization: Bearer <jwt_access_token>
```

### Claims & Role Hierarchy
```json
{
  "sub": "usr_948f2c01a938",
  "role": "Owner", // "Owner" | "Agent" | "Developer" | "Admin"
  "verified_phone": true,
  "verified_kyc": false,
  "iat": 1792953600,
  "exp": 1793040000
}
```

### Authorization Rules
1. **Ownership Enforcement**: Mutating or deleting a listing requires `sub == listing.owner_id` or `role == "Admin"`. Client-supplied owner IDs in payloads are strictly ignored in favor of `sub` from the verified token.
2. **Contact Privacy**: Private contact details (direct phone, email) are never returned in public listing endpoints. Public endpoints return masked contact metadata (`"is_phone_protected": true`) and require an inquiry token or authenticated user session to unlock.

---

## 3. Production REST Endpoints

### 3.1 Create Listing
`POST /api/v1/listings`

#### Request Payload
```json
{
  "role": "Owner",
  "mode": "buy",
  "property_category": "Residential",
  "property_type": "Apartment",
  "title": "3 BHK Luxury Flat in Whitefield",
  "location": {
    "city": "Bengaluru",
    "locality": "Whitefield",
    "sub_locality": "ITPL Main Road",
    "project_name": "Prestige Boulevard",
    "landmark": "Near Hope Farm Junction",
    "pincode": "560066",
    "latitude": 12.9698,
    "longitude": 77.7499
  },
  "specs": {
    "builtup_area_sqft": 1650.0,
    "carpet_area_sqft": 1380.0,
    "bhk": 3,
    "bathrooms": 3,
    "balconies": 2,
    "floor_no": 7,
    "total_floors": 14,
    "facing": "East",
    "age_years": 2,
    "furnishing": "Semi-Furnished",
    "possession_status": "Ready to Move",
    "parking": 1
  },
  "financials": {
    "price_inr": 12500000.0,
    "maintenance_monthly_inr": 4500.0,
    "is_price_negotiable": true
  },
  "amenities": [
    "Clubhouse",
    "Swimming Pool",
    "24x7 Security",
    "Power Backup",
    "Gated Community",
    "Gymnasium"
  ],
  "description": "Spacious east-facing 3 BHK with premium fittings, dedicated covered parking and close proximity to metro line.",
  "privacy": {
    "mask_phone": true,
    "require_verified_inquiry": true
  },
  "status": "draft" // "draft" | "submitted"
}
```

#### Response (`201 Created`)
```json
{
  "id": "lst_blr_001928",
  "slug": "3-bhk-luxury-flat-in-whitefield-lst-001928",
  "owner_id": "usr_948f2c01a938",
  "status": "pending_verification", // "draft" | "pending_verification" | "active" | "rejected"
  "ast_xgb_benchmark_inr": 12150000.0,
  "conformal_lower_90_inr": 11320000.0,
  "conformal_upper_90_inr": 12980000.0,
  "created_at": "2026-10-26T00:15:00Z",
  "updated_at": "2026-10-26T00:15:00Z"
}
```

---

### 3.2 Multipart Image Upload & Processing
`POST /api/v1/listings/{listing_id}/images`  
`Content-Type: multipart/form-data`

#### Security & Validation Requirements
1. **Magic Bytes Validation**: Enforce binary MIME inspection (`image/jpeg`, `image/png`, `image/webp`). Disallow SVG or executable polyglots.
2. **File Size Limit**: Maximum **5.0 MB** per image.
3. **Image Count Limit**: Up to **15 images** per listing.
4. **Processing Pipeline**: Strip EXIF metadata (GPS/PII) -> Resize to standard breakpoints (1200w, 800w, 400w thumbnail) -> Encode to WebP -> Upload to private cloud object store (AWS S3 / Google Cloud Storage) with CDN caching.
5. **Executable Protection**: Stored files must never have executable permissions or execute script handlers. S3 bucket must enforce `Content-Disposition: inline` and immutable ACLs.

---

### 3.3 Manage Owner Listings
- `GET /api/v1/listings/me`: Return all listings created by the authenticated owner.
- `GET /api/v1/listings/{id}`: Return listing details with full edit permissions if caller owns the asset.
- `PUT /api/v1/listings/{id}`: Update listing fields and re-trigger conformal interval sanity checks.
- `DELETE /api/v1/listings/{id}`: Soft-delete listing or mark as archived.

---

## 4. Interim Adapter Protocol

Until production microservices are provisioned, `listingStorageAdapter.ts`:
1. Maintains client-side state under key `ast_xgb_owner_listings` in `localStorage`.
2. Encodes uploaded photos into validated, client-safe image Data URLs / Object URLs with size caps (< 2MB per preview).
3. Injects custom owner listings into the global search index (`listingsAdapter.ts`) with prominent badges:
   - `[DEMO PROTOTYPE LISTING]`
   - `[LOCAL SESSION PERSISTED]`
4. Emits `ast_xgb_listings_updated` window events for real-time synchronization.
