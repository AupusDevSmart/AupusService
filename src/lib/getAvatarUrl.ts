/**
 * Converts a relative avatar URL to an absolute URL.
 * If the URL is already absolute (starts with http:// or https://), returns it as-is.
 * Otherwise, constructs a complete URL using the API base URL.
 *
 * @param {string | null | undefined} avatarUrl - The avatar URL path (can be relative or absolute)
 * @return {string | null} The complete avatar URL or null if no avatar is provided
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;

  // Trim whitespace from the URL
  const trimmedUrl = avatarUrl.trim();

  if (!trimmedUrl) return null;

  // If already a complete URL, return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // Build complete URL from relative path
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  // Remove only trailing slashes, keep /api/v1 (files are served under /api/v1/uploads)
  const baseUrl = apiUrl.replace(/\/+$/, '');

  // Ensure the avatar URL starts with a slash
  const cleanAvatarUrl = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;

  // Encode the URL to handle spaces and special characters
  const encodedUrl = cleanAvatarUrl.split('/').map(segment => segment ? encodeURIComponent(segment) : '').join('/');

  // Build final URL ensuring no double slashes (except after http:// or https://)
  const finalUrl = `${baseUrl}${encodedUrl}`.replace(/([^:]\/)\/+/g, '$1');

  return finalUrl;
}
