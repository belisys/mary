/**
 * =========================================================================
 * 3D RAYCASTER INTERACTION ENGINE (DYNAMIC SCALED PICKING)
 * =========================================================================
 * Dynamically adjusts raycasting threshold based on camera zoom distance.
 * Enables effortless picking from orbit and razor-sharp pinpoint selection
 * when flying deep inside the 3D heart particle cloud.
 */

import * as THREE from 'three';
import { modalManager } from './modalManager.js?v=340';
import { telemetry } from './telemetry.js?v=340';
import { isSanctuaryUnlocked } from './sanctuaryGate.js?v=340';

export class RaycasterInteraction {
  constructor(camera, scene, heartEngine, planetaryRing) {
    this.camera = camera;
    this.scene = scene;
    this.heartEngine = heartEngine;
    this.planetaryRing = planetaryRing;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-999, -999);
    this.hoveredParticleIndex = -1;
    this.isHovering = false;
    this.isHoveringBeacon = false;
    this.cursorRing = document.getElementById('cursor-ring');
    this.tooltip = document.getElementById('hover-star-tooltip');
    this.screenX = -999;
    this.screenY = -999;
    this.mouseDownPos = { x: -999, y: -999 };
    this.isPinching = false;

    this.bindEvents();
  }

  isUIElement(target) {
    if (!target) return false;
    return !!(
      target.closest('#star-constellation-selector') ||
      target.closest('.constellation-card') ||
      target.closest('.constellation-item') ||
      target.closest('.constellation-expand-pill') ||
      target.closest('#reset-cam-btn') ||
      target.closest('.center-pill-btn') ||
      target.closest('#open-vessel-btn') ||
      target.closest('.vessel-pill-btn') ||
      target.closest('#toggle-cam-orbit-btn') ||
      target.closest('.cam-orbit-btn') ||
      target.closest('#music-player-pill') ||
      target.closest('.music-pill') ||
      target.closest('.volume-wheel-container') ||
      target.closest('#playlist-popover') ||
      target.closest('.playlist-popover') ||
      target.closest('#memory-modal') ||
      target.closest('#letter-modal') ||
      target.closest('#open-letter-btn') ||
      target.closest('.letter-pill-btn') ||
      target.closest('.header-brand') ||
      target.closest('.badge-secrets') ||
      target.closest('.ui-control-btn') ||
      target.closest('.modal-nav-btn') ||
      target.closest('#sanctuary-gate') ||
      target.closest('.gate-card') ||
      target.closest('button')
    );
  }

  bindEvents() {
    window.addEventListener('mousedown', (e) => {
      this.mouseDownPos.x = e.clientX;
      this.mouseDownPos.y = e.clientY;
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isPinching = false;
        this.mouseDownPos.x = e.touches[0].clientX;
        this.mouseDownPos.y = e.touches[0].clientY;
      } else if (e.touches.length > 1) {
        this.isPinching = true;
      }
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.screenX = e.clientX;
      this.screenY = e.clientY;
      
      if (this.cursorRing) {
        this.cursorRing.style.left = `${e.clientX}px`;
        this.cursorRing.style.top = `${e.clientY}px`;
      }

      if (this.tooltip && this.isHovering) {
        this.tooltip.style.left = `${e.clientX + 14}px`;
        this.tooltip.style.top = `${e.clientY + 14}px`;
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && !this.isPinching) {
        const touch = e.touches[0];
        this.pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        this.screenX = touch.clientX;
        this.screenY = touch.clientY;
      } else if (e.touches.length > 1) {
        this.isPinching = true;
      }
    }, { passive: true });

    window.addEventListener('click', (e) => {
      if (this.isUIElement(e.target)) return;
      // If mouse moved more than 7px, it was a camera rotation drag, not an intentional click!
      const dragDist = Math.hypot(e.clientX - this.mouseDownPos.x, e.clientY - this.mouseDownPos.y);
      if (dragDist > 7) return;
      this.handleClick();
    });

    window.addEventListener('touchend', (e) => {
      if (this.isUIElement(e.target)) return;
      if (this.isPinching) {
        if (e.touches.length === 0) {
          this.isPinching = false;
        }
        return;
      }
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const dragDist = Math.hypot(touch.clientX - this.mouseDownPos.x, touch.clientY - this.mouseDownPos.y);
        if (dragDist > 10) return;
        this.pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        this.handleClick();
      }
    });
  }

  // Update dynamically per frame
  update() {
    if (!this.heartEngine || !this.heartEngine.particles) return;

    if ((modalManager && modalManager.isOpen) || (window.letterModal && window.letterModal.isOpen)) {
      if (this.tooltip) this.tooltip.classList.add('hidden');
      if (this.cursorRing) this.cursorRing.classList.remove('active');
      document.body.style.cursor = 'default';
      this.heartEngine.highlightParticle(-1);
      return;
    }

    // Dynamic threshold: scales down when camera zooms deep inside the heart,
    // and provides a natural comfortable touch target radius on mobile devices.
    const camDist = this.camera.position.length();
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const maxThreshold = isTouchDevice ? 1.85 : 1.35;
    this.raycaster.params.Points.threshold = THREE.MathUtils.clamp(
      0.35 + (camDist - 3.0) * 0.022,
      0.35,
      maxThreshold
    );

    this.raycaster.setFromCamera(this.pointer, this.camera);

    // 1. Check intersection with the Special Orbit Beacon or ANY part of the Orbit Ring!
    if (this.planetaryRing && this.planetaryRing.getOrbitHitTargets) {
      const orbitTargets = this.planetaryRing.getOrbitHitTargets();
      const orbitHits = this.raycaster.intersectObjects(orbitTargets, false);
      if (orbitHits.length > 0) {
        this.isHoveringBeacon = true;
        this.planetaryRing.setBeaconHovered(true);
        document.body.style.cursor = 'pointer';

        if (this.cursorRing) {
          this.cursorRing.classList.add('active');
          this.cursorRing.style.borderColor = '#fef08a';
        }

        if (this.tooltip) {
          this.tooltip.innerHTML = `<span class="tooltip-icon" style="color:#fef08a;">✦</span> Orbit Vessel <span class="tooltip-tag" style="color:#fef08a;">• Click to open secret</span>`;
          this.tooltip.style.left = `${this.screenX + 14}px`;
          this.tooltip.style.top = `${this.screenY + 14}px`;
          this.tooltip.classList.remove('hidden');
        }
        return;
      } else if (this.isHoveringBeacon) {
        this.isHoveringBeacon = false;
        this.planetaryRing.setBeaconHovered(false);
      }
    }

    const intersects = this.raycaster.intersectObject(this.heartEngine.particles);

    if (intersects.length > 0) {
      const hitIndex = intersects[0].index;
      const dotId = hitIndex + 1;
      this.hoveredParticleIndex = hitIndex;
      this.isHovering = true;

      this.heartEngine.highlightParticle(hitIndex);
      document.body.style.cursor = 'pointer';

      if (this.cursorRing) {
        this.cursorRing.classList.add('active');
        this.cursorRing.style.borderColor = 'rgba(56, 189, 248, 0.9)';
      }

      if (this.tooltip) {
        const isDiscovered = this.heartEngine.discoveredStars && this.heartEngine.discoveredStars.has(dotId);
        const pData = this.heartEngine.particleData[hitIndex];
        const categoryName = pData ? pData.categoryName : 'Celestial Memory';

        let categoryTag = '';
        if (pData && pData.filterGroup === 'words_from_me') {
          if (pData.id === 186) {
            categoryTag = `<span style="color:#fb7185; font-weight:600;">✦ The Ten Kids</span>`;
          } else {
            categoryTag = `<span style="color:#fde047; font-weight:600;">✦ From Nader</span>`;
          }
        } else if (pData && pData.filterGroup === 'poems') {
          categoryTag = `<span style="color:#e879f9; font-weight:600;">✦ Poem & Verse</span>`;
        } else if (pData && pData.filterGroup === 'advice') {
          categoryTag = `<span style="color:#38bdf8; font-weight:600;">✦ Lesson & Knowledge</span>`;
        }

        this.tooltip.innerHTML = isDiscovered
          ? `<span class="tooltip-icon">✦</span> ${categoryTag || 'Star'} #${dotId} <span class="tooltip-tag">• Unlocked (${categoryName})</span>`
          : `<span class="tooltip-icon">✦</span> ${categoryTag || 'Star'} #${dotId} <span class="tooltip-tag">• ${categoryName}</span>`;
        this.tooltip.style.left = `${this.screenX + 14}px`;
        this.tooltip.style.top = `${this.screenY + 14}px`;
        this.tooltip.classList.remove('hidden');
      }
    } else {
      if (this.isHovering) {
        document.body.style.cursor = 'default';
        if (this.cursorRing) {
          this.cursorRing.classList.remove('active');
        }
        if (this.tooltip) {
          this.tooltip.classList.add('hidden');
        }
        this.heartEngine.highlightParticle(-1);
      }
      this.isHovering = false;
      this.hoveredParticleIndex = -1;
    }
  }

  handleClick() {
    if (window.__gateJustUnlocked || document.body.classList.contains('sanctuary-locked') || !isSanctuaryUnlocked()) return;
    if (modalManager && modalManager.isOpen) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // 1. Check if the Special Starlight Beacon Vessel is clicked
    if (this.planetaryRing && this.planetaryRing.getBeaconHitTarget) {
      const beaconTarget = this.planetaryRing.getBeaconHitTarget();
      if (beaconTarget) {
        const beaconHits = this.raycaster.intersectObject(beaconTarget, false);
        if (beaconHits.length > 0) {
          this.triggerBeaconOpening();
          return;
        }
      }
    }

    if (!this.heartEngine || !this.heartEngine.particles) return;
    const intersects = this.raycaster.intersectObject(this.heartEngine.particles);
    const activeFilter = (modalManager && modalManager.activeFilter) || 'all';

    if (intersects.length > 0) {
      let hitIndex = intersects[0].index;
      let dotId = hitIndex + 1; // 1-indexed ID

      // If a category filter is active, ensure we lock onto a matching particle in that category
      if (activeFilter !== 'all' && this.heartEngine.particleData) {
        const p = this.heartEngine.particleData[hitIndex];
        if (!p || p.filterGroup !== activeFilter) {
          // Find closest particle matching activeFilter to keep 3D camera flight consistent
          const matches = this.heartEngine.particleData.filter(item => item.filterGroup === activeFilter);
          if (matches.length > 0) {
            const hitPos = intersects[0].point;
            let bestMatch = matches[0];
            let bestDistSq = Infinity;
            for (let k = 0; k < matches.length; k++) {
              const dx = matches[k].baseX - hitPos.x;
              const dy = matches[k].baseY - hitPos.y;
              const dz = matches[k].baseZ - hitPos.z;
              const dSq = dx * dx + dy * dy + dz * dz;
              if (dSq < bestDistSq) {
                bestDistSq = dSq;
                bestMatch = matches[k];
              }
            }
            hitIndex = bestMatch.id - 1;
            dotId = bestMatch.id;
          }
        }
      }

      // Mark as unlocked beacon in 3D geometry
      this.heartEngine.markDiscovered(hitIndex);

      // Record interaction in silent telemetry
      telemetry.recordInteraction(dotId);

      // Open polymorphic modal card strictly when user intentionally clicks an actual particle star
      modalManager.open(dotId, hitIndex);
      return;
    }
  }

  triggerBeaconOpening() {
    if (!this.planetaryRing) return;
    this.planetaryRing.ascendBeaconToCenter(() => {
      modalManager.openFromBeacon(this.planetaryRing);
    });
  }
}
