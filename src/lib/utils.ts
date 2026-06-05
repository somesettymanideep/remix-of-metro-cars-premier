import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve asset URLs from Lovable development URLs to CDN URLs
 * Supports both /__l5e/ dev URLs and proper R2 CDN URLs
 */
export function resolveAssetUrl(asset: { url?: string; r2_key?: string } | string): string {
  if (typeof asset === "string") return asset;
  
  // If it's already a full CDN URL, return it
  if (asset.url && asset.url.startsWith("https://")) {
    return asset.url;
  }
  
  // If it's a Lovable dev URL, convert to R2 CDN
  if (asset.url && asset.url.startsWith("/__l5e/")) {
    // Convert /__l5e/assets-v1/ID/FILE to R2 URL
    const match = asset.url.match(/\/__l5e\/assets-v1\/([^/]+)\/(.+)$/);
    if (match && asset.r2_key) {
      // Use the r2_key directly with CDN domain
      return `https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/${asset.r2_key}`;
    }
  }
  
  // Fallback to original URL
  return asset.url || "";
}
