/**
 * Backend Keepalive Service
 * Prevents Render backend from sleeping by pinging it every 10 minutes
 */

// Remove trailing /api for health endpoint
const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://millenium-potters.onrender.com/api"
).replace(/\/api\/?$/, "");

class KeepAliveService {
  private intervalId: NodeJS.Timeout | null = null;
  private isActive = false;
  private lastPingTime = 0;
  private minPingInterval = 60000; // Minimum 1 minute between pings
  private rateLimitBackoff = 300000; // 5 minutes backoff on rate limit

  /**
   * Check if we should skip ping due to rate limiting
   */
  private shouldSkipPing(): boolean {
    const now = Date.now();
    return now - this.lastPingTime < this.minPingInterval;
  }

  /**
   * Ping the backend to keep it awake
   */
  private async pingBackend(): Promise<void> {
    // Check rate limiting
    if (this.shouldSkipPing()) {
      console.log("⏭️ Skipping ping due to rate limiting protection");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add a timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      this.lastPingTime = Date.now();

      if (response.ok) {
        console.log("✅ Backend ping successful - keeping server awake");
      } else if (response.status === 429) {
        console.warn("⚠️ Rate limited - backing off for 5 minutes");
        this.lastPingTime = Date.now() + this.rateLimitBackoff; // Extend backoff
      } else {
        console.warn(
          "⚠️ Backend ping returned non-200 status:",
          response.status
        );
      }
    } catch (error) {
      // Silently handle fetch failures (backend may be offline/sleeping)
      console.log("⏭️ Backend ping skipped - server may be offline");

      // Don't try alternative endpoints if we just hit a rate limit
      if (!this.shouldSkipPing()) {
        try {
          await this.pingAlternativeEndpoints();
        } catch (altError) {
          // Silently handle alternative endpoint failures
          console.log("⏭️ Alternative endpoints also unavailable");
        }
      }
    }
  }

  /**
   * Try alternative endpoints if health endpoint is not available
   */
  private async pingAlternativeEndpoints(): Promise<void> {
    // Remove auth endpoints to avoid triggering session checks
    const endpoints = ["/ping", "/test"];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
          console.log(`✅ Alternative ping successful via ${endpoint}`);
          return;
        }
      } catch (error) {
        console.warn(`⚠️ Alternative ping failed for ${endpoint}:`, error);
        continue;
      }
    }
  }

  /**
   * Start the keepalive service
   */
  public start(): void {
    if (this.isActive) {
      console.log("🔄 Keepalive service already running");
      return;
    }

    console.log("🚀 Starting backend keepalive service...");
    this.isActive = true;

    // Ping immediately when starting
    this.pingBackend();

    // Set up interval to ping every 10 minutes (600,000 ms)
    this.intervalId = setInterval(() => {
      this.pingBackend();
    }, 10 * 60 * 1000); // 10 minutes

    console.log(
      "✅ Keepalive service started - pinging backend every 10 minutes"
    );
  }

  /**
   * Stop the keepalive service
   */
  public stop(): void {
    if (!this.isActive) {
      return;
    }

    console.log("🛑 Stopping backend keepalive service...");
    this.isActive = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("✅ Keepalive service stopped");
  }

  /**
   * Check if the service is currently active
   */
  public isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Force a ping (useful for manual testing)
   */
  public async forcePing(): Promise<void> {
    console.log("🔔 Force pinging backend...");
    // Use the rate-limited ping method instead of bypassing it
    await this.pingBackend();
  }
}

// Create a singleton instance
export const keepAliveService = new KeepAliveService();

// Auto-start the service when the module is imported (only in browser)
if (typeof window !== "undefined") {
  // Start the service when the page loads
  keepAliveService.start();

  // Also ping when the page becomes visible (user returns to tab)
  // But only if it's been at least 2 minutes since last ping
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      console.log("👁️ Page became visible - checking if ping needed");
      keepAliveService.forcePing(); // This now uses rate limiting
    }
  });

  // Ping when the page regains focus
  // But only if it's been at least 2 minutes since last ping
  window.addEventListener("focus", () => {
    console.log("🎯 Page regained focus - checking if ping needed");
    keepAliveService.forcePing(); // This now uses rate limiting
  });
}

export default keepAliveService;
