/**
 * =========================================================================
 * POLYMORPHIC MODAL MANAGER (GSAP FLOATING GLASS CARDS)
 * =========================================================================
 * - Renders photos, health advice, secrets, poems, and romantic expressions.
 * - Enforces strict category isolation (Travel, Poems, Advice, Words From Me).
 * - Full browsing history: Next steps forward or draws random unseen entries;
 *   Prev steps backwards through the exact sequence of notes visited.
 * - Smooth camera flight & GSAP spring physics.
 */

import { getMemoryByDotId, getCategoryPool } from './memoryDatabase.js?v=338';
import { MARY_SANCTUARY_LEXICON } from './marySanctuaryLexicon.js?v=338';
import { telemetry } from './telemetry.js?v=338';

class ModalManager {
  constructor() {
    this.currentDotId = 1;
    this.currentIndex = 0;
    this.isOpen = false;
    this.isBeaconMode = false;
    this.planetaryRing = null;
    this.currentBeaconIndex = 0;

    // Browsing History & Unseen Pools per category
    this.activeFilter = 'all';
    this.history = [];      // Array of { data, dotId, hitIndex, filter }
    this.historyIndex = -1; // Current pointer in this.history
    this.unseenPools = {};  // { [filterId]: Array<Entry> }

    // DOM Elements
    this.modalEl = document.getElementById('memory-modal');
    this.cardEl = document.getElementById('modal-card');
    this.backdropEl = document.getElementById('modal-backdrop');
    this.badgeEl = document.getElementById('modal-badge');
    this.locationBadgeEl = document.getElementById('modal-location-badge');
    this.titleEl = document.getElementById('modal-title');
    this.contentEl = document.getElementById('modal-content');
    this.teaseEl = document.getElementById('modal-tease');
    this.counterEl = document.getElementById('modal-counter');
    this.badgeCountEl = document.getElementById('unlocked-badge-count');

    // Photo Card Elements
    this.photoContainer = document.getElementById('modal-photo-container');
    this.photoImg = document.getElementById('modal-photo-img');

    // Controls
    this.closeBtn = document.getElementById('modal-close-btn');
    this.prevBtn = document.getElementById('modal-prev-btn');
    this.nextBtn = document.getElementById('modal-next-btn');
    this.randomBtn = document.getElementById('modal-random-btn');

    this.onFlyToCallback = null;

    window.modalManager = this;
    this.bindEvents();
  }

  setActiveFilter(filterId) {
    if (this.activeFilter === filterId) return;
    this.activeFilter = filterId;

    // If modal is currently open, smoothly swap to a card from the newly selected category
    if (this.isOpen && !this.isBeaconMode) {
      const nextData = this.getNextCategoryEntry(this.activeFilter);
      const hitIndex = this.findMatchingParticleIndex(nextData);
      const dotId = nextData.dotId || hitIndex + 1;

      this.currentDotId = dotId;
      this.currentIndex = hitIndex;
      this.pushHistory(nextData, dotId, hitIndex);
      this.animateCardTransition(nextData, hitIndex);
    }
  }

  setFlyToCallback(fn) {
    this.onFlyToCallback = fn;
  }

