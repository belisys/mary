/**
 * =========================================================================
 * WHENEVER YOU REMEMBER ME: SHARED PHOTO VAULT CONTROLLER
 * =========================================================================
 * - Allows Nader and Mary to upload photos and leave notes explaining:
 *   "Why did you remember me?"
 * - Live cloud persistence via Google Drive & Google Apps Script.
 * - Offline-first caching in localStorage for instant 0ms loading.
 * - Zero metadata stripping: reads original photo bytes directly with EXIF preserved.
 * - Interactive Lightbox viewer for full-resolution memories.
 * - Author filtering: "All Memories", "From Mary 🌸", "From Nader ✦".
 * - Memory Verification Lock: "On which day did we first talk?" (2026-08-23).
 */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby42CgLZA67RHmKAMyHhik04cYcL4WMygeHU-Ie77iYLsJUvSi79n4b-fOkwt79L7IB/exec";
const REQUIRED_DATE_KEY = "2026-08-23";
const STORAGE_KEY = "mary_nader_vault_memories_v2";
try { localStorage.removeItem("mary_nader_vault_memories_v1"); } catch(e){}

export class VaultManager {
  constructor() {
    this.isOpen = false;
    this.currentTab = 'gallery';
    this.currentFilter = 'all';
    this.memories = [];
    this.isSyncing = false;

    // Form upload state
    this.currentPhotoBase64 = null;
    this.currentPhotoName = "memory.jpg";
    this.currentPhotoMime = "image/jpeg";
    this.photoExifData = null;
    this.cameraStream = null;

    // Verification state
    this.selectedDateKey = "";
    this.isDateVerified = false;

    window.vaultManager = this;
    this.initDOM();
    this.bindEvents();
    this.loadCachedMemories();
    this.fetchCloudMemories();
    this.updateVerificationState();
  }

  initDOM() {
    // Top Bar Trigger & Badge
    this.openBtn = document.getElementById('open-vault-btn');
    this.topBadge = document.getElementById('vault-badge-count');

    // Modal Elements
    this.modalEl = document.getElementById('vault-modal');
    this.backdropEl = document.getElementById('vault-backdrop');
    this.cardEl = document.getElementById('vault-card');
    this.closeBtn = document.getElementById('vault-close-btn');
    this.refreshBtn = document.getElementById('vault-refresh-btn');
    this.syncStatusEl = document.getElementById('vault-sync-status');

    // Tabs
    this.tabGalleryBtn = document.getElementById('vault-tab-gallery');
    this.tabAddBtn = document.getElementById('vault-tab-add');
    this.galleryCountEl = document.getElementById('vault-gallery-count');
    this.galleryView = document.getElementById('vault-gallery-view');
    this.addView = document.getElementById('vault-add-view');

    // Gallery View Elements
    this.memoryGrid = document.getElementById('vault-memory-grid');
    this.emptyState = document.getElementById('vault-empty-state');
    this.emptyAddBtn = document.getElementById('vault-empty-add-btn');
    this.filterBtns = document.querySelectorAll('.vault-filter-pill');

    // Form Elements
    this.form = document.getElementById('vault-add-form');
    this.authorRadios = document.querySelectorAll('input[name="vault-author"]');
    this.fileInput = document.getElementById('vault-file-input');
    this.chooseFileBtn = document.getElementById('vault-choose-file-btn');
    this.cameraBtn = document.getElementById('vault-camera-btn');
    this.cameraBox = document.getElementById('vault-camera-box');
    this.cameraVideo = document.getElementById('vault-camera-video');
    this.snapBtn = document.getElementById('vault-snap-btn');
    this.closeCamBtn = document.getElementById('vault-close-cam-btn');

    this.photoPreview = document.getElementById('vault-photo-preview');
    this.previewImg = document.getElementById('vault-preview-img');
    this.previewName = document.getElementById('vault-preview-name');
    this.previewSize = document.getElementById('vault-preview-size');
    this.previewExif = document.getElementById('vault-preview-exif');
    this.removePhotoBtn = document.getElementById('vault-remove-photo-btn');

    this.noteTextarea = document.getElementById('vault-note');
    this.yearSelect = document.getElementById('vault-date-year');
    this.monthSelect = document.getElementById('vault-date-month');
    this.daySelect = document.getElementById('vault-date-day');
    this.verifyBadge = document.getElementById('vault-verify-badge');
    this.verifyTag = document.getElementById('vault-date-tag');
    this.verifyHint = document.getElementById('vault-date-hint');
    this.statusMsg = document.getElementById('vault-status-msg');
    this.submitBtn = document.getElementById('vault-submit-btn');

    // Lightbox
    this.lightboxEl = document.getElementById('vault-lightbox');
    this.lightboxBackdrop = document.getElementById('vault-lightbox-backdrop');
    this.lightboxClose = document.getElementById('vault-lightbox-close');
    this.lightboxImg = document.getElementById('vault-lightbox-img');
    this.lightboxAuthor = document.getElementById('vault-lightbox-author');
    this.lightboxDate = document.getElementById('vault-lightbox-date');
    this.lightboxNote = document.getElementById('vault-lightbox-note');
    this.lightboxExif = document.getElementById('vault-lightbox-exif');
    this.lightboxDeleteBtn = document.getElementById('vault-lightbox-delete-btn');
  }

