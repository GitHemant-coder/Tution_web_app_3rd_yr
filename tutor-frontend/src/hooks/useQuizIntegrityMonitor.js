/**
 * useQuizIntegrityMonitor.js
 *
 * A reusable React hook that silently monitors suspicious browser activity
 * while a student is taking a quiz.
 *
 * What it tracks (browser APIs only — no camera, no ML):
 *   - TAB_SWITCH  : student switches tab or minimizes browser (visibilitychange)
 *   - FULLSCREEN_EXIT : student leaves fullscreen mode (fullscreenchange)
 *   - WINDOW_BLUR : browser window loses focus (blur event)
 *
 * It does NOT accuse students. It only records events for the teacher to review.
 *
 * Usage:
 *   const { startMonitoring, stopMonitoring, getIntegrityData } = useQuizIntegrityMonitor();
 */

import { useRef, useCallback } from "react";

export default function useQuizIntegrityMonitor() {
  // ── State stored in refs (not useState) so we don't trigger re-renders ──
  const isMonitoring = useRef(false);

  // Timestamps to calculate "time away"
  const awayStartTime = useRef(null); // when student left the page
  const lastEventType = useRef(null); // track last event to avoid duplicates

  // Accumulated data
  const integrityData = useRef({
    tabSwitches: 0,
    fullscreenExits: 0,
    windowBlurs: 0,
    totalTimeAway: 0, // in seconds
    integrityEvents: [], // array of { eventType, timestamp, duration }
  });

  // Callback ref so we can remove the exact same listener later
  const handlersRef = useRef({});

  // ── Helper: record one event ──────────────────────────────────────────────

  const recordEvent = useCallback((eventType, duration = 0) => {
    const data = integrityData.current;
    const event = {
      eventType,
      timestamp: new Date().toISOString(), // exact moment it happened
      duration, // seconds student was away (0 if unknown)
    };

    // Update counters
    if (eventType === "TAB_SWITCH") data.tabSwitches += 1;
    if (eventType === "FULLSCREEN_EXIT") data.fullscreenExits += 1;
    if (eventType === "WINDOW_BLUR") data.windowBlurs += 1;
    data.totalTimeAway += duration;
    data.integrityEvents.push(event);

    console.warn(
      `[Integrity] ${eventType} at ${event.timestamp}, away ${duration.toFixed(1)}s`,
    );

    return event;
  }, []);

  // ── Event Handlers ────────────────────────────────────────────────────────

  /**
   * visibilitychange fires when student switches tab, minimizes window,
   * or the browser tab becomes hidden in any way.
   */
  const onVisibilityChange = useCallback(() => {
    if (!isMonitoring.current) return;

    if (document.hidden) {
      // Student just left the page — record start time
      awayStartTime.current = Date.now();
      lastEventType.current = "TAB_SWITCH";
    } else {
      // Student came back — calculate how long they were away
      if (awayStartTime.current && lastEventType.current === "TAB_SWITCH") {
        const duration = (Date.now() - awayStartTime.current) / 1000; // convert ms to seconds
        recordEvent("TAB_SWITCH", duration);
        awayStartTime.current = null;
        lastEventType.current = null;
      }
    }
  }, [recordEvent]);

  /**
   * fullscreenchange fires when entering or exiting fullscreen.
   * We only care about EXITS (when student leaves fullscreen).
   */
  const onFullscreenChange = useCallback(() => {
    if (!isMonitoring.current) return;

    // document.fullscreenElement is null when NOT in fullscreen
    const isInFullscreen = !!document.fullscreenElement;
    if (!isInFullscreen) {
      // Student just exited fullscreen
      recordEvent("FULLSCREEN_EXIT", 0);
    }
  }, [recordEvent]);

  /**
   * blur fires when the browser WINDOW (not tab) loses focus.
   * This overlaps with visibilitychange sometimes — we avoid double-logging
   * by checking if a TAB_SWITCH was already recorded very recently.
   */
  const onWindowBlur = useCallback(() => {
    if (!isMonitoring.current) return;

    // If the tab is already hidden, visibilitychange already caught this.
    // Only record WINDOW_BLUR if the tab is still visible (e.g., alt-tab to another app
    // without switching browser tabs).
    if (!document.hidden && lastEventType.current !== "TAB_SWITCH") {
      awayStartTime.current = Date.now();
      lastEventType.current = "WINDOW_BLUR";
    }
  }, []);

  /**
   * focus fires when the browser window gets focus back.
   * If the last event was WINDOW_BLUR, calculate duration and record it.
   */
  const onWindowFocus = useCallback(() => {
    if (!isMonitoring.current) return;

    if (awayStartTime.current && lastEventType.current === "WINDOW_BLUR") {
      const duration = (Date.now() - awayStartTime.current) / 1000;
      recordEvent("WINDOW_BLUR", duration);
      awayStartTime.current = null;
      lastEventType.current = null;
    }
  }, [recordEvent]);

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * startMonitoring()
   * Call this when the student clicks "Start Quiz".
   * Attaches all browser event listeners.
   */
  const startMonitoring = useCallback(() => {
    if (isMonitoring.current) return; // already running

    // Reset all data for a fresh attempt
    integrityData.current = {
      tabSwitches: 0,
      fullscreenExits: 0,
      windowBlurs: 0,
      totalTimeAway: 0,
      integrityEvents: [],
    };
    awayStartTime.current = null;
    lastEventType.current = null;
    isMonitoring.current = true;

    // Store handlers so we can remove the exact same function references later
    handlersRef.current = {
      onVisibilityChange,
      onFullscreenChange,
      onWindowBlur,
      onWindowFocus,
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);

    console.log("[Integrity Monitor] Started");
  }, [onVisibilityChange, onFullscreenChange, onWindowBlur, onWindowFocus]);

  /**
   * stopMonitoring()
   * Call this when the student submits the quiz.
   * Removes all event listeners.
   */
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring.current) return;
    isMonitoring.current = false;

    document.removeEventListener(
      "visibilitychange",
      handlersRef.current.onVisibilityChange,
    );
    document.removeEventListener(
      "fullscreenchange",
      handlersRef.current.onFullscreenChange,
    );
    window.removeEventListener("blur", handlersRef.current.onWindowBlur);
    window.removeEventListener("focus", handlersRef.current.onWindowFocus);

    console.log("[Integrity Monitor] Stopped");
  }, []);

  /**
   * getIntegrityData()
   * Returns all collected data. Call this when submitting the quiz
   * to send events to the backend.
   */
  const getIntegrityData = useCallback(() => {
    return { ...integrityData.current };
  }, []);

  /**
   * requestFullscreen()
   * Helper to ask the browser to go fullscreen at quiz start.
   * We wrap this in a try-catch because the browser might deny it.
   */
  const requestFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("[Integrity] Fullscreen request denied:", e.message);
    }
  }, []);

  return {
    startMonitoring,
    stopMonitoring,
    getIntegrityData,
    requestFullscreen,
  };
}
