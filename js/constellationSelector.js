/**
 * =========================================================================
 * CONSTELLATION CATEGORY SELECTOR & STAR FILTER ENGINE
 * =========================================================================
 * Provides an obsidian glassmorphic floating selector on the right edge.
 * Allows Mary to filter and highlight specific celestial themes:
 * - Words From Me (Devotion, letters, Darija, playful banter)
 * - Poems & Wisdom (French poetry, classical literary wisdom)
 * - Advice & Strength (Resilience, somatic calm, health sanctuary)
 * - Our Travels (Milestones in Cairo, Riyadh, and London)
 * - All Stars (Full 4,200 particle beating heart)
 *
 * Matching stars illuminate in distinct, theme-harmonized colors while
 * non-matching stars gently recede into velvet night twilight.
 */

import { modalManager } from './modalManager.js?v=337';

export const CONSTELLATION_GROUPS = {
  all: {
    id: "all",
    title: "All Stars",
    subtitle: "Complete heart galaxy",
    iconSvg: `<svg class="cat-svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    colorHex: "#f43f5e",
    threeColorHex: 0xf43f5e,
    actionLabel: "✦ Explore Random Star"
  },
  words_from_me: {
    id: "words_from_me",
    title: "Words From Me",
    subtitle: "Devotion, love & poetry",
    iconSvg: `<svg class="cat-svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    colorHex: "#fde047", // Warm Champagne Sunburst Gold
    threeColorHex: 0xfde047,
    actionLabel: "✦ Read Word From Nader"
  },
  poems: {
    id: "poems",
    title: "Poems & Wisdom",
    subtitle: "Arabic & classical romance",
    iconSvg: `<svg class="cat-svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
    colorHex: "#e879f9", // Ethereal Rose-Lavender / Amethyst
    threeColorHex: 0xe879f9,
    actionLabel: "✦ Read a Poem"
  },
  advice: {
    id: "advice",
    title: "Lessons & Knowledge",
    subtitle: "Biology, health & stoic clarity",
    iconSvg: `<svg class="cat-svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    colorHex: "#38bdf8", // Radiant Celestial Jade / Cyan
    threeColorHex: 0x38bdf8,
    actionLabel: "✦ Read Lesson & Knowledge"
  }
};

export class ConstellationSelector {
  constructor(heartEngine) {
    this.heartEngine = heartEngine;
    this.currentFilter = 'all';
    this.container = document.getElementById('star-constellation-selector');
    this.isCollapsed = true;

    window.constellationSelector = this;
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn("Constellation selector container not found in DOM");
      return;
    }

