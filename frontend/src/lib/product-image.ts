import { PRODUCTS_API_URL } from "../config";

export const DEFAULT_PRODUCT_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="No image">
      <rect width="800" height="600" fill="#e2e8f0" rx="48" />
      <rect x="170" y="120" width="460" height="360" rx="32" fill="#cbd5e1" />
      <path d="M240 250h320v20H240zM240 310h240v20H240zM240 370h180v20H240z" fill="#94a3b8" />
    </svg>
  `);

export function resolveProductImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const normalizedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${PRODUCTS_API_URL}${normalizedPath}`;
}
