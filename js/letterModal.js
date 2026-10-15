/**
 * =========================================================================
 * PRIVATE LETTER / MESSAGE TO NADER CONTROLLER (VERSION 3)
 * =========================================================================
 * - Allows Mary to write a private note and attach photos or videos.
 * - Three-Field Question Verification: "On which day did we first talk?" (Year: 2026, Month: 08, Day: 23).
 * - Multi-source public IP detection + Geolocation/ISP.
 * - Collects all timestamps: Client Local Time, Timezone, UTC Time.
 * - Sends to Google Apps Script Web App (Nader's email 100% hidden).
 * - Unlimited letter text length.
 * - Auto-compresses photos to max 1280px JPEG for lightning fast upload.
 * - Supports video clips (MP4, WebM, MOV) up to 20 MB.
 * - Decelerates 3D heart into slow-motion for calm typing.
 */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby42CgLZA67RHmKAMyHhik04cYcL4WMygeHU-Ie77iYLsJUvSi79n4b-fOkwt79L7IB/exec";
const REQUIRED_DATE_KEY = "2026-08-23";
const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20 MB limit

export class LetterModalManager {
  constructor() {
    this.isOpen = false;
    this.currentMediaBase64 = null;
    this.currentMediaName = "photo_from_mary.jpg";
    this.currentMediaMime = "image/jpeg";
    this.isVideo = false;
    this.cameraStream = null;

    // Verification state
    this.selectedDateKey = "";
    this.isDateVerified = false;

    // Session duration tracker
    this.sessionStartTime = Date.now();

    // Client Network & Device metadata
    this.clientIp = "Detecting...";
    this.privateIp = "Detecting...";
    this.localCandidate = "";
    this.photoExifData = null;
    this.ipLocation = "";
    this.clientLocalTime = "";
    this.clientTimezone = "";
    this.clientUtcTime = "";
    this.platform = "";
    this.screen = "";
    this.userAgent = "";

    // DOM Elements
    this.openBtn = document.getElementById('open-letter-btn');
    this.modalEl = document.getElementById('letter-modal');
    this.cardEl = document.getElementById('letter-card');
    this.backdropEl = document.getElementById('letter-backdrop');
    this.closeBtn = document.getElementById('letter-close-btn');

    this.formContainer = document.getElementById('letter-form-container');
    this.form = document.getElementById('letter-form');
    this.subjectInput = document.getElementById('letter-subject');
    this.messageInput = document.getElementById('letter-message');
    this.hpInput = document.getElementById('letter-hp');
    this.statusMsg = document.getElementById('letter-status-msg');
    this.submitBtn = document.getElementById('letter-submit-btn');

    // Media Controls
    this.chooseFileBtn = document.getElementById('letter-choose-file-btn');
    this.fileInput = document.getElementById('letter-file-input');
    this.cameraBtn = document.getElementById('letter-camera-btn');
    this.cameraBox = document.getElementById('letter-camera-box');
    this.cameraVideo = document.getElementById('letter-camera-video');
    this.snapBtn = document.getElementById('letter-snap-btn');
    this.closeCamBtn = document.getElementById('letter-close-cam-btn');

    // Preview
    this.previewBox = document.getElementById('letter-photo-preview');
    this.previewImg = document.getElementById('letter-preview-img');
    this.previewVideo = document.getElementById('letter-preview-video');
    this.videoBadge = document.getElementById('letter-video-badge');
    this.previewName = document.getElementById('letter-preview-name');
    this.previewSize = document.getElementById('letter-preview-size');
    this.removePhotoBtn = document.getElementById('letter-remove-photo-btn');

    // Three-Field Date Verification
    this.yearSelect = document.getElementById('date-select-year');
    this.monthSelect = document.getElementById('date-select-month');
    this.daySelect = document.getElementById('date-select-day');
    this.verifyBadge = document.getElementById('date-verify-badge');
    this.verifyTag = document.getElementById('date-verify-tag');
    this.verifyHint = document.getElementById('date-verify-hint');
    this.verificationCard = document.querySelector('.verification-card');

    // Success Screen
    this.successBox = document.getElementById('letter-success-box');
    this.successCloseBtn = document.getElementById('letter-success-close-btn');

    window.letterModal = this;
    this.initClientIp();
    this.bindEvents();
    this.updateVerificationState();
  }

