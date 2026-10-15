/**
 * =========================================================================
 * 3D MULTI-TYPE CELESTIAL BACKGROUND STARFIELD
 * =========================================================================
 * Implements a rich, observable celestial backdrop featuring three distinct
 * star species distributed across the deep cosmic dome:
 *
 * 1. CROSS STARS (Diffraction Spikes / Luminous Christian Cross Flare):
 *    - 4-pointed cross star with elongated vertical diffraction beam and
 *      horizontal arms centered on a brilliant, soft-diffuse stellar core.
 *    - Observable scale (7.5 - 13.0) with majestic, slow celestial shimmer.
 *
 * 2. BREATHING DOT STARS:
 *    - Soft circular stardust halos that smoothly brighten and dim in
 *      rhythmic, gentle sine cycles (0.35 -> 0.85 opacity).
 *
 * 3. VIBRATING BRIGHT STARS:
 *    - High-frequency luminance jitter / shimmer (rapid diamond vibration)
 *      that catches the eye with diamond-white and champagne sparkle.
 *
 * All stars occupy a deep spherical shell (radius 180 to 420) behind the
 * central 3D beating heart and orbit ribbon, ensuring the heart remains
 * the undisputed emotional centerpiece while the universe breathes behind it.
 */

import * as THREE from 'three';

export class BackgroundStarfield {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.renderOrder = -180;
    this.scene.add(this.group);

    // Star species counts
    this.crossStarCount = 85;       // Prominent, majestic cross-shaped stars
    this.breathingDotCount = 380;   // Softly breathing glowing halos
    this.vibratingStarCount = 180;  // Rapidly vibrating crystalline diamond stars

    this.materials = [];

