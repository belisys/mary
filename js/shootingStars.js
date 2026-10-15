/**
 * =========================================================================
 * 3D CELESTIAL SHOOTING STARS ENGINE (FAR COSMIC BACKGROUND METEORS)
 * =========================================================================
 * Generates distant, radiant shooting stars streaking across the deep cosmic
 * sky FAR BEHIND the 3D heart and FAR BEHIND its planetary orbit ring.
 *
 * Uses camera-billboarded feathered quad ribbons with cosine core falloff and
 * 4-point diamond star flare sprites, rendered in the background layer (-100)
 * so they frame Mary's sanctuary without obscuring core particles.
 */

import * as THREE from 'three';

export class ShootingStarsEngine {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.group = new THREE.Group();
    // Render in deep background before foreground heart and orbit particles
    this.group.renderOrder = -100;
    this.scene.add(this.group);

    this.maxStars = 4;
    this.stars = [];
    this.segments = 32; // Silky ribbon trail resolution
    this.nextSpawnTime = 0.5; // First meteor streaks shortly after entrance

    this.initPool();
  }

  initPool() {
    const headTexture = this.createHeadTexture();
    const trailTexture = this.createTrailTexture();

    for (let i = 0; i < this.maxStars; i++) {
      // 1. Tapered Feathered Ribbon Mesh (Luminous distant cosmic trail)
      const numVerts = (this.segments + 1) * 2;
      const positions = new Float32Array(numVerts * 3);
      const colors = new Float32Array(numVerts * 3);
      const uvs = new Float32Array(numVerts * 2);
      const indices = [];

      for (let j = 0; j <= this.segments; j++) {
        const u = j / this.segments; // 0 at head, 1 at tail
        // Left vertex: v = 0.0 (edge)
        uvs[(j * 2) * 2] = u;
        uvs[(j * 2) * 2 + 1] = 0.0;
        // Right vertex: v = 1.0 (edge)
        uvs[(j * 2 + 1) * 2] = u;
        uvs[(j * 2 + 1) * 2 + 1] = 1.0;
      }

      for (let j = 0; j < this.segments; j++) {
        const i0 = j * 2;
        const i1 = j * 2 + 1;
        const i2 = (j + 1) * 2;
        const i3 = (j + 1) * 2 + 1;

        indices.push(i0, i1, i2);
        indices.push(i1, i3, i2);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geom.setIndex(indices);

      const mat = new THREE.MeshBasicMaterial({
        map: trailTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true
      });

      const ribbonMesh = new THREE.Mesh(geom, mat);
      ribbonMesh.frustumCulled = false;
      ribbonMesh.renderOrder = -100;
      ribbonMesh.visible = false;
      this.group.add(ribbonMesh);

      // 2. Radiant Diamond Flare Head Sprite (Far celestial beacon)
      const spriteMat = new THREE.SpriteMaterial({
        map: headTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
      });
      const headSprite = new THREE.Sprite(spriteMat);
      headSprite.scale.set(6.8, 6.8, 1.0);
      headSprite.renderOrder = -100;
      headSprite.visible = false;
      this.group.add(headSprite);

      this.stars.push({
        ribbon: ribbonMesh,
        head: headSprite,
        active: false,
        pos: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        history: [],
        life: 0,
        maxLife: 1.50,
        headColor: new THREE.Color(0xffffff),
        tailColor: new THREE.Color(0xfef08a)
      });
    }
  }

  /**
   * Generates a 256x64 feathered trail texture with a bright core
   * and soft Gaussian/cosine falloff to edges.
   */
  createTrailTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(256, 64);
    const data = imgData.data;

    for (let y = 0; y < 64; y++) {
      const ny = (y / 63) * 2 - 1; // -1 to +1
      // Cosine bell curve: 1.0 at center spine, 0.0 at outer edges
      const crossFactor = Math.pow(Math.max(0, Math.cos(ny * Math.PI * 0.5)), 2.2);

      for (let x = 0; x < 256; x++) {
        const u = x / 255; // 0 at head, 1 at tail
        const lenFactor = Math.pow(1.0 - u, 1.15);
        const alpha = Math.min(255, Math.floor(crossFactor * lenFactor * 255));

        const idx = (y * 256 + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = alpha;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Generates a 256x256 high-res canvas texture with a soft celestial halo
   * and a radiant 4-pointed diamond star flare.
   */
  createHeadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const cx = 128;
    const cy = 128;

    // 1. Core soft spherical glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.90)');
    grad.addColorStop(0.42, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.fill();

    // 2. Horizontal Diamond Starlight Flare
    const hGrad = ctx.createLinearGradient(0, cy, 256, cy);
    hGrad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
    hGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.35)');
    hGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
    hGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.35)');
    hGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = hGrad;
    ctx.beginPath();
    ctx.moveTo(12, cy);
    ctx.lineTo(cx, cy - 3.5);
    ctx.lineTo(244, cy);
    ctx.lineTo(cx, cy + 3.5);
    ctx.closePath();
    ctx.fill();

    // 3. Vertical Diamond Starlight Flare
    const vGrad = ctx.createLinearGradient(cx, 0, cx, 256);
    vGrad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
    vGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.35)');
    vGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
    vGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.35)');
    vGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = vGrad;
    ctx.beginPath();
    ctx.moveTo(cx, 12);
    ctx.lineTo(cx - 3.5, cy);
    ctx.lineTo(cx, 244);
    ctx.lineTo(cx + 3.5, cy);
    ctx.closePath();
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Spawns a luminous shooting star strictly in the deep background plane of the scene
   * (Z in [-76, -88]), physically far behind the 3D heart (Z in [-8, +8]) and the tilted
   * planetary ring orbit (Z in [-28, +28]).
   *
   * Enforces velocity.z = 0 so the star moves purely in the X/Y celestial background,
   * gliding gracefully from side to side in the upper cosmic sky, and can NEVER move
   * from front to back or pass in front of foreground elements.
   */
  spawnStar(options = {}) {
    const star = this.stars.find(s => !s.active);
    if (!star) return;

    const fromLeft = options.fromLeft !== undefined ? options.fromLeft : (Math.random() < 0.5);

    // Camera gaze basis vectors to keep shooting stars strictly in the background sky
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const camUp = this.camera.up.clone().normalize();
    const camRight = new THREE.Vector3().crossVectors(camDir, camUp).normalize();

    // Deep celestial background plane: 80 units behind the heart along the camera's gaze
    const bgDist = 80.0 + Math.random() * 10.0;
    const startX = fromLeft
      ? -115.0 - Math.random() * 20.0
      : 115.0 + Math.random() * 20.0;
    const startY = 44.0 + Math.random() * 12.0; // High in celestial dome above the heart

    star.pos.set(0, 0, 0)
      .addScaledVector(camDir, bgDist)
      .addScaledVector(camRight, startX)
      .addScaledVector(camUp, startY);

    const speed = 82 + Math.random() * 16;
    const signX = fromLeft ? 1.0 : -1.0;
    const slopeY = -0.06 - Math.random() * 0.04;

    // Movement is purely perpendicular to gaze (strictly along camRight and camUp)
    star.direction.set(0, 0, 0)
      .addScaledVector(camRight, signX)
      .addScaledVector(camUp, slopeY)
      .normalize();
    star.velocity.copy(star.direction).multiplyScalar(speed);

    // Initialize clean history starting with the single point
    star.history = [star.pos.clone()];

    star.life = 0;
    star.maxLife = 1.45 + Math.random() * 0.35; // ~1.45s to 1.80s flight time

    // Aesthetic luxury palette
    const randCol = options.colorType !== undefined ? options.colorType : Math.random();
    if (randCol < 0.45) {
      // 1. Diamond White & Warm Starlight Gold
      star.headColor.setHex(0xffffff);
      star.tailColor.setHex(0xfef08a);
    } else if (randCol < 0.75) {
      // 2. Rose Gold & Neon Crimson
      star.headColor.setHex(0xfda4af);
      star.tailColor.setHex(0xf43f5e);
    } else {
      // 3. Electric Ice Cyan & Starlight White
      star.headColor.setHex(0x38bdf8);
      star.tailColor.setHex(0xe0f2fe);
    }

    star.ribbon.visible = true;
    star.head.visible = true;
    star.active = true;
  }

  update(timeSeconds, deltaSeconds) {
    const dt = Math.min(deltaSeconds || 0.016, 0.05);

    // 1. Spawner Scheduler (Streaks gracefully every 3.5 to 5.8 seconds)
    if (timeSeconds >= this.nextSpawnTime) {
      this.spawnStar();
      const isTwin = Math.random() < 0.20;
      this.nextSpawnTime = timeSeconds + (isTwin ? 0.40 : 3.5 + Math.random() * 2.5);
    }

    // Camera position for billboard orientation
    const camPos = this.camera ? this.camera.position : new THREE.Vector3(0, 5, 62);
    const toCamVec = new THREE.Vector3();
    const ribbonNormal = new THREE.Vector3();

    // 2. Animate Active Meteors
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      if (!star.active) continue;

      star.life += dt;
      const progress = star.life / star.maxLife;

      if (progress >= 1.0) {
        star.active = false;
        star.ribbon.visible = false;
        star.head.visible = false;
        continue;
      }

      // Advance meteor along velocity
      star.pos.addScaledVector(star.velocity, dt);

      // Prepend current pos to history
      star.history.unshift(star.pos.clone());
      if (star.history.length > this.segments + 1) {
        star.history.pop();
      }

      // Smooth birth fade-in & graceful death fade-out
      let fade = 1.0;
      if (progress < 0.10) {
        fade = progress / 0.10;
      } else if (progress > 0.65) {
        fade = 1.0 - (progress - 0.65) / 0.35;
      }

      // Update head sprite position & glowing opacity
      star.head.position.copy(star.pos);
      star.head.material.opacity = fade * 0.98;
      star.head.material.color.copy(star.headColor);

      // Update camera-billboarded ribbon geometry
      const posAttr = star.ribbon.geometry.attributes.position;
      const colAttr = star.ribbon.geometry.attributes.color;
      const posArray = posAttr.array;
      const colArray = colAttr.array;

      const baseWidth = 2.4; // Calibrated for far background distance (~135 units from camera)

      for (let j = 0; j <= this.segments; j++) {
        // Sample history point or anchor at oldest available
        const p = star.history[j] || star.history[star.history.length - 1];
        const tailFactor = 1.0 - (j / this.segments); // 1.0 at head, 0.0 at tail end
        const curWidth = baseWidth * Math.pow(tailFactor, 1.12) * fade;

        // Camera billboard normal: cross product of flight direction and view vector
        toCamVec.subVectors(camPos, p).normalize();
        ribbonNormal.crossVectors(star.direction, toCamVec).normalize();

        // Left & Right vertices across the billboarded normal
        const lx = p.x + ribbonNormal.x * curWidth;
        const ly = p.y + ribbonNormal.y * curWidth;
        const lz = p.z + ribbonNormal.z * curWidth;

        const rx = p.x - ribbonNormal.x * curWidth;
        const ry = p.y - ribbonNormal.y * curWidth;
        const rz = p.z - ribbonNormal.z * curWidth;

        const idxL = j * 2 * 3;
        const idxR = (j * 2 + 1) * 3;

        posArray[idxL] = lx;
        posArray[idxL + 1] = ly;
        posArray[idxL + 2] = lz;

        posArray[idxR] = rx;
        posArray[idxR + 1] = ry;
        posArray[idxR + 2] = rz;

        // Color interpolation with bloom amplification factor
        const c = star.headColor.clone().lerp(star.tailColor, 1.0 - tailFactor);
        const intensity = tailFactor * fade * 1.55; // Amplified for radiant bloom

        colArray[idxL] = c.r * intensity;
        colArray[idxL + 1] = c.g * intensity;
        colArray[idxL + 2] = c.b * intensity;

        colArray[idxR] = c.r * intensity;
        colArray[idxR + 1] = c.g * intensity;
        colArray[idxR + 2] = c.b * intensity;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }
  }
}
