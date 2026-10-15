/**
 * =========================================================================
 * CELESTIAL BACKGROUND LIGHT WHISPERS ENGINE
 * =========================================================================
 * Multilingual "I love you" phrases scattered across 3D cosmic sectors.
 * Phrases emerge with an aura of soft light, gently float, glow softly,
 * and slowly dim and disappear on multiple sides of the background.
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export const WHISPER_PHRASES = [
  { text: "I love you", lang: "English" },
  { text: "Je t'aime", lang: "French" },
  { text: "Te amo", lang: "Spanish" },
  { text: "Ti amo", lang: "Italian" },
  { text: "Ich liebe dich", lang: "German" },
  { text: "愛してる", lang: "Japanese" },
  { text: "사랑해", lang: "Korean" },
  { text: "Eu te amo", lang: "Portuguese" },
  { text: "Я тебя люблю", lang: "Russian" },
  { text: "Σ' αγαπώ", lang: "Greek" },
  { text: "Seni seviyorum", lang: "Turkish" },
  { text: "Ik hou van jou", lang: "Dutch" },
  { text: "Jag älskar dig", lang: "Swedish" },
  { text: "Kocham cię", lang: "Polish" },
  { text: "Anh yêu em", lang: "Vietnamese" },
  { text: "Aku cinta kamu", lang: "Indonesian" },
  { text: "Я тебе кохаю", lang: "Ukrainian" },
  { text: "मैं तुमसे प्यार करता हूँ", lang: "Hindi" },
  { text: "Jeg elsker dig", lang: "Danish" },
  { text: "Jeg elsker deg", lang: "Norwegian" },
  { text: "Miluji tě", lang: "Czech" },
  { text: "Te iubesc", lang: "Romanian" },
  { text: "Taim i ngra leat", lang: "Irish" },
  { text: "Te amo in aeternum", lang: "Latin" }
];

export class BackgroundWhispersEngine {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.whisperNodes = [];
    this.sectors = [
      { name: "Top-Left", bounds: { minX: -38, maxX: -22, minY: 16, maxY: 28, minZ: -30, maxZ: -16 } },
      { name: "Top-Right", bounds: { minX: 22, maxX: 38, minY: 16, maxY: 28, minZ: -30, maxZ: -16 } },
      { name: "Bottom-Left", bounds: { minX: -36, maxX: -20, minY: -24, maxY: -12, minZ: -30, maxZ: -16 } },
      { name: "Bottom-Right", bounds: { minX: 20, maxX: 36, minY: -24, maxY: -12, minZ: -30, maxZ: -16 } },
      { name: "Upper-Center", bounds: { minX: -14, maxX: 14, minY: 22, maxY: 32, minZ: -32, maxZ: -20 } }
    ];

    this.activeSimultaneous = 3;
    this.initWhisperNodes();
  }

  createWhisperTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 640, 180);

    // Pure feathered elliptical starlight bloom (Zero rectangular hard edges)
    const glow = ctx.createRadialGradient(320, 90, 0, 320, 90, 200);
    glow.addColorStop(0, 'rgba(254, 240, 138, 0.40)');
    glow.addColorStop(0.35, 'rgba(244, 63, 94, 0.28)');
    glow.addColorStop(0.7, 'rgba(244, 63, 94, 0.06)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(320, 90, 310, 85, 0, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.restore();

    // High-visibility glowing neon typography
    ctx.shadowColor = 'rgba(254, 240, 138, 0.95)';
    ctx.shadowBlur = 22;
    ctx.font = '700 46px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(text, 320, 90);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }

  initWhisperNodes() {
    const geometry = new THREE.PlaneGeometry(16.0, 4.5);

    for (let i = 0; i < WHISPER_PHRASES.length; i++) {
      const phrase = WHISPER_PHRASES[i];
      const texture = this.createWhisperTexture(phrase.text);

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;

      const sector = this.sectors[i % this.sectors.length];
      const pos = this.randomPositionInSector(sector);
      mesh.position.copy(pos);

      const node = {
        id: i,
        mesh,
        material,
        phrase,
        sector,
        basePos: pos.clone(),
        state: 'dormant',
        startTime: 0,
        holdStartTime: 0,
        fadeStartTime: 0,
        driftVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.01
        )
      };

      this.whisperNodes.push(node);
      this.group.add(mesh);
    }

    this.triggerInitialBatch();
  }

  randomPositionInSector(sector) {
    const b = sector.bounds;
    return new THREE.Vector3(
      b.minX + Math.random() * (b.maxX - b.minX),
      b.minY + Math.random() * (b.maxY - b.minY),
      b.minZ + Math.random() * (b.maxZ - b.minZ)
    );
  }

  triggerInitialBatch() {
    const pickedSectors = new Set();
    let triggered = 0;

    for (let i = 0; i < this.whisperNodes.length && triggered < this.activeSimultaneous; i++) {
      const node = this.whisperNodes[i];
      if (!pickedSectors.has(node.sector.name)) {
        pickedSectors.add(node.sector.name);
        this.activateNode(node, triggered * 1.5);
        triggered++;
      }
    }
  }

  activateNode(node, delaySec = 0) {
    node.state = 'waiting';
    node.mesh.visible = true;
    node.material.opacity = 0;
    node.basePos = this.randomPositionInSector(node.sector);
    node.mesh.position.copy(node.basePos);

    setTimeout(() => {
      node.state = 'blooming';
      node.startTime = performance.now();
      node.mesh.scale.set(0.85, 0.85, 0.85);
    }, delaySec * 1000);
  }

  update(timeSeconds, camera) {
    const now = performance.now();
    let activeCount = 0;

    for (let i = 0; i < this.whisperNodes.length; i++) {
      const node = this.whisperNodes[i];

      // Keep billboard facing camera
      node.mesh.lookAt(camera.position);

      if (node.state === 'blooming') {
        activeCount++;
        const elapsedSec = (now - node.startTime) / 1000;
        const bloomDuration = 2.2; // 2.2s gentle bloom with light

        if (elapsedSec < bloomDuration) {
          const t = elapsedSec / bloomDuration;
          const ease = Math.sin(t * (Math.PI / 2));
          node.material.opacity = ease * 0.95;
          const s = 0.85 + ease * 0.22;
          node.mesh.scale.set(s, s, s);
        } else {
          node.state = 'holding';
          node.holdStartTime = now;
          node.material.opacity = 0.95;
          node.mesh.scale.set(1.07, 1.07, 1.07);
        }

      } else if (node.state === 'holding') {
        activeCount++;
        const elapsedSec = (now - node.holdStartTime) / 1000;
        const holdDuration = 4.8; // 4.8s holding while gently floating

        node.mesh.position.add(node.driftVelocity);
        const pulse = 0.88 + Math.sin(elapsedSec * 2.2) * 0.1;
        node.material.opacity = pulse;

        if (elapsedSec >= holdDuration) {
          node.state = 'fading';
          node.fadeStartTime = now;
        }

      } else if (node.state === 'fading') {
        activeCount++;
        const elapsedSec = (now - node.fadeStartTime) / 1000;
        const fadeDuration = 2.5; // 2.5s slow, easy disappearance

        if (elapsedSec < fadeDuration) {
          const t = 1.0 - (elapsedSec / fadeDuration);
          const ease = Math.sin(t * (Math.PI / 2));
          node.material.opacity = ease * 0.95;
          const s = 1.07 - (1.0 - ease) * 0.15;
          node.mesh.scale.set(s, s, s);
        } else {
          node.state = 'dormant';
          node.mesh.visible = false;
          node.material.opacity = 0;
        }
      }
    }

    if (activeCount < this.activeSimultaneous) {
      const dormantNodes = this.whisperNodes.filter(n => n.state === 'dormant');
      if (dormantNodes.length > 0) {
        const chosen = dormantNodes[Math.floor(Math.random() * dormantNodes.length)];
        this.activateNode(chosen, 0.4);
      }
    }
  }
}
