/**
 * =========================================================================
 * ORIENTATION & CINEMATIC FULLSCREEN MANAGER
 * =========================================================================
 * Orchestrates landscape vs portrait experiences across iPhone (iOS Safari)
 * and Android/Desktop devices:
 * 1. Automatic orientation detection & CSS state management
 * 2. Cross-browser Fullscreen API (handling iOS Safari div fullscreen limitations)
 * 3. Subtle, non-intrusive 'Rotate for Cinematic Widescreen' hint for portrait mobile
 * 4. Safe-area aware adaptations for iPhone Dynamic Island / notch
 * 5. Smooth callbacks for Three.js camera reframing
 */

class OrientationManager {
  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    this.isAndroid = /Android/.test(navigator.userAgent);
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    this.currentOrientation = this.detectOrientation();
    this.listeners = [];
    this.hintDismissed = sessionStorage.getItem('sanctuary_orientation_dismissed') === 'true';

    // DOM Elements
    this.hintEl = null;
    this.fullscreenBtn = null;
    this.toastEl = null;
    this.toastTextEl = null;
    this.toastTimer = null;
    this.resizeDebounceTimer = null;

    window.orientationManager = this;

    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.cacheDOMElements();
      this.bindEvents();
      this.updateOrientationClasses();
      this.updateHintVisibility();
    });
  }

  cacheDOMElements() {
    this.hintEl = document.getElementById('orientation-hint');
    this.hintBtn = document.getElementById('orientation-hint-btn');
    this.hintDismissBtn = document.getElementById('orientation-hint-dismiss');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    this.toastEl = document.getElementById('orientation-toast');
    this.toastTextEl = document.getElementById('orientation-toast-text');
  }

  bindEvents() {
    // 1. Resize & Orientation Change Listeners
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = setTimeout(() => {
        this.handleResizeOrOrientationChange();
      }, 120);
    });

    window.addEventListener('orientationchange', () => {
      // iOS Safari updates dimensions slightly after the event
      setTimeout(() => {
        this.handleResizeOrOrientationChange();
      }, 150);
    });

    if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
      screen.orientation.addEventListener('change', () => {
        setTimeout(() => this.handleResizeOrOrientationChange(), 100);
      });
    }

    // 2. Fullscreen Change Listeners
    document.addEventListener('fullscreenchange', () => this.updateFullscreenUI());
    document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenUI());
    document.addEventListener('mozfullscreenchange', () => this.updateFullscreenUI());
    document.addEventListener('msfullscreenchange', () => this.updateFullscreenUI());

    // 3. UI Button Handlers
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleFullscreen();
      });
    }

    if (this.hintBtn) {
      this.hintBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleHintClick();
      });
    }

    if (this.hintDismissBtn) {
      this.hintDismissBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dismissHint();
      });
    }
  }

  detectOrientation() {
    if (window.innerWidth > window.innerHeight) {
      return 'landscape';
    }
    return 'portrait';
  }

  isPortrait() {
    return this.detectOrientation() === 'portrait';
  }

  isLandscape() {
    return this.detectOrientation() === 'landscape';
  }

  getAspect() {
    return window.innerWidth / Math.max(1, window.innerHeight);
  }

  handleResizeOrOrientationChange() {
    const newOrientation = this.detectOrientation();
    const aspect = this.getAspect();
    const orientationChanged = newOrientation !== this.currentOrientation;
    this.currentOrientation = newOrientation;

    this.updateOrientationClasses();
    this.updateHintVisibility();

    // Notify registered listeners (such as Three.js camera orchestrator)
    this.notifyListeners({
      orientation: newOrientation,
      aspect: aspect,
      width: window.innerWidth,
      height: window.innerHeight,
      changed: orientationChanged
    });
  }

  updateOrientationClasses() {
    const body = document.body;
    if (this.currentOrientation === 'landscape') {
      body.classList.add('orientation-landscape');
      body.classList.remove('orientation-portrait');
    } else {
      body.classList.add('orientation-portrait');
      body.classList.remove('orientation-landscape');
    }
  }

  updateHintVisibility() {
    if (!this.hintEl) return;

    // Do not show hint while locked at the Sanctuary Entrance Gate
    const isLocked = document.body.classList.contains('sanctuary-locked');
    if (isLocked) {
      this.hintEl.classList.add('hidden');
      return;
    }

    // Only suggest rotating when user is on a touch device and in portrait mode
    if (this.isTouchDevice && this.isPortrait() && !this.hintDismissed) {
      this.hintEl.classList.remove('hidden');
    } else {
      this.hintEl.classList.add('hidden');
    }
  }

  dismissHint() {
    this.hintDismissed = true;
    try {
      sessionStorage.setItem('sanctuary_orientation_dismissed', 'true');
    } catch (e) {}

    if (this.hintEl) {
      if (window.gsap) {
        window.gsap.to(this.hintEl, {
          opacity: 0,
          y: 15,
          duration: 0.35,
          onComplete: () => {
            this.hintEl.classList.add('hidden');
          }
        });
      } else {
        this.hintEl.classList.add('hidden');
      }
    }
  }

  handleHintClick() {
    if (this.isAndroid) {
      // Android: attempt to go fullscreen and lock landscape
      this.requestFullscreenAndLockLandscape();
    } else if (this.isIOS) {
      // iOS: Apple restricts screen.orientation.lock and requestFullscreen on arbitrary divs.
      // Animate the rotation icon and guide the user.
      const icon = this.hintEl ? this.hintEl.querySelector('.orientation-hint-icon') : null;
      if (icon && window.gsap) {
        window.gsap.fromTo(icon, { rotation: 0 }, { rotation: 360, duration: 0.6, ease: "power2.out" });
      }
      this.showToast("🔄 Rotate your phone horizontally for edge-to-edge widescreen! ✨", 3800);
    } else {
      this.toggleFullscreen();
    }
  }

  async toggleFullscreen() {
    const isFs = this.isFullscreen();

    if (!isFs) {
      // Enter Fullscreen
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        try {
          await docEl.requestFullscreen();
          // On Android, optionally lock to landscape for widescreen majesty
          if (this.isAndroid && screen.orientation && typeof screen.orientation.lock === 'function') {
            screen.orientation.lock('landscape').catch(() => {});
          }
        } catch (err) {
          console.warn("[OrientationManager] requestFullscreen error:", err);
        }
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (this.isIOS) {
        // iPhone Safari does not support Element.requestFullscreen()
        this.showToast("✦ Tip: Rotate your phone horizontally! (For full screen without Safari bars, tap Share ⎋ → 'Add to Home Screen' 📱)", 4500);
      }
    } else {
      // Exit Fullscreen
      if (document.exitFullscreen) {
        try {
          await document.exitFullscreen();
          if (screen.orientation && typeof screen.orientation.unlock === 'function') {
            screen.orientation.unlock();
          }
        } catch (err) {
          console.warn("[OrientationManager] exitFullscreen error:", err);
        }
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  async requestFullscreenAndLockLandscape() {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      try {
        await docEl.requestFullscreen();
        if (screen.orientation && typeof screen.orientation.lock === 'function') {
          await screen.orientation.lock('landscape');
        }
      } catch (err) {
        console.warn("[OrientationManager] lock landscape fallback:", err);
      }
    }
  }

  isFullscreen() {
    return Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  updateFullscreenUI() {
    if (!this.fullscreenBtn) return;
    const isFs = this.isFullscreen();
    const enterIcon = this.fullscreenBtn.querySelector('.icon-fs-enter');
    const exitIcon = this.fullscreenBtn.querySelector('.icon-fs-exit');

    if (isFs) {
      this.fullscreenBtn.classList.add('active');
      this.fullscreenBtn.title = "Exit Cinematic Fullscreen";
      if (enterIcon) enterIcon.classList.add('hidden');
      if (exitIcon) exitIcon.classList.remove('hidden');
    } else {
      this.fullscreenBtn.classList.remove('active');
      this.fullscreenBtn.title = "Toggle Cinematic Widescreen Fullscreen";
      if (enterIcon) enterIcon.classList.remove('hidden');
      if (exitIcon) exitIcon.classList.add('hidden');
    }
  }

  showToast(message, duration = 3500) {
    if (!this.toastEl || !this.toastTextEl) return;

    clearTimeout(this.toastTimer);
    this.toastTextEl.textContent = message;
    this.toastEl.classList.remove('hidden');

    if (window.gsap) {
      window.gsap.killTweensOf(this.toastEl);
      window.gsap.fromTo(this.toastEl, 
        { opacity: 0, y: -20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.2)" }
      );
    }

    this.toastTimer = setTimeout(() => {
      if (window.gsap) {
        window.gsap.to(this.toastEl, {
          opacity: 0,
          y: -15,
          duration: 0.35,
          ease: "power2.in",
          onComplete: () => this.toastEl.classList.add('hidden')
        });
      } else {
        this.toastEl.classList.add('hidden');
      }
    }, duration);
  }

  onOrientationChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notifyListeners(data) {
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (err) {
        console.error("[OrientationManager] Listener error:", err);
      }
    }
  }
}

export const orientationManager = new OrientationManager();
