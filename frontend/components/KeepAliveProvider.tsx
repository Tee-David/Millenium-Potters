"use client";

import { useEffect } from "react";
import { keepAliveService } from "@/lib/keepalive";

/**
 * KeepAlive Provider Component
 * Initializes the backend keepalive service when the app starts
 */
export function KeepAliveProvider() {
  useEffect(() => {
    // Start the keepalive service when the component mounts
    keepAliveService.start();

    // Cleanup function to stop the service when component unmounts
    return () => {
      keepAliveService.stop();
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}

export default KeepAliveProvider;
