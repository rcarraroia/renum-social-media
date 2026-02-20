import { useCallback } from "react";
import { useDeviceDetection } from "./useDeviceDetection";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export const useHapticFeedback = () => {
  const { isMobile, isTouchDevice } = useDeviceDetection();

  const vibrate = useCallback(
    (pattern: HapticPattern = "light") => {
      // Only vibrate on mobile/touch devices
      if (!isMobile && !isTouchDevice) return;
      if (!navigator.vibrate) return;

      const patterns: Record<HapticPattern, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 30,
        success: [10, 50, 10],
        warning: [20, 100, 20],
        error: [30, 100, 30, 100, 30],
      };

      navigator.vibrate(patterns[pattern]);
    },
    [isMobile, isTouchDevice]
  );

  return { vibrate };
};