    this.render();
    this.bindEvents();
    this.toggleCollapse(true);
  }

  render() {
    this.container.innerHTML = `
      <!-- Collapsible Floating Pill Card -->
      <div class="constellation-card collapsed" id="constellation-card">
        <!-- Header with Toggle Button -->
        <div class="constellation-header">
          <div class="constellation-header-info">
            <span class="constellation-sparkle">✦</span>
            <span class="constellation-title">CONSTELLATIONS</span>
          </div>
          <button id="constellation-collapse-btn" class="constellation-collapse-btn" title="Toggle constellation menu" type="button" aria-label="Toggle constellation menu">
            <svg class="icon-toggle" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <p class="constellation-hint">Highlight Mary's stars by mood</p>

        <!-- Category Options List -->
        <div class="constellation-list" role="radiogroup" aria-label="Constellation filter">
          ${Object.values(CONSTELLATION_GROUPS).map(group => {
            const isActive = group.id === this.currentFilter;
            return `
              <button 
                type="button"
                class="constellation-item ${isActive ? 'active' : ''}" 
                data-filter="${group.id}"
                style="--cat-accent: ${group.colorHex};"
                aria-pressed="${isActive}"
              >
                <div class="item-left">
                  <span class="item-indicator"></span>
                  <span class="item-icon">${group.iconSvg}</span>
                  <div class="item-text">
                    <span class="item-title">${group.title}</span>
                    <span class="item-sub">${group.subtitle}</span>
                  </div>
                </div>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Quick Action Trigger Button -->
        <div class="constellation-action-wrap">
          <button id="constellation-quick-action-btn" class="constellation-action-btn" type="button">
            ${CONSTELLATION_GROUPS[this.currentFilter].actionLabel}
          </button>
        </div>
      </div>

      <!-- Compact Floating Badge Pill when Collapsed -->
      <button id="constellation-expand-pill" class="constellation-expand-pill" type="button" title="Open constellations filter" aria-label="Open constellations filter">
        <span class="expand-pill-icon">✦</span>
        <span class="expand-pill-label">Constellations</span>
      </button>
    `;
  }

  bindEvents() {
    // Prevent any interaction with the constellation panel from bubbling to 3D raycaster
    this.container.addEventListener('click', (e) => e.stopPropagation());
    this.container.addEventListener('mousedown', (e) => e.stopPropagation());
    this.container.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });

    const list = this.container.querySelector('.constellation-list');
    if (list) {
      list.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemBtn = e.target.closest('.constellation-item');
        if (!itemBtn) return;
        const filterId = itemBtn.dataset.filter;
        if (filterId) {
          this.setFilter(filterId);
        }
      });
    }

    const actionBtn = this.container.querySelector('#constellation-quick-action-btn');
    if (actionBtn) {
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.triggerQuickAction();
      });
    }

    const collapseBtn = this.container.querySelector('#constellation-collapse-btn');
    const expandPill = this.container.querySelector('#constellation-expand-pill');
    const card = this.container.querySelector('#constellation-card');

    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCollapse(true);
      });
    }

    if (expandPill) {
      expandPill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCollapse(false);
      });
    }
  }

  toggleCollapse(collapse) {
    this.isCollapsed = collapse;
    const card = this.container.querySelector('#constellation-card');
    const expandPill = this.container.querySelector('#constellation-expand-pill');

    if (collapse) {
      if (card) card.classList.add('collapsed');
      if (expandPill) expandPill.classList.remove('hidden');
    } else {
      if (card) card.classList.remove('collapsed');
      if (expandPill) expandPill.classList.add('hidden');
    }
  }

  setFilter(filterId) {
    if (!CONSTELLATION_GROUPS[filterId]) return;
    this.currentFilter = filterId;

    // 1. Update UI Active State
    const items = this.container.querySelectorAll('.constellation-item');
    items.forEach(btn => {
      const isMatch = btn.dataset.filter === filterId;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-pressed', isMatch);
    });

    // 2. Update Action Button Text
    const actionBtn = this.container.querySelector('#constellation-quick-action-btn');
    if (actionBtn) {
      actionBtn.textContent = CONSTELLATION_GROUPS[filterId].actionLabel;
      actionBtn.style.setProperty('--btn-glow', CONSTELLATION_GROUPS[filterId].colorHex);
    }

    // 3. Command HeartEngine to Highlight Corresponding Stars
    if (this.heartEngine && typeof this.heartEngine.setFilter === 'function') {
      this.heartEngine.setFilter(filterId);
    }

    // 4. Update ModalManager navigation filter if applicable
    if (modalManager && typeof modalManager.setActiveFilter === 'function') {
      modalManager.setActiveFilter(filterId);
    }
  }

  triggerQuickAction() {
    if (!this.heartEngine || !modalManager) return;

    if (modalManager.isOpen) {
      modalManager.triggerRandom();
      return;
    }

    const nextData = modalManager.getNextCategoryEntry(this.currentFilter);
    const targetIndex = modalManager.findMatchingParticleIndex(nextData);
    const targetDotId = nextData.dotId || (typeof nextData.id === 'number' && nextData.id <= 9 ? nextData.id : targetIndex + 1);

    this.heartEngine.markDiscovered(targetIndex);
    modalManager.open(targetDotId, targetIndex);
  }
}
