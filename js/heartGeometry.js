/**
 * =========================================================================
 * 3D VOLUMETRIC CARDIOID HEART GEOMETRY & RADIANT STARLIGHT SPINE ENGINE
 * =========================================================================
 * - Exact original plump cardioid silhouette (width 32, height 33.5, aspect ratio 0.955)
 * - Authentic 3D anatomical dome depth Z(x,y) across both lobes with anterior chest bulge
 * - Brilliant diamond/champagne vertical starlight spine connecting cleft to apex
 * - 4,200+ Volumetric stardust particles with inside-out pulse wave
 * - Persistent discovery tracking & dynamic raycasting highlights
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { MARY_SANCTUARY_LEXICON } from './marySanctuaryLexicon.js?v=327';
import { PHOTO_MEMORIES } from './memoryDatabase.js?v=327';

export class HeartEngine {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = CONFIG.visuals.particleCount || 4200;
    this.particles = null;
    this.particleData = [];
    this.maxRadius = 22.0;
    this.waveSpeed = 13.5;
    this.hoveredIndex = -1;

    // Constellation Category Star Filtering
    this.activeFilter = 'all';
    this.filterColors = {
      words_from_me: new THREE.Color(0xfde047), // Warm Champagne Sunburst Gold
      poems: new THREE.Color(0xe879f9),         // Ethereal Rose-Lavender / Amethyst
      advice: new THREE.Color(0x38bdf8),        // Radiant Celestial Jade / Cyan
      travel: new THREE.Color(0xffffff)         // Pure Diamond Starlight Flare
    };

    // Load discovered star IDs from localStorage
    this.discoveredStars = new Set();
    this.loadDiscoveredStars();

    this.initParticleCloud();
  }

  loadDiscoveredStars() {
    try {
      const saved = localStorage.getItem('mary_discovered_stars');
      if (saved) {
        const arr = JSON.parse(saved);
        arr.forEach(id => this.discoveredStars.add(Number(id)));
      }
    } catch (e) {
      console.warn("Could not load discovered stars from localStorage:", e);
    }
  }

  saveDiscoveredStar(dotId) {
    this.discoveredStars.add(dotId);
    try {
      localStorage.setItem('mary_discovered_stars', JSON.stringify(Array.from(this.discoveredStars)));
    } catch (e) {
      // Ignored
    }
  }

  /**
   * Classic Iconic 2D Cardioid Parametric Formula:
   * Width: [-16, 16] = 32
   * Height: [-17, 16.5] = 33.5
   * Aspect Ratio: ~0.955 (Wide, plump, rounded, romantic)
   */
  static parametricHeart2D(t) {
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);
    const x = 16.0 * Math.pow(sinT, 3);
    const y = 13.0 * cosT - 5.0 * Math.cos(2 * t) - 2.0 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x, y };
  }

  /**
   * True 3D Volumetric Cardioid Heart Manifold:
   * Endows the classic plump cardioid with spherical 3D lobe curvature,
   * anterior chest projection, and posterior depth.
   */
  static get3DHeartThickness(x, y) {
    const s = THREE.MathUtils.clamp((y + 17.0) / 29.0, 0.0, 1.0);
    // Smooth tapering to apex (s = 0) and graceful dome at lobes
    const heightFactor = Math.pow(s, 0.75) * Math.pow(Math.sin(s * Math.PI), 0.40) * 10.5;

    // Dual-lobe dome curvature (bulges around left (-7.5, 3.5) and right (+7.5, 3.5) lobe centers)
    const lobeDist = Math.sqrt(Math.pow(Math.abs(x) - 7.5, 2) + Math.pow(Math.max(0, y - 3.5), 2));
    const domeFalloff = Math.exp(-0.5 * Math.pow(lobeDist / 8.5, 2));

    // Lateral boundary
    const maxW = Math.max(0.1, 16.2 * Math.sqrt(s));
    const u = THREE.MathUtils.clamp(Math.abs(x) / maxW, 0.0, 1.0);
    const lateralFactor = Math.sqrt(Math.max(0.0, 1.0 - u * u));

    return heightFactor * (0.35 * lateralFactor + 0.65 * domeFalloff);
  }

  initParticleCloud() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    this.particleData = [];

    // Exact Harmonized Romantic Palette from the Original Beloved Version
    const colorOuter = new THREE.Color(0xf43f5e);    // Neon crimson
    const colorDeep = new THREE.Color(0x881337);     // Deep velvet ruby
    const colorMid = new THREE.Color(0xbe123c);      // Warm rich crimson
    const colorRose = new THREE.Color(0xfda4af);     // Soft rose gold
    const colorGold = new THREE.Color(0xfef08a);     // Starlight gold
    const colorCore = new THREE.Color(0xffe4e6);     // Soft pearl peach
    const colorBeacon = new THREE.Color(0xffffff);   // Diamond beacon

    for (let i = 0; i < this.particleCount; i++) {
      const dotId = i + 1; // 1-indexed ID
      let x, y, z;
      let category = 1;
      const randType = Math.random();

      if (randType < 0.38) {
        // --- 1. Perimeter Shell (38%) ---
        category = 2;
        const t = Math.random() * Math.PI * 2;
        const p = HeartEngine.parametricHeart2D(t);
        const phi = (Math.random() - 0.5) * Math.PI;
        const maxT = HeartEngine.get3DHeartThickness(p.x, p.y);
        const thickness = maxT * Math.cos(phi);

        x = p.x * (Math.pow(Math.cos(phi), 0.3) * 0.18 + 0.82) + (Math.random() - 0.5) * 0.35;
        y = p.y + (Math.random() - 0.5) * 0.35;
        z = Math.sin(phi) * thickness + (Math.random() - 0.5) * 0.25;

      } else if (randType < 0.82) {
        // --- 2. Volumetric Interior (44%) ---
        category = 1;
        const t = Math.random() * Math.PI * 2;
        const p = HeartEngine.parametricHeart2D(t);
        const rScale = Math.pow(Math.random(), 0.62);
        const phi = (Math.random() - 0.5) * Math.PI;
        const px = p.x * rScale;
        const py = p.y * rScale;
        const maxT = HeartEngine.get3DHeartThickness(px, py);
        const thickness = maxT * Math.cos(phi);

        x = px + (Math.random() - 0.5) * 0.4;
        y = py + (Math.random() - 0.5) * 0.4;
        z = Math.sin(phi) * thickness + (Math.random() - 0.5) * 0.3;

      } else if (randType < 0.93) {
        // --- 3. Heart Core Emitter (11%) ---
        category = 0;
        const radius = Math.pow(Math.random(), 1.4) * 3.6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.sin(phi) * Math.sin(theta);
        z = radius * Math.cos(phi) * 0.85;

      } else {
        // --- 4. Ambient Stardust Halo (7%) ---
        category = 3;
        const t = Math.random() * Math.PI * 2;
        const p = HeartEngine.parametricHeart2D(t);
        const haloScale = 1.05 + Math.random() * 0.28;

        x = p.x * haloScale + (Math.random() - 0.5) * 1.5;
        y = p.y * haloScale + (Math.random() - 0.5) * 1.5;
        z = (Math.random() - 0.5) * 7.5;
      }

      // Distance from visual center (0, 0, 0)
      const distFromCore = Math.sqrt(x * x + y * y + z * z);
      const dirFromCore = distFromCore > 0.001 
        ? new THREE.Vector3(x / distFromCore, y / distFromCore, z / distFromCore)
        : new THREE.Vector3(0, 1, 0);

      let c = new THREE.Color();
      let baseSize = 1.8;

      const isDiscovered = this.discoveredStars.has(dotId);

      if (isDiscovered) {
        c.copy(colorGold).lerp(colorBeacon, 0.70);
        baseSize = 2.6;
      } else if (category === 0) {
        c.copy(colorCore).lerp(colorRose, Math.random() * 0.5);
        baseSize = 1.8 + Math.random() * 0.8;
      } else if (category === 1) {
        const factor = Math.min(distFromCore / this.maxRadius, 1.0);
        c.copy(colorDeep).lerp(colorMid, factor);
        baseSize = 1.4 + Math.random() * 0.6;
      } else if (category === 2) {
        c.copy(colorOuter).lerp(colorRose, Math.random() * 0.4);
        baseSize = 1.6 + Math.random() * 0.7;
      } else {
        c.copy(colorGold).lerp(colorRose, Math.random() * 0.6);
        baseSize = 1.0 + Math.random() * 0.5;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = baseSize;

      // Assign category metadata for constellation filtering
      let filterGroup = 'words_from_me';
      let categoryName = 'Grounded Devotion';
      let entryTitle = "Mary's Star";

      if (dotId <= 9 && PHOTO_MEMORIES[dotId]) {
        filterGroup = 'travel';
        categoryName = 'Travel & Shared Dreams';
        entryTitle = PHOTO_MEMORIES[dotId].title;
      } else {
        const lexIdx = Math.abs((dotId - 10) % MARY_SANCTUARY_LEXICON.length);
        const entry = MARY_SANCTUARY_LEXICON[lexIdx];
        categoryName = entry.category || 'Grounded Devotion';
        entryTitle = entry.title || "Mary's Star";

        if (
          categoryName === 'Grounded Devotion' ||
          categoryName === 'Grounded Devotion & Letters' ||
          categoryName === 'Playful Dominance & Banter' ||
          categoryName === 'Take the Compliment'
        ) {
          filterGroup = 'words_from_me';
        } else if (
          categoryName === 'Celestial Verse' ||
          categoryName === 'Celestial Verse & Poetry'
        ) {
          filterGroup = 'poems';
        } else if (
          categoryName === 'Stay Strong & Motivated' ||
          categoryName === 'Somatic & Physical Care'
        ) {
          filterGroup = 'advice';
        } else if (
          categoryName === 'Flirty Science & Shared Dreams'
        ) {
          if (entry.id && entry.id.startsWith('drm-')) {
            filterGroup = 'travel';
          } else {
            filterGroup = 'words_from_me';
          }
        } else {
          filterGroup = 'words_from_me';
        }
      }

      this.particleData.push({
        id: dotId,
        baseX: x,
        baseY: y,
        baseZ: z,
        distanceFromCore: distFromCore,
        directionFromCore: dirFromCore,
        category: category,
        filterGroup: filterGroup,
        categoryName: categoryName,
        entryTitle: entryTitle,
        baseColor: c.clone(),
        currentColor: c.clone(),
        baseSize: baseSize,
        currentSize: baseSize,
        hoverGlow: 0.0,
        isDiscovered: isDiscovered
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('customPointSize', new THREE.BufferAttribute(sizes, 1));

    const texture = this.createParticleTexture();

    const material = new THREE.PointsMaterial({
      size: 2.8,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      sizeAttenuation: true
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute float customPointSize;
        ${shader.vertexShader}
      `.replace(
        'gl_PointSize = size;',
        'gl_PointSize = customPointSize;'
      );
    };

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const cx = 32;
    const cy = 32;

    // Crisp, luminous Gaussian starlight particle
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    grad.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');       // Diamond core
    grad.addColorStop(0.18, 'rgba(255, 235, 242, 0.92)');      // Incandescent starlight
    grad.addColorStop(0.48, 'rgba(244, 63, 94, 0.48)');       // Luminous rose-crimson aura
    grad.addColorStop(0.82, 'rgba(159, 18, 57, 0.12)');       // Deep ruby boundary
    grad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  update(timeSeconds) {
    if (!this.particles) return;

    const positions = this.particles.geometry.attributes.position.array;
    const colors = this.particles.geometry.attributes.color.array;
    const sizes = this.particles.geometry.attributes.customPointSize.array;

    // 1. Anatomical Lub-Dub Heartbeat cycle
    const beatFrequency = CONFIG.visuals.corePulseSpeed || 1.15;
    const cycleTime = (timeSeconds * beatFrequency) % 1.0;

    let beatScale = 1.0;
    if (cycleTime < 0.16) {
      beatScale = 1.0 + Math.sin((cycleTime / 0.16) * Math.PI) * 0.065;
    } else if (cycleTime >= 0.20 && cycleTime < 0.36) {
      beatScale = 1.0 + Math.sin(((cycleTime - 0.20) / 0.16) * Math.PI) * 0.042;
    }

    // 2. Dynamic Inside-Out Wave of Light Radiating from Core to Outer Edges
    const waveSpeed = this.waveSpeed || 13.5;
    const maxDist = this.maxRadius * 1.15;
    const waveRadius = ((timeSeconds * waveSpeed) % (maxDist * 1.15));
    const waveWidth = 4.0;

    const beaconColor = new THREE.Color(0xffffff);
    const flashGold = new THREE.Color(CONFIG.visuals.colors.starlightGold || 0xfef08a);
    const flashCoral = new THREE.Color(CONFIG.visuals.colors.warmCoral || 0xfb7185);
    const electricCyan = new THREE.Color(0x38bdf8);

    let hoveredPos = null;
    if (this.hoveredIndex >= 0 && this.hoveredIndex < this.particleCount) {
      const hData = this.particleData[this.hoveredIndex];
      hoveredPos = new THREE.Vector3(hData.baseX, hData.baseY, hData.baseZ);
    }

    for (let i = 0; i < this.particleCount; i++) {
      const data = this.particleData[i];

      const distFromWave = Math.abs(data.distanceFromCore - waveRadius);
      let waveFactor = 0.0;
      if (distFromWave < waveWidth) {
        waveFactor = Math.cos((distFromWave / waveWidth) * (Math.PI / 2));
      }

      const radialPush = waveFactor * 0.35;
      const totalScale = beatScale;

      positions[i * 3] = (data.baseX + data.directionFromCore.x * radialPush) * totalScale;
      positions[i * 3 + 1] = (data.baseY + data.directionFromCore.y * radialPush) * totalScale;
      positions[i * 3 + 2] = (data.baseZ + data.directionFromCore.z * radialPush) * totalScale;

      const c = data.currentColor.copy(data.baseColor);
      let targetSize = data.baseSize;

      if (this.activeFilter && this.activeFilter !== 'all') {
        // --- CONSTELLATION FILTER HIGHLIGHT MODE ---
        const isMatch = (data.filterGroup === this.activeFilter);

        if (isMatch) {
          // Highlight with category's signature color
          const highlightColor = this.filterColors[this.activeFilter] || beaconColor;
          c.copy(highlightColor);

          // Luminous organic twinkle/shimmer
          const twinkle = Math.sin(timeSeconds * 3.6 + i * 0.12) * 0.35;
          targetSize = data.baseSize * (2.25 + twinkle);

          if (i === this.hoveredIndex) {
            c.setHex(0xffffff);
            targetSize = data.baseSize * 4.6;
            data.hoverGlow = 1.0;
          }
        } else {
          // Gracefully dim non-matching stars into soft velvet night twilight
          c.multiplyScalar(0.14);
          targetSize = data.baseSize * 0.65;
        }
      } else {
        // --- DEFAULT ALL-STARS MODE ---
        if (data.isDiscovered) {
          c.lerp(beaconColor, 0.65);
          targetSize = data.baseSize * 1.35;
        } else if (waveFactor > 0.01) {
          if (data.category === 0) {
            c.lerp(flashGold, waveFactor * 0.40);
          } else {
            c.lerp(flashCoral, waveFactor * 0.30);
            c.lerp(flashGold, waveFactor * 0.15);
          }
          targetSize = data.baseSize * (1.0 + waveFactor * 0.18);
        }

        if (i === this.hoveredIndex) {
          c.copy(electricCyan);
          targetSize = data.baseSize * 4.2;
          data.hoverGlow = 1.0;
        } else if (hoveredPos) {
          const dx = data.baseX - hoveredPos.x;
          const dy = data.baseY - hoveredPos.y;
          const dz = data.baseZ - hoveredPos.z;
          const distToHovered = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (distToHovered < 3.8) {
            const dimFactor = 0.50 + (distToHovered / 3.8) * 0.50;
            c.multiplyScalar(dimFactor);
          }
        }
      }

      if (data.hoverGlow > 0.01 && i !== this.hoveredIndex) {
        c.lerp(beaconColor, data.hoverGlow);
        data.hoverGlow *= 0.88;
      }

      data.currentSize += (targetSize - data.currentSize) * 0.25;
      sizes[i] = data.currentSize;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.color.needsUpdate = true;
    this.particles.geometry.attributes.customPointSize.needsUpdate = true;
  }

  setFilter(filterId) {
    this.activeFilter = filterId;
  }

  markDiscovered(index) {
    if (index >= 0 && index < this.particleCount) {
      const data = this.particleData[index];
      data.isDiscovered = true;
      this.saveDiscoveredStar(data.id);

      const beaconColor = new THREE.Color(0xfef08a).lerp(new THREE.Color(0xffffff), 0.75);
      data.baseColor.copy(beaconColor);
      data.hoverGlow = 3.0;
    }
  }

  highlightParticle(index) {
    this.hoveredIndex = (index >= 0 && index < this.particleCount) ? index : -1;
  }

  getParticleWorldPosition(index) {
    if (index >= 0 && index < this.particleCount) {
      const positions = this.particles.geometry.attributes.position.array;
      const v = new THREE.Vector3(
        positions[index * 3],
        positions[index * 3 + 1],
        positions[index * 3 + 2]
      );
      this.particles.updateMatrixWorld(true);
      return v.applyMatrix4(this.particles.matrixWorld);
    }
    return new THREE.Vector3(0, 0, 0);
  }

  getDiscoveredCount() {
    return this.discoveredStars.size;
  }
}
