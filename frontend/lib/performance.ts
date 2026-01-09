import React, { useEffect } from "react";

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();
  private static observers: PerformanceObserver[] = [];

  // Start measuring performance
  static startMeasure(name: string): void {
    if (typeof window !== "undefined" && "performance" in window) {
      this.measurements.set(name, performance.now());
    }
  }

  // End measuring and log result
  static endMeasure(name: string, logResult = true): number {
    if (typeof window !== "undefined" && "performance" in window) {
      const startTime = this.measurements.get(name);
      if (startTime) {
        const duration = performance.now() - startTime;
        this.measurements.delete(name);

        if (logResult) {
          console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
        }

        return duration;
      }
    }
    return 0;
  }

  // Measure async function execution
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    logResult = true
  ): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await fn();
      this.endMeasure(name, logResult);
      return result;
    } catch (error) {
      this.endMeasure(name, logResult);
      throw error;
    }
  }

  // Measure sync function execution
  static measureSync<T>(name: string, fn: () => T, logResult = true): T {
    this.startMeasure(name);
    try {
      const result = fn();
      this.endMeasure(name, logResult);
      return result;
    } catch (error) {
      this.endMeasure(name, logResult);
      throw error;
    }
  }

  // Monitor component render performance
  static monitorComponentRender(componentName: string): void {
    if (typeof window !== "undefined" && "performance" in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes(componentName)) {
            console.log(
              `Component ${componentName} render: ${entry.duration.toFixed(
                2
              )}ms`
            );
          }
        });
      });

      observer.observe({ entryTypes: ["measure"] });
      this.observers.push(observer);
    }
  }

  // Monitor API call performance
  static monitorApiCall(url: string): void {
    if (typeof window !== "undefined" && "performance" in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes(url)) {
            console.log(`API Call ${url}: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ["resource"] });
      this.observers.push(observer);
    }
  }

  // Clean up observers
  static cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.measurements.clear();
  }

  // Get performance metrics
  static getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.measurements.forEach((value, key) => {
      metrics[key] = value;
    });
    return metrics;
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    PerformanceMonitor.monitorComponentRender(componentName);

    return () => {
      PerformanceMonitor.cleanup();
    };
  }, [componentName]);
}

// Higher-order component for performance monitoring
export function withPerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function PerformanceMonitoredComponent(props: P) {
    usePerformanceMonitor(componentName);
    return React.createElement(Component, props);
  };
}

// Utility for debouncing expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Utility for throttling expensive operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memory usage monitoring
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  if (typeof window !== "undefined" && "memory" in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
    };
  }

  return { used: 0, total: 0, percentage: 0 };
}

// Network performance monitoring
export function getNetworkInfo(): {
  connection?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
} {
  if (typeof window !== "undefined" && "connection" in navigator) {
    const connection = (navigator as any).connection;
    return {
      connection: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    };
  }

  return {};
}