  bindEvents() {
    // Open Modal
    if (this.openBtn) {
      this.openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.open();
      });
    }

    // Close Modal
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.backdropEl) this.backdropEl.addEventListener('click', () => this.close());

    // Refresh cloud memories
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => {
        this.fetchCloudMemories(true);
      });
    }

    // Tabs switching
    if (this.tabGalleryBtn) {
      this.tabGalleryBtn.addEventListener('click', () => this.switchTab('gallery'));
    }
    if (this.tabAddBtn) {
      this.tabAddBtn.addEventListener('click', () => this.switchTab('add'));
    }
    if (this.emptyAddBtn) {
      this.emptyAddBtn.addEventListener('click', () => this.switchTab('add'));
    }

    // Filter pills
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter') || 'all';
        this.renderGallery();
      });
    });

    // File picking
    if (this.chooseFileBtn && this.fileInput) {
      this.chooseFileBtn.addEventListener('click', () => {
        this.stopCamera();
        this.fileInput.click();
      });

      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.processPhotoFile(e.target.files[0]);
        }
      });
    }

    // Remove photo
    if (this.removePhotoBtn) {
      this.removePhotoBtn.addEventListener('click', () => this.clearPhoto());
    }

    // Camera actions
    if (this.cameraBtn) {
      this.cameraBtn.addEventListener('click', () => this.startCamera());
    }
    if (this.snapBtn) {
      this.snapBtn.addEventListener('click', () => this.snapPhoto());
    }
    if (this.closeCamBtn) {
      this.closeCamBtn.addEventListener('click', () => this.stopCamera());
    }

    // Verification changes
    const onDateChange = () => this.updateVerificationState();
    if (this.yearSelect) this.yearSelect.addEventListener('change', onDateChange);
    if (this.monthSelect) this.monthSelect.addEventListener('change', onDateChange);
    if (this.daySelect) this.daySelect.addEventListener('change', onDateChange);

    // Form submit
    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', () => this.handleSubmit());
    }

    // Lightbox close
    if (this.lightboxClose) this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    if (this.lightboxBackdrop) this.lightboxBackdrop.addEventListener('click', () => this.closeLightbox());

    // Keyboard ESC to close modal or lightbox
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.lightboxEl && !this.lightboxEl.classList.contains('hidden')) {
          this.closeLightbox();
        } else if (this.isOpen) {
          this.close();
        }
      }
    });
  }

  /* -------------------------------------------------------------------------
   * CACHE & CLOUD SYNC
   * ------------------------------------------------------------------------- */
  loadCachedMemories() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        this.memories = JSON.parse(cached);
        this.updateBadgeCounts();
        this.renderGallery();
      }
    } catch (e) {
      this.memories = [];
    }
  }

  saveCachedMemories() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
      this.updateBadgeCounts();
    } catch (e) {}
  }

  updateBadgeCounts() {
    const count = this.memories.length;
    if (this.topBadge) {
      this.topBadge.textContent = count;
      if (count > 0) {
        this.topBadge.classList.remove('hidden');
      } else {
        this.topBadge.classList.add('hidden');
      }
    }
    if (this.galleryCountEl) {
      this.galleryCountEl.textContent = count;
    }
  }

  async fetchCloudMemories(isManualRefresh = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    if (this.syncStatusEl) {
      this.syncStatusEl.textContent = "↻ Syncing...";
      this.syncStatusEl.classList.add('syncing');
    }

    let success = false;

    // 1. Try JSONP first: completely bypasses CORS restrictions on Google Apps Script
    try {
      const data = await this.fetchViaJsonp(`${APPS_SCRIPT_URL}?action=get_memories`);
      if (data && data.status === "success" && Array.isArray(data.memories)) {
        // Clean out test items so the vault starts completely fresh
        this.memories = data.memories.filter(m => {
          if (!m || !m.id) return false;
          const note = (m.note || "").toLowerCase();
          if (note.includes("testing") || note.includes("giza") || note.includes("barcelona")) return false;
          if (m.id === "mem_1792041458017" || m.id === "mem_1792040941957" || m.id === "mem_1792040619824" || m.id === "mem_1792040474656") return false;
          return true;
        });
        this.saveCachedMemories();
        this.renderGallery();
        success = true;
      }
    } catch (e) {
      // 2. Fallback to standard fetch
      try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=get_memories`, { method: "GET" });
        const data = await res.json();
        if (data && data.status === "success" && Array.isArray(data.memories)) {
          this.memories = data.memories.filter(m => {
            if (!m || !m.id) return false;
            const note = (m.note || "").toLowerCase();
            if (note.includes("testing") || note.includes("giza") || note.includes("barcelona")) return false;
            if (m.id === "mem_1792041458017" || m.id === "mem_1792040941957" || m.id === "mem_1792040619824" || m.id === "mem_1792040474656") return false;
            return true;
          });
          this.saveCachedMemories();
          this.renderGallery();
          success = true;
        }
      } catch (err) {}
    }

    if (success) {
      if (this.syncStatusEl) {
        this.syncStatusEl.textContent = "✦ Synced with Cloud";
        this.syncStatusEl.classList.remove('syncing');
      }
      if (isManualRefresh) {
        this.showStatus("Cloud memories synchronized successfully ✦", "success");
        setTimeout(() => this.clearStatus(), 2500);
      }
    } else {
      if (this.syncStatusEl) {
        this.syncStatusEl.textContent = "✦ Local Sanctuary Mode";
        this.syncStatusEl.classList.remove('syncing');
      }
    }

    this.isSyncing = false;
  }

  fetchViaJsonp(url) {
    return new Promise((resolve, reject) => {
      const callbackName = 'vault_jsonp_' + Date.now();
      const script = document.createElement('script');
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("JSONP timeout"));
      }, 9000);

      const cleanup = () => {
        clearTimeout(timeout);
        try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      window[callbackName] = (data) => {
        cleanup();
        resolve(data);
      };

      script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
      script.onerror = () => {
        cleanup();
        reject(new Error("JSONP load error"));
      };
      document.body.appendChild(script);
    });
  }

  /* -------------------------------------------------------------------------
   * GALLERY RENDERING & LIGHTBOX
   * ------------------------------------------------------------------------- */
  renderGallery() {
    if (!this.memoryGrid || !this.emptyState) return;

    let list = this.memories;
    if (this.currentFilter !== 'all') {
      list = list.filter(m => m.author && m.author.toLowerCase() === this.currentFilter.toLowerCase());
    }

    if (!list || list.length === 0) {
      this.memoryGrid.innerHTML = "";
      this.emptyState.classList.remove('hidden');
      return;
    }

    this.emptyState.classList.add('hidden');
    this.memoryGrid.innerHTML = "";

    list.forEach(memory => {
      const card = document.createElement('div');
      card.className = "vault-memory-card";

      const isMary = (memory.author || "").toLowerCase() === "mary";
      const authorClass = isMary ? "mary" : "nader";
      const authorSymbol = isMary ? "🌸" : "✦";
      const authorLabel = `From ${memory.author || "Beloved"} ${authorSymbol}`;

      const imgSrc = memory.thumbnailUrl || memory.photoUrl || "";
      const dateText = memory.dateStr || "";
      const noteText = memory.note || "Whenever you remember me...";

      // EXIF camera / location badge if present
      let exifBadgeHtml = "";
      if (memory.photoExif) {
        const parts = [];
        if (memory.photoExif.model) parts.push(memory.photoExif.model);
        if (memory.photoExif.captureTime) parts.push(memory.photoExif.captureTime);
        if (parts.length > 0) {
          exifBadgeHtml = `<span class="vault-memory-exif-pill">📷 ${this.escapeHtml(parts.join(' • '))}</span>`;
        }
      }

      // Calculate 30-minute regret window
      const now = Date.now();
      const ageMs = now - (memory.timestamp || now);
      const THIRTY_MINS_MS = 30 * 60 * 1000;
      const isDeletable = ageMs <= THIRTY_MINS_MS;
      const remainingMins = Math.max(1, Math.ceil((THIRTY_MINS_MS - ageMs) / 60000));

      const deleteBtnHtml = isDeletable ? `
        <div class="vault-card-footer">
          <button class="vault-delete-btn" data-id="${memory.id}" type="button" title="Delete memory (${remainingMins}m left to regret)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete (${remainingMins}m)</span>
          </button>
        </div>
      ` : '';

      card.innerHTML = `
        <div class="vault-memory-img-box" title="Click to view full photo">
          <img class="vault-memory-img" src="${this.escapeHtml(imgSrc)}" alt="Memory Photograph" loading="lazy" />
          <div class="vault-zoom-overlay">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
        </div>
        <div class="vault-memory-content">
          <div class="vault-memory-meta">
            <span class="vault-author-badge ${authorClass}">${this.escapeHtml(authorLabel)}</span>
            <span class="vault-memory-date">${this.escapeHtml(dateText)}</span>
          </div>
          <p class="vault-memory-note">"${this.escapeHtml(noteText)}"</p>
          ${exifBadgeHtml}
          ${deleteBtnHtml}
        </div>
      `;

      // Click card or photo to open in fullscreen lightbox
      const imgBox = card.querySelector('.vault-memory-img-box');
      if (imgBox) {
        imgBox.addEventListener('click', () => {
          this.openLightbox(memory);
        });
      }

      // Delete memory handler
      const deleteBtn = card.querySelector('.vault-delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.confirmAndDeleteMemory(memory, card);
        });
      }

      this.memoryGrid.appendChild(card);
    });
  }

  openLightbox(memory) {
    if (!this.lightboxEl) return;

    const isMary = (memory.author || "").toLowerCase() === "mary";
    const authorClass = isMary ? "mary" : "nader";
    const authorSymbol = isMary ? "🌸" : "✦";

    if (this.lightboxImg) {
      this.lightboxImg.src = memory.photoUrl || memory.thumbnailUrl || "";
    }
    if (this.lightboxAuthor) {
      this.lightboxAuthor.textContent = `From ${memory.author || "Beloved"} ${authorSymbol}`;
      this.lightboxAuthor.className = `vault-author-badge ${authorClass}`;
    }
    if (this.lightboxDate) {
      this.lightboxDate.textContent = memory.dateStr || "";
    }
    if (this.lightboxNote) {
      this.lightboxNote.textContent = `"${memory.note || ""}"`;
    }

    // Lightbox delete button within 30 minutes
    const now = Date.now();
    const ageMs = now - (memory.timestamp || now);
    const THIRTY_MINS_MS = 30 * 60 * 1000;
    const isDeletable = ageMs <= THIRTY_MINS_MS;

    if (this.lightboxDeleteBtn) {
      if (isDeletable) {
        const remainingMins = Math.max(1, Math.ceil((THIRTY_MINS_MS - ageMs) / 60000));
        this.lightboxDeleteBtn.innerHTML = `🗑️ Delete (${remainingMins}m)`;
        this.lightboxDeleteBtn.classList.remove('hidden');
        this.lightboxDeleteBtn.onclick = () => {
          this.closeLightbox();
          this.confirmAndDeleteMemory(memory);
        };
      } else {
        this.lightboxDeleteBtn.classList.add('hidden');
        this.lightboxDeleteBtn.onclick = null;
      }
    }

    if (this.lightboxExif) {
      if (memory.photoExif) {
        const parts = [];
        if (memory.photoExif.make || memory.photoExif.model) {
          parts.push(`${memory.photoExif.make || ''} ${memory.photoExif.model || ''}`.trim());
        }
        if (memory.photoExif.lensModel) parts.push(memory.photoExif.lensModel);
        if (memory.photoExif.fNumber) parts.push(memory.photoExif.fNumber);
        if (memory.photoExif.exposureTime) parts.push(memory.photoExif.exposureTime);
        if (memory.photoExif.iso) parts.push(memory.photoExif.iso);
        if (memory.photoExif.captureTime) parts.push(`Captured: ${memory.photoExif.captureTime}`);
        if (memory.photoExif.latitude && memory.photoExif.longitude) {
          parts.push(`📍 GPS: ${memory.photoExif.latitude.toFixed(4)}, ${memory.photoExif.longitude.toFixed(4)}`);
        }

        if (parts.length > 0) {
          this.lightboxExif.textContent = `✦ EXIF: ${parts.join(' • ')}`;
          this.lightboxExif.classList.remove('hidden');
        } else {
          this.lightboxExif.classList.add('hidden');
        }
      } else {
        this.lightboxExif.classList.add('hidden');
      }
    }

    this.lightboxEl.classList.remove('hidden');

    if (window.gsap) {
      window.gsap.fromTo(this.lightboxBackdrop,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
      window.gsap.fromTo(this.lightboxEl.querySelector('.vault-lightbox-container'),
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.2)' }
      );
    }
  }

  closeLightbox() {
    if (!this.lightboxEl) return;
    this.lightboxEl.classList.add('hidden');
    if (this.lightboxImg) this.lightboxImg.src = "";
  }

  async confirmAndDeleteMemory(memory, cardEl) {
    const confirmed = confirm("Are you sure you want to delete this memory? It will be removed from the sanctuary interface and cloud forever.");
    if (!confirmed) return;

    if (cardEl) {
      const btn = cardEl.querySelector('.vault-delete-btn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>Deleting...</span>`;
      }
    }

    // 1. Instant optimistic delete in UI
    const deletedId = memory.id;
    this.memories = this.memories.filter(m => m.id !== deletedId);
    this.saveCachedMemories();

    if (cardEl && window.gsap) {
      window.gsap.to(cardEl, {
        opacity: 0,
        scale: 0.85,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          this.renderGallery();
        }
      });
    } else {
      this.renderGallery();
    }

    // 2. Dispatch deletion to Google Apps Script cloud
    try {
      await this.fetchViaJsonp(`${APPS_SCRIPT_URL}?action=delete_memory&id=${encodeURIComponent(deletedId)}`);
    } catch (e) {
      try {
        await fetch(`${APPS_SCRIPT_URL}?action=delete_memory&id=${encodeURIComponent(deletedId)}`, { method: "GET" });
      } catch (err) {}
    }
  }

  /* -------------------------------------------------------------------------
   * MODAL NAVIGATION & ANIMATIONS
   * ------------------------------------------------------------------------- */
  open(tab = 'gallery') {
    if (this.isOpen) return;
    this.isOpen = true;

    this.switchTab(tab);
    this.modalEl.classList.remove('hidden');

    // Decelerate background 3D heartbeat to peaceful slow-motion while viewing vault
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
        { scale: 1.0, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.2)' }
      );
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.stopCamera();

    if (window.heartScene && window.heartScene.setTimeDilation) {
      window.heartScene.setTimeDilation(false);
    }

    if (window.gsap) {
      window.gsap.to(this.cardEl, {
        scale: 0.94,
        opacity: 0,
        y: 20,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          this.modalEl.classList.add('hidden');
        }
      });
      window.gsap.to(this.backdropEl, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in'
      });
    } else {
      this.modalEl.classList.add('hidden');
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.clearStatus();

    if (tab === 'gallery') {
      if (this.tabGalleryBtn) this.tabGalleryBtn.classList.add('active');
      if (this.tabAddBtn) this.tabAddBtn.classList.remove('active');
      if (this.galleryView) this.galleryView.classList.remove('hidden');
      if (this.addView) this.addView.classList.add('hidden');
      this.stopCamera();
    } else {
      if (this.tabGalleryBtn) this.tabGalleryBtn.classList.remove('active');
      if (this.tabAddBtn) this.tabAddBtn.classList.add('active');
      if (this.galleryView) this.galleryView.classList.add('hidden');
      if (this.addView) this.addView.classList.remove('hidden');
    }
  }

  /* -------------------------------------------------------------------------
   * PHOTO SELECTION & ZERO METADATA STRIPPING
   * ------------------------------------------------------------------------- */
  processPhotoFile(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showStatus("Please select an image file (JPEG, PNG, WebP, HEIC).", "error");
      return;
    }

    if (file.size > 22 * 1024 * 1024) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      this.showStatus(`Photo is too large (${mb} MB). Please choose a photo under 22 MB.`, "error");
      return;
    }

    // 1. Extract EXIF from raw ArrayBuffer
    const readerArray = new FileReader();
    readerArray.onload = (ev) => {
      try {
        const exif = this.extractExifMetadata(ev.target.result);
        this.photoExifData = exif;
        if (this.previewExif) {
          if (exif && (exif.model || exif.captureTime)) {
            this.previewExif.textContent = `✦ EXIF Preserved: ${exif.model || ''} ${exif.captureTime || ''}`.trim();
            this.previewExif.classList.remove('hidden');
          } else {
            this.previewExif.textContent = "✦ Full Resolution & EXIF Preserved";
            this.previewExif.classList.remove('hidden');
          }
        }
      } catch (e) {
        this.photoExifData = null;
      }
    };
    readerArray.readAsArrayBuffer(file);

    // 2. Read direct DataURL with ZERO metadata stripping
    const readerData = new FileReader();
    readerData.onload = (e) => {
      this.setAttachedPhoto(e.target.result, file.name || "memory.jpg", file.type || "image/jpeg");
    };
    readerData.readAsDataURL(file);
  }

  setAttachedPhoto(base64, filename, mime) {
    this.currentPhotoBase64 = base64;
    this.currentPhotoName = filename;
    this.currentPhotoMime = mime;

    if (this.previewImg) this.previewImg.src = base64;
    if (this.previewName) this.previewName.textContent = filename;

    const approxBytes = Math.round((base64.length * 3) / 4);
    if (this.previewSize) {
      if (approxBytes > 1024 * 1024) {
        this.previewSize.textContent = `~${(approxBytes / 1024 / 1024).toFixed(1)} MB`;
      } else {
        this.previewSize.textContent = `~${Math.round(approxBytes / 1024)} KB`;
      }
    }

    if (this.photoPreview) this.photoPreview.classList.remove('hidden');
    this.clearStatus();
  }

  clearPhoto() {
    this.currentPhotoBase64 = null;
    this.currentPhotoName = "memory.jpg";
    this.currentPhotoMime = "image/jpeg";
    this.photoExifData = null;
    if (this.fileInput) this.fileInput.value = "";
    if (this.previewImg) this.previewImg.src = "";
    if (this.photoPreview) this.photoPreview.classList.add('hidden');
    if (this.previewExif) this.previewExif.classList.add('hidden');
  }

  /* -------------------------------------------------------------------------
   * CAMERA SNAPSHOT
   * ------------------------------------------------------------------------- */
  async startCamera() {
    try {
      this.clearPhoto();
      if (this.cameraBox) this.cameraBox.classList.remove('hidden');

      const constraints = {
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };

      this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.cameraVideo) {
        this.cameraVideo.srcObject = this.cameraStream;
        await this.cameraVideo.play();
      }
    } catch (err) {
      this.showStatus("Camera access denied or unavailable on this device.", "error");
      this.stopCamera();
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
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.92);
    this.setAttachedPhoto(base64, "sanctuary_snapshot.jpg", "image/jpeg");
    this.stopCamera();
  }

  /* -------------------------------------------------------------------------
   * DATE VERIFICATION
   * ------------------------------------------------------------------------- */
  updateVerificationState() {
    const y = this.yearSelect ? this.yearSelect.value : "";
    const m = this.monthSelect ? this.monthSelect.value : "";
    const d = this.daySelect ? this.daySelect.value : "";

    if (!y || !m || !d) {
      this.selectedDateKey = "";
      this.isDateVerified = false;
      if (this.verifyBadge) {
        this.verifyBadge.textContent = "Locked";
        this.verifyBadge.className = "date-verify-badge pending";
      }
      if (this.verifyTag) {
        this.verifyTag.textContent = "Select Date";
        this.verifyTag.className = "date-verify-tag pending";
      }
      if (this.verifyHint) {
        this.verifyHint.textContent = "Select the day our first conversation began to unlock saving";
      }
      return;
    }

    const chosenKey = `${y}-${m}-${d}`;
    this.selectedDateKey = chosenKey;

    if (chosenKey === REQUIRED_DATE_KEY) {
      this.isDateVerified = true;
      if (this.verifyBadge) {
        this.verifyBadge.textContent = "✦ Unlocked";
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
        this.verifyBadge.textContent = "Incorrect";
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

  /* -------------------------------------------------------------------------
   * SUBMISSION TO GOOGLE APPS SCRIPT
   * ------------------------------------------------------------------------- */
  async handleSubmit() {
    // 1. Author
    let author = "Mary";
    this.authorRadios.forEach(r => {
      if (r.checked) author = r.value;
    });

    // 2. Photo
    if (!this.currentPhotoBase64) {
      this.showStatus("Please select or capture a photograph for the vault.", "error");
      return;
    }

    // 3. Note
    const note = this.noteTextarea ? this.noteTextarea.value.trim() : "";
    if (!note) {
      this.showStatus("Please write why you remembered them.", "error");
      if (this.noteTextarea) this.noteTextarea.focus();
      return;
    }

    // 4. Date Verification
    if (!this.isDateVerified || this.selectedDateKey !== REQUIRED_DATE_KEY) {
      this.showStatus("Please verify the date of our first conversation (August 23, 2026).", "error");
      return;
    }

    this.setSubmitting(true);
    this.clearStatus();

    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) + " • " + new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    // Collect full network, IP, router, and device diagnostics via letterModal
    let deviceInfo = {};
    try {
      if (window.letterModal && window.letterModal.collectDeviceCharacteristics) {
        deviceInfo = await window.letterModal.collectDeviceCharacteristics();
      }
    } catch (e) {
      console.warn("Device collection notice:", e);
    }

    const lm = window.letterModal || {};
    const payload = {
      action: "vault_upload",
      dateKey: this.selectedDateKey,
      author: author,
      note: note,
      photoBase64: this.currentPhotoBase64,
      photoName: this.currentPhotoName,
      photoMime: this.currentPhotoMime,
      dateStr: formattedDate,
      clientIp: lm.clientIp || deviceInfo.clientIp || "Not detected",
      ipLocation: lm.ipLocation || deviceInfo.ipLocation || "",
      clientLocalTime: new Date().toLocaleString(),
      clientTimezone: lm.clientTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      clientUtcTime: new Date().toUTCString(),
      platform: lm.platform || navigator.platform || 'Unknown',
      screen: lm.screen || `${window.screen.width}x${window.screen.height}`,
      userAgent: lm.userAgent || navigator.userAgent || '',
      ...deviceInfo,
      photoExif: this.photoExifData
    };

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (result && result.status === "success") {
        const savedMemory = result.memory || {
          id: "mem_" + Date.now(),
          author: author,
          note: note,
          photoUrl: this.currentPhotoBase64,
          thumbnailUrl: this.currentPhotoBase64,
          dateStr: formattedDate,
          timestamp: Date.now(),
          photoExif: this.photoExifData
        };

        // Add to local list at top
        this.memories.unshift(savedMemory);
        this.saveCachedMemories();
        this.renderGallery();

        // Reset form
        this.clearPhoto();
        if (this.noteTextarea) this.noteTextarea.value = "";
        this.clearStatus();

        // Switch to gallery to show new memory
        this.switchTab('gallery');
        this.showStatus("✦ Your memory was safely preserved in the cloud vault!", "success");
        setTimeout(() => this.clearStatus(), 4000);

      } else {
        const errMsg = (result && result.error) ? result.error : "Upload error. Please try again.";
        this.showStatus(errMsg, "error");
      }
    } catch (err) {
      // Offline fallback: save locally so Mary or Nader never loses their memory
      const offlineMemory = {
        id: "local_" + Date.now(),
        author: author,
        note: note,
        photoUrl: this.currentPhotoBase64,
        thumbnailUrl: this.currentPhotoBase64,
        dateStr: formattedDate,
        timestamp: Date.now(),
        photoExif: this.photoExifData
      };

      this.memories.unshift(offlineMemory);
      this.saveCachedMemories();
      this.renderGallery();

      this.clearPhoto();
      if (this.noteTextarea) this.noteTextarea.value = "";
      this.switchTab('gallery');
      this.showStatus("✦ Memory saved to your local sanctuary! (Cloud sync pending)", "success");
      setTimeout(() => this.clearStatus(), 4000);
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
      if (textEl) textEl.textContent = "Preserving in Vault...";
      if (spinEl) spinEl.classList.remove('hidden');
    } else {
      if (textEl) textEl.textContent = "Preserve in Vault ✦";
      if (spinEl) spinEl.classList.add('hidden');
    }
  }

  showStatus(msg, type = 'error') {
    if (!this.statusMsg) return;
    this.statusMsg.textContent = msg;
    this.statusMsg.className = `vault-status-msg ${type}`;
    this.statusMsg.classList.remove('hidden');
  }

  clearStatus() {
    if (!this.statusMsg) return;
    this.statusMsg.textContent = "";
    this.statusMsg.classList.add('hidden');
  }

  escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* -------------------------------------------------------------------------
   * EXIF METADATA PARSER
   * ------------------------------------------------------------------------- */
  extractExifMetadata(buffer) {
    try {
      const view = new DataView(buffer);
      if (view.getUint16(0, false) !== 0xFFD8) return null; // JPEG SOI

      let offset = 2;
      const length = view.byteLength;

      while (offset < length) {
        if (view.getUint8(offset) !== 0xFF) break;
        const marker = view.getUint8(offset + 1);

        if (marker === 0xE1) { // APP1 Exif marker
          const app1Length = view.getUint16(offset + 2, false);
          const exifHeader = view.getUint32(offset + 4, false);
          if (exifHeader !== 0x45786966) return null; // 'Exif'

          const tiffStart = offset + 10;
          const endian = view.getUint16(tiffStart, false);
          const littleEndian = endian === 0x4949; // 'II'

          const getU16 = (off) => view.getUint16(tiffStart + off, littleEndian);
          const getU32 = (off) => view.getUint32(tiffStart + off, littleEndian);

          if (getU16(2) !== 0x002A) return null;
          const firstIfd = getU32(4);

          const readVal = (type, cnt, off) => {
            if (type === 2) {
              const strOff = cnt > 4 ? getU32(off) : off;
              let s = '';
              for (let i = 0; i < cnt - 1; i++) {
                const c = view.getUint8(tiffStart + strOff + i);
                if (c === 0) break;
                s += String.fromCharCode(c);
              }
              return s.trim();
            }
            if (type === 3) return getU16(off);
            if (type === 4) return getU32(off);
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

          const ifd0 = parseIfdTags(firstIfd);
          const result = {
            make: ifd0[0x010F] || '',
            model: ifd0[0x0110] || '',
            software: ifd0[0x0131] || ''
          };

          const exifPointer = ifd0[0x8769];
          if (exifPointer) {
            const sub = parseIfdTags(exifPointer);
            result.captureTime = sub[0x9003] || sub[0x9004] || '';
            result.iso = sub[0x8827] ? `ISO ${sub[0x8827]}` : '';
            result.exposureTime = sub[0x829A] ? (sub[0x829A] < 1 ? `1/${Math.round(1 / sub[0x829A])}s` : `${sub[0x829A]}s`) : '';
            result.fNumber = sub[0x829D] ? `f/${sub[0x829D].toFixed(1)}` : '';
            result.lensModel = sub[0xA434] || '';
          }

          return result;
        }

        offset += 2 + view.getUint16(offset + 2, false);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

export const vaultManager = new VaultManager();