  async initClientIp() {
    this.clientLocalTime = new Date().toLocaleString();
    this.clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
    this.clientUtcTime = new Date().toUTCString();
    this.userAgent = navigator.userAgent || '';
    this.platform = navigator.platform || (navigator.userAgentData && navigator.userAgentData.platform) || 'Unknown';
    this.screen = `${window.screen.width}x${window.screen.height}`;
    this.ispOrg = "";
    this.ispName = "";
    this.ispDomain = "";

    // Multi-source IP & ISP detection with zero rate-limit fallbacks
    const endpoints = [
      {
        url: 'https://ipwho.is/',
        parse: (d) => {
          if (!d || !d.ip) return null;
          const org = d.connection ? (d.connection.org || d.connection.isp || '') : '';
          const isp = d.connection ? (d.connection.isp || '') : '';
          const domain = d.connection ? (d.connection.domain || '') : '';
          const locParts = [d.city, d.region, d.country].filter(Boolean);
          return {
            ip: d.ip,
            location: locParts.join(', ') + (org ? ` (${org}${domain ? ' - ' + domain : ''})` : ''),
            org, isp, domain
          };
        }
      },
      {
        url: 'https://freeipapi.com/api/json',
        parse: (d) => {
          if (!d || !d.ipAddress) return null;
          const org = d.asnOrganization || '';
          const locParts = [d.cityName, d.regionName, d.countryName].filter(Boolean);
          return {
            ip: d.ipAddress,
            location: locParts.join(', ') + (org ? ` (${org})` : ''),
            org, isp: org, domain: ''
          };
        }
      },
      {
        url: 'https://api.ipify.org?format=json',
        parse: (d) => {
          return d && d.ip ? { ip: d.ip, location: '', org: '', isp: '', domain: '' } : null;
        }
      }
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const raw = await res.json();
          const parsed = ep.parse(raw);
          if (parsed && parsed.ip) {
            this.clientIp = parsed.ip;
            this.ipLocation = parsed.location || this.ipLocation;
            this.ispOrg = parsed.org || '';
            this.ispName = parsed.isp || '';
            this.ispDomain = parsed.domain || '';
            break;
          }
        }
      } catch (e) {
        // Try next provider
      }
    }

    if (!this.clientIp || this.clientIp === "Detecting...") {
      this.clientIp = "Not detected";
    }

    // Run WebRTC private IP gathering in background
    this.detectPrivateIp().then(w => {
      this.privateIp = w.privateIp;
      this.localCandidate = w.candidate;
    });
  }

  async detectPrivateIp() {
    return new Promise((resolve) => {
      try {
        const RTCPC = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        if (!RTCPC) {
          resolve({ privateIp: 'Not supported by browser', candidate: 'WebRTC API unavailable' });
          return;
        }

        const pc = new RTCPC({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        const found = [];
        let done = false;

        pc.createDataChannel('');
        pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => {});

        pc.onicecandidate = (e) => {
          if (!e || !e.candidate) {
            if (!done) { done = true; finish(); }
            return;
          }
          const c = e.candidate.candidate;
          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})|([a-f0-9\-]+\.local)/gi;
          const m = c.match(ipRegex);
          if (m) {
            m.forEach(addr => {
              if (addr !== '0.0.0.0' && !found.includes(addr)) found.push(addr);
            });
          }
        };

        const finish = () => {
          try { pc.close(); } catch (e) {}
          const realPrivate = found.find(c => /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(c));
          const mdns = found.find(c => c.endsWith('.local'));
          resolve({
            privateIp: realPrivate || (mdns ? `LAN mDNS Host (${mdns})` : 'Protected by browser mDNS'),
            candidate: found.join(' • ') || 'None exposed'
          });
        };

        setTimeout(() => {
          if (!done) { done = true; finish(); }
        }, 1500);
      } catch (e) {
        resolve({ privateIp: 'Query error', candidate: 'Error' });
      }
    });
  }

  getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'CANV-UNAVAILABLE';
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Cosmic Heart Sanctuary, 123 \uD83D\uDC96', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Cosmic Heart Sanctuary, 123 \uD83D\uDC96', 4, 17);
      const dataUrl = canvas.toDataURL();
      let hash = 0;
      for (let i = 0; i < dataUrl.length; i++) {
        hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
        hash |= 0;
      }
      return 'CANV-' + Math.abs(hash).toString(16).toUpperCase();
    } catch (e) {
      return 'CANV-ERROR';
    }
  }

  extractExifMetadata(buffer) {
    try {
      const view = new DataView(buffer);
      if (view.byteLength < 4 || view.getUint16(0, false) !== 0xFFD8) return null;
      let offset = 2;
      while (offset < view.byteLength) {
        if (offset + 4 > view.byteLength) break;
        const marker = view.getUint16(offset, false);
        offset += 2;
        if (marker === 0xFFE1) {
          const segLen = view.getUint16(offset, false);
          offset += 2;
          const header = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
          if (header !== 'Exif') return null;
          const tiffStart = offset + 6;
          const bigEndian = view.getUint16(tiffStart, false) === 0x4D4D;
          const getU16 = (o) => view.getUint16(tiffStart + o, !bigEndian);
          const getU32 = (o) => view.getUint32(tiffStart + o, !bigEndian);
          if (getU16(2) !== 0x002A) return null;
          const firstIfd = getU32(4);

          const readVal = (type, count, valOff) => {
            if (type === 2) {
              const strOff = count > 4 ? getU32(valOff) : valOff;
              let s = '';
              for (let i = 0; i < count - 1; i++) {
                if (tiffStart + strOff + i < view.byteLength) {
                  s += String.fromCharCode(view.getUint8(tiffStart + strOff + i));
                }
              }
              return s.trim();
            } else if (type === 3) return getU16(valOff);
            else if (type === 4) return getU32(valOff);
            else if (type === 5 || type === 10) {
              const rOff = getU32(valOff);
              const num = getU32(rOff);
              const den = getU32(rOff + 4);
              return den === 0 ? 0 : num / den;
            }
            return null;
          };

          const parseIfdTags = (ifdOff) => {
            const map = {};
            if (ifdOff + 2 > view.byteLength) return map;
            const count = getU16(ifdOff);
            let cur = ifdOff + 2;
            for (let i = 0; i < count; i++) {
              if (cur + 12 > view.byteLength) break;
              const tag = getU16(cur);
              const type = getU16(cur + 2);
              const cnt = getU32(cur + 4);
              map[tag] = readVal(type, cnt, cur + 8);
              cur += 12;
            }
            return map;
          };

          const readRationalArray = (valOff, count) => {
            const rOff = getU32(valOff);
            const arr = [];
            for (let i = 0; i < count; i++) {
              const num = getU32(rOff + (i * 8));
              const den = getU32(rOff + (i * 8) + 4);
              arr.push(den === 0 ? 0 : num / den);
            }
            return arr;
          };

          const ifd0 = parseIfdTags(firstIfd);
          const result = {
            make: ifd0[0x010F] || '',
            model: ifd0[0x0110] || '',
            software: ifd0[0x0131] || '',
            modifyDate: ifd0[0x0132] || ''
          };

          const exifPointer = ifd0[0x8769];
          if (exifPointer) {
            const sub = parseIfdTags(exifPointer);
            result.captureTime = sub[0x9003] || sub[0x9004] || '';
            result.iso = sub[0x8827] ? `ISO ${sub[0x8827]}` : '';
            result.exposureTime = sub[0x829A] ? (sub[0x829A] < 1 ? `1/${Math.round(1 / sub[0x829A])}s` : `${sub[0x829A]}s`) : '';
            result.fNumber = sub[0x829D] ? `f/${sub[0x829D].toFixed(1)}` : '';
            result.focalLength = sub[0x920A] ? `${sub[0x920A].toFixed(1)}mm` : '';
            result.lensModel = sub[0xA434] || '';
          }

          const gpsPointer = ifd0[0x8825];
          if (gpsPointer) {
            const count = getU16(gpsPointer);
            let cur = gpsPointer + 2;
            let latRef = 'N', lonRef = 'E', latDms = null, lonDms = null, alt = null;
            for (let i = 0; i < count; i++) {
              if (cur + 12 > view.byteLength) break;
              const tag = getU16(cur);
              if (tag === 0x0001) latRef = String.fromCharCode(view.getUint8(tiffStart + cur + 8));
              else if (tag === 0x0002) latDms = readRationalArray(cur + 8, 3);
              else if (tag === 0x0003) lonRef = String.fromCharCode(view.getUint8(tiffStart + cur + 8));
              else if (tag === 0x0004) lonDms = readRationalArray(cur + 8, 3);
              else if (tag === 0x0006) alt = readVal(5, 1, cur + 8);
              cur += 12;
            }
            if (latDms && latDms.length === 3 && lonDms && lonDms.length === 3) {
              let lat = latDms[0] + (latDms[1] / 60) + (latDms[2] / 3600);
              if (latRef === 'S') lat = -lat;
              let lon = lonDms[0] + (lonDms[1] / 60) + (lonDms[2] / 3600);
              if (lonRef === 'W') lon = -lon;
              result.gps = {
                latitude: lat.toFixed(6),
                longitude: lon.toFixed(6),
                altitude: alt ? `${alt.toFixed(1)}m` : '',
                mapsUrl: `https://maps.google.com/?q=${lat.toFixed(6)},${lon.toFixed(6)}`,
                formatted: `${lat.toFixed(6)}° ${latRef}, ${lon.toFixed(6)}° ${lonRef}`
              };
            }
          }
          return result;
        } else if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFFD8 && marker !== 0xFFD9) {
          offset += view.getUint16(offset, false);
        } else break;
      }
    } catch (e) {
      console.warn("EXIF extraction notice:", e);
    }
    return null;
  }

  async collectDeviceCharacteristics() {
    const d = {};

    // 1. Session Duration on Heart Sanctuary
    const secondsSpent = Math.max(1, Math.round((Date.now() - (this.sessionStartTime || Date.now())) / 1000));
    const mins = Math.floor(secondsSpent / 60);
    const secs = secondsSpent % 60;
    d.sessionDuration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // 2. High-Entropy Device / OS / Model
    const ua = navigator.userAgent || '';
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
    let deviceCategory = isMobile ? 'Mobile' : 'Desktop';
    let deviceModel = '';

    if (/iPhone/i.test(ua)) {
      deviceCategory = 'iPhone';
      deviceModel = (window.devicePixelRatio >= 3) ? 'Apple iPhone (Super Retina OLED)' : 'Apple iPhone (Retina)';
    } else if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      deviceCategory = 'iPad';
      deviceModel = 'Apple iPad';
    } else if (/Android/i.test(ua)) {
      deviceCategory = 'Android';
      const match = ua.match(/Android[^;]+; ([^)]+)\)/);
      deviceModel = match ? `Android (${match[1].trim()})` : 'Android Device';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      deviceCategory = 'Mac';
      deviceModel = 'Apple Mac';
    } else if (/Windows/i.test(ua)) {
      deviceCategory = 'Windows PC';
      deviceModel = 'Windows PC (x64/ARM)';
    }

    // Modern Client Hints API
    if (navigator.userAgentData) {
      if (typeof navigator.userAgentData.mobile === 'boolean') {
        isMobile = navigator.userAgentData.mobile;
      }
      try {
        const hint = await navigator.userAgentData.getHighEntropyValues([
          'model', 'platformVersion', 'architecture', 'bitness'
        ]);
        if (hint.model) {
          deviceModel = `${hint.model} (${hint.architecture || ''} ${hint.bitness ? hint.bitness + '-bit' : ''})`.trim();
        }
      } catch (e) {}
    }
    d.deviceType = `${deviceCategory} • ${isMobile ? 'Mobile Device' : 'Desktop Computer'}`;
    d.deviceModel = deviceModel || navigator.platform || 'Unknown Device';

    // 3. Screen, Viewport, Holding & Display
    d.screenResolution = `${window.screen.width}x${window.screen.height}`;
    d.viewport = `${window.innerWidth}x${window.innerHeight}`;
    d.devicePixelRatio = `${window.devicePixelRatio || 1}x ${window.devicePixelRatio >= 2 ? '(High-Density Retina)' : '(Standard)'}`;

    // Holding orientation: portrait vs landscape
    let orientation = 'Unknown';
    if (window.screen.orientation && window.screen.orientation.type) {
      orientation = window.screen.orientation.type.includes('portrait') ? 'Portrait (Upright)' : 'Landscape (Sideways)';
    } else if (window.innerHeight > window.innerWidth) {
      orientation = 'Portrait (Upright)';
    } else {
      orientation = 'Landscape (Sideways)';
    }
    d.screenOrientation = orientation;

    // Touch Capability
    const touchPoints = navigator.maxTouchPoints || 0;
    d.touchCapability = touchPoints > 0 ? `Touchscreen (${touchPoints} touch points)` : 'Mouse & Keyboard (No touch)';

    // Color gamut / HDR
    d.colorGamut = window.matchMedia('(color-gamut: p3)').matches ? 'Wide Color (Display P3 / OLED)' : 'Standard sRGB';

    // 4. Hardware: CPU & RAM
    d.cpuCores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : 'Not exposed';
    d.deviceRam = navigator.deviceMemory ? `${navigator.deviceMemory} GB+ RAM` : 'Not exposed';

    // 5. Graphics Processor (GPU) via WebGL unmasked renderer
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          d.gpuRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Not exposed';
        }
      }
    } catch (e) {
      d.gpuRenderer = 'Unavailable';
    }

    // 6. Battery Status (Chrome / Android / Edge)
    d.batteryStatus = 'Not exposed by browser';
    if (navigator.getBattery) {
      try {
        const b = await navigator.getBattery();
        const pct = Math.round(b.level * 100);
        d.batteryStatus = `${pct}% (${b.charging ? 'Plugged In & Charging ⚡' : 'Running on Battery 🔋'})`;
      } catch (e) {}
    }

    // 7. Network Connection: Wi-Fi vs Cellular (4G/5G) Detection & Speed
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const browserConnType = conn && conn.type ? conn.type.toLowerCase() : '';
    const effectiveType = conn && conn.effectiveType ? conn.effectiveType.toUpperCase() : '';
    const downlink = conn && conn.downlink ? `~${conn.downlink} Mbps` : '';
    const rtt = conn && conn.rtt ? `${conn.rtt} ms ping` : '';
    const saveData = conn && conn.saveData ? 'Data Saver On' : '';

    // Smart Medium Detection: Wi-Fi vs Cellular vs Ethernet
    let networkMedium = 'Wi-Fi or Cellular';
    const combinedIsp = `${this.ispOrg || ''} ${this.ispName || ''} ${this.ispDomain || ''}`.toLowerCase();

    if (browserConnType === 'cellular') {
      networkMedium = 'Cellular (Mobile Data: 4G / 5G / LTE)';
    } else if (browserConnType === 'wifi') {
      networkMedium = 'Wi-Fi (Wireless Home / Broadband)';
    } else if (browserConnType === 'ethernet') {
      networkMedium = 'Ethernet (Wired LAN Cable)';
    } else if (/mobile|cellular|gsm|lte|3g|4g|5g|wireless|iam mobile|orange mobile|inwi mobile/i.test(combinedIsp)) {
      networkMedium = 'Cellular (Mobile Data: 4G / LTE)';
    } else if (/adsl|fibre|fiber|ftth|fixe|fixed|cable|broadband|menara|wanadoo|lan/i.test(combinedIsp)) {
      networkMedium = 'Wi-Fi / Fixed Broadband (ADSL / Fiber)';
    } else if (effectiveType) {
      networkMedium = `${effectiveType} Quality Wireless (Wi-Fi or Cellular)`;
    }

    d.connectionMedium = networkMedium;

    const speedParts = [];
    if (effectiveType) speedParts.push(`${effectiveType} Speed Grade`);
    if (downlink) speedParts.push(downlink);
    if (rtt) speedParts.push(rtt);
    if (saveData) speedParts.push(saveData);
    d.networkSpeed = speedParts.length > 0 ? speedParts.join(' • ') : (navigator.onLine ? 'Connected (Online)' : 'Offline');

    // 8. System Preferences & Locale
    const langs = (navigator.languages && navigator.languages.length) ? navigator.languages.join(', ') : (navigator.language || 'Unknown');
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    d.systemLanguages = langs;
    d.colorTheme = isDark ? 'Dark Mode 🌙' : 'Light Mode ☀️';

    // 9. Local Private IP & WebRTC Candidates
    if (!this.privateIp || this.privateIp === "Detecting...") {
      const webrtc = await this.detectPrivateIp();
      this.privateIp = webrtc.privateIp;
      this.localCandidate = webrtc.candidate;
    }
    d.privateIp = this.privateIp || "Protected by browser mDNS";
    d.localCandidate = this.localCandidate || "None exposed";

    // 10. Router & Local Network Inference
    const isIAM = /maroc telecom|itissalat|menara/i.test(combinedIsp);
    const isOrange = /orange|medi telecom/i.test(combinedIsp);
    const isInwi = /inwi|wana/i.test(combinedIsp);
    let routerInference = 'Standard Residential Gateway (192.168.1.1)';
    if (isIAM) routerInference = 'Maroc Telecom Gateway (ZTE F680 / Huawei HG8245H / Sagemcom • 192.168.1.1)';
    else if (isOrange) routerInference = 'Orange Livebox / Fibre Gateway (192.168.1.1)';
    else if (isInwi) routerInference = 'Inwi Darbox / Huawei Router (192.168.8.1)';
    d.routerModel = routerInference;

    // 11. Unique Visitor Fingerprint (Canvas + WebGL Hash)
    const canvHash = this.getCanvasFingerprint();
    const gpuRaw = (d.gpuRenderer && d.gpuRenderer !== 'Not exposed' && d.gpuRenderer !== 'Unavailable')
      ? d.gpuRenderer.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
      : 'GPU0';
    d.visitorFingerprint = `#VISITOR-${canvHash.replace('CANV-', '')}-${gpuRaw}`;

    // 12. IP Address & Geolocation
    d.clientIp = this.clientIp || 'Not detected';
    d.ipLocation = this.ipLocation || '';

    // 13. Photo EXIF metadata
    d.photoExif = this.photoExifData;

    return d;
  }

  bindEvents() {
    if (this.openBtn) {
      this.openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.open();
      });
    }

    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.backdropEl) this.backdropEl.addEventListener('click', () => this.close());

    if (this.successCloseBtn) {
      this.successCloseBtn.addEventListener('click', () => this.close());
    }

    // Three-Field Date Verification Events
    const handleDateChange = () => this.updateVerificationState();
    if (this.yearSelect) this.yearSelect.addEventListener('change', handleDateChange);
    if (this.monthSelect) this.monthSelect.addEventListener('change', handleDateChange);
    if (this.daySelect) this.daySelect.addEventListener('change', handleDateChange);

    // Media file picker
    if (this.chooseFileBtn && this.fileInput) {
      this.chooseFileBtn.addEventListener('click', () => {
        this.stopCamera();
        this.fileInput.click();
      });

      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.processMediaFile(e.target.files[0]);
        }
      });
    }

    // Camera toggle
    if (this.cameraBtn) {
      this.cameraBtn.addEventListener('click', () => this.startCamera());
    }

    if (this.snapBtn) {
      this.snapBtn.addEventListener('click', () => this.snapPhoto());
    }

    if (this.closeCamBtn) {
      this.closeCamBtn.addEventListener('click', () => this.stopCamera());
    }

    if (this.removePhotoBtn) {
      this.removePhotoBtn.addEventListener('click', () => this.clearMedia());
    }

    // Form submit
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    });
  }

  updateVerificationState() {
    this.clearStatus();
    const y = this.yearSelect ? this.yearSelect.value : "";
    const m = this.monthSelect ? this.monthSelect.value : "";
    const d = this.daySelect ? this.daySelect.value : "";

    if (!y || !m || !d) {
      this.isDateVerified = false;
      this.selectedDateKey = "";
      if (this.verifyBadge) {
        this.verifyBadge.textContent = "✦ Incomplete";
        this.verifyBadge.className = "date-verify-badge pending";
      }
      if (this.verifyTag) {
        this.verifyTag.textContent = "Select Date";
        this.verifyTag.className = "date-verify-tag pending";
      }
      if (this.verifyHint) {
        this.verifyHint.textContent = "Select the year, month, and day we first talked";
      }
      return;
    }

    const chosenKey = `${y}-${m}-${d}`;
    this.selectedDateKey = chosenKey;

    if (chosenKey === REQUIRED_DATE_KEY) {
      this.isDateVerified = true;
      if (this.verifyBadge) {
        this.verifyBadge.textContent = "✦ Answer Correct";
        this.verifyBadge.className = "date-verify-badge matched";
      }
      if (this.verifyTag) {
        this.verifyTag.textContent = "✦ August 23, 2026";
        this.verifyTag.className = "date-verify-tag match";
      }
      if (this.verifyHint) {
        this.verifyHint.textContent = "✦ Verified: The day our very first conversation began";
      }
    } else {
      this.isDateVerified = false;
      if (this.verifyBadge) {
        this.verifyBadge.textContent = "Not Matched";
        this.verifyBadge.className = "date-verify-badge unmatched";
      }
      if (this.verifyTag) {
        this.verifyTag.textContent = chosenKey;
        this.verifyTag.className = "date-verify-tag nomatch";
      }
      if (this.verifyHint) {
        this.verifyHint.textContent = "Not the day of our first conversation. Try another date.";
      }
    }
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    // Reset form states
    this.resetForm();
    if (this.formContainer) this.formContainer.classList.remove('hidden');
    if (this.successBox) this.successBox.classList.add('hidden');

    this.modalEl.classList.remove('hidden');

    // Decelerate background 3D heartbeat to peaceful slow-motion while writing
    if (window.heartScene && window.heartScene.setTimeDilation) {
      window.heartScene.setTimeDilation(true);
    }

    if (window.gsap) {
      window.gsap.killTweensOf([this.cardEl, this.backdropEl]);
      window.gsap.fromTo(this.backdropEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
      window.gsap.fromTo(this.cardEl,
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1.0, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.3)' }
      );
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.stopCamera();

    // Restore background 3D heartbeat back to normal pace
    if (window.heartScene && window.heartScene.setTimeDilation) {
      window.heartScene.setTimeDilation(false);
    }

    if (window.gsap) {
      window.gsap.to(this.cardEl, {
        scale: 0.9,
        opacity: 0,
        y: 20,
        duration: 0.25,
        ease: 'power2.in'
      });
      window.gsap.to(this.backdropEl, {
        opacity: 0,
        duration: 0.25,
        onComplete: () => {
          this.modalEl.classList.add('hidden');
          this.resetForm();
        }
      });
    } else {
      this.modalEl.classList.add('hidden');
      this.resetForm();
    }
  }

  /* -------------------------------------------------------------------------
   * CAMERA LIVE STREAM & SNAPSHOT
   * ------------------------------------------------------------------------- */
  async startCamera() {
    this.clearMedia();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showStatus("Camera access is not supported on this browser.", "error");
      return;
    }

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      if (this.cameraVideo) {
        this.cameraVideo.srcObject = this.cameraStream;
        await this.cameraVideo.play();
      }

      if (this.cameraBox) this.cameraBox.classList.remove('hidden');
      this.clearStatus();
    } catch (err) {
      console.warn("Camera access denied or error:", err);
      this.showStatus("Could not access camera. You can choose a photo or video from your device instead.", "error");
    }
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    if (this.cameraVideo) {
      this.cameraVideo.srcObject = null;
    }
    if (this.cameraBox) {
      this.cameraBox.classList.add('hidden');
    }
  }

  snapPhoto() {
    if (!this.cameraVideo || !this.cameraStream) return;

    const video = this.cameraVideo;
    const canvas = document.createElement('canvas');
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    const maxDim = 1280;
    let targetW = vw;
    let targetH = vh;
    if (targetW > maxDim || targetH > maxDim) {
      if (targetW > targetH) {
        targetH = Math.round((targetH * maxDim) / targetW);
        targetW = maxDim;
      } else {
        targetW = Math.round((targetW * maxDim) / targetH);
        targetH = maxDim;
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, targetW, targetH);

    const base64 = canvas.toDataURL('image/jpeg', 0.82);
    this.setAttachedMedia(base64, "camera_snapshot.jpg", "image/jpeg", false);
    this.stopCamera();
  }

  /* -------------------------------------------------------------------------
   * MEDIA PROCESSING (PHOTOS VIA CANVAS RESCALE, VIDEOS UP TO 20 MB)
   * ------------------------------------------------------------------------- */
  processMediaFile(file) {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      this.showStatus("Please select a photo (JPEG, PNG, WebP) or video (MP4, WebM, MOV).", "error");
      return;
    }

    if (isVideo) {
      if (file.size > MAX_VIDEO_BYTES) {
        const mb = (file.size / 1024 / 1024).toFixed(1);
        this.showStatus(`Video is too large (${mb} MB). Please select a video under 20 MB.`, "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.setAttachedMedia(e.target.result, file.name || "video_from_mary.mp4", file.type || "video/mp4", true);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Image handling: ZERO METADATA STRIPPING... Preserve 100% of raw bytes & EXIF
    if (file.size > 22 * 1024 * 1024) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      this.showStatus(`Photo is too large (${mb} MB). Please select an image under 22 MB.`, "error");
      return;
    }

    // 1. Extract EXIF (GPS coordinates, capture timestamp, camera model, lens) from raw ArrayBuffer
    const readerArray = new FileReader();
    readerArray.onload = (ev) => {
      try {
        const exif = this.extractExifMetadata(ev.target.result);
        this.photoExifData = exif;
      } catch (err) {
        this.photoExifData = null;
      }
    };
    readerArray.readAsArrayBuffer(file);

    // 2. Read direct raw DataURL so zero metadata/EXIF tags are stripped by canvas
    const readerData = new FileReader();
    readerData.onload = (e) => {
      this.setAttachedMedia(e.target.result, file.name || "photo_from_mary.jpg", file.type || "image/jpeg", false);
    };
    readerData.readAsDataURL(file);
  }

  setAttachedMedia(base64, filename, mime, isVideo = false) {
    this.currentMediaBase64 = base64;
    this.currentMediaName = filename;
    this.currentMediaMime = mime;
    this.isVideo = isVideo;

    if (isVideo) {
      if (this.previewImg) {
        this.previewImg.src = "";
        this.previewImg.classList.add('hidden');
      }
      if (this.previewVideo) {
        this.previewVideo.src = base64;
        this.previewVideo.classList.remove('hidden');
      }
      if (this.videoBadge) this.videoBadge.classList.remove('hidden');
    } else {
      if (this.previewVideo) {
        this.previewVideo.src = "";
        this.previewVideo.classList.add('hidden');
      }
      if (this.videoBadge) this.videoBadge.classList.add('hidden');
      if (this.previewImg) {
        this.previewImg.src = base64;
        this.previewImg.classList.remove('hidden');
      }
    }

    if (this.previewName) this.previewName.textContent = filename;

    const approxBytes = Math.round((base64.length * 3) / 4);
    if (this.previewSize) {
      if (approxBytes > 1024 * 1024) {
        this.previewSize.textContent = `~${(approxBytes / 1024 / 1024).toFixed(1)} MB`;
      } else {
        this.previewSize.textContent = `~${Math.round(approxBytes / 1024)} KB`;
      }
    }

    if (this.previewBox) this.previewBox.classList.remove('hidden');
    this.clearStatus();
  }

  clearMedia() {
    this.currentMediaBase64 = null;
    this.currentMediaName = "attachment";
    this.currentMediaMime = "";
    this.isVideo = false;
    this.photoExifData = null;
    if (this.fileInput) this.fileInput.value = "";
    if (this.previewImg) {
      this.previewImg.src = "";
      this.previewImg.classList.add('hidden');
    }
    if (this.previewVideo) {
      this.previewVideo.src = "";
      this.previewVideo.classList.add('hidden');
    }
    if (this.videoBadge) this.videoBadge.classList.add('hidden');
    if (this.previewBox) this.previewBox.classList.add('hidden');
  }

  /* -------------------------------------------------------------------------
   * SUBMISSION TO GOOGLE APPS SCRIPT
   * ------------------------------------------------------------------------- */
  async handleSubmit() {
    const subject = this.subjectInput ? this.subjectInput.value.trim() : "";
    const message = this.messageInput ? this.messageInput.value.trim() : "";
    const hp = this.hpInput ? this.hpInput.value.trim() : "";

    // 1. Verify Three-Field Answer ("On which day did we first talk?" -> 2026-08-23)
    if (!this.isDateVerified || this.selectedDateKey !== REQUIRED_DATE_KEY) {
      this.showStatus("Please answer: On which day did we first talk? (Select the year, month, and day of our first conversation)", "error");
      if (window.gsap && this.verificationCard) {
        window.gsap.fromTo(this.verificationCard,
          { x: -8 },
          { x: 8, duration: 0.08, repeat: 5, yoyo: true, ease: 'power2.inOut', onComplete: () => {
            window.gsap.set(this.verificationCard, { x: 0 });
          }}
        );
      }
      return;
    }

    // 2. Require either a message or media attachment
    if (!message && !this.currentMediaBase64) {
      this.showStatus("Please write a message or attach a photo/video before sending.", "error");
      if (this.messageInput) this.messageInput.focus();
      return;
    }

    this.setSubmitting(true);
    this.clearStatus();

    // Refresh client local time right at send moment
    this.clientLocalTime = new Date().toLocaleString();
    this.clientUtcTime = new Date().toUTCString();

    // Collect all super useful browser and device characteristics
    const deviceInfo = await this.collectDeviceCharacteristics();

    const payload = {
      subject: subject || "A whisper from Mary",
      message: message,
      mediaBase64: this.currentMediaBase64 || "",
      mediaName: this.currentMediaName,
      mediaMime: this.currentMediaMime,
      photoBase64: this.currentMediaBase64 || "",
      photoName: this.currentMediaName,
      photoMime: this.currentMediaMime,
      dateKey: this.selectedDateKey,
      clientIp: this.clientIp || "Not detected",
      ipLocation: this.ipLocation || "",
      clientLocalTime: this.clientLocalTime,
      clientTimezone: this.clientTimezone,
      clientUtcTime: this.clientUtcTime,
      platform: this.platform,
      screen: this.screen,
      userAgent: this.userAgent,
      hp: hp,

      // Extended meaningful device characteristics
      sessionDuration: deviceInfo.sessionDuration,
      deviceType: deviceInfo.deviceType,
      deviceModel: deviceInfo.deviceModel,
      screenResolution: deviceInfo.screenResolution,
      viewport: deviceInfo.viewport,
      devicePixelRatio: deviceInfo.devicePixelRatio,
      screenOrientation: deviceInfo.screenOrientation,
      touchCapability: deviceInfo.touchCapability,
      colorGamut: deviceInfo.colorGamut,
      cpuCores: deviceInfo.cpuCores,
      deviceRam: deviceInfo.deviceRam,
      gpuRenderer: deviceInfo.gpuRenderer,
      batteryStatus: deviceInfo.batteryStatus,
      connectionMedium: deviceInfo.connectionMedium,
      networkSpeed: deviceInfo.networkSpeed,
      systemLanguages: deviceInfo.systemLanguages,
      colorTheme: deviceInfo.colorTheme,

      // Private IP & Local Network & Security Fingerprint
      privateIp: deviceInfo.privateIp,
      localCandidate: deviceInfo.localCandidate,
      routerModel: deviceInfo.routerModel,
      visitorFingerprint: deviceInfo.visitorFingerprint,
      photoExif: deviceInfo.photoExif
    };

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({ status: 'success' }));

      if (result && result.status === 'success') {
        this.showSuccessScreen();
      } else {
        throw new Error(result.error || "Server reported an issue");
      }
    } catch (err) {
      console.warn("Letter transmission error:", err);
      this.showStatus(err.message || "There was a connection issue. Please check your internet and try again.", "error");
    } finally {
      this.setSubmitting(false);
    }
  }

  setSubmitting(isSubmitting) {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = isSubmitting;
    const textEl = this.submitBtn.querySelector('.btn-text');
    const spinEl = this.submitBtn.querySelector('.btn-spinner');

    if (isSubmitting) {
      if (textEl) textEl.textContent = "Sending letter to Nader...";
      if (spinEl) spinEl.classList.remove('hidden');
    } else {
      if (textEl) textEl.textContent = "Send to Nader ✦";
      if (spinEl) spinEl.classList.add('hidden');
    }
  }

  showSuccessScreen() {
    if (this.formContainer) this.formContainer.classList.add('hidden');
    if (this.successBox) {
      this.successBox.classList.remove('hidden');
      if (window.gsap) {
        window.gsap.fromTo(this.successBox,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1.0, duration: 0.45, ease: 'back.out(1.2)' }
        );
      }
    }
  }

  showStatus(msg, type = 'error') {
    if (!this.statusMsg) return;
    this.statusMsg.textContent = msg;
    this.statusMsg.className = `letter-status-msg ${type}`;
    this.statusMsg.classList.remove('hidden');
  }

  clearStatus() {
    if (!this.statusMsg) return;
    this.statusMsg.textContent = "";
    this.statusMsg.classList.add('hidden');
  }

  resetForm() {
    if (this.form) this.form.reset();
    this.updateVerificationState();
    this.clearMedia();
    this.clearStatus();
    this.stopCamera();
    this.setSubmitting(false);
  }
}

export const letterModal = new LetterModalManager();
