# Plan: Resolved Broken Product Images via Signed URLs

The backend blocks public buckets via `public_buckets_blocked`. To ensure images load correctly in both the private Dashboard and the anonymous Public Storefront, we will implement **Signed URLs** with a long expiration (e.g., 1 year) for catalog images.

## Technical Details

- **Problem**: Bucket `products` is private. `getPublicUrl` returns 404/NoSuchBucket.
- **Solution**: Use `supabase.storage.from("products").createSignedUrl(path, 31536000)` (1 year).
- **Architecture**:
  - The Dashboard and Public Storefront will fetch products and then generate signed URLs for each image.
  - Since signed URLs are generated client-side, they will use the current session (if any) or public access (via RLS).
  - Note: `createSignedUrl` for a private bucket requires the user to have `SELECT` permission on `storage.objects`. Our RLS already allows `public` SELECT on `products`.

## Implementation Steps

### 1. Dashboard Enhancements
- Update `fetchProducts` in `src/pages/Dashboard.tsx` to map over products and generate signed URLs for each `image_url`.
- Update the `getImageUrl` helper to handle these pre-generated URLs.

### 2. Public Storefront Enhancements
- Update `fetchStoreData` in `src/pages/PublicStore.tsx` to generate signed URLs for all fetched products.
- This ensures that even anonymous users get a valid, signed link to the private bucket assets.

### 3. Verification
- Use Playwright to confirm:
  1. Dashboard images return HTTP 200.
  2. Public Storefront images return HTTP 200 without a session.
  3. Visual confirmation of image rendering.
