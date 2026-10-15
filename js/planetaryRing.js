/**
 * =========================================================================
 * 3D ROSE-RUBY AURORA BOREALIS & COSMIC GEMSTONES ENGINE
 * =========================================================================
 * Renders an undulating 3D Northern Lights silk ribbon in deep ruby & rose gold,
 * embedded with 32 faceted tumbling gemstones (16 Blood Rubies + 16 Brilliant Diamonds)
 * and ambient cosmic stardust embers circling Mary's heart in 3D orbit.
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class PlanetaryRingEngine {
  constructor(scene) {
    this.scene = scene;

    // Orbital pivot centered at (0, 0, 0) for continuous revolution around Mary's beating heart
    this.orbitPivot = new THREE.Group();
    this.scene.add(this.orbitPivot);

    this.ringGroup = new THREE.Group();
    this.orbitPivot.add(this.ringGroup);

    const cfg = CONFIG.visuals.aurora || {};
    this.radiusX = cfg.radiusX || 34.0;
    this.radiusZ = cfg.radiusZ || 34.0;
    this.ribbonWidth = cfg.ribbonWidth || 5.2;
    this.waveSpeed = cfg.waveSpeed || 0.65;
    this.undulationAmp = cfg.undulationAmplitude || 2.4;

    // Centered horizontally around Mary's heart (0 static inclination)
    this.ringGroup.rotation.set(0, 0, 0);
    this.orbitPivot.rotation.set(0, 0, 0);

    // Components
    this.auroraMesh = null;
    this.auroraGeom = null;
    this.auroraSegments = 160;
    this.auroraVDivs = 12;
    this.basePositions = [];

    this.gemstones = [];
    this.dustParticles = null;

    this.initAuroraRibbon();
    this.initGemstones();
    this.initStardustEmbers();
    this.initSpecialOrbitBeacon();
  }

  /* -------------------------------------------------------------------------
   * 1. 3D PARAMETRIC UNDULATING AURORA RIBBON (ROSE-RUBY NORTHERN LIGHTS)
   * ------------------------------------------------------------------------- */
  initAuroraRibbon() {
    const segments = this.auroraSegments;
    const vDivs = this.auroraVDivs;
    const totalVertices = (segments + 1) * (vDivs + 1);

    this.auroraGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(totalVertices * 3);
    const uvs = new Float32Array(totalVertices * 2);
    const indices = [];

    this.basePositions = [];

    let vertexIdx = 0;
    for (let j = 0; j <= vDivs; j++) {
      const v = j / vDivs; // 0.0 (bottom edge) to 1.0 (top edge)
      const vNorm = v - 0.5; // -0.5 to +0.5

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const theta = u * Math.PI * 2;

        const bx = Math.cos(theta) * this.radiusX;
        const bz = Math.sin(theta) * this.radiusZ;
        const by = vNorm * this.ribbonWidth;

        positions[vertexIdx * 3] = bx;
        positions[vertexIdx * 3 + 1] = by;
        positions[vertexIdx * 3 + 2] = bz;

        uvs[vertexIdx * 2] = u * 4.0; // Repeat texture 4 times around the orbit
        uvs[vertexIdx * 2 + 1] = v;

        this.basePositions.push({
          theta: theta,
          u: u,
          vNorm: vNorm,
          bx: bx,
          bz: zNorm(theta, this.radiusZ),
          by: by
        });

        vertexIdx++;
      }
    }

    function zNorm(t, rz) {
      return Math.sin(t) * rz;
    }

    // Index grid for two-sided ribbon triangles
    for (let j = 0; j < vDivs; j++) {
      for (let i = 0; i < segments; i++) {
        const a = j * (segments + 1) + i;
        const b = (j + 1) * (segments + 1) + i;
        const c = (j + 1) * (segments + 1) + (i + 1);
        const d = j * (segments + 1) + (i + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    this.auroraGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.auroraGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.auroraGeom.setIndex(indices);
    this.auroraGeom.computeVertexNormals();

    this.ribbonTexture = this.createAuroraTexture();

    const auroraMaterial = new THREE.MeshBasicMaterial({
      map: this.ribbonTexture,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false
    });

    this.auroraMesh = new THREE.Mesh(this.auroraGeom, auroraMaterial);
    this.ringGroup.add(this.auroraMesh);
  }

  createAuroraTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Vertical curtain gradient (harmonized radiant crimson-ruby & starlight gold)
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.14, 'rgba(225, 29, 72, 0.22)'); // Rich velvet ruby
    grad.addColorStop(0.44, 'rgba(244, 63, 94, 0.88)'); // Radiant crimson ruby - exactly matching the heart
    grad.addColorStop(0.68, 'rgba(225, 29, 72, 0.55)'); // Royal ruby
    grad.addColorStop(0.85, 'rgba(159, 18, 57, 0.25)'); // Deep wine undertone
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Ethereal vertical curtain light bands (Crimson & Champagne Gold ripples)
    for (let x = 0; x < 512; x += 16) {
      const alpha = 0.08 + Math.sin((x / 512) * Math.PI * 8) * 0.05;
      ctx.fillStyle = (x % 32 === 0) 
        ? `rgba(254, 240, 138, ${alpha * 0.75})` 
        : `rgba(244, 63, 94, ${alpha * 0.9})`;
      ctx.fillRect(x, 20, 8, 216);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /* -------------------------------------------------------------------------
   * 2. 32 FACETED 3D COSMIC GEMSTONES (16 RUBIES + 16 DIAMONDS)
   * ------------------------------------------------------------------------- */
  initGemstones() {
    const gemCfg = CONFIG.visuals.gemstones || {};
    const totalGems = gemCfg.count || 32;

    const rubyGeom = new THREE.OctahedronGeometry(0.72, 0); // Faceted octahedron
    const diamondGeom = new THREE.OctahedronGeometry(0.64, 0);

    const rubyMaterial = new THREE.MeshStandardMaterial({
      color: 0xe11d48,           // Blood Ruby
      emissive: 0x881337,
      emissiveIntensity: 0.75,
      roughness: 0.12,
      metalness: 0.85,
      flatShading: true
    });

    const diamondMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,           // Brilliant Diamond
      emissive: 0x38bdf8,        // Ice Diamond Glint
      emissiveIntensity: 0.7,
      roughness: 0.06,
      metalness: 0.95,
      flatShading: true
    });

    this.gemstones = [];

    for (let i = 0; i < totalGems; i++) {
      const isRuby = i % 2 === 0;
      const mesh = new THREE.Mesh(
        isRuby ? rubyGeom : diamondGeom,
        isRuby ? rubyMaterial : diamondMaterial
      );

      const baseAngle = (i / totalGems) * Math.PI * 2;
      const radialJitter = (Math.random() - 0.5) * 2.8;
      const heightJitter = (Math.random() - 0.5) * 1.6;

      const rotSpeedX = (Math.random() - 0.5) * 0.035;
      const rotSpeedY = (Math.random() - 0.5) * 0.045;
      const rotSpeedZ = (Math.random() - 0.5) * 0.03;

      this.gemstones.push({
        mesh: mesh,
        baseAngle: baseAngle,
        radiusOffset: radialJitter,
        heightOffset: heightJitter,
        rotSpeedX: rotSpeedX,
        rotSpeedY: rotSpeedY,
        rotSpeedZ: rotSpeedZ,
        driftSpeed: 0.045 + (Math.random() * 0.02)
      });

      this.ringGroup.add(mesh);
    }
  }

  /* -------------------------------------------------------------------------
   * 3. AMBIENT COSMIC STARDUST EMBERS
   * ------------------------------------------------------------------------- */
  initStardustEmbers() {
    const count = 260;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorCrimson = new THREE.Color(CONFIG.visuals.colors.brightCrimson); // 0xf43f5e
    const colorRuby = new THREE.Color(CONFIG.visuals.colors.royalRuby);       // 0xe11d48
    const colorGold = new THREE.Color(CONFIG.visuals.colors.starlightGold);   // 0xfef08a
    const colorDiamond = new THREE.Color(0xffffff);

    this.dustData = [];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const rOffset = (Math.random() - 0.5) * 4.2;
      const yOffset = (Math.random() - 0.5) * 2.2;
      const driftSpeed = 0.02 + Math.random() * 0.025;

      this.dustData.push({ theta, rOffset, yOffset, driftSpeed });

      const rx = this.radiusX + rOffset;
      const rz = this.radiusZ + rOffset;

      positions[i * 3] = Math.cos(theta) * rx;
      positions[i * 3 + 1] = yOffset;
      positions[i * 3 + 2] = Math.sin(theta) * rz;

      const c = new THREE.Color();
      const rand = Math.random();
      if (rand < 0.45) c.copy(colorCrimson);
      else if (rand < 0.72) c.copy(colorRuby);
      else if (rand < 0.88) c.copy(colorGold);
      else c.copy(colorDiamond);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Glowing particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(244, 63, 94, 0.75)'); // Radiant crimson starlight
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();

    const starTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.35,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.ringGroup.add(this.dustParticles);
  }

  /* -------------------------------------------------------------------------
   * PER-FRAME ANIMATION UPDATE (CALM, SERENE & GRACEFUL SILK FLOW)
   * ------------------------------------------------------------------------- */
  update(timeSeconds) {
    // The orbit ring is anchored horizontally in the X-Z plane around Mary's heart
    if (this.ringGroup) {
      this.ringGroup.rotation.set(0, 0, 0);
    }

    // Dynamic wave time: smooth, nice, slow, but alive
    const t = timeSeconds * 0.90;

    // Bioluminescent silk light bands flow gently along the ribbon
    if (this.ribbonTexture) {
      this.ribbonTexture.offset.x = (timeSeconds * 0.045) % 1.0;
    }

    // 2. Dynamic Traveling Wave Going Across the Ribbon
    if (this.auroraGeom && this.basePositions.length > 0) {
      const posAttr = this.auroraGeom.attributes.position;
      const posArray = posAttr.array;
      const count = this.basePositions.length;

      for (let i = 0; i < count; i++) {
        const bp = this.basePositions[i];
        const theta = bp.theta;

        // Smooth traveling wave moving across the horizontal ring
        const wave1 = Math.sin(theta * 3.0 - t * 1.3) * 2.2;  // Traveling wave crests
        const wave2 = Math.cos(theta * 2.0 + t * 0.8) * 1.1;  // Harmonic ripple
        const wave3 = Math.sin(theta * 1.0 - t * 0.4) * 0.6;  // Breathing ocean swell
        const totalWave = wave1 + wave2 + wave3;

        // Subtle radial breathing swell
        const rSwell = Math.cos(theta * 2.0 - t * 0.70) * 0.75;

        posArray[i * 3] = Math.cos(theta) * (this.radiusX + rSwell);
        posArray[i * 3 + 1] = bp.by + totalWave;
        posArray[i * 3 + 2] = Math.sin(theta) * (this.radiusZ + rSwell);
      }

      posAttr.needsUpdate = true;
    }

    // 3. Tumbling Gemstones Gliding Along the Traveling Wave
    for (let i = 0; i < this.gemstones.length; i++) {
      const g = this.gemstones[i];
      // Slow, steady orbital drift along the perimeter
      const curAngle = g.baseAngle + timeSeconds * (g.driftSpeed * 0.40);

      const wave1 = Math.sin(curAngle * 3.0 - t * 1.3) * 2.2;
      const wave2 = Math.cos(curAngle * 2.0 + t * 0.8) * 1.1;
      const wave3 = Math.sin(curAngle * 1.0 - t * 0.4) * 0.6;
      const gemY = wave1 + wave2 + wave3 + g.heightOffset;

      const rSwell = Math.cos(curAngle * 2.0 - t * 0.70) * 0.75;
      const rx = this.radiusX + rSwell + g.radiusOffset;
      const rz = this.radiusZ + rSwell + g.radiusOffset;

      g.mesh.position.set(
        Math.cos(curAngle) * rx,
        gemY,
        Math.sin(curAngle) * rz
      );

      // Smooth faceted tumbling on axes
      g.mesh.rotation.x += g.rotSpeedX * 0.35;
      g.mesh.rotation.y += g.rotSpeedY * 0.35;
      g.mesh.rotation.z += g.rotSpeedZ * 0.35;
    }

    // 4. Stardust Embers Rippling in Traveling Swells
    if (this.dustParticles && this.dustData && this.dustData.length > 0) {
      const posAttr = this.dustParticles.geometry.attributes.position;
      const posArray = posAttr.array;
      for (let i = 0; i < this.dustData.length; i++) {
        const d = this.dustData[i];
        const curAngle = d.theta + timeSeconds * d.driftSpeed;

        const wave1 = Math.sin(curAngle * 3.0 - t * 1.3) * 2.2;
        const wave2 = Math.cos(curAngle * 2.0 + t * 0.8) * 1.1;
        const wave3 = Math.sin(curAngle * 1.0 - t * 0.4) * 0.6;
        const dustY = wave1 + wave2 + wave3 + d.yOffset;

        const rSwell = Math.cos(curAngle * 2.0 - t * 0.70) * 0.75;
        const rx = this.radiusX + rSwell + d.rOffset;
        const rz = this.radiusZ + rSwell + d.rOffset;

        posArray[i * 3] = Math.cos(curAngle) * rx;
        posArray[i * 3 + 1] = dustY;
        posArray[i * 3 + 2] = Math.sin(curAngle) * rz;
      }
      posAttr.needsUpdate = true;
    }

    // 5. Special Radiant Orbit Beacon (Sanctuary Vessel)
    this.updateSpecialBeacon(timeSeconds, t);
  }

  /* -------------------------------------------------------------------------
   * 4. SPECIAL RADIANT ORBIT BEACON (SANCTUARY VESSEL)
   * ------------------------------------------------------------------------- */
  initSpecialOrbitBeacon() {
    this.beaconGroup = new THREE.Group();
    this.ringGroup.add(this.beaconGroup);

    // 1. Core Diamond Polyhedron Star
    const beaconGeom = new THREE.IcosahedronGeometry(0.85, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 1.2,
      roughness: 0.05,
      metalness: 0.95,
      flatShading: true
    });
    this.beaconCoreMesh = new THREE.Mesh(beaconGeom, beaconMat);
    this.beaconGroup.add(this.beaconCoreMesh);

    // 2. Multi-point Radiant Starlight Flare Sprite
    const flareTex = this.createBeaconFlareTexture();
    const flareMat = new THREE.SpriteMaterial({
      map: flareTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.55,
      depthWrite: false
    });
    this.beaconFlare = new THREE.Sprite(flareMat);
    this.beaconFlare.scale.set(3.0, 3.0, 1.0);
    this.beaconGroup.add(this.beaconFlare);

    // 3. Rotating Starlight Halo Rays
    const raysTex = this.createBeaconRaysTexture();
    const raysMat = new THREE.SpriteMaterial({
      map: raysTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.35,
      depthWrite: false
    });
    this.beaconRays = new THREE.Sprite(raysMat);
    this.beaconRays.scale.set(3.8, 3.8, 1.0);
    this.beaconGroup.add(this.beaconRays);

    // 4. Invisible Hover & Click Hit Target (Spherical collider for effortless picking)
    const hitGeom = new THREE.SphereGeometry(3.6, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.beaconHitTarget = new THREE.Mesh(hitGeom, hitMat);
    this.beaconHitTarget.userData = { isSanctuaryBeacon: true };
    this.beaconGroup.add(this.beaconHitTarget);

    // State & Coordinates
    this.beaconState = 'orbiting'; // 'orbiting' | 'ascending' | 'centered' | 'descending'
    this.beaconOrbitAngle = Math.PI * 0.28; // prominent starting angle on front ribbon
    this.beaconDriftSpeed = 0.045;
    this.isHovered = false;
  }

  createBeaconFlareTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const cx = 128, cy = 128;

    // Radiant starlight core
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.16, 'rgba(254, 240, 138, 0.95)'); // Starlight gold
    grad.addColorStop(0.38, 'rgba(244, 63, 94, 0.65)');   // Crimson aura
    grad.addColorStop(0.68, 'rgba(56, 189, 248, 0.25)');  // Electric cyan edge
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.fill();

    // 4-point razor diamond spikes
    for (let angle of [0, Math.PI / 2]) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const spike = ctx.createLinearGradient(-124, 0, 124, 0);
      spike.addColorStop(0, 'rgba(255, 255, 255, 0)');
      spike.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
      spike.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = spike;
      ctx.fillRect(-124, -2.0, 248, 4.0);
      ctx.restore();
    }

    return new THREE.CanvasTexture(canvas);
  }

  createBeaconRaysTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const cx = 128, cy = 128;

    // 8 diagonal rays
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const ray = ctx.createLinearGradient(0, 0, 114, 0);
      ray.addColorStop(0, 'rgba(254, 240, 138, 0.90)');
      ray.addColorStop(0.4, 'rgba(244, 63, 94, 0.40)');
      ray.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = ray;
      ctx.beginPath();
      ctx.moveTo(0, -3.0);
      ctx.lineTo(114, 0);
      ctx.lineTo(0, 3.0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    return new THREE.CanvasTexture(canvas);
  }

  updateSpecialBeacon(timeSeconds, t) {
    if (!this.beaconGroup) return;

    if (this.beaconState === 'orbiting') {
      // 1. Orbital revolution along the traveling wave
      const curAngle = this.beaconOrbitAngle + timeSeconds * (this.beaconDriftSpeed * 0.40);
      
      const wave1 = Math.sin(curAngle * 3.0 - t * 1.3) * 2.2;
      const wave2 = Math.cos(curAngle * 2.0 + t * 0.8) * 1.1;
      const wave3 = Math.sin(curAngle * 1.0 - t * 0.4) * 0.6;
      const beaconY = wave1 + wave2 + wave3;

      const rSwell = Math.cos(curAngle * 2.0 - t * 0.70) * 0.75;
      const rx = this.radiusX + rSwell;
      const rz = this.radiusZ + rSwell;

      this.beaconGroup.position.set(
        Math.cos(curAngle) * rx,
        beaconY,
        Math.sin(curAngle) * rz
      );

      // Core rotation & starlight pulsing
      this.beaconCoreMesh.rotation.x += 0.025;
      this.beaconCoreMesh.rotation.y += 0.035;

      const pulse = 1.0 + Math.sin(timeSeconds * 3.8) * 0.16 + (this.isHovered ? 0.25 : 0.0);
      const baseScale = this.isHovered ? 4.2 : 3.0;
      this.beaconFlare.scale.set(baseScale * pulse, baseScale * pulse, 1.0);
      this.beaconRays.material.rotation = timeSeconds * 0.55;
      this.beaconRays.scale.set(baseScale * 1.25 * pulse, baseScale * 1.25 * pulse, 1.0);

    } else if (this.beaconState === 'ascending' || this.beaconState === 'centered') {
      // Intensely glowing and rotating in the middle of the screen
      this.beaconCoreMesh.rotation.x += 0.04;
      this.beaconCoreMesh.rotation.y += 0.05;

      const pulse = 1.0 + Math.sin(timeSeconds * 5.0) * 0.18;
      this.beaconFlare.scale.set(8.5 * pulse, 8.5 * pulse, 1.0);
      this.beaconRays.material.rotation = timeSeconds * 0.85;
      this.beaconRays.scale.set(11.0 * pulse, 11.0 * pulse, 1.0);
    }
  }

  getBeaconHitTarget() {
    return this.beaconHitTarget;
  }

  getOrbitHitTargets() {
    const targets = [];
    if (this.beaconHitTarget) targets.push(this.beaconHitTarget);
    return targets;
  }

  setBeaconHovered(hovered) {
    this.isHovered = hovered;
    if (this.beaconCoreMesh) {
      this.beaconCoreMesh.material.emissiveIntensity = hovered ? 1.8 : 1.2;
    }
  }

  ascendBeaconToCenter(onCompleteCallback) {
    if (this.beaconState === 'ascending' || this.beaconState === 'centered') return;

    this.beaconState = 'ascending';
    const targetPos = new THREE.Vector3(0, 3.2, 28);

    if (window.gsap) {
      window.gsap.killTweensOf([this.beaconGroup.position, this.beaconFlare.scale]);

      window.gsap.to(this.beaconGroup.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.2,
        ease: "power3.out",
        onComplete: () => {
          this.beaconState = 'centered';
          if (onCompleteCallback) onCompleteCallback();
        }
      });

      window.gsap.to(this.beaconFlare.scale, {
        x: 8.5,
        y: 8.5,
        duration: 1.2,
        ease: "power2.out"
      });
    } else {
      this.beaconGroup.position.copy(targetPos);
      this.beaconState = 'centered';
      if (onCompleteCallback) onCompleteCallback();
    }
  }

  descendBeaconToOrbit() {
    if (this.beaconState === 'orbiting') return;

    this.beaconState = 'descending';

    // Calculate current orbital wave position
    const curAngle = this.beaconOrbitAngle;
    const wave = Math.sin(curAngle * 3.0) * 2.2 + Math.cos(curAngle * 2.0) * 1.1;
    const targetPos = new THREE.Vector3(
      Math.cos(curAngle) * this.radiusX,
      wave,
      Math.sin(curAngle) * this.radiusZ
    );

    if (window.gsap) {
      window.gsap.killTweensOf([this.beaconGroup.position, this.beaconFlare.scale]);

      window.gsap.to(this.beaconGroup.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.1,
        ease: "power2.inOut",
        onComplete: () => {
          this.beaconState = 'orbiting';
        }
      });

      window.gsap.to(this.beaconFlare.scale, {
        x: 3.0,
        y: 3.0,
        duration: 1.1,
        ease: "power2.inOut"
      });
    } else {
      this.beaconGroup.position.copy(targetPos);
      this.beaconState = 'orbiting';
    }
  }
}
