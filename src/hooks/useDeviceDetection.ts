import { useState, useEffect } from "react";

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTouchDevice: boolean;
  screenSize: "sm" | "md" | "lg" | "xl" | "2xl";
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isIOS: false,
        isAndroid: false,
        isTouchDevice: false,
        screenSize: "lg",
      };
    }

    const ua = navigator.userAgent;
    const width = window.innerWidth;

    return {
      isMobile: /iPhone|iPod|Android.*Mobile/i.test(ua) || width < 768,
      isTablet: /iPad|Android(?!.*Mobile)/i.test(ua) || (width >= 768 && width < 1024),
      isDesktop: width >= 1024,
      isIOS: /iPhone|iPad|iPod/i.test(ua),
      isAndroid: /Android/i.test(ua),
      isTouchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      screenSize: getScreenSize(width),
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const ua = navigator.userAgent;
      const width = window.innerWidth;

      setDeviceInfo({
        isMobile: /iPhone|iPod|Android.*Mobile/i.test(ua) || width < 768,
        isTablet: /iPad|Android(?!.*Mobile)/i.test(ua) || (width >= 768 && width < 1024),
        isDesktop: width >= 1024,
        isIOS: /iPhone|iPad|iPod/i.test(ua),
        isAndroid: /Android/i.test(ua),
        isTouchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0,
        screenSize: getScreenSize(width),
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceInfo;
};

function getScreenSize(width: number): "sm" | "md" | "lg" | "xl" | "2xl" {
  if (width < 640) return "sm";
  if (width < 768) return "md";
  if (width < 1024) return "lg";
  if (width < 1280) return "xl";
  return "2xl";
}

// Hook para detectar orientação
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(() => {
    if (typeof window === "undefined") return "portrait";
    return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape");
    };

    window.addEventListener("resize", handleOrientationChange);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", handleOrientationChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  return orientation;
};

// Hook para detectar safe areas (iOS)
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue("--sat") || "0"),
        right: parseInt(style.getPropertyValue("--sar") || "0"),
        bottom: parseInt(style.getPropertyValue("--sab") || "0"),
        left: parseInt(style.getPropertyValue("--sal") || "0"),
      });
    };

    updateSafeArea();
    window.addEventListener("resize", updateSafeArea);

    return () => window.removeEventListener("resize", updateSafeArea);
  }, []);

  return safeArea;
};
