import { supabase } from "@/integrations/supabase/client";

// Event types
export type AnalyticsEventType =
  | "page_view"
  | "script_generated"
  | "video_recorded"
  | "post_scheduled"
  | "post_published"
  | "assistant_interaction"
  | "error"
  | "friction_point"
  | "feature_used"
  | "user_action";

// Event data structure
export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  event_name: string;
  user_id?: string;
  session_id: string;
  page_path: string;
  page_title: string;
  timestamp: string;
  properties?: Record<string, any>;
  device_info?: {
    userAgent: string;
    platform: string;
    screenWidth: number;
    screenHeight: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
  performance?: {
    loadTime?: number;
    renderTime?: number;
    interactionTime?: number;
  };
}

class AnalyticsService {
  private sessionId: string;
  private queue: AnalyticsEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 10;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
    this.setupBeforeUnload();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private setupBeforeUnload() {
    window.addEventListener("beforeunload", () => {
      this.flush(true);
    });
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      isMobile: /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent) || window.innerWidth < 768,
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) || (window.innerWidth >= 768 && window.innerWidth < 1024),
      isDesktop: window.innerWidth >= 1024,
    };
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }

  async track(
    eventType: AnalyticsEventType,
    eventName: string,
    properties?: Record<string, any>,
    performance?: AnalyticsEvent["performance"]
  ) {
    const userId = await this.getCurrentUserId();

    const event: AnalyticsEvent = {
      event_type: eventType,
      event_name: eventName,
      user_id: userId,
      session_id: this.sessionId,
      page_path: window.location.pathname,
      page_title: document.title,
      timestamp: new Date().toISOString(),
      properties,
      device_info: this.getDeviceInfo(),
      performance,
    };

    // Add to queue
    this.queue.push(event);

    // Save to localStorage as fallback
    this.saveToLocalStorage(event);

    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      await this.flush();
    }
  }

  private saveToLocalStorage(event: AnalyticsEvent) {
    try {
      const stored = localStorage.getItem("analytics_queue");
      const queue = stored ? JSON.parse(stored) : [];
      queue.push(event);
      
      // Keep only last 100 events
      if (queue.length > 100) {
        queue.shift();
      }
      
      localStorage.setItem("analytics_queue", JSON.stringify(queue));
    } catch (error) {
      console.error("Failed to save analytics to localStorage:", error);
    }
  }

  private async flush(sync: boolean = false) {
    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      if (sync && navigator.sendBeacon) {
        // Use sendBeacon for synchronous requests (on page unload)
        const blob = new Blob([JSON.stringify(eventsToSend)], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/track", blob);
      } else {
        // Use regular fetch for async requests
        const { error } = await supabase.from("analytics_events").insert(
          eventsToSend.map((event) => ({
            event_type: event.event_type,
            event_name: event.event_name,
            user_id: event.user_id,
            session_id: event.session_id,
            page_path: event.page_path,
            page_title: event.page_title,
            properties: event.properties,
            device_info: event.device_info,
            performance: event.performance,
            created_at: event.timestamp,
          }))
        );

        if (error) {
          console.error("Failed to send analytics:", error);
          // Re-add to queue on failure
          this.queue.unshift(...eventsToSend);
        } else {
          // Clear localStorage on success
          this.clearLocalStorage(eventsToSend);
        }
      }
    } catch (error) {
      console.error("Failed to flush analytics:", error);
      // Re-add to queue on failure
      this.queue.unshift(...eventsToSend);
    }
  }

  private clearLocalStorage(sentEvents: AnalyticsEvent[]) {
    try {
      const stored = localStorage.getItem("analytics_queue");
      if (!stored) return;

      const queue = JSON.parse(stored);
      const remaining = queue.filter(
        (event: AnalyticsEvent) =>
          !sentEvents.some((sent) => sent.timestamp === event.timestamp)
      );

      localStorage.setItem("analytics_queue", JSON.stringify(remaining));
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  }

  // Convenience methods
  async trackPageView(pageName?: string) {
    await this.track("page_view", pageName || document.title, {
      referrer: document.referrer,
    });
  }

  async trackScriptGenerated(scriptId: string, theme: string, audience: string) {
    await this.track("script_generated", "Script Generated", {
      scriptId,
      theme,
      audience,
    });
  }

  async trackVideoRecorded(duration: number, aspectRatio: string, recordTextInVideo: boolean) {
    await this.track("video_recorded", "Video Recorded", {
      duration,
      aspectRatio,
      recordTextInVideo,
    });
  }

  async trackPostScheduled(platforms: string[], scheduledAt: string) {
    await this.track("post_scheduled", "Post Scheduled", {
      platforms,
      scheduledAt,
      platformCount: platforms.length,
    });
  }

  async trackPostPublished(platform: string, postId: string) {
    await this.track("post_published", "Post Published", {
      platform,
      postId,
    });
  }

  async trackAssistantInteraction(action: string, context?: Record<string, any>) {
    await this.track("assistant_interaction", `Assistant: ${action}`, {
      action,
      ...context,
    });
  }

  async trackError(errorMessage: string, errorStack?: string, context?: Record<string, any>) {
    await this.track("error", errorMessage, {
      errorStack,
      ...context,
    });
  }

  async trackFrictionPoint(point: string, context?: Record<string, any>) {
    await this.track("friction_point", point, context);
  }

  async trackFeatureUsed(featureName: string, context?: Record<string, any>) {
    await this.track("feature_used", featureName, context);
  }

  async trackUserAction(actionName: string, context?: Record<string, any>) {
    await this.track("user_action", actionName, context);
  }

  // Performance tracking
  async trackPerformance(metricName: string, value: number, context?: Record<string, any>) {
    await this.track("feature_used", `Performance: ${metricName}`, context, {
      [metricName]: value,
    });
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(true);
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// React hook for analytics
export const useAnalytics = () => {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackScriptGenerated: analytics.trackScriptGenerated.bind(analytics),
    trackVideoRecorded: analytics.trackVideoRecorded.bind(analytics),
    trackPostScheduled: analytics.trackPostScheduled.bind(analytics),
    trackPostPublished: analytics.trackPostPublished.bind(analytics),
    trackAssistantInteraction: analytics.trackAssistantInteraction.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackFrictionPoint: analytics.trackFrictionPoint.bind(analytics),
    trackFeatureUsed: analytics.trackFeatureUsed.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
  };
};
