"use client";

import { useEffect, useState } from "react";
import { getThreeShift } from "@repo/utils";

interface SystemMetrics {
  websocketLatency: number; // mock latency in ms
  serverTimeSAST: string; // SAST formatted time string HH:MM:SS
  currentShift: {
    shift: "A" | "B" | "C";
    label: string;
    start: string;
    end: string;
  };
  online: boolean;
}

/**
 * useSystemMetrics
 *
 * Custom hook to monitor system runtime metrics:
 * - Websocket latency (with realistic jitter and spikes)
 * - Server time tracked in South African Standard Time (SAST)
 * - Current operational shift calculated using getThreeShift
 * - Online connection status tracked via browser network events
 */
export function useSystemMetrics(): SystemMetrics {
  const [metrics, setMetrics] = useState<SystemMetrics>(() => {
    const now = new Date();
    return {
      websocketLatency: 15,
      serverTimeSAST: now.toLocaleTimeString("en-US", {
        timeZone: "Africa/Johannesburg",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      currentShift: getThreeShift(now),
      online: typeof window !== "undefined" ? window.navigator.onLine : true,
    };
  });

  useEffect(() => {
    // Network status change listeners
    const handleOnline = () => setMetrics((prev) => ({ ...prev, online: true }));
    const handleOffline = () => setMetrics((prev) => ({ ...prev, online: false }));

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    // Tick clock and update shift every second
    const clockInterval = setInterval(() => {
      const now = new Date();
      const serverTimeSAST = now.toLocaleTimeString("en-US", {
        timeZone: "Africa/Johannesburg",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const currentShift = getThreeShift(now);

      setMetrics((prev) => ({
        ...prev,
        serverTimeSAST,
        currentShift,
      }));
    }, 1000);

    // Simulate websocket latency update every 3 seconds
    const updateLatency = () => {
      const base = 12;
      const jitter = Math.floor(Math.random() * 15);
      const spike = Math.random() > 0.95 ? Math.floor(Math.random() * 45) : 0; // 5% chance of spike
      const newLatency = base + jitter + spike;

      setMetrics((prev) => ({
        ...prev,
        websocketLatency: newLatency,
      }));
    };

    updateLatency();
    const latencyInterval = setInterval(updateLatency, 3000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(latencyInterval);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  return metrics;
}
