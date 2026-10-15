/**
 * =========================================================================
 * 3D CELESTIAL BACKGROUND STARFIELD
 * =========================================================================
 * Generates a deep, organic field of dim, softly shining background stars
 * distributed in a cosmic spherical dome behind the 3D heart and orbit.
 *
 * Designed with deliberate restraint:
 * - Perfectly spaced (neither too sparse nor crowded)
 * - Dim luminescence (0.22 - 0.45 opacity) so the heart & planetary ribbon
 *   always remain the radiant centerpiece of the sanctuary.
 * - Organic breathing twinkle with randomized individual frequencies.
 */

import * as THREE from 'three';

export class BackgroundStarfield {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.renderOrder = -180;
    this.scene.add(this.group);

    this.starCount = 780; // Balanced density: spaced, non-cluttered
    this.initStars();
  }

  createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 240, 245, 0.85)');
    grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.25)');
    grad.addColorStop(0.8, 'rgba(192, 132, 252, 0.08)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  initStars() {
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);
    const sizes = new Float32Array(this.starCount);

    this.baseAlphas = new Float32Array(this.starCount);
    this.twinkleSpeeds = new Float32Array(this.starCount);
    this.twinklePhases = new Float32Array(this.starCount);

    // Ethereal subtle cosmic tint palette
    const palette = [
      new THREE.Color('#ffffff'), // Pure soft white
      new THREE.Color('#fef08a'), // Soft champagne warmth
      new THREE.Color('#fce7f3'), // Dusty rose
      new THREE.Color('#ede9fe'), // Ethereal lavender
      new THREE.Color('#e0f2fe')  // Starlight diamond
    ];

    let pIdx = 0;
    let cIdx = 0;

    for (let i = 0; i < this.starCount; i++) {
      // Uniform spherical shell distribution, centered around origin
      // Minimum radius = 175, Maximum radius = 420 (keeps clear of heart at 0-50 and ring at 65)
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const radius = 175 + Math.random() * 245;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.85; // Slight organic flattening
      const z = radius * Math.cos(phi);

      positions[pIdx] = x;
      positions[pIdx + 1] = y;
      positions[pIdx + 2] = z;
      pIdx += 3;

      // Color tint
      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[cIdx] = col.r;
      colors[cIdx + 1] = col.g;
      colors[cIdx + 2] = col.b;
      cIdx += 3;

      // Modest point sizes: 1.2 to 2.4 (dim & distant)
      sizes[i] = 1.2 + Math.random() * 1.3;

      // Dim base alpha (0.18 - 0.42) - Never overpowers the central heart!
      this.baseAlphas[i] = 0.18 + Math.random() * 0.24;
      this.twinkleSpeeds[i] = 0.8 + Math.random() * 1.6;
      this.twinklePhases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for per-star dynamic alpha twinkling & soft glowing circular points
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.createStarTexture() },
        uTime: { value: 0 },
        uBaseDim: { value: 0.85 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;

        void main() {
          vColor = color;
          
          // Subtle twinkle calculation in vertex shader
          float phase = position.x * 0.05 + position.y * 0.07 + position.z * 0.03;
          float twinkle = 0.65 + 0.35 * sin(uTime * 1.4 + phase);
          vAlpha = twinkle;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (260.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uBaseDim;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          if (tex.a < 0.01) discard;

          // Dim luminescence so heart & orbit ribbon remain primary focus
          float finalAlpha = tex.a * vAlpha * uBaseDim * 0.55;
          gl_FragColor = vec4(vColor * 1.15, finalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geometry, this.material);
    this.group.add(this.points);
  }

  update(delta, elapsed, audioReactiveBass = 0) {
    if (!this.material) return;
    this.material.uniforms.uTime.value = elapsed;

    // Extremely subtle, smooth cosmic breathing with music
    const baseDim = 0.75 + Math.min(0.25, audioReactiveBass * 0.2);
    this.material.uniforms.uBaseDim.value = baseDim;

    // Ultra-slow, majestic cosmic rotation
    if (this.group) {
      this.group.rotation.y = elapsed * 0.008;
      this.group.rotation.x = Math.sin(elapsed * 0.005) * 0.02;
    }
  }

  dispose() {
    if (this.points) {
      this.group.remove(this.points);
      this.points.geometry.dispose();
      this.material.dispose();
    }
    this.scene.remove(this.group);
  }
}
