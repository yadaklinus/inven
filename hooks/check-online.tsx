"use client"

import { useEffect, useState, useCallback, useRef } from "react"

interface OnlineStatusOptions {
  url?: string;
  interval?: number;
  timeout?: number;
  fallbackUrls?: string[];
  adaptiveInterval?: boolean;
}

export function useOnlineStatus(options: OnlineStatusOptions = {}) {
  const {
    url = "https://ping-v6lv.onrender.com/",
    interval = 5000,
    timeout = 3000,
    fallbackUrls = ["https://www.google.com/favicon.ico", "https://cloudflare.com/favicon.ico"],
    adaptiveInterval = true
  } = options;

  const [online, setOnline] = useState(navigator?.onLine ?? false);
  const [loading, setLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Adaptive interval based on connection stability
  const getAdaptiveInterval = useCallback(() => {
    if (!adaptiveInterval) return interval;
    
    if (consecutiveFailures === 0) {
      return interval; // Normal interval when online
    } else if (consecutiveFailures < 3) {
      return interval * 2; // Slow down on failures
    } else {
      return Math.min(interval * 4, 30000); // Max 30 seconds on repeated failures
    }
  }, [interval, consecutiveFailures, adaptiveInterval]);

  // Enhanced connection check with multiple fallbacks
  const checkConnectionStatus = useCallback(async (): Promise<boolean> => {
    // Cancel any ongoing check
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Check browser's navigator.onLine first (instant)
      if (!navigator.onLine) {
        return false;
      }

      // Primary URL check with timeout
      const primaryCheck = fetch(url, { 
        method: "HEAD",
        signal,
        cache: "no-cache",
        mode: "no-cors"
      }).then(res => true).catch(() => false);

      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      );

      let isOnline = false;
      
      try {
        isOnline = await Promise.race([primaryCheck, timeoutPromise]);
      } catch {
        // If primary fails, try fallback URLs in parallel
        console.log("Primary URL failed, trying fallbacks...");
        
        const fallbackChecks = fallbackUrls.map(fallbackUrl => 
          fetch(fallbackUrl, { 
            method: "HEAD", 
            signal,
            cache: "no-cache",
            mode: "no-cors"
          }).then(() => true).catch(() => false)
        );

        const fallbackResults = await Promise.allSettled(fallbackChecks);
        isOnline = fallbackResults.some(result => 
          result.status === 'fulfilled' && result.value === true
        );
      }

      return isOnline;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Connection check aborted");
      }
      return false;
    } finally {
      abortControllerRef.current = null;
    }
  }, [url, timeout, fallbackUrls]);

  // Optimized status check function
  const checkStatus = useCallback(async () => {
    setLoading(true);
    
    try {
      const isOnline = await checkConnectionStatus();
      
      setOnline(isOnline);
      setLastCheckTime(new Date());
      
      if (isOnline) {
        setConsecutiveFailures(0);
      } else {
        setConsecutiveFailures(prev => prev + 1);
      }
      
    } catch (error) {
      console.error("Connection check error:", error);
      setOnline(false);
      setConsecutiveFailures(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [checkConnectionStatus]);

  useEffect(() => {
    // Listen to browser online/offline events for instant updates
    const handleOnline = () => {
      setOnline(true);
      setConsecutiveFailures(0);
      checkStatus(); // Verify with actual network check
    };
    
    const handleOffline = () => {
      setOnline(false);
      setConsecutiveFailures(prev => prev + 1);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    checkStatus();

    // Set up adaptive interval checking
    const scheduleNextCheck = () => {
      const currentInterval = getAdaptiveInterval();
      timerRef.current = setTimeout(() => {
        checkStatus().then(scheduleNextCheck);
      }, currentInterval);
    };

    scheduleNextCheck();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [checkStatus, getAdaptiveInterval]);

  return { 
    online, 
    loading, 
    lastCheckTime,
    consecutiveFailures,
    checkNow: checkStatus
  };
}
