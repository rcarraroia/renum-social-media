import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  enabled = true,
}: UsePullToRefreshOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if scrolled to top
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      if (distance > 0 && container.scrollTop === 0) {
        // Prevent default scroll behavior
        e.preventDefault();
        
        // Apply resistance (diminishing returns)
        const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
        setPullDistance(resistedDistance);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      setIsPulling(false);

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, isPulling, isRefreshing, pullDistance, threshold, onRefresh]);

  return {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    shouldTrigger: pullDistance >= threshold,
  };
};