    this.initCrossStars();
    this.initBreathingDotStars();
    this.initVibratingStars();
  }

  /**
   * Generates a 128x128 4-pointed cross star texture with vertical
   * and horizontal diffraction beams and a brilliant core flare.
   */
  createCrossTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const cx = 64;
    const cy = 64;

    ctx.clearRect(0, 0, 128, 128);

    // 1. Soft ambient aura
    const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, 38);
    aura.addColorStop(0.0, 'rgba(255, 255, 255, 0.45)');
    aura.addColorStop(0.3, 'rgba(255, 225, 235, 0.20)');
    aura.addColorStop(0.7, 'rgba(244, 63, 94, 0.08)');
    aura.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vertical Diffraction Beam (elongated Latin cross proportion)
    const vBeam = ctx.createLinearGradient(cx, 6, cx, 122);
    vBeam.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
    vBeam.addColorStop(0.2, 'rgba(255, 240, 245, 0.35)');
    vBeam.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
    vBeam.addColorStop(0.8, 'rgba(255, 240, 245, 0.35)');
    vBeam.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = vBeam;
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.quadraticCurveTo(cx + 4.5, cy, cx, 124);
    ctx.quadraticCurveTo(cx - 4.5, cy, cx, 4);
    ctx.fill();

    // 3. Horizontal Diffraction Beam (slightly shorter arms)
    const hBeam = ctx.createLinearGradient(16, cy, 112, cy);
    hBeam.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
    hBeam.addColorStop(0.2, 'rgba(255, 240, 245, 0.30)');
    hBeam.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
    hBeam.addColorStop(0.8, 'rgba(255, 240, 245, 0.30)');
    hBeam.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = hBeam;
    ctx.beginPath();
    ctx.moveTo(14, cy);
    ctx.quadraticCurveTo(cx, cy + 4.0, 114, cy);
    ctx.quadraticCurveTo(cx, cy - 4.0, 14, cy);
    ctx.fill();

    // 4. Brilliant Radiant Center Core
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
    core.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    core.addColorStop(0.35, 'rgba(255, 250, 252, 0.95)');
    core.addColorStop(0.7, 'rgba(254, 205, 211, 0.40)');
    core.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  /**
   * Generates a 64x64 Gaussian radial halo dot texture for breathing stars.
   */
  createDotTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.25, 'rgba(254, 240, 138, 0.85)');
    grad.addColorStop(0.55, 'rgba(244, 63, 94, 0.28)');
    grad.addColorStop(0.85, 'rgba(192, 132, 252, 0.08)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  /**
   * Generates a 64x64 diamond starlight texture for high-frequency vibrating stars.
   */
  createDiamondTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const cx = 32;
    const cy = 32;

    ctx.clearRect(0, 0, 64, 64);

    // 4 sharp diamond rays
    const diamond = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
    diamond.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    diamond.addColorStop(0.25, 'rgba(224, 242, 254, 0.90)');
    diamond.addColorStop(0.65, 'rgba(147, 197, 253, 0.25)');
    diamond.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = diamond;
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(cx + 6, cy);
    ctx.lineTo(cx, 60);
    ctx.lineTo(cx - 6, cy);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(4, cy);
    ctx.lineTo(cx, cy + 6);
    ctx.lineTo(60, cy);
    ctx.lineTo(cx, cy - 6);
    ctx.closePath();
    ctx.fill();

    // Center jewel
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
    core.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    core.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
    core.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  /**
   * Helper to distribute stars in a deep cosmic shell
   */
  generateShellPositions(count, minR = 190, maxR = 430) {
    const positions = new Float32Array(count * 3);
    let pIdx = 0;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const radius = minR + Math.random() * (maxR - minR);

      positions[pIdx] = radius * Math.sin(phi) * Math.cos(theta);
      positions[pIdx + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.88; // subtle flattering
      positions[pIdx + 2] = radius * Math.cos(phi);
      pIdx += 3;
    }
    return positions;
  }

  /**
   * 1. CROSS STARS: Luminous Christian cross diffraction flares
   */
  initCrossStars() {
    const count = this.crossStarCount;
    const positions = this.generateShellPositions(count, 185, 410);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    // Warm white, platinum diamond, rose gold, soft champagne
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#fff1f2'),
      new THREE.Color('#fef08a'),
      new THREE.Color('#e0f2fe'),
      new THREE.Color('#f5d0fe')
    ];

    let cIdx = 0;
    for (let i = 0; i < count; i++) {
      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[cIdx] = col.r;
      colors[cIdx + 1] = col.g;
      colors[cIdx + 2] = col.b;
      cIdx += 3;

      // Prominent, clearly visible size: 9.0 to 16.0
      sizes[i] = 9.0 + Math.random() * 7.0;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.createCrossTexture() },
        uTime: { value: 0 },
        uBass: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float phase;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uBass;

        void main() {
          vColor = color;

          // Slow, majestic celestial twinkle with slight bass pulse
          float shimmer = 0.65 + 0.35 * sin(uTime * 1.2 + phase);
          vAlpha = shimmer * (1.0 + uBass * 0.25);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (560.0 / -mvPosition.z);
          // Clamp to stay crisp & observable on all screens
          gl_PointSize = clamp(gl_PointSize, 8.0, 42.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          if (tex.a < 0.01) discard;

          // Crisp luminescence: recognizable cross shape with brilliant center
          gl_FragColor = vec4(vColor * 1.2, tex.a * vAlpha * 0.88);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.crossPoints = new THREE.Points(geometry, material);
    this.group.add(this.crossPoints);
    this.materials.push(material);
  }

  /**
   * 2. BREATHING DOT STARS: Soft glowing halos that gently brighten and dim
   */
  initBreathingDotStars() {
    const count = this.breathingDotCount;
    const positions = this.generateShellPositions(count, 195, 430);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#fef9c3'),
      new THREE.Color('#ffe4e6'),
      new THREE.Color('#f3e8ff'),
      new THREE.Color('#e0f2fe')
    ];

    let cIdx = 0;
    for (let i = 0; i < count; i++) {
      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[cIdx] = col.r;
      colors[cIdx + 1] = col.g;
      colors[cIdx + 2] = col.b;
      cIdx += 3;

      // Observable dot size: 4.5 to 8.5
      sizes[i] = 4.5 + Math.random() * 4.0;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.7 + Math.random() * 1.1; // Gentle breathing period
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.createDotTexture() },
        uTime: { value: 0 },
        uBass: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float phase;
        attribute float speed;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uBass;

        void main() {
          vColor = color;

          // Organic breathing: sinusoidal brighten and dim
          float wave = sin(uTime * speed + phase) * 0.5 + 0.5;
          float breath = 0.35 + 0.65 * pow(wave, 1.4);
          vAlpha = breath * (1.0 + uBass * 0.20);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (460.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 4.0, 24.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          if (tex.a < 0.01) discard;

          gl_FragColor = vec4(vColor * 1.1, tex.a * vAlpha * 0.72);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.dotPoints = new THREE.Points(geometry, material);
    this.group.add(this.dotPoints);
    this.materials.push(material);
  }

  /**
   * 3. VIBRATING BRIGHT STARS: High-frequency shimmering diamond stars
   */
  initVibratingStars() {
    const count = this.vibratingStarCount;
    const positions = this.generateShellPositions(count, 190, 420);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    const palette = [
      new THREE.Color('#ffffff'), // Pure piercing starlight
      new THREE.Color('#e0f2fe'), // Ice blue diamond
      new THREE.Color('#fff1f2'), // Radiant rose
      new THREE.Color('#fef08a')  // Gold spark
    ];

    let cIdx = 0;
    for (let i = 0; i < count; i++) {
      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[cIdx] = col.r;
      colors[cIdx + 1] = col.g;
      colors[cIdx + 2] = col.b;
      cIdx += 3;

      // Bright diamond size: 5.5 to 10.0
      sizes[i] = 5.5 + Math.random() * 4.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.createDiamondTexture() },
        uTime: { value: 0 },
        uBass: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float phase;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uBass;

        void main() {
          vColor = color;

          // High-frequency dual-sine vibration shimmer
          float vib1 = sin(uTime * 16.0 + phase * 6.28);
          float vib2 = sin(uTime * 27.0 + phase * 3.14);
          float vibration = 0.58 + 0.42 * (vib1 * vib2);
          vAlpha = clamp(vibration, 0.20, 1.0) * (1.0 + uBass * 0.30);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (500.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 5.0, 30.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          if (tex.a < 0.01) discard;

          // Piercing, vibrating bright sparkles
          gl_FragColor = vec4(vColor * 1.3, tex.a * vAlpha * 0.92);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.vibratingPoints = new THREE.Points(geometry, material);
    this.group.add(this.vibratingPoints);
    this.materials.push(material);
  }

  /**
   * Animation tick
   */
  update(delta, elapsed, audioReactiveBass = 0) {
    // Very gentle cosmic rotation of the entire starry background dome
    if (this.group) {
      this.group.rotation.y = elapsed * 0.0035;
      this.group.rotation.x = Math.sin(elapsed * 0.002) * 0.015;
    }

    const bass = Math.min(Math.max(audioReactiveBass, 0.0), 1.0);

    for (let i = 0; i < this.materials.length; i++) {
      const mat = this.materials[i];
      if (mat.uniforms) {
        if (mat.uniforms.uTime) mat.uniforms.uTime.value = elapsed;
        if (mat.uniforms.uBass) mat.uniforms.uBass.value = bass;
      }
    }
  }

  dispose() {
    this.materials.forEach(mat => {
      if (mat.uniforms && mat.uniforms.uTexture && mat.uniforms.uTexture.value) {
        mat.uniforms.uTexture.value.dispose();
      }
      mat.dispose();
    });
    if (this.scene && this.group) {
      this.scene.remove(this.group);
    }
  }
}
