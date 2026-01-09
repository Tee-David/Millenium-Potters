import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { PerformanceMonitor } from "./performance";

// API client configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Create optimized axios instance
const createOptimizedClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor for performance monitoring
  client.interceptors.request.use(
    (config) => {
      const requestId = `${config.method?.toUpperCase()}_${config.url}`;
      PerformanceMonitor.startMeasure(requestId);

      // Add request timestamp
      (config as any).metadata = { startTime: Date.now() };

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for performance monitoring and error handling
  client.interceptors.response.use(
    (response) => {
      const requestId = `${response.config.method?.toUpperCase()}_${
        response.config.url
      }`;
      const duration = PerformanceMonitor.endMeasure(requestId, false);

      // Log slow requests
      if (duration > 1000) {
        console.warn(
          `Slow API request: ${requestId} took ${duration.toFixed(2)}ms`
        );
      }

      return response;
    },
    (error) => {
      const requestId = error.config
        ? `${error.config.method?.toUpperCase()}_${error.config.url}`
        : "unknown_request";

      PerformanceMonitor.endMeasure(requestId, false);

      // Enhanced error logging
      console.error(`API Error [${requestId}]:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });

      return Promise.reject(error);
    }
  );

  return client;
};

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
}

class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private config: CacheConfig;

  constructor(config: CacheConfig = { ttl: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config;
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Optimized API client with caching
export class OptimizedApiClient {
  private client: AxiosInstance;
  private cache: ApiCache;
  private requestQueue = new Map<string, Promise<any>>();

  constructor() {
    this.client = createOptimizedClient();
    this.cache = new ApiCache();
  }

  // Generic request method with caching and deduplication
  async request<T = any>(
    config: AxiosRequestConfig,
    options: {
      cache?: boolean;
      cacheKey?: string;
      deduplicate?: boolean;
    } = {}
  ): Promise<AxiosResponse<T>> {
    const {
      cache = false,
      cacheKey = this.generateCacheKey(config),
      deduplicate = true,
    } = options;

    // Check cache first
    if (cache) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        } as AxiosResponse<T>;
      }
    }

    // Check for duplicate requests
    if (deduplicate && this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Create request promise
    const requestPromise = this.client
      .request<T>(config)
      .then((response) => {
        // Cache successful responses
        if (cache && response.status === 200) {
          this.cache.set(cacheKey, response.data);
        }

        // Remove from queue
        this.requestQueue.delete(cacheKey);

        return response;
      })
      .catch((error) => {
        // Remove from queue on error
        this.requestQueue.delete(cacheKey);
        throw error;
      });

    // Add to queue for deduplication
    if (deduplicate) {
      this.requestQueue.set(cacheKey, requestPromise);
    }

    return requestPromise;
  }

  // GET request with caching
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
    options?: { cache?: boolean; cacheKey?: string }
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(
      { ...config, method: "GET", url },
      { cache: true, ...options }
    );
  }

  // POST request
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      ...config,
      method: "POST",
      url,
      data,
    });
  }

  // PUT request
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      ...config,
      method: "PUT",
      url,
      data,
    });
  }

  // DELETE request
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      ...config,
      method: "DELETE",
      url,
    });
  }

  // Batch requests
  async batch<T = any>(
    requests: Array<{
      config: AxiosRequestConfig;
      options?: { cache?: boolean; cacheKey?: string };
    }>
  ): Promise<AxiosResponse<T>[]> {
    const promises = requests.map(({ config, options }) =>
      this.request<T>(config, options)
    );

    return Promise.all(promises);
  }

  // Generate cache key from request config
  private generateCacheKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config;
    return `${method}_${url}_${JSON.stringify(params)}_${JSON.stringify(data)}`;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size(),
      maxSize: this.cache["config"].maxSize,
    };
  }

  // Set auth token
  setAuthToken(token: string): void {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // Remove auth token
  removeAuthToken(): void {
    delete this.client.defaults.headers.common["Authorization"];
  }
}

// Create singleton instance
export const optimizedApiClient = new OptimizedApiClient();

// Utility functions for common operations
export const apiUtils = {
  // Retry failed requests
  async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (i < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, delay * Math.pow(2, i))
          );
        }
      }
    }

    throw lastError!;
  },

  // Timeout wrapper
  async timeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  },

  // Cancel token for request cancellation
  createCancelToken() {
    return axios.CancelToken.source();
  },
};

// Export default client
export default optimizedApiClient;
