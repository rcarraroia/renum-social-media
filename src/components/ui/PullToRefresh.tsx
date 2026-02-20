import React from "react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  threshold,
  isRefreshing,
}) => {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
      style={{
        height: `${Math.min(pullDistance, threshold * 1.5)}px`,
        opacity: pullDistance > 0 ? 1 : 0,
      }}
    >
      <div className="flex flex-col items-center gap-2">
        {isRefreshing ? (
          <>
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-600 font-medium">Atualizando...</span>
          </>
        ) : (
          <>
            <div className="relative w-8 h-8">
              <svg
                className="w-8 h-8 transform transition-transform"
                style={{
                  transform: shouldTrigger ? "rotate(180deg)" : "rotate(0deg)",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  className={shouldTrigger ? "text-indigo-600" : "text-slate-400"}
                />
              </svg>
              <svg
                className="absolute inset-0 w-8 h-8 -rotate-90"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2"
                  strokeDasharray="100"
                  strokeDashoffset={100 - progress}
                  className="transition-all duration-200"
                />
              </svg>
            </div>
            <span className="text-sm text-slate-600 font-medium">
              {shouldTrigger ? "Solte para atualizar" : "Puxe para atualizar"}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

interface PullToRefreshContainerProps {
  children: React.ReactNode;
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const PullToRefreshContainer: React.FC<PullToRefreshContainerProps> = ({
  children,
  pullDistance,
  threshold,
  isRefreshing,
  containerRef,
}) => {
  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto h-full"
      style={{
        paddingTop: isRefreshing ? `${threshold}px` : "0",
        transition: isRefreshing ? "padding-top 0.3s ease-out" : "none",
      }}
    >
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        threshold={threshold}
        isRefreshing={isRefreshing}
      />
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold * 1.5)}px)`,
          transition: pullDistance === 0 ? "transform 0.3s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};