  bindEvents() {
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.backdropEl) this.backdropEl.addEventListener('click', () => this.close());
    
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.navigatePrev());
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.navigateNext());
    }
    
    if (this.randomBtn) {
      this.randomBtn.addEventListener('click', () => this.triggerRandom());
    }

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') this.close();
      if (this.activeFilter === 'ten_kids') return;
      if (e.key === 'ArrowLeft') this.navigatePrev();
      if (e.key === 'ArrowRight') this.navigateNext();
    });
  }

  /**
   * Returns the next unseen entry for a given category filter.
   * Reshuffles only after ALL entries in that category pool have been shown.
   */
  getNextCategoryEntry(filterId = 'all') {
    if (!this.unseenPools[filterId] || this.unseenPools[filterId].length === 0) {
      const source = getCategoryPool(filterId);
      const copy = [...source];
      // Fisher-Yates shuffle
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      this.unseenPools[filterId] = copy;
    }
    return this.unseenPools[filterId].pop();
  }

  /**
   * Finds or picks an appropriate particle index in the 3D heart for a given entry.
   */
  findMatchingParticleIndex(entry) {
    if (!window.heartScene || !window.heartScene.heartEngine) return 0;
    const engine = window.heartScene.heartEngine;

    // 1. Direct photo index mapping (IDs 1-9)
    if (typeof entry.id === 'number' && entry.id >= 1 && entry.id <= 9) {
      return entry.id - 1;
    }

    // 2. Find matching particle in heartEngine matching activeFilter
    const targetFilter = this.activeFilter !== 'all' ? this.activeFilter : 'words_from_me';
    if (engine.particleData && engine.particleData.length > 0) {
      const matches = engine.particleData.filter(p => p.filterGroup === targetFilter);
      if (matches.length > 0) {
        const picked = matches[Math.floor(Math.random() * matches.length)];
        return picked.id - 1;
      }
    }

    return Math.floor(Math.random() * (engine.particleCount || 4200));
  }

  /**
   * Pushes a viewed memory card into browsing history.
   */
  pushHistory(data, dotId, hitIndex) {
    // If user stepped backward and now picks a new card, trim forward history
    if (this.historyIndex >= 0 && this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    const entryKey = `${data.id || ''}_${data.title || ''}`;
    const currentItem = this.history[this.historyIndex];
    const currentKey = currentItem ? `${currentItem.data.id || ''}_${currentItem.data.title || ''}` : null;

    if (entryKey !== currentKey) {
      this.history.push({
        data,
        dotId,
        hitIndex,
        filter: this.activeFilter
      });
      this.historyIndex = this.history.length - 1;
    }

    this.updateNavButtonStates();
  }

  updateNavButtonStates() {
    if (this.activeFilter === 'ten_kids') {
      if (this.prevBtn) {
        this.prevBtn.setAttribute('disabled', 'true');
        this.prevBtn.classList.add('disabled');
        this.prevBtn.style.opacity = '0.2';
        this.prevBtn.style.cursor = 'not-allowed';
        this.prevBtn.style.pointerEvents = 'none';
        this.prevBtn.title = 'Only this quotation exists';
      }
      if (this.nextBtn) {
        this.nextBtn.setAttribute('disabled', 'true');
        this.nextBtn.classList.add('disabled');
        this.nextBtn.style.opacity = '0.2';
        this.nextBtn.style.cursor = 'not-allowed';
        this.nextBtn.style.pointerEvents = 'none';
        this.nextBtn.title = 'Only this quotation exists';
      }
      if (this.randomBtn) {
        this.randomBtn.setAttribute('disabled', 'true');
        this.randomBtn.classList.add('disabled');
        this.randomBtn.style.opacity = '0.2';
        this.randomBtn.style.cursor = 'not-allowed';
        this.randomBtn.style.pointerEvents = 'none';
        this.randomBtn.title = 'Only this quotation exists';
      }
      return;
    }

    if (this.prevBtn) {
      this.prevBtn.removeAttribute('disabled');
      this.prevBtn.classList.remove('disabled');
      const canGoBack = this.historyIndex > 0;
      this.prevBtn.style.opacity = canGoBack ? '1' : '0.35';
      this.prevBtn.style.cursor = canGoBack ? 'pointer' : 'default';
      this.prevBtn.style.pointerEvents = canGoBack ? 'auto' : 'none';
      this.prevBtn.title = canGoBack ? 'Previous note (go back in history)' : 'No earlier notes';
    }
    if (this.nextBtn) {
      this.nextBtn.removeAttribute('disabled');
      this.nextBtn.classList.remove('disabled');
      this.nextBtn.style.opacity = '1';
      this.nextBtn.style.cursor = 'pointer';
      this.nextBtn.style.pointerEvents = 'auto';
      this.nextBtn.title = 'Next Star';
    }
    if (this.randomBtn) {
      this.randomBtn.removeAttribute('disabled');
      this.randomBtn.classList.remove('disabled');
      this.randomBtn.style.opacity = '1';
      this.randomBtn.style.cursor = 'pointer';
      this.randomBtn.style.pointerEvents = 'auto';
      this.randomBtn.title = 'Fly to a random star';
    }
  }

  /**
   * Next button navigation:
   * Moves forward in history if available; otherwise draws next unseen entry in category pool.
   */
  navigateNext() {
    if (this.activeFilter === 'ten_kids') return;

    if (this.isBeaconMode) {
      this.unveilNextBeaconQuote();
      return;
    }

    // 1. If Mary previously clicked 'Prev' and is moving forward in history:
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const item = this.history[this.historyIndex];
      this.currentDotId = item.dotId;
      this.currentIndex = item.hitIndex;
      this.animateCardTransition(item.data, item.hitIndex);
      this.updateNavButtonStates();
      return;
    }

    // 2. Otherwise Mary is at the latest tip: draw next unseen entry strictly in this category!
    const nextData = this.getNextCategoryEntry(this.activeFilter);
    const targetParticleIndex = this.findMatchingParticleIndex(nextData);
    const dotId = nextData.dotId || (typeof nextData.id === 'number' && nextData.id <= 9 ? nextData.id : targetParticleIndex + 1);

    this.currentDotId = dotId;
    this.currentIndex = targetParticleIndex;

    this.history.push({
      data: nextData,
      dotId,
      hitIndex: targetParticleIndex,
      filter: this.activeFilter
    });
    this.historyIndex = this.history.length - 1;

    this.animateCardTransition(nextData, targetParticleIndex);
    this.updateNavButtonStates();
  }

  /**
   * Prev button navigation:
   * Steps backwards through the exact cards previously visited in this session.
   */
  navigatePrev() {
    if (this.activeFilter === 'ten_kids') return;

    if (this.isBeaconMode) {
      this.unveilNextBeaconQuote();
      return;
    }

    if (this.historyIndex > 0) {
      this.historyIndex--;
      const item = this.history[this.historyIndex];
      this.currentDotId = item.dotId;
      this.currentIndex = item.hitIndex;
      this.animateCardTransition(item.data, item.hitIndex);
      this.updateNavButtonStates();
    }
  }

  /**
   * Random button:
   * Immediately draws a fresh random entry from the active category and appends to history.
   */
  triggerRandom() {
    if (this.activeFilter === 'ten_kids') return;

    if (this.isBeaconMode) {
      this.unveilNextBeaconQuote();
      return;
    }

    const randData = this.getNextCategoryEntry(this.activeFilter);
    const targetParticleIndex = this.findMatchingParticleIndex(randData);
    const dotId = randData.dotId || (typeof randData.id === 'number' && randData.id <= 9 ? randData.id : targetParticleIndex + 1);

    this.currentDotId = dotId;
    this.currentIndex = targetParticleIndex;

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push({
      data: randData,
      dotId,
      hitIndex: targetParticleIndex,
      filter: this.activeFilter
    });
    this.historyIndex = this.history.length - 1;

    this.animateCardTransition(randData, targetParticleIndex);
    this.updateNavButtonStates();
  }

  /**
   * Opens modal for a specific particle or user selection.
   * Strictly resolves within activeFilter.
   */
  open(dotId, hitIndex = 0) {
    this.isBeaconMode = false;
    this.currentDotId = dotId;
    this.currentIndex = hitIndex;
    this.isOpen = true;

    // Strict category resolution: guaranteed to match activeFilter!
    const data = getMemoryByDotId(this.currentDotId, this.activeFilter);

    // Record in browsing history
    this.pushHistory(data, dotId, hitIndex);

    this.renderCardContent(data);
    this.modalEl.classList.remove('hidden');

    // Smoothly decelerate background 3D heartbeat & ring into calm slow motion for reading
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
        { scale: 0.88, opacity: 0, y: 25, rotateX: 5, filter: 'brightness(1)' },
        { scale: 1, opacity: 1, y: 0, rotateX: 0, duration: 0.45, ease: 'back.out(1.3)' }
      );
    }

    telemetry.recordInteraction(dotId);
    this.updateCounter();
    this.updateNavButtonStates();

    if (this.onFlyToCallback) {
      this.onFlyToCallback(hitIndex);
    }
  }

  animateCardTransition(data, hitIndex) {
    this.renderCardContent(data);
    telemetry.recordInteraction(this.currentDotId);
    this.updateCounter();

    if (this.onFlyToCallback) {
      this.onFlyToCallback(hitIndex);
    }

    if (window.gsap) {
      window.gsap.killTweensOf(this.cardEl);
      window.gsap.fromTo(this.cardEl,
        { scale: 0.96, opacity: 0.75 },
        { scale: 1.0, opacity: 1.0, duration: 0.28, ease: 'back.out(1.3)' }
      );
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    // Smoothly restore background 3D heartbeat & ring back to normal 1.0x rhythm
    if (window.heartScene && window.heartScene.setTimeDilation) {
      window.heartScene.setTimeDilation(false);
    }

    // Automatically activate decenter function to smoothly pull camera back out of the heart
    if (window.heartScene && window.heartScene.resetCameraToCenter) {
      window.heartScene.resetCameraToCenter();
    }

    if (this.isBeaconMode) {
      if (window.gsap) {
        window.gsap.to(this.cardEl, {
          scale: 0.04,
          opacity: 0,
          y: 0,
          filter: 'brightness(2.5)',
          duration: 0.38,
          ease: 'power2.in'
        });

        window.gsap.to(this.backdropEl, {
          opacity: 0,
          duration: 0.38,
          onComplete: () => {
            this.modalEl.classList.add('hidden');
            this.isOpen = false;
            this.isBeaconMode = false;
            if (this.planetaryRing && this.planetaryRing.descendBeaconToOrbit) {
              this.planetaryRing.descendBeaconToOrbit();
            }
          }
        });
      } else {
        this.modalEl.classList.add('hidden');
        this.isOpen = false;
        this.isBeaconMode = false;
        if (this.planetaryRing && this.planetaryRing.descendBeaconToOrbit) {
          this.planetaryRing.descendBeaconToOrbit();
        }
      }
      return;
    }

    if (window.gsap) {
      window.gsap.to(this.cardEl, {
        scale: 0.88,
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
          this.isOpen = false;
        }
      });
    } else {
      this.modalEl.classList.add('hidden');
      this.isOpen = false;
    }
  }

  /**
   * Opens the Sanctuary Quotation Box directly from the molten light of the rising Orbit Beacon!
   */
  openFromBeacon(planetaryRing) {
    this.isBeaconMode = true;
    this.planetaryRing = planetaryRing;
    this.isOpen = true;

    this.currentBeaconIndex = Math.floor(Math.random() * MARY_SANCTUARY_LEXICON.length);
    const template = MARY_SANCTUARY_LEXICON[this.currentBeaconIndex];

    const data = {
      id: template.id,
      type: template.type || 'advice',
      category: template.category,
      tag: `✦ SANCTUARY VESSEL • ${template.category}`,
      title: template.title,
      content: template.content,
      tease: `"${template.tease}" • ${template.author_or_source || 'Nader'}`
    };

    this.renderCardContent(data);
    this.modalEl.classList.remove('hidden');

    if (window.heartScene && window.heartScene.setTimeDilation) {
      window.heartScene.setTimeDilation(true);
    }

    const burstEl = document.getElementById('beacon-portal-burst');

    if (window.gsap) {
      window.gsap.killTweensOf([this.cardEl, this.backdropEl, burstEl]);

      window.gsap.fromTo(this.backdropEl, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.45, ease: 'power2.out' }
      );

      if (burstEl) {
        burstEl.classList.remove('hidden');
        window.gsap.fromTo(burstEl,
          { scale: 0.05, opacity: 1, filter: 'blur(2px)' },
          { scale: 2.6, opacity: 0, filter: 'blur(16px)', duration: 0.85, ease: 'power2.out',
            onComplete: () => burstEl.classList.add('hidden')
          }
        );
      }

      window.gsap.fromTo(this.cardEl,
        { scale: 0.04, opacity: 0, y: 0, filter: 'brightness(3.5)' },
        { scale: 1.0, opacity: 1, y: 0, filter: 'brightness(1)', duration: 0.75, ease: 'back.out(1.35)' }
      );
    }
  }

  unveilNextBeaconQuote() {
    if (!this.isBeaconMode) return;
    this.currentBeaconIndex = (this.currentBeaconIndex + 1 + Math.floor(Math.random() * 7)) % MARY_SANCTUARY_LEXICON.length;
    const template = MARY_SANCTUARY_LEXICON[this.currentBeaconIndex];

    const data = {
      id: template.id,
      type: template.type || 'advice',
      category: template.category,
      tag: `✦ SANCTUARY VESSEL • ${template.category}`,
      title: template.title,
      content: template.content,
      tease: `"${template.tease}" • ${template.author_or_source || 'Nader'}`
    };

    const burstEl = document.getElementById('beacon-portal-burst');
    if (burstEl && window.gsap) {
      burstEl.classList.remove('hidden');
      window.gsap.fromTo(burstEl,
        { scale: 0.3, opacity: 0.8 },
        { scale: 1.8, opacity: 0, duration: 0.6, ease: 'power2.out',
          onComplete: () => burstEl.classList.add('hidden')
        }
      );
    }

    if (window.gsap) {
      window.gsap.to(this.cardEl, {
        scale: 0.95,
        opacity: 0.6,
        duration: 0.15,
        onComplete: () => {
          this.renderCardContent(data);
          window.gsap.to(this.cardEl, { scale: 1.0, opacity: 1, duration: 0.28, ease: 'back.out(1.2)' });
        }
      });
    } else {
      this.renderCardContent(data);
    }
  }

  renderCardContent(data) {
    let badgeText = `${data.tag} • ${data.category}`;
    if (data.id === 'drm-01' || this.activeFilter === 'ten_kids') {
      badgeText = `✦ Inside Joke • The Ten Kids`;
    } else if (data.type === 'photo') {
      badgeText = `📷 Travel Polaroid • ${data.category}`;
    } else if (data.category === 'Travel & Shared Dreams') {
      badgeText = `📍 Travel Milestone • ${data.tag}`;
    } else if (data.type === 'advice' || data.category === 'Somatic & Physical Care' || data.category === 'Stay Strong & Motivated') {
      badgeText = `🌿 Caring Reminder • ${data.category}`;
    } else if (data.category === 'Celestial Verse' || data.category === 'Celestial Verse & Poetry') {
      badgeText = `📜 Celestial Verse • ${data.tag}`;
    } else if (data.type === 'secret') {
      badgeText = `🔒 Teasing Secret • ${data.category}`;
    } else {
      badgeText = `💌 Words From Me • ${data.category}`;
    }

    if (this.badgeEl) this.badgeEl.textContent = badgeText;
    if (this.titleEl) this.titleEl.textContent = data.title;
    if (this.contentEl) this.contentEl.textContent = data.content;
    if (this.teaseEl) this.teaseEl.textContent = data.tease;

    if (this.locationBadgeEl) {
      if (data.location) {
        this.locationBadgeEl.textContent = data.location;
        this.locationBadgeEl.classList.remove('hidden');
      } else {
        this.locationBadgeEl.classList.add('hidden');
      }
    }

    if (this.photoContainer && this.photoImg) {
      if (data.type === 'photo' && data.photoUrl) {
        this.photoImg.src = data.photoUrl;
        this.photoContainer.classList.remove('hidden');
      } else {
        this.photoContainer.classList.add('hidden');
      }
    }
  }

  updateCounter() {
    // Star progress counting intentionally removed
  }
}

export const modalManager = new ModalManager();
