// Utility functions for handling image URLs

// Helper function to transform localhost URLs to deployed backend URLs
export const transformImageUrl = (url: string): string => {
  if (!url) return url;

  try {
    // If it's a localhost:3001 URL, transform it to deployed backend with /api and HTTPS
    if (url.includes("localhost:3001")) {
      return url.replace(
        "http://localhost:3001",
        "https://millenium-potters.onrender.com/api"
      );
    }

    // Force HTTP to HTTPS for millenium-potters.onrender.com (Render requires HTTPS)
    if (url.includes("millenium-potters.onrender.com") && url.startsWith("http://")) {
      url = url.replace("http://", "https://");
    }

    // If it's already millenium-potters.onrender.com but missing /api, add it
    if (
      url.includes("millenium-potters.onrender.com/uploads") &&
      !url.includes("/api/uploads")
    ) {
      return url.replace(
        "millenium-potters.onrender.com/uploads",
        "millenium-potters.onrender.com/api/uploads"
      );
    }

    return url;
  } catch {
    return url;
  }
};

// Helper function to check if image URL is accessible
export const isImageUrlAccessible = (url: string): boolean => {
  if (!url) return false;

  try {
    const urlObj = new URL(url);

    // Allow deployed backend URLs (millenium-potters.onrender.com)
    if (urlObj.hostname === "millenium-potters.onrender.com") {
      return true;
    }

    // Allow blob URLs (for local previews)
    if (url.startsWith("blob:")) {
      return true;
    }

    // Allow other HTTPS URLs
    if (urlObj.protocol === "https:") {
      return true;
    }

    // For localhost, only allow if we're also on localhost
    if (typeof window !== "undefined") {
      if (
        urlObj.hostname === "localhost" &&
        window.location.hostname === "localhost"
      ) {
        return true;
      }
    }

    return false;
  } catch {
    // If URL parsing fails, try to be permissive for blob URLs
    if (url.startsWith("blob:")) {
      return true;
    }
    return false;
  }
};

// Safe image URL that either returns transformed URL or null if it should be blocked
export const getSafeImageUrl = (url: string): string | null => {
  if (!url) return null;

  // First, transform the URL (localhost:3001 → deployed backend)
  const transformedUrl = transformImageUrl(url);

  // Log the transformation for debugging
  if (url !== transformedUrl) {
    console.log(`Transformed URL: ${url} → ${transformedUrl}`);
  }

  // Check if the transformed URL is accessible
  if (!isImageUrlAccessible(transformedUrl)) {
    console.log(`URL not accessible: ${transformedUrl}`);
    return null;
  }

  return transformedUrl;
};
