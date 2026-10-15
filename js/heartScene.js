/**
 * =========================================================================
 * 3D SCENE ORCHESTRATOR & WEBGL PIPELINE
 * =========================================================================
 * Coordinates Three.js scene, camera, lights, UnrealBloomPass postprocessing,
 * OrbitControls (zoom inside heart enabled), Screen-Space Background Whispers,
 * Stardust Ribbon, and camera focus glide animations.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { CONFIG } from './config.js';
import { HeartEngine } from './heartGeometry.js?v=337';
import { PlanetaryRingEngine } from './planetaryRing.js?v=337';
import { RaycasterInteraction } from './raycasterInteraction.js?v=337';
import { modalManager } from './modalManager.js?v=337';
import { telemetry } from './telemetry.js?v=337';
import { ScreenWhispersEngine } from './screenWhispers.js';
import { musicPlayer } from './musicPlayer.js?v=337';
import { ShootingStarsEngine } from './shootingStars.js';
import { BackgroundStarfield } from './backgroundStarfield.js?v=337';
import { ConstellationSelector } from './constellationSelector.js?v=337';
import { letterModal } from './letterModal.js?v=337';
import { vaultManager } from './vaultManager.js?v=337';
import { sanctuaryGate } from './sanctuaryGate.js?v=337';
import { orientationManager } from './orientationManager.js?v=337';

class HeartScene {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    this.heartEngine = null;
    this.planetaryRing = null;
    this.shootingStars = null;
    this.raycaster = null;
    this.screenWhispers = null;
    this.isCameraOrbitActive = false;

    // Time Dilation ("Slow Time" for calm reading when modal is open)
    this.timeScale = 1.0;
    this.simulatedTime = 0.0;

    window.heartScene = this;

    this.init();
  }

  setTimeDilation(isDilated) {
    const targetScale = isDilated ? 0.25 : 1.0;
    if (window.gsap) {
      window.gsap.killTweensOf(this, "timeScale");
      window.gsap.to(this, {
        timeScale: targetScale,
        duration: isDilated ? 0.85 : 0.65,
        ease: "power2.out"
      });
    } else {
      this.timeScale = targetScale;
    }
  }

  /**
   * Dynamically calculates camera distance and altitude based on viewport aspect ratio.
   * Desktop/Landscape (aspect >= 1.0): Returns exact intimate cinematic distance (Z = 62, Y = 3).
   * Mobile Portrait (aspect < 1.0): Dynamically calculates Z so the heart (width 32) fits
   * edge-to-edge with ~10% horizontal margins (e.g. Z ~ 104-108 for iPhone 14/15/16 Pro).
   */
  getCameraFraming(aspect = (window.innerWidth / window.innerHeight)) {
    const baseZ = CONFIG.visuals.camera.initialPosition?.z || 62.0;
    const baseY = CONFIG.visuals.camera.initialPosition?.y || 3.0;

    if (aspect >= 1.0) {
      return { z: baseZ, y: baseY, targetDist: Math.hypot(baseY, baseZ) };
    }

    // Three.js vertical FOV = 45 degrees
    // Visible horizontal world width at distance Z is: 2 * Z * tan(vFOV / 2) * aspect
    // Cardioid heart width is 32 units (x: -16 to +16).
    // Target visible width of ~40.5 units ensures heart occupies ~79% of screen width,
    // leaving clean, elegant ~10.5% margins on mobile and keeping planetary rings in view.
    const targetVisibleWidth = 40.5;
    const fovRad = (this.camera ? this.camera.fov : 45) * (Math.PI / 180);
    const zNeeded = targetVisibleWidth / (2 * Math.tan(fovRad / 2) * aspect);

    // Clamp between baseZ (62.0) and 112.0
    const z = THREE.MathUtils.clamp(zNeeded, baseZ, 112.0);
    // Scale altitude Y proportionally to preserve exact polar viewing pitch angle
    const y = baseY * (z / baseZ);

    return { z, y, targetDist: Math.hypot(y, z) };
  }

  init() {
    if (window.gsap && window.gsap.ticker) {
      window.gsap.ticker.lagSmoothing(false);
    }

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.visuals.colors.background);
    this.scene.fog = new THREE.FogExp2(CONFIG.visuals.colors.background, 0.003);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    const initialFraming = this.getCameraFraming(aspect);
    this.camera.position.set(0, initialFraming.y, initialFraming.z);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.domElement.style.touchAction = 'none';
    this.container.appendChild(this.renderer.domElement);

    // 3. Orbit Controls: Horizontal orbit with gentle organic vertical perspective
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false; // Left mouse drag exclusively orbits around the heart at (0, 0, 0)!
    this.controls.minDistance = CONFIG.visuals.camera.minDistance || 1.2;  // Fly right inside!
    this.controls.maxDistance = Math.max(CONFIG.visuals.camera.maxDistance || 145.0, initialFraming.z * 1.35);

    // Explicit touches mapping for mobile touch gestures (1-finger rotate, 2-finger pinch zoom)
    if (THREE.TOUCH) {
      this.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    }
    
    // Natural viewing perspective around the horizontal axis
    this.controls.minPolarAngle = 1.25; // ~71.6° (view lobes from slightly above)
    this.controls.maxPolarAngle = 1.72; // ~98.5° (view lancet apex from slightly below)
    this.controls.minAzimuthAngle = -Infinity;    // Full 360° continuous orbit!
    this.controls.maxAzimuthAngle = Infinity;     // No walls, no getting stuck!
    this.controls.rotateSpeed = 0.85;             // Smooth, responsive rotation speed
    this.controls.autoRotate = false;             // Disabled by default

    // 4. Subtle Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(CONFIG.visuals.colors.brightCrimson, 1.2);
    rimLight.position.set(20, 30, 20);
    this.scene.add(rimLight);

    // 5. Postprocessing Bloom Pipeline
    this.initPostProcessing();

    // 6. Instantiate 3D Engines & Screen Whispers
    this.heartEngine = new HeartEngine(this.scene);
    this.planetaryRing = new PlanetaryRingEngine(this.scene);
    this.shootingStars = new ShootingStarsEngine(this.scene, this.camera, this.controls);
    this.backgroundStarfield = new BackgroundStarfield(this.scene);
    this.raycaster = new RaycasterInteraction(this.camera, this.scene, this.heartEngine, this.planetaryRing);
    this.screenWhispers = new ScreenWhispersEngine();
    this.constellationSelector = new ConstellationSelector(this.heartEngine);

    // Camera Focus Glide when Mary selects a star
    modalManager.setFlyToCallback((index) => this.flyCameraToParticle(index));

    // 7. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize(true));
    window.addEventListener('orientationchange', () => {
      // Delay to allow mobile browser bar & viewport dimensions to settle
      setTimeout(() => this.onWindowResize(true), 120);
      setTimeout(() => this.onWindowResize(true), 320);
    });
    if (orientationManager && typeof orientationManager.onOrientationChange === 'function') {
      orientationManager.onOrientationChange(() => this.onWindowResize(true));
    }
    this.initUIButtons();

    // 8. Silent Visit Telemetry Launch
    telemetry.init();

    // 9. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // Smooth camera glide toward a clicked star
  flyCameraToParticle(particleIndex) {
    if (!this.heartEngine || !window.gsap) return;
    const worldPos = this.heartEngine.getParticleWorldPosition(particleIndex);
    if (!worldPos || worldPos.lengthSq() < 0.01) return;

    const currentCamDir = this.camera.position.clone().sub(this.controls.target).normalize();
    const targetCamPos = worldPos.clone().add(currentCamDir.multiplyScalar(9.0));

    window.gsap.killTweensOf([this.camera.position, this.controls.target]);

    // Temporarily pause OrbitControls damping to prevent animation cracking
    this.controls.enabled = false;

    window.gsap.to(this.controls.target, {
      x: worldPos.x,
      y: worldPos.y,
      z: worldPos.z,
      duration: 1.2,
      ease: "power2.out"
    });

    window.gsap.to(this.camera.position, {
      x: targetCamPos.x,
      y: targetCamPos.y,
      z: targetCamPos.z,
      duration: 1.4,
      ease: "power2.out",
      onComplete: () => {
        this.controls.enabled = true;
        this.controls.update();
      }
    });
  }

  initPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      CONFIG.visuals.bloomStrength,
      CONFIG.visuals.bloomRadius,
      CONFIG.visuals.bloomThreshold
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);
  }

  initUIButtons() {
    // 1. Center View Camera Button (Pull back from inside to centered full overview)
    const resetBtn = document.getElementById('reset-cam-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.resetCameraToCenter();
      });
    }

    // 2. Starlight Orbit Beacon / Sanctuary Vessel Button
    const vesselBtn = document.getElementById('open-vessel-btn');
    if (vesselBtn) {
      vesselBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (this.raycaster) {
          this.raycaster.triggerBeaconOpening();
        }
      });
    }
  }

  resetCameraToCenter() {
    const framing = this.getCameraFraming(this.camera.aspect);

    if (window.gsap) {
      window.gsap.killTweensOf([this.camera.position, this.controls.target]);

      // Pause OrbitControls updates during tween so camera glides with zero jitter
      this.controls.enabled = false;

      window.gsap.to(this.controls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.1,
        ease: "power2.inOut"
      });

      window.gsap.to(this.camera.position, {
        x: 0,
        y: framing.y,
        z: framing.z,
        duration: 1.3,
        ease: "power2.inOut",
        onComplete: () => {
          this.controls.enabled = true;
          this.controls.update();
        }
      });
    } else {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, framing.y, framing.z);
      this.controls.update();
    }
  }

  playUnlockAnimation() {
    if (!window.gsap) return;

    const framing = this.getCameraFraming(this.camera.aspect);
    const startZ = framing.z * 1.35;
    const startY = framing.y * 3.33;

    // 1. Cinematic Camera Glide: starts slightly elevated & deeper in space, swooping smoothly to center view
    if (this.camera && this.controls) {
      this.controls.enabled = false;
      this.camera.position.set(0, startY, startZ);
      this.controls.target.set(0, 0, 0);

      window.gsap.to(this.camera.position, {
        x: 0,
        y: framing.y,
        z: framing.z,
        duration: 2.4,
        ease: "power3.out",
        onComplete: () => {
          this.controls.enabled = true;
          this.controls.update();
        }
      });
    }

    // 2. Cosmic Heart Particle Awakening: gentle ethereal bloom settling at 1.0 with soft elastic rhythm
    if (this.heartEngine && this.heartEngine.particles) {
      window.gsap.killTweensOf(this.heartEngine.particles.scale);
      window.gsap.fromTo(this.heartEngine.particles.scale,
        { x: 0.68, y: 0.68, z: 0.68 },
        { x: 1.0, y: 1.0, z: 1.0, duration: 2.5, ease: "elastic.out(1, 0.7)" }
      );
    }

    // 3. Stardust Ribbon unfurl
    if (this.planetaryRing && this.planetaryRing.ringPoints) {
      window.gsap.killTweensOf(this.planetaryRing.ringPoints.scale);
      window.gsap.fromTo(this.planetaryRing.ringPoints.scale,
        { x: 0.5, y: 0.5, z: 0.5 },
        { x: 1.0, y: 1.0, z: 1.0, duration: 2.2, ease: "power2.out" }
      );
    }

    // 4. Twin Shooting Stars across the deep cosmic sky
    if (this.shootingStars && typeof this.shootingStars.spawnStar === 'function') {
      setTimeout(() => this.shootingStars.spawnStar({ fromLeft: true }), 400);
      setTimeout(() => this.shootingStars.spawnStar({ fromLeft: false }), 950);
    }

    // 5. Elegant Staggered Cascade of Top Sanctuary Controls
    const uiElements = [
      document.querySelector('.sanctuary-title'),
      document.querySelector('.music-player-container'),
      document.getElementById('discovered-counter-badge'),
      document.getElementById('open-vessel-btn'),
      document.getElementById('vault-open-btn'),
      document.getElementById('leave-message-btn'),
      document.getElementById('reset-cam-btn'),
      document.getElementById('constellation-expand-pill')
    ].filter(Boolean);

    window.gsap.fromTo(uiElements,
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, ease: "power2.out", delay: 0.5 }
    );
  }

  onWindowResize(animateCamera = true) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.updateCameraForViewport(aspect, animateCamera);
  }

  updateCameraForViewport(aspect, animate = true) {
    const framing = this.getCameraFraming(aspect);
    this.controls.maxDistance = Math.max(CONFIG.visuals.camera.maxDistance || 145.0, framing.z * 1.35);

    // If modal is open or letter modal is active, do not interrupt reading experience
    if ((modalManager && modalManager.isOpen) || (window.letterModal && window.letterModal.isOpen)) {
      return;
    }

    const currentOffset = this.camera.position.clone().sub(this.controls.target);
    const currentDist = currentOffset.length();
    if (currentDist < 0.01) return;

    // Only adjust distance if user is in standard overview range (> 25 units from heart center)
    // If user has zoomed deep inside the heart (< 25 units), respect their close-up exploration!
    if (currentDist < 25.0) return;

    // Preserve the user's current azimuth & polar rotation angle while smoothly adjusting distance
    const direction = currentOffset.normalize();
    const newPos = this.controls.target.clone().add(direction.multiplyScalar(framing.targetDist));

    if (window.gsap && animate) {
      window.gsap.killTweensOf(this.camera.position);
      window.gsap.to(this.camera.position, {
        x: newPos.x,
        y: newPos.y,
        z: newPos.z,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => {
          this.controls.update();
        }
      });
    } else {
      this.camera.position.copy(newPos);
      this.controls.update();
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const rawDelta = this.clock.getDelta();
    const delta = Math.min(rawDelta, 0.1); // clamp delta to avoid sudden leaps
    this.simulatedTime += delta * this.timeScale;

    this.controls.update();

    // 1. Update Heart Geometry - always faces Mary directly at (0,0,0)
    if (this.heartEngine) {
      this.heartEngine.update(this.simulatedTime, this.camera);
    }

    // 2. Update Stardust Planetary Ribbon
    if (this.planetaryRing) {
      this.planetaryRing.update(this.simulatedTime);
    }

    // 3. Update Celestial Shooting Stars & Dim Background Starfield
    if (this.shootingStars) {
      this.shootingStars.update(this.simulatedTime, delta * this.timeScale);
    }
    if (this.backgroundStarfield) {
      const bass = (musicPlayer && typeof musicPlayer.getAudioReactiveValues === 'function')
        ? (musicPlayer.getAudioReactiveValues().bass || 0)
        : 0;
      this.backgroundStarfield.update(delta * this.timeScale, this.simulatedTime, bass);
    }

    // 4. Update Dynamic Scaled Raycaster
    if (this.raycaster) {
      this.raycaster.update();
    }

    // 4. Render Scene with UnrealBloomPass
    this.composer.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new HeartScene();
});
